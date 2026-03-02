// @ts-check
/**
 * @typedef {import("../types.js").Callback} Callback
 * @typedef {import("../types.js").Config} Config
 * @typedef {import("../types.js").Node} Node
 */


/**
 * @typedef {Object} StoreConfig
 * @property {string | null} key
 * @property {string} gid
 *
 * @typedef {StoreConfig | string | null} SimpleConfig
 *
 * @typedef {Object} Mem
 * @property {(configuration: SimpleConfig, callback: Callback) => void} get
 * @property {(state: any, configuration: SimpleConfig, callback: Callback) => void} put
 * @property {(state: any, configuration: SimpleConfig, callback: Callback) => void} append
 * @property {(configuration: SimpleConfig, callback: Callback) => void} del
 * @property {(configuration: Object.<string, Node>, callback: Callback) => void} reconf
 */


/**
 * @param {Config} config
 * @returns {Mem}
 */
function mem(config) {
  const context = {};
  context.gid = config.gid || 'all';
  context.hash = config.hash || globalThis.distribution.util.id.naiveHash;

  function normalizeConfig(configuration) {
    if (configuration === null || configuration === undefined) {
      return {key: null, gid: context.gid};
    }

    if (typeof configuration === 'string') {
      return {key: configuration, gid: context.gid};
    }

    return {
      key: configuration.key ?? null,
      gid: configuration.gid ?? context.gid,
    };
  }

  function resolveNodeForKey(key, callback) {
    globalThis.distribution.local.groups.get(context.gid, (e, group) => {
      if (e) return callback(e);

      const nodes = Object.values(group || {});
      if (nodes.length === 0) {
        return callback(new Error(`mem: group "${context.gid}" is empty`));
      }

      const kid = globalThis.distribution.util.id.getID(key);
      const nids = nodes.map((node) => globalThis.distribution.util.id.getNID(node));
      const targetNid = context.hash(kid, nids);
      const targetNode = nodes.find((node) => globalThis.distribution.util.id.getNID(node) === targetNid);

      if (!targetNode) {
        return callback(new Error(`mem: could not resolve node for key "${key}"`));
      }

      return callback(null, targetNode);
    });
  }

  /**
   * @param {SimpleConfig} configuration
   * @param {Callback} callback
   */
  function get(configuration, callback) {
    const config = normalizeConfig(configuration);

    if (config.key === null) {
      return callback(new Error('no key provided'));
    }

    resolveNodeForKey(config.key, (e, node) => {
      if (e) return callback(e);

      const remote = {node, service: 'mem', method: 'get'};
      return globalThis.distribution.local.comm.send([config], remote, callback);
    });
  }

  /**
   * @param {any} state
   * @param {SimpleConfig} configuration
   * @param {Callback} callback
   */
  function put(state, configuration, callback) {
    const config = normalizeConfig(configuration);
    const key = config.key ?? globalThis.distribution.util.id.getID(state);
    const resolvedConfig = {key, gid: config.gid};

    resolveNodeForKey(key, (e, node) => {
      if (e) return callback(e);

      const remote = {node, service: 'mem', method: 'put'};
      return globalThis.distribution.local.comm.send([state, resolvedConfig], remote, callback);
    });
  }

  /**
   * @param {any} state
   * @param {SimpleConfig} configuration
   * @param {Callback} callback
   */
  function append(state, configuration, callback) {
    return callback(new Error('mem.append not implemented')); // You'll need to implement this method for the distributed processing milestone.
  }

  /**
   * @param {SimpleConfig} configuration
   * @param {Callback} callback
   */
  function del(configuration, callback) {
    const config = normalizeConfig(configuration);

    if (config.key === null) return callback(new Error('mem.del key is null'));

    resolveNodeForKey(config.key, (e, node) => {
      if (e) return callback(e);

      const remote = {node, service: 'mem', method: 'del'};
      return globalThis.distribution.local.comm.send([config], remote, callback);
    });
  }

  /**
   * @param {Object.<string, Node>} configuration
   * @param {Callback} callback
   */
  function reconf(configuration, callback) {
    return callback(new Error('mem.reconf not implemented'));
  }
  /* For the distributed mem service, the configuration will
          always be a string */
  return {
    get,
    put,
    append,
    del,
    reconf,
  };
}

module.exports = mem;
