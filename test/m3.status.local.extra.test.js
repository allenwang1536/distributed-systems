require('../distribution.js')();
const distribution = globalThis.distribution;
const local = distribution.local;
const comm = distribution.local.comm;

test('(10 pts) local.status.spawn/stop using local.comm', (done) => {
  try {
    expect(local.status.spawn).toBeDefined();
    expect(local.status.stop).toBeDefined();
    expect(local.comm).toBeDefined();
    expect(local.comm.send).toBeDefined();
  } catch (error) {
    done(error);
  }

  const node = {
    ip: '127.0.0.1',
    port: 9090,
  };

  const config = {
    ip: node.ip,
    port: node.port,
    onStart: () => {
      console.log('Node is started!');
    },
  };

  const cleanup = (done) => {
    comm.send([], {service: 'status', method: 'stop', node: node}, (e, v) => {
      if (globalThis.distribution.node.server) {
        globalThis.distribution.node.server.close();
      }
      try {
        expect(e).toBeFalsy();
        expect(v.ip).toEqual(node.ip);
        expect(v.port).toEqual(node.port);
        done();
      } catch (error) {
        done(error);
      }
    });
  };

  const spawnNode = () => {
    local.status.spawn(config, (e, v) => {
      try {
        expect(e).toBeFalsy();
        expect(v).toBeDefined();
        cleanup(done);
      } catch (error) {
        cleanup(done);
      }
    });
  };

  distribution.node.start(() => {
    spawnNode();
  });
});

test('(0 pts) local.status.spawn with invalid config', (done) => {
  const config = {
    ip: '127.0.0.1',
    port: 0, // Port cannot be 0
  };

  local.status.spawn(config, (e, v) => {
    try {
      expect(e).toBeDefined();
      expect(v).toBeFalsy();
      done();
    } catch (error) {
      done(error);
    }
  });
});
