/**
 * @typedef {import("../types").Callback} Callback
 * @typedef {string} ServiceName
 */

const localRoutes = Object.create(null);

/**
 * @param {ServiceName | {service: ServiceName, gid?: string}} configuration
 * @param {Callback} callback
 * @returns {void}
 */
function get(configuration, callback) {
  let serviceName;
  let gid = 'local';

  if (typeof configuration === 'string') {
    serviceName = configuration;
  } else if (configuration && typeof configuration === 'object') {
    serviceName = configuration.service;
    if (typeof configuration.gid === 'string' && configuration.gid.length > 0) {
      gid = configuration.gid;
    }
  }

  if (typeof serviceName !== 'string' || serviceName.length === 0) {
    return callback(new Error('routes.get: service name must be a non-empty string'));
  }

  if (gid === 'local') {
    const service = localRoutes[serviceName];
    if (!service) {
      return callback(new Error(`routes.get: no such service "${serviceName}"`));
    }
    return callback(null, service);
  }

  // TODO: handle gid non-local
  const groupObj = globalThis.distribution ? globalThis.distribution[gid] : undefined;
  if (!groupObj || typeof groupObj !== 'object') {
    return callback(new Error(`routes.get: no such group "${gid}"`));
  }

  const service = groupObj[serviceName];
  if (!service) {
    return callback(new Error(`routes.get: no such service "${serviceName}" in group "${gid}"`));
  }

  return callback(null, service);
}

/**
 * @param {object} service
 * @param {string} configuration
 * @param {Callback} callback
 * @returns {void}
 */
function put(service, configuration, callback) {
  if (!service || (typeof service !== 'object' && typeof service !== 'function')) {
    return callback(new Error('routes.put: service must be an object or function'));
  }
  if (typeof configuration !== 'string' || configuration.length === 0) {
    return callback(new Error('routes.put: service name must be a non-empty string'));
  }

  localRoutes[configuration] = service;
  return callback(null, configuration);
}

/**
 * @param {string} configuration
 * @param {Callback} callback
 */
function rem(configuration, callback) {
  if (typeof configuration !== 'string' || configuration.length === 0) {
    callback(new Error('routes.rem: service name must be a non-empty string'));
    return;
  }

  const existing = localRoutes[configuration];
  if (!existing) {
    callback(new Error(`routes.rem: no such service "${configuration}"`));
    return;
  }

  delete localRoutes[configuration];
  callback(null, existing);
}

module.exports = {get, put, rem};
