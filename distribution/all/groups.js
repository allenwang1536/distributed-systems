// @ts-check
/**
 * @typedef {import("../types.js").Callback} Callback
 * @typedef {import("../types.js").Config} Config
 * @typedef {import("../util/id.js").Node} Node
 *
 * @typedef {Object} Groups
 * @property {(config: Config | string, group: Object.<string, Node>, callback: Callback) => void} put
 * @property {(name: string, callback: Callback) => void} del
 * @property {(name: string, callback: Callback) => void} get
 * @property {(name: string, node: Node, callback: Callback) => void} add
 * @property {(name: string, node: string, callback: Callback) => void} rem
 */

/**
 * @param {Config} config
 * @returns {Groups}
 */
function groups(config) {
  const context = {gid: config.gid || 'all'};

  function fanout(method, args, callback) {
    const gid = context.gid;

    globalThis.distribution.local.groups.get(gid, (ge, group) => {
      if (ge || !group) {
        return callback(ge || new Error(`groups.${method}: no such group "${gid}"`), {});
      }

      const sids = Object.keys(group);
      if (sids.length === 0) {
        return callback(new Error(`groups.${method}: group "${gid}" is empty`), {});
      }

      const values = Object.create(null);
      const errors = Object.create(null);

      let pending = sids.length;
      for (const sid of sids) {
        const node = group[sid];

        globalThis.distribution.local.comm.send(args, {
          node,
          gid: 'local',
          service: 'groups',
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
   * @param {Config | string} config
   * @param {Object.<string, Node>} group
   * @param {Callback} callback
   */
  function put(config, group, callback) {
    return fanout('put', [config, group], callback);
  }

  /**
   * @param {string} name=
   * @param {Callback} callback
   */
  function del(name, callback) {
    return fanout('del', [name], callback);
  }

  /**
   * @param {string} name
   * @param {Callback} callback
   */
  function get(name, callback) {
    return fanout('get', [name], callback);
  }

  /**
   * @param {string} name
   * @param {Node} node
   * @param {Callback} callback
   */
  function add(name, node, callback) {
    return fanout('add', [name, node], callback);
  }

  /**
   * @param {string} name
   * @param {string} node
   * @param {Callback} callback
   */
  function rem(name, node, callback) {
    return fanout('rem', [name, node], callback);
  }

  return {
    put, del, get, add, rem,
  };
}

module.exports = groups;
