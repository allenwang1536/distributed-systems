// @ts-check
/**
 * @typedef {import("../types.js").Callback} Callback
 * @typedef {import("../types.js").Config} Config
 * @typedef {import("../util/id.js").Node} Node
 *
 * @typedef {Object} Status
 * @property {(configuration: string, callback: Callback) => void} get
 * @property {(configuration: Node, callback: Callback) => void} spawn
 * @property {(callback: Callback) => void} stop
 */

/**
 * @param {Config} config
 * @returns {Status}
 */
function status(config) {
  const context = {};
  context.gid = config.gid || 'all';

  /**
   * @param {string} configuration
   * @param {Callback} callback
   */
  function get(configuration, callback) {
    const key = configuration;
    const gid = context.gid;

    const remote = {service: 'status', method: 'get', gid: 'local'};

    globalThis.distribution[gid].comm.send([key], remote, (e, v) => {
      const errMap =
        (e && typeof e === 'object' && !Array.isArray(e) && Object.keys(e).length > 0) ? e : {};

      if (Object.keys(errMap).length > 0) {
        return callback(errMap, {});
      }

      if (!v || typeof v !== 'object' || Array.isArray(v)) {
        return callback({}, {});
      }

      if (key === 'nid' || key === 'sid') {
        return callback({}, Object.values(v));
      }

      if (key === 'heapTotal') {
        const total = Object.values(v).reduce((acc, val) => acc + Number(val || 0), 0);
        return callback({}, total);
      }

      if (key === 'heapUsed') {
        return callback({}, v);
      }
      return callback({}, v);
    });
  }

  /**
   * @param {Node} configuration
   * @param {Callback} callback
   */
  function spawn(configuration, callback) {
    callback(new Error('status.spawn not implemented')); // If you won't implement this, check the skip.sh script.
  }

  /**
   * @param {Callback} callback
   */
  function stop(callback) {
    callback(new Error('status.stop not implemented')); // If you won't implement this, check the skip.sh script.
  }

  return {get, stop, spawn};
}

module.exports = status;
