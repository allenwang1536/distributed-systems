// @ts-check
/**
 * @typedef {import("../types.js").Callback} Callback
 * @typedef {import("../types.js").Node} Node
 */

const {naiveHash} = require('../util/id.js');
const local = require('./local.js');

/**
 * @param {string} configuration
 * @param {Callback} callback
 */
function get(configuration, callback) {
  const key = configuration;
  const node = globalThis.distribution?.node?.config;

  if (globalThis.distribution.node.counts === undefined) {
    globalThis.distribution.node.counts = 0;
  }

  switch (key) {
    case 'nid':
      return callback(null, globalThis.distribution.util.id.getNID(node));
    case 'sid':
      return callback(null, globalThis.distribution.util.id.getSID(node));
    case 'ip':
      return callback(null, node.ip);
    case 'port':
      return callback(null, node.port);
    case 'counts':
      return callback(null, Number(globalThis.distribution.node.counts) || 0);
    case 'heapTotal':
      return callback(null, process.memoryUsage().heapTotal);
    case 'heapUsed':
      return callback(null, process.memoryUsage().heapUsed);
    default:
      return callback(new Error(`status.get: unknown key "${key}"`));
  }
};


/**
 * @param {Node} configuration
 * @param {Callback} callback
 */
function spawn(configuration, callback) {
  callback(new Error('status.spawn not implemented'));
}

/**
 * @param {Callback} callback
 */
function stop(callback) {
  callback(new Error('status.stop not implemented'));
}

module.exports = {get, spawn, stop};
