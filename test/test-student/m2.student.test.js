/*
    In this file, add your own test cases that correspond to functionality introduced for each milestone.
    You should fill out each test case so it adequately tests the functionality you implemented.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/

const {isExportDeclaration} = require('typescript');

const distribution = require('../../distribution.js')();
require('../helpers/sync-guard');

const local = distribution.local;
const id = distribution.util.id;

beforeAll((done) => {
  distribution.node.start((e) => done(e || null));
});

afterAll((done) => {
  if (distribution.node.server) {
    distribution.node.server.close();
  }
  done();
});

test('(1 pts) student test', (done) => {
  const node = distribution.node.config;
  local.status.get('nid', (e, v) => {
    try {
      expect(e).toBeFalsy();
      expect(v).toEqual(id.getNID(node));
      done();
    } catch (err) {
      done(err);
    }
  });
});


test('(1 pts) student test', (done) => {
  const heapUsed = process.memoryUsage().heapUsed;
  local.status.get('heapUsed', (e, v) => {
    try {
      expect(e).toBeFalsy();
      expect(typeof v).toBe('number');
      expect(v).toBeGreaterThanOrEqual(heapUsed);
      done();
    } catch (err) {
      done(err);
    }
  });
});


test('(1 pts) student test', (done) => {
  const service = {ping: () => 'pong'};
  local.routes.put(service, 'studentSvc', (e1, v1) => {
    try {
      expect(e1).toBeFalsy();
      expect(v1).toBe('studentSvc');
    } catch (err) {
      done(err);
      return;
    }

    local.routes.get('studentSvc', (e2, v2) => {
      try {
        expect(e2).toBeFalsy();
        expect(v2).toBe(service);
        expect(v2.ping()).toBe('pong');
        done();
      } catch (err) {
        done(err);
      }
    });
  });
});

test('(1 pts) student test', (done) => {
  const service = {hello: () => 'world'};
  local.routes.put(service, 'tempSvc', (e1) => {
    if (e1) return done(e1);
    local.routes.rem('tempSvc', (e2, removed) => {
      try {
        expect(e2).toBeFalsy();
        expect(removed).toBe(service);
      } catch (err) {
        done(err);
        return;
      }

      local.routes.get('tempSvc', (e3, v3) => {
        try {
          expect(e3).toBeInstanceOf(Error);
          expect(v3).toBeFalsy();
          done();
        } catch (err) {
          done(err);
        }
      });
    });
  });
});

test('(1 pts) student test', (done) => {
  const node = distribution.node.config;
  local.comm.send(['sid'], {node, service: 'nope', method: 'get'}, (e, v) => {
    try {
      expect(e).toBeInstanceOf(Error);
      expect(v).toBeFalsy();
      done();
    } catch (err) {
      done(err);
    }
  });
});
