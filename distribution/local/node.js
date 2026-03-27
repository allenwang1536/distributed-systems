// @ts-check
/**
 * @typedef {import("../types.js").Node} Node
 * @typedef {import("../types.js").Callback} Callback
 */
const http = require('node:http');
const url = require('node:url');
const log = require('../util/log.js');

const yargs = require('yargs/yargs');

/**
 * @returns {Node}
 */
function setNodeConfig() {
  const args = yargs(process.argv)
      .help(false)
      .version(false)
      .parse();

  let maybeIp; let maybePort; let maybeOnStart;
  if (typeof args.ip === 'string') {
    maybeIp = args.ip;
  }
  if (typeof args.port === 'string' || typeof args.port === 'number') {
    maybePort = parseInt(String(args.port), 10);
  }

  if (args.help === true || args.h === true) {
    console.log('Node usage:');
    console.log('  --ip <ip address>      The ip address to bind the node to');
    console.log('  --port <port>          The port to bind the node to');
    console.log('  --config <config>      The serialized config string');
    process.exit(0);
  }

  if (typeof args.config === 'string') {
    let config = undefined;
    try {
      config = globalThis.distribution.util.deserialize(args.config);
    } catch (error) {
      try {
        config = JSON.parse(args.config);
      } catch {
        console.error('Cannot deserialize config string: ' + args.config);
        process.exit(1);
      }
    }

    if (typeof config?.ip === 'string') {
      maybeIp = config?.ip;
    }
    if (typeof config?.port === 'number') {
      maybePort = config?.port;
    }
    if (typeof config?.onStart === 'function') {
      maybeOnStart = config?.onStart;
    }
  }

  // Default values for config
  maybeIp = maybeIp ?? '127.0.0.1';
  maybePort = maybePort ?? 1234;

  return {
    ip: maybeIp,
    port: maybePort,
    onStart: maybeOnStart,
  };
}
/*
    The start function will be called to start your node.
    It will take a callback as an argument.
    After your node has booted, you should call the callback.
*/


/**
 * @param {(err?: Error | null) => void} callback
 * @returns {void}
 */
function start(callback) {
  const server = http.createServer((req, res) => {
    /* Your server will be listening for PUT requests. */

    if (globalThis.distribution?.node?.counts === undefined) {
      globalThis.distribution.node.counts = 0;
    }

    globalThis.distribution.node.counts += 1;

    if (req.method !== 'PUT') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json');
      const err = new Error('node: only PUT requests are supported');
      res.end(globalThis.distribution.util.serialize(err));
      return;
    }

    /*
      The path of the http request will determine the service to be used.
      The url will have the form: http://node_ip:node_port/service/method
    */

    const parsed = url.parse(req.url || '', false);
    const pathname = parsed.pathname || '';
    const parts = pathname.split('/').filter(Boolean).map((p) => decodeURIComponent(p));

    let gid;
    let serviceName;
    let methodName;

    if (parts.length === 3) {
      gid = parts[0];
      serviceName = parts[1];
      methodName = parts[2];
    } else if (parts.length === 2) {
      gid = 'local';
      serviceName = parts[0];
      methodName = parts[1];
    } else {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      const err = new Error('node: invalid path, expected /<gid>/<service>/<method>');
      res.end(globalThis.distribution.util.serialize([err, null]));
      return;
    }

    /*
      A common pattern in handling HTTP requests in Node.js is to have a
      subroutine that collects all the data chunks belonging to the same
      request. These chunks are aggregated into a body variable.

      When the req.on('end') event is emitted, it signifies that all data from
      the request has been received. Typically, this data is in the form of a
      string. To work with this data in a structured format, it is often parsed
      into a JSON object using JSON.parse(body), provided the data is in JSON
      format.

      Our nodes expect data in JSON format.
    */

    // Write some code...

    /** @type {any[]} */
    const body = [];

    req.on('data', (chunk) => {
      body.push(chunk);
    });

    req.on('end', () => {
      /*
        Here, you can handle the service requests.
        Use the local routes service to get the service you need to call.
        You need to call the service with the method and arguments provided in the request.
        Then, you need to serialize the result and send it back to the caller.
      */

      // Write some code...


      let args;
      try {
        const raw = Buffer.concat(body).toString('utf8');
        args = globalThis.distribution.util.deserialize(raw);
      } catch (e) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        const err = e instanceof Error ? e : new Error(String(e));
        res.end(globalThis.distribution.util.serialize([err, null]));
        return;
      }

      if (!Array.isArray(args)) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(globalThis.distribution.util.serialize([new Error('node: request body must be a serialized array'), null]));
        return;
      }

      globalThis.distribution.local.routes.get({service: serviceName, gid: gid}, (e, service) => {
        if (e || !service) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.end(globalThis.distribution.util.serialize([e || new Error(`node: service not found: ${serviceName}`), null]));
          return;
        }

        const method = service[methodName];

        if (typeof method !== 'function') {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.end(globalThis.distribution.util.serialize([new Error(`node: method not found: ${serviceName}.${methodName}`), null]));
          return;
        }

        const done = (err, value) => {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(globalThis.distribution.util.serialize([err || null, value === undefined ? null : value]));
        };

        try {
          method.call(service, ...args, done);
        } catch (err) {
          done(err instanceof Error ? err : new Error(String(err)), null);
        }
      });
    });
  });

  /*
    Your server will be listening on the port and ip specified in the config
    You'll be calling the `callback` callback when your server has successfully
    started.

    At some point, we'll be adding the ability to stop a node
    remotely through the service interface.
  */

  // Important: allow tests to access server
  globalThis.distribution.node.server = server;
  const config = globalThis.distribution.node.config;

  server.once('listening', () => {
    callback(null);
  });

  server.once('error', (error) => {
    callback(error);
  });

  server.listen(config.port, config.ip);
}

module.exports = {start, config: setNodeConfig()};
