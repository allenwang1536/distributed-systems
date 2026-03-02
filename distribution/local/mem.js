// @ts-check
/**
 * @typedef {import("../types.js").Callback} Callback
 *
 * @typedef {Object} StoreConfig
 * @property {string | null} key
 * @property {string | null} gid
 *
 * @typedef {StoreConfig | string | null} SimpleConfig
 */

const namespaces = new Map();

function normalizeConfig(configuration) {
  if (configuration === null || configuration === undefined) {
    return {key: null, gid: 'local'};
  }

  if (typeof configuration === 'string') {
    return {key: configuration, gid: 'local'};
  }

  return {
    key: configuration.key ?? null,
    gid: configuration.gid ?? 'local',
  };
}

function getNamespace(gid) {
  if (!namespaces.has(gid)) {
    namespaces.set(gid, new Map());
  }

  return namespaces.get(gid);
}

/**
 * @param {any} state
 * @param {SimpleConfig} configuration
 * @param {Callback} callback
 */
function put(state, configuration, callback) {
  const {gid} = normalizeConfig(configuration);
  const namespace = getNamespace(gid);
  const key = normalizeConfig(configuration).key ?? globalThis.distribution.util.id.getID(state);

  namespace.set(key, state);
  return callback(null, state);
};

/**
 * @param {any} state
 * @param {SimpleConfig} configuration
 * @param {Callback} callback
 */
function append(state, configuration, callback) {
  return callback(new Error('mem.append not implemented')); // You'll need to implement this method for the distributed processing milestone.
};

/**
 * @param {SimpleConfig} configuration
 * @param {Callback} callback
 */
function get(configuration, callback) {
  const {key, gid} = normalizeConfig(configuration);
  const namespace = getNamespace(gid);
  if (key === null) {
    return callback(null, Array.from(namespace.keys()).sort());
  }
  if (!namespace.has(key)) {
    return callback(new Error('Key not found'));
  }

  return callback(null, namespace.get(key));
}

/**
 * @param {SimpleConfig} configuration
 * @param {Callback} callback
 */
function del(configuration, callback) {
  const {key, gid} = normalizeConfig(configuration);
  const namespace = getNamespace(gid);
  if (key === null || !namespace.has(key)) {
    return callback(new Error('Key not found'));
  }

  const value = namespace.get(key);
  namespace.delete(key);
  return callback(null, value);
};

module.exports = {put, get, del, append};
