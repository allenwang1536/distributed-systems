// @ts-check
/**
 * @typedef {import("../types.js").Callback} Callback
 * @typedef {import("../types.js").Config} Config
 * @typedef {import("../types.js").Node} Node
 */

const {setup} = require('../all/all.js');

function ensureGroupsState() {
  if (!globalThis.distribution.node) {
    globalThis.distribution.node = {};
  }
  if (!globalThis.distribution.node.groups) {
    globalThis.distribution.node.groups = Object.create(null);
  }

  const groupsState = globalThis.distribution.node.groups;

  const localNode = globalThis.distribution?.node?.config;
  if (localNode && typeof localNode.ip === 'string' && typeof localNode.port === 'number') {
    const localSid = globalThis.distribution.util.id.getSID(localNode);

    if (!groupsState.local) groupsState.local = Object.create(null);
    if (!groupsState.all) groupsState.all = Object.create(null);

    groupsState.local[localSid] = localNode;
    groupsState.all[localSid] = localNode;
  }
  return groupsState;
}

/**
 * @param {string} name
 * @param {Callback} callback
 */
function get(name, callback) {
  callback = (typeof callback === 'function') ? callback : null;

  const groupsState = ensureGroupsState();
  const group = groupsState[name];

  if (!group) {
    if (callback) return callback(new Error(`groups.get: no such group "${name}"`));
  }

  if (callback) return callback(null, group);
}

/**
 * @param {Config | string} config
 * @param {Object.<string, Node>} group
 * @param {Callback} callback
 */
function put(config, group, callback) {
  callback = (typeof callback === 'function') ? callback : null;
  const name = (typeof config === 'string') ?
    config :
    (config && typeof config === 'object' ? config.gid : null);

  if (typeof name !== 'string' || name.length === 0) {
    if (callback) return callback(new Error('groups.put: gid must be a non-empty string'));
  }
  if (!group || typeof group !== 'object' || Array.isArray(group)) {
    if (callback) return callback(new Error('groups.put: group must be an object mapping sid -> node'));
  }

  const groupsState = ensureGroupsState();
  groupsState[name] = group;

  if (name !== 'local' && name !== 'all') {
    globalThis.distribution[name] = setup(
      typeof config === 'object' && config !== null ? {...config, gid: name} : {gid: name},
    );
  }

  if (callback) return callback(null, group);
}

/**
 * @param {string} name
 * @param {Callback} callback
 */
function del(name, callback) {
  callback = (typeof callback === 'function') ? callback : null;

  if (typeof name !== 'string' || name.length === 0) {
    if (callback) return callback(new Error('groups.del: name must be a non-empty string'));
  }

  if (name === 'local' || name === 'all') {
    if (callback) return callback(new Error(`groups.del: cannot delete built-in group "${name}"`));
  }

  const groupsState = ensureGroupsState();
  const existing = groupsState[name];
  if (!existing) {
    if (callback) return callback(new Error(`groups.del: no such group "${name}"`));
  }

  delete groupsState[name];

  // unnecessary defensive check? will keep just in case
  if (globalThis.distribution[name]) {
    delete globalThis.distribution[name];
  }

  if (callback) return callback(null, existing);
}

/**
 * @param {string} name
 * @param {Node} node
 * @param {Callback} callback
 */
function add(name, node, callback) {
  callback = (typeof callback === 'function') ? callback : null;

  if (typeof name !== 'string' || name.length === 0) {
    if (callback) return callback(new Error('groups.add: name must be a non-empty string'));
  }
  if (!node || typeof node !== 'object') {
    if (callback) return callback(new Error('groups.add: node must be an object'));
  }
  if (typeof node.ip !== 'string' || node.ip.length === 0) {
    if (callback) return callback(new Error('groups.add: node.ip is required'));
  }
  if (typeof node.port !== 'number' || !Number.isFinite(node.port)) {
    if (callback) return callback(new Error('groups.add: node.port is required'));
  }

  const groupsState = ensureGroupsState();
  const group = groupsState[name];


  if (!group) {
    if (callback) return callback(new Error(`groups.add: no such group "${name}"`));
  }

  const sid = globalThis.distribution.util.id.getSID(node);
  group[sid] = {ip: node.ip, port: node.port};

  if (callback) return callback(null, group);
};

/**
 * @param {string} name
 * @param {string} node
 * @param {Callback} callback
 */
function rem(name, node, callback) {
  callback = (typeof callback === 'function') ? callback : null;

  if (typeof name !== 'string' || name.length === 0) {
    if (callback) return callback(new Error('groups.rem: name must be a non-empty string'));
  }
  if (typeof node !== 'string' || node.length === 0) {
    if (callback) return callback(new Error('groups.rem: node must be a non-empty sid string'));
  }

  const groupsState = ensureGroupsState();
  const group = groupsState[name];

  if (!group) {
    if (callback) return callback(new Error(`groups.rem: no such group "${name}"`));
  }

  if (group[node]) {
    delete group[node];
  }

  if (callback) return callback(null, group);
};

module.exports = {get, put, del, add, rem};
