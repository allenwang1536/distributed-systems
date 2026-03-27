// @ts-check
/**
 * @typedef {import("../types.js").Callback} Callback
 *
 * @typedef {Object} StoreConfig
 * @property {?string} key
 * @property {?string} gid
 *
 * @typedef {StoreConfig | string | null} SimpleConfig
 */

const fs = require('node:fs');
const path = require('node:path');

/* Notes/Tips:

- Use absolute paths to make sure they are agnostic to where your code is running from!
  Use the `path` module for that.
*/

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

function getNodeStoreDir() {
  const root = path.resolve(__dirname, '..', '..', 'store');
  const sid = globalThis.distribution.util.id.getSID(globalThis.distribution.node.config);
  return path.join(root, `s-${sid}`);
}

function getFilePath(gid, key) {
  const dir = getNodeStoreDir();
  const safeName = Buffer.from(`${gid}:${key}`, 'utf8').toString('hex');
  return path.join(dir, safeName);
}

function ensureDir(dir, callback) {
  fs.mkdir(dir, {recursive: true}, callback);
}

/**
 * @param {any} state
 * @param {SimpleConfig} configuration
 * @param {Callback} callback
 */
function put(state, configuration, callback) {
  const {gid, key: rawKey} = normalizeConfig(configuration);
  const key = rawKey ?? globalThis.distribution.util.id.getID(state);
  const dir = getNodeStoreDir();
  const filePath = getFilePath(gid, key);
  const record = {gid, key, value: state};
  const serialized = globalThis.distribution.util.serialize(record);

  ensureDir(dir, (err) => {
    if (err) return callback(err);

    fs.writeFile(filePath, serialized, 'utf8', (err) => {
      if (err) return callback(err);
      return callback(null, state);
    });
  });
}

/**
 * @param {SimpleConfig} configuration
 * @param {Callback} callback
 */
function get(configuration, callback) {
  const {key, gid} = normalizeConfig(configuration);
  const dir = getNodeStoreDir();

  if (key === null) {
    ensureDir(dir, (err) => {
      if (err) return callback(err);

      fs.readdir(dir, (err, files) => {
        if (err) return callback(err);

        if (files.length === 0) return callback(null, []);

        const keys = [];
        let pending = files.length;
        let finished = false;

        files.forEach((file) => {
          fs.readFile(path.join(dir, file), 'utf8', (err, data) => {
            if (finished) return;

            if (!err) {
              try {
                const record = globalThis.distribution.util.deserialize(data);
                if (record && record.gid === gid && typeof record.key === 'string') {
                  keys.push(record.key);
                }
              } catch {
                // ignore malformed files for now
              }
            }

            pending -= 1;
            if (pending === 0) {
              finished = true;
              return callback(null, keys.sort());
            }
          });
        });
      });
    });
    return;
  }

  const filePath = getFilePath(gid, key);
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        return callback(new Error('Key not found'));
      }
      return callback(err);
    }

    try {
      const record = globalThis.distribution.util.deserialize(data);
      return callback(null, record.value);
    } catch (error) {
      return callback(error);
    }
  });
}

/**
 * @param {SimpleConfig} configuration
 * @param {Callback} callback
 */
function del(configuration, callback) {
  const {key, gid} = normalizeConfig(configuration);
  if (key === null) {
    return callback(new Error('Key not found'));
  }
  const filePath = getFilePath(gid, key);

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        return callback(new Error('Key not found'));
      }
      return callback(err);
    }

    let record;
    try {
      record = globalThis.distribution.util.deserialize(data);
    } catch (error) {
      return callback(error);
    }

    fs.unlink(filePath, (err) => {
      if (err) return callback(err);
      return callback(null, record.value);
    });
  });
}

/**
 * @param {any} state
 * @param {SimpleConfig} configuration
 * @param {Callback} callback
 */
function append(state, configuration, callback) {
  const {gid, key: rawKey} = normalizeConfig(configuration);
  const key = rawKey ?? globalThis.distribution.util.id.getID(state);
  const dir = getNodeStoreDir();
  const filePath = getFilePath(gid, key);

  try {
    fs.mkdirSync(dir, {recursive: true});

    let nextValue = [state];

    try {
      const data = fs.readFileSync(filePath, 'utf8');
      const record = globalThis.distribution.util.deserialize(data);

      if (Array.isArray(record.value)) {
        nextValue = [...record.value, state];
      } else if (record.value === undefined) {
        nextValue = [state];
      } else {
        nextValue = [record.value, state];
      }
    } catch (e) {
      if (!e || e.code !== 'ENOENT') {
        return callback(e);
      }
    }

    const record = {gid, key, value: nextValue};
    const serialized = globalThis.distribution.util.serialize(record);
    fs.writeFileSync(filePath, serialized, 'utf8');
    return callback(null, nextValue);
  } catch (e) {
    return callback(e);
  }
}

module.exports = {put, get, del, append};
