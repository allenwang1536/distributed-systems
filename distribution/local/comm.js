// @ts-check
/**
 * @typedef {import("../types.js").Callback} Callback
 * @typedef {import("../types.js").Node} Node
 */

const http = require('node:http');

/**
 * @typedef {Object} Target
 * @property {string} service
 * @property {string} method
 * @property {Node} node
 * @property {string} [gid]
 */

/**
 * @param {Array<any>} message
 * @param {Target} remote
 * @param {(error: Error, value?: any) => void} callback
 * @returns {void}
 */
function send(message, remote, callback) {
  if (!remote || typeof remote !== 'object') {
    return callback(new Error('comm.send: remote must be an object'), undefined);
  }
  if (!remote.node || typeof remote.node !== 'object') {
    return callback(new Error('comm.send: remote.node is required'), undefined);
  }
  if (typeof remote.node.ip !== 'string' || remote.node.ip.length === 0) {
    return callback(new Error('comm.send: remote.node.ip is required'), undefined);
  }
  if (typeof remote.node.port !== 'number' || !Number.isFinite(remote.node.port)) {
    return callback(new Error('comm.send: remote.node.port is required'), undefined);
  }
  if (typeof remote.service !== 'string' || remote.service.length === 0) {
    return callback(new Error('comm.send: remote.service is required'), undefined);
  }
  if (typeof remote.method !== 'string' || remote.method.length === 0) {
    return callback(new Error('comm.send: remote.method is required'), undefined);
  }

  let args;
  if (message === null || message === undefined) {
    args = [];
  } else if (Array.isArray(message)) {
    args = message;
  } else {
    return callback(new Error('comm.send: message must be an array'), undefined);
  }

  const gid = (typeof remote.gid === 'string' && remote.gid.length > 0) ? remote.gid : 'local';
  const path = `/${gid}/${encodeURIComponent(remote.service)}/${encodeURIComponent(remote.method)}`;

  const options = {
    hostname: remote.node.ip,
    port: remote.node.port,
    path,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const decoded = globalThis.distribution.util.deserialize(data);

        if (Array.isArray(decoded) && decoded.length === 2) {
          return callback(decoded[0] || null, decoded[1]);
        }

        if (decoded instanceof Error) {
          return callback(decoded);
        }

        return callback(new Error('Invalid response format'));
      } catch (err) {
        return callback(err instanceof Error ? err : new Error(String(err)));
      }
    });
  });

  req.on('error', (err) => {
    callback(err instanceof Error ? err : new Error(String(err)));
  });

  req.write(globalThis.distribution.util.serialize(args));
  req.end();
}

module.exports = {send};
