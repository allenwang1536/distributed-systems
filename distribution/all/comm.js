// @ts-check
/**
 * @typedef {import("../types.js").Callback} Callback
 * @typedef {import("../types.js").Config} Config
 */

/**
 * NOTE: This Target is slightly different from local.all.Target
 * @typedef {Object} Target
 * @property {string} service
 * @property {string} method
 * @property {string} [gid]
 *
 * @typedef {Object} Comm
 * @property {(message: any[], configuration: Target, callback: Callback) => void} send
 */

/**
 * @param {Config} config
 * @returns {Comm}
 */
function comm(config) {
  const context = {gid: config.gid || 'all'};

  /**
   * @param {any[]} message
   * @param {Target} configuration
   * @param {Callback} callback
   */
  function send(message, configuration, callback) {
    const gid = context.gid;

    if (typeof callback !== 'function') {
      return;
    }

    globalThis.distribution.local.groups.get(gid, (groupErr, group) => {
      if (groupErr || !group) {
        return callback(groupErr || new Error(`comm.send: no such group "${gid}"`));
      }

      const sids = Object.keys(group);
      if (sids.length === 0) {
        return callback(new Error(`comm.send: group "${gid}" is empty`));
      }

      if (!Array.isArray(message)) {
        const errors = Object.create(null);
        for (const sid of sids) {
          errors[sid] = new Error('comm.send: message must be an array');
        }
        return callback(errors, {});
      }

      const svcOk = configuration && typeof configuration.service === 'string' && configuration.service.length > 0;
      const mOk = configuration && typeof configuration.method === 'string' && configuration.method.length > 0;
      if (!svcOk || !mOk) {
        const errors = Object.create(null);
        for (const sid of sids) {
          errors[sid] = new Error('comm.send: remote must include service and method');
        }
        return callback(errors, {});
      }

      const remoteGid = (typeof configuration.gid === 'string' && configuration.gid.length > 0) ?
        configuration.gid :
        'local'; // must default to local, not context gid

      const values = Object.create(null);
      const errors = Object.create(null);

      let pending = sids.length;
      for (const sid of sids) {
        const node = group[sid];
        if (!node || typeof node.ip !== 'string' || typeof node.port !== 'number') {
          errors[sid] = new Error('comm.send: invalid node in group');
          pending -= 1;
          if (pending === 0) {
            return callback(errors, values);
          }
          continue;
        }

        const remote = {
          node,
          gid: remoteGid,
          service: configuration.service,
          method: configuration.method,
        };

        globalThis.distribution.local.comm.send(message, remote, (e, v) => {
          if (e) {
            errors[sid] = e instanceof Error ? e : new Error(String(e));
          } else {
            values[sid] = v;
          }

          pending -= 1;
          if (pending === 0) {
            const errOut = Object.keys(errors).length === 0 ? {} : errors;
            return callback(errOut, values);
          }
        });
      }
    });
  }

  return {send};
}

module.exports = comm;
