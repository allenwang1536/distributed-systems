// @ts-check
/**
 * @typedef {import("../types.js").Callback} Callback
 * @typedef {import("../types.js").Config} Config
 * @typedef {import("../util/id.js").NID} NID
 */

const id = require('../util/id.js');

/**
 * Map functions used for mapreduce
 * @callback Mapper
 * @param {string} key
 * @param {any} value
 * @returns {object[]}
 */

/**
 * Reduce functions used for mapreduce
 * @callback Reducer
 * @param {string} key
 * @param {any[]} value
 * @returns {object}
 */

/**
 * @typedef {Object} MRConfig
 * @property {Mapper} map
 * @property {Reducer} reduce
 * @property {string[]} keys
 *
 * @typedef {Object} Mr
 * @property {(configuration: MRConfig, callback: Callback) => void} exec
 */


/*
  Note: The only method explicitly exposed in the `mr` service is `exec`.
  Other methods, such as `map`, `shuffle`, and `reduce`, should be dynamically
  installed on the remote nodes and not necessarily exposed to the user.
*/

/**
 * @param {Config} config
 * @returns {Mr}
 */
function mr(config) {
  const builtinHashName = ['naiveHash', 'consistentHash', 'rendezvousHash']
      .find((name) => globalThis.distribution.util.id[name] ===
    (config.hash || globalThis.distribution.util.id.naiveHash)) || 'naiveHash';

  const context = {
    gid: config.gid || 'all',
    hashName: builtinHashName,
  };

  /**
   * @param {MRConfig} configuration
   * @param {Callback} callback
   * @returns {void}
   */
  function exec(configuration, callback) {
    /*
      MapReduce steps:
      1) Setup: register a service `mr-<id>` on all nodes in the group. The service implements the map, shuffle, and reduce methods.
      2) Map: make each node run map on its local data and store them locally, under a different gid, to be used in the shuffle step.
      3) Shuffle: group values by key using store.append.
      4) Reduce: make each node run reduce on its local grouped values.
      5) Cleanup: remove the `mr-<id>` service and return the final output.

      Note: Comments inside the stencil describe a possible implementation---you should feel free to make low- and mid-level adjustments as needed.
   */

    const mrID = id.getID(`${configuration}${Date.now()}`);
    const serviceName = `mr.${mrID}`;
    const mapNamespace = `${serviceName}.m`;
    const shuffleNamespace = `${serviceName}.s`;
    const coordinatorNode = {
      ip: globalThis.distribution.node.config.ip,
      port: globalThis.distribution.node.config.port,
    };

    globalThis.distribution.local.groups.get(context.gid, (e, group) => {
      if (e) return callback(e);

      const nodes = Object.values(group || {});
      const sids = Object.keys(group || {});

      if (nodes.length === 0) return callback(new Error(`mr.exec: group "${context.gid}" is empty`));

      let finished = false;
      let currentPhase = 'setup';
      let localRouteRegistered = false;
      let workerRoutesRegistered = false;
      let reduceOutputs = [];
      const completions = Object.create(null); // use set to count in case of duplicate notifications

      const finish = (error, value) => {
        if (finished) return;
        finished = true;

        // clean up worker services
        const cleanupNode = (node, done) => {
          globalThis.distribution.local.comm.send(
              [[mapNamespace, shuffleNamespace]],
              {node, service: serviceName, method: 'cleanup'},
              () => done(),
          );
        };
        // clean up coordinator services
        let pendingCleanup = nodes.length;

        const afterCleanup = () => {
          const removeWorkerRoutes = (done) => {
            if (!workerRoutesRegistered) return done();
            return globalThis.distribution[context.gid].routes.rem(serviceName, () => done());
          };

          removeWorkerRoutes(() => {
            if (!localRouteRegistered) return callback(error || null, value);

            return globalThis.distribution.local.routes.rem(serviceName, () => {
              callback(error || null, value);
            });
          });
        };

        if (pendingCleanup === 0) return afterCleanup();

        nodes.forEach((node) => {
          cleanupNode(node, () => {
            pendingCleanup -= 1;
            if (pendingCleanup === 0) {
              afterCleanup();
            }
          });
        });
      };

      const fail = (error) => {
        const err = error instanceof Error ? error : new Error(String(error));
        return finish(err);
      };

      const fanoutPhase = (method, args) => {
        let sendFailed = false;

        nodes.forEach((node) => {
          globalThis.distribution.local.comm.send(args, {
            node,
            service: serviceName,
            method,
          }, (e) => {
            if (sendFailed) return;

            if (e) {
              sendFailed = true;
              return fail(e);
            }
          });
        });
      };

      const startPhase = (phase) => {
        currentPhase = phase;
        completions[phase] = new Set();

        if (phase === 'map') {
          return fanoutPhase('map', [context.gid, configuration.keys, mapNamespace]);
        }

        if (phase === 'shuffle') {
          return fanoutPhase('shuffle', [context.gid, mapNamespace, shuffleNamespace]);
        }

        if (phase === 'reduce') {
          return fanoutPhase('reduce', [context.gid, shuffleNamespace]);
        }
      };

      const coordinatorService = {
        notify: (payload, done) => {
          const sid = payload && payload.sid;
          const phase = payload && payload.phase;

          // have internal counter of how many are done, compare against total number of servers
          // before checking if done, must aggregate reduce
          // if not done, just return

          if (phase !== currentPhase) return done(null, null);

          completions[phase].add(sid);

          if (phase === 'reduce' && Array.isArray(payload.results)) {
            reduceOutputs = reduceOutputs.concat(payload.results);
          }

          if (completions[phase].size !== sids.length) {
            return done(null, null);
          }

          // else, check which phase is finisehd
          // call startPhase on next one unless it's reduced
          // if reduce, then just call finish

          if (phase === 'map') {
            startPhase('shuffle');
            return done(null, null);
          }

          if (phase === 'shuffle') {
            startPhase('reduce');
            return done(null, null);
          }

          if (phase === 'reduce') {
            finish(null, reduceOutputs);
            return done(null, reduceOutputs);
          }

          return done(null, null);
        },
      };

      const workerService = {
        serviceName,
        coordinatorNode,
        mapper: configuration.map,
        reducer: configuration.reduce,
        hashName: context.hashName,
        normalizeOutputs: function(output) {
          if (output === null || output === undefined) {
            return [];
          }

          const raw = Array.isArray(output) ? output : [output];
          const normalized = [];

          raw.forEach((entry) => {
            if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
              return;
            }

            Object.keys(entry).forEach((key) => {
              normalized.push({key: String(key), value: entry[key]});
            });
          });

          return normalized;
        },
        notifyCoordinator: function(payload, done) {
          const remote = {
            node: this.coordinatorNode,
            service: this.serviceName,
            method: 'notify',
          };

          return globalThis.distribution.local.comm.send([payload], remote, (e) => {
            if (e) return done(e);
            return done(null, payload);
          });
        },
        map: function(gid, keys, namespace, done) {
          globalThis.distribution.local.groups.get(gid, (e, group) => {
            if (e) return done(e);

            const service = this;

            // determine owned keys
            const nodes = Object.values(group || {});
            const nids = nodes.map((node) => globalThis.distribution.util.id.getNID(node));
            const localNode = globalThis.distribution.node.config;
            const localNid = globalThis.distribution.util.id.getNID(localNode);
            const localSid = globalThis.distribution.util.id.getSID(localNode);
            const hashFn = globalThis.distribution.util.id[service.hashName];
            const ownedKeys = keys.filter((key) => {
              return hashFn(globalThis.distribution.util.id.getID(key), nids) == localNid;
            });

            // call map on every key
            // for each output in outputs
            // put in store

            const processKey = (index) => {
              if (index >= ownedKeys.length) {
                return this.notifyCoordinator({phase: 'map', sid: localSid}, (e) => {
                  if (e) return done(e);
                  return done(null, ownedKeys); // don't need to technically return ownedKeys since we don't do anything with it
                });
              }

              const key = ownedKeys[index];
              return globalThis.distribution.local.store.get({gid, key}, (e, v) => {
                if (e) return done(e);

                const outputs = this.normalizeOutputs(service.mapper(key, v));

                const writeOutput = (outputIndex) => {
                  if (outputIndex >= outputs.length) return processKey(index+1);

                  const emitted = outputs[outputIndex];
                  const tempKey = globalThis.distribution.util.id.getID({
                    namespace,
                    source: key,
                    outputIndex,
                    emittedKey: emitted.key,
                  }).slice(0, 16);

                  return globalThis.distribution.local.store.put({key: emitted.key, value: emitted.value}, {gid: namespace, key: tempKey},
                      (e) => {
                        if (e) return done(e);
                        return writeOutput(outputIndex+1);
                      },
                  );
                };

                return writeOutput(0);
              });
            };

            return processKey(0);
          });
        },
        shuffle: function(gid, mapNs, shuffleNs, done) {
          const service = this;

          globalThis.distribution.local.groups.get(gid, (e, group) => {
            if (e) return done(e);

            return globalThis.distribution.local.store.get({gid: mapNs, key: null}, (e, mapKeys) => {
              if (e) return done(e);

              const nodes = Object.values(group || {});
              const nids = nodes.map((node) => globalThis.distribution.util.id.getNID(node));
              const localSid = globalThis.distribution.util.id.getSID(globalThis.distribution.node.config);
              const hashFn = globalThis.distribution.util.id[service.hashName];

              const processMappedRecord = (index) => {
                if (index >= mapKeys.length) {
                  return service.notifyCoordinator({phase: 'shuffle', sid: localSid}, (e) => {
                    if (e) return done(e);
                    return done(null, mapKeys);
                  });
                }

                const tempKey = mapKeys[index];
                globalThis.distribution.local.store.get({gid: mapNs, key: tempKey}, (e, record) => {
                  if (e) return done(e);

                  const targetNid = hashFn(globalThis.distribution.util.id.getID(record.key), nids);
                  const targetNode = nodes.find((node) => {
                    return globalThis.distribution.util.id.getNID(node) === targetNid;
                  });

                  return globalThis.distribution.local.comm.send(
                      [record.value, {gid: shuffleNs, key: String(record.key)}],
                      {node: targetNode, service: 'store', method: 'append'},
                      (e) => {
                        if (e) return done(e);
                        return processMappedRecord(index+1);
                      },
                  );
                });
              };

              return processMappedRecord(0);
            });

            // for every entry in store in namespace mapNs
            // if done, notify coordinator

          // hash it to find the node it belongs to
          // call rpc write and store it to namespace shuffleNs
          });
        },
        reduce: function(gid, shuffleNs, done) {
        // for each key in shuffleNs, run reduce on the value
        // once done, notify with payload
          const service = this;
          const localSid = globalThis.distribution.util.id.getSID(globalThis.distribution.node.config);

          globalThis.distribution.local.store.get({gid: shuffleNs, key: null}, (e, keys) => {
            if (e) return done(e);

            const results = [];
            const processGroupedKey = (index) => {
              if (index >= keys.length) {
                return service.notifyCoordinator({phase: 'reduce', sid: localSid, results}, (e) => {
                  if (e) return done(e);
                  return done(null, results);
                },
                );
              }

              const key = keys[index];
              globalThis.distribution.local.store.get({gid: shuffleNs, key: key}, (e, values) => {
                if (e) return done(e);

                const outputs = service.normalizeOutputs(
                    service.reducer(key, Array.isArray(values) ? values : [values]),
                );

                outputs.forEach((entry) => {
                  const out = {};
                  out[entry.key] = entry.value;
                  results.push(out);
                });

                return processGroupedKey(index + 1);
              });
            };
            return processGroupedKey(0);
          });
        },
        cleanup: function(namespaces, done) {
          const deleteNamespace = (index) => {
            if (index >= namespaces.length) return done(null, null);

            const namespace = namespaces[index];
            return globalThis.distribution.local.store.get({gid: namespace, key: null}, (e, keys) => {
              if (e) return done(e);

              const deleteKey = (keyIndex) => {
                if (keyIndex >= keys.length) return deleteNamespace(index+1);

                return globalThis.distribution.local.store.del(
                    {gid: namespace, key: keys[keyIndex]},
                    (e) => {
                      if (e) return done(e);
                      return deleteKey(keyIndex+1);
                    },
                );
              };
              return deleteKey(0);
            });
          };

          return deleteNamespace(0);
        },
      };


      return globalThis.distribution.local.routes.put(coordinatorService, serviceName, (e) => {
        if (e) return callback(e);

        localRouteRegistered = true;

        return globalThis.distribution[context.gid].routes.put(workerService, serviceName, (routesError) => {
          if (routesError && Object.keys(routesError).length > 0) {
            return fail(routesError[Object.keys(routesError)[0]]);
          }

          workerRoutesRegistered = true;
          return startPhase('map');
        });
      });
    });
  }

  return {exec};
}

module.exports = mr;
