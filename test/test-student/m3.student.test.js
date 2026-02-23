/*
    In this file, add your own test cases that correspond to functionality introduced for each milestone.
    You should fill out each test case so it adequately tests the functionality you implemented.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/

// const local = require('@brown-ds/distribution/distribution/local/local.js');

const distribution = require('../../distribution.js')();
require('../helpers/sync-guard');

test('(1 pts) student test', (done) => {
  const id = distribution.util.id;
  const self = {ip: '127.0.0.1', port: 9999};
  const gid = 'group1';

  const g = {};
  g[id.getSID(self)] = {ip: self.ip, port: self.port};

  distribution.local.groups.put({gid}, g, (e) => {
    try {
      expect(e).toBeNull();
      expect(distribution[gid]).toBeDefined();
      expect(distribution[gid].status).toBeDefined();
      expect(typeof distribution[gid].status.get).toBe('function');
      done();
    } catch (err) {
      done(err);
    }
  });
});


test('(1 pts) student test', (done) => {
  const id = distribution.util.id;
  const self = {ip: '127.0.0.1', port: 9999};
  const gid = 'group1';

  const g = {};
  g[id.getSID(self)] = {ip: self.ip, port: self.port};

  distribution.local.groups.put({gid}, g, (e) => {
    distribution.local.groups.get(gid, (e2, v) => {
      try {
        expect(e2).toBeNull();
        expect(v).toBeDefined();
        expect(Object.keys(v)).toEqual(expect.arrayContaining([id.getSID(self)]));
        done();
      } catch (err) {
        done(err);
      }
    });
  });
});


test('(1 pts) student test', (done) => {
  const id = distribution.util.id;
  const gid = 'group1';

  const nA = {ip: '127.0.0.1', port: 9101};
  const nB = {ip: '127.0.0.1', port: 9102};

  const g = {};
  g[id.getSID(nA)] = nA;

  distribution.local.groups.put({gid}, g, (e) => {
    if (e) return done(e);
    distribution.local.groups.add(gid, nB, (e) => {
      if (e) return done(e);
      distribution.local.groups.get(gid, (e, v) => {
        if (e) return done(e);
        try {
          expect(Object.keys(v)).toEqual(expect.arrayContaining([id.getSID(nA), id.getSID(nB)]));
        } catch (err) {
          return done(err);
        }

        distribution.local.groups.rem(gid, id.getSID(nB), (e) => {
          if (e) return done(e);

          distribution.local.groups.get(gid, (e, v) => {
            try {
              expect(Object.keys(v)).toEqual(expect.arrayContaining([id.getSID(nA)]));
              expect(Object.keys(v)).not.toEqual(expect.arrayContaining([id.getSID(nB)]));
              done();
            } catch (err) {
              done(err);
            }
          });
        });
      });
    });
  });
});

test('(1 pts) student test', (done) => {
  const service = {ping: (_cb) => _cb(null, 'pong')};
  distribution.local.routes.put(service, 'servicePing', (e) => {
    distribution.local.routes.get('servicePing', (e, got) => {
      try {
        expect(e).toBeNull();
        expect(got).toBe(service);
        done();
      } catch (err) {
        done(err);
      }
    });
  });
});

test('(1 pts) student test', (done) => {
  const remote = {
    node: {ip: '127.0.0.1', port: 8000},
    service: 'status',
    method: 'get',
  };

  globalThis.distribution.local.comm.send('not-an-array', remote, (e, v) => {
    try {
      expect(e).toBeInstanceOf(Error);
      expect(e.message).toMatch(/message must be an array/i);
      done();
    } catch (err) {
      done(err);
    }
  });
});
