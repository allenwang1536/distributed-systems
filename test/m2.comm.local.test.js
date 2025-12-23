require('../distribution.js')({ip: '127.0.0.1', port: 1246});
const distribution = globalThis.distribution;
const local = distribution.local;
const id = distribution.util.id;

test('(10 pts) local.comm(status.get(nid))', (done) => {
  const node = distribution.node.config;

  const remote = {node: node, service: 'status', method: 'get'};
  const message = ['nid']; // Arguments to the method

  local.comm.send(message, remote, (e, v) => {
    try {
      expect(e).toBeFalsy();
      expect(v).toEqual(id.getNID(node));
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(10 pts) comm: status.get()', (done) => {
  const node = distribution.node.config;
  const remote = {node: node, service: 'status', method: 'get'};
  const message = [
    'sid',
  ];

  local.comm.send(message, remote, (e, v) => {
    try {
      expect(e).toBeFalsy();
      expect(v).toEqual(id.getSID(node));
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(10 pts) comm: status.get() with nonexistent key', (done) => {
  const node = distribution.node.config;
  const remote = {node: node, service: 'status', method: 'get'};
  const message = ['invalid'];

  local.comm.send(message, remote, (e, v) => {
    try {
      expect(e).toBeTruthy();
      expect(e).toBeInstanceOf(Error);
      expect(v).toBeFalsy();
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(10 pts) comm: status.get() with invalid service', (done) => {
  const node = distribution.node.config;
  const remote = {node: node, service: 'invalid', method: 'get'};
  const message = ['sid'];

  local.comm.send(message, remote, (e, v) => {
    try {
      expect(e).toBeTruthy();
      expect(e).toBeInstanceOf(Error);
      expect(v).toBeFalsy();
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(0 pts) comm: send rejects non-array message', (done) => {
  const node = distribution.node.config;
  const remote = {node: node, service: 'status', method: 'get'};

  local.comm.send('not-an-array', remote, (e, v) => { // @ts-ignore for test
    try {
      expect(e).toBeInstanceOf(Error);
      expect(v).toBeFalsy();
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(0 pts) comm: send requires service and method', (done) => {
  const node = distribution.node.config;
  const remoteMissingService = {node: node, method: 'get'};
  const remoteMissingMethod = {node: node, service: 'status'};

  local.comm.send([], remoteMissingService, (e, v) => {
    try {
      expect(e).toBeInstanceOf(Error);
      expect(v).toBeFalsy();
      local.comm.send([], remoteMissingMethod, (e2, v2) => {
        try {
          expect(e2).toBeInstanceOf(Error);
          expect(v2).toBeFalsy();
          done();
        } catch (error) {
          done(error);
        }
      });
    } catch (error) {
      done(error);
    }
  });
});

test('(0 pts) comm: send rejects missing node', (done) => {
  const remote = {service: 'status', method: 'get', node: null};

  local.comm.send([], remote, (e, v) => {
    try {
      expect(e).toBeInstanceOf(Error);
      expect(v).toBeFalsy();
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(0 pts) comm: send rejects empty service string', (done) => {
  const node = distribution.node.config;
  const remote = {node: node, service: '', method: 'get'};

  local.comm.send([], remote, (e, v) => {
    try {
      expect(e).toBeInstanceOf(Error);
      expect(v).toBeFalsy();
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(0 pts) comm: send rejects empty method string', (done) => {
  const node = distribution.node.config;
  const remote = {node: node, service: 'status', method: ''};

  local.comm.send([], remote, (e, v) => {
    try {
      expect(e).toBeInstanceOf(Error);
      expect(v).toBeFalsy();
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(0 pts) comm: send rejects non-array object message', (done) => {
  const node = distribution.node.config;
  const remote = {node: node, service: 'status', method: 'get'};

  local.comm.send({0: 'sid', length: 1}, remote, (e, v) => { // @ts-ignore for test
    try {
      expect(e).toBeInstanceOf(Error);
      expect(v).toBeFalsy();
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(0 pts) comm: send with undefined message returns error from service', (done) => {
  const node = distribution.node.config;
  const remote = {node: node, service: 'status', method: 'get'};

  local.comm.send(undefined, remote, (e, v) => {
    try {
      expect(e).toBeInstanceOf(Error);
      expect(v).toBeFalsy();
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(0 pts) comm: send with null message returns error from service', (done) => {
  const node = distribution.node.config;
  const remote = {node: node, service: 'status', method: 'get'};

  local.comm.send(null, remote, (e, v) => {
    try {
      expect(e).toBeInstanceOf(Error);
      expect(v).toBeFalsy();
      done();
    } catch (error) {
      done(error);
    }
  });
});

/* Test infrastructure */

beforeAll((done) => {
  distribution.node.start(() => {
    done();
  });
});

afterAll((done) => {
  if (globalThis.distribution.node.server) {
    globalThis.distribution.node.server.close();
  }
  done();
});
