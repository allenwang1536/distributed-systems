// @ts-check
/**
 * @typedef {import("../types.js").Callback} Callback
 * @typedef {import("../types.js").Config} Config
 *
 * @typedef {Object} Routes
 * @property {(service: object, name: string, callback: Callback) => void} put
 * @property {(configuration: string, callback: Callback) => void} rem
 */

const {getID} = require('../util/id.js');

/**
 * @param {Config} config
 * @returns {Routes}
 */
function routes(config) {
  const context = {};
  context.gid = config.gid || 'all';

  function fanout(method, args, callback) {
    const gid = context.gid;

    globalThis.distribution.local.groups.get(gid, (ge, group) => {
      if (ge || !group) {
        return callback(ge || new Error(`routes.${method}: no such group "${gid}"`), {});
      }

      const sids = Object.keys(group);
      if (sids.length === 0) {
        return callback(new Error(`routes.${method}: group "${gid}" is empty`), {});
      }

      const values = Object.create(null);
      const errors = Object.create(null);

      let pending = sids.length;
      for (const sid of sids) {
        const node = group[sid];

        globalThis.distribution.local.comm.send(args, {
          node,
          gid: 'local',
          service: 'routes',
          method,
        }, (e, v) => {
          if (e) {
            errors[sid] = e instanceof Error ? e : new Error(String(e));
          } else {
            values[sid] = v;
          }

          pending -= 1;
          if (pending === 0) {
            if (Object.keys(errors).length > 0) {
              return callback(errors, {});
            }
            return callback({}, values);
          }
        });
      }
    });
  }

  /**
   * @param {object} service
   * @param {string} name
   * @param {Callback} callback
   */
  function put(service, name, callback) {
    return fanout('put', [service, name], callback);
  }

  /**
   * @param {string} configuration
   * @param {Callback} callback
   */
  function rem(configuration, callback) {
    return fanout('rem', [configuration], callback);
  }

  return {put, rem};
}

module.exports = routes;
