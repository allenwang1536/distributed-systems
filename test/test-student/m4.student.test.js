/*
    In this file, add your own test cases that correspond to functionality introduced for each milestone.
    You should fill out each test case so it adequately tests the functionality you implemented.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/

const util = require('@brown-ds/distribution/distribution/util/util.js');

const distribution = require('../../distribution.js')();
require('../helpers/sync-guard');
const id = distribution.util.id;

test('(1 pts) student test', (done) => {
  const key = 'random';
  const original = {version: 1};
  const updated = {version: 2};

  distribution.local.mem.put(original, key, (e) => {
    if (e) return done(e);

    distribution.local.mem.put(updated, key, (e) => {
      if (e) return done(e);

      distribution.local.mem.get(key, (e, v) => {
        try {
          expect(e).toBeFalsy();
          expect(v).toEqual(updated);
          done();
        } catch (err) {
          done(err);
        }
      });
    });
  });
});


test('(1 pts) student test', (done) => {
  const key = 'random';
  const original = {version: 1};
  const updated = {version: 2};

  distribution.local.store.put(original, key, (e) => {
    if (e) return done(e);

    distribution.local.store.put(updated, key, (e) => {
      if (e) return done(e);

      distribution.local.store.get(key, (e, v) => {
        try {
          expect(e).toBeFalsy();
          expect(v).toEqual(updated);
          done();
        } catch (err) {
          done(err);
        }
      });
    });
  });
});


test('(1 pts) student test', (done) => {
  const key = 'shared-key';
  const val1 = 'val1';
  const val2 = 'val2';

  distribution.local.mem.put(val1, {key: key, gid: 'g1'}, (e) => {
    if (e) return done(e);

    distribution.local.mem.put(val2, {key: key, gid: 'g2'}, (e) => {
      if (e) return done(e);

      distribution.local.mem.get({key: key, gid: 'g1'}, (e, v) => {
        if (e) return done(e);
        try {
          expect(v).toEqual(val1);
        } catch (err) {
          done(err);
        }

        distribution.local.mem.get({key: key, gid: 'g2'}, (e, v) => {
          if (e) return done(e);

          try {
            expect(v).toEqual(val2);
            done();
          } catch (err) {
            done(err);
          }
        });
      });
    });
  });
});

test('(1 pts) student test', () => {
  const nodes = [{ip: '127.0.0.1', port: 12000}, {ip: '127.0.0.1', port: 12001}, {ip: '127.0.0.1', port: 12002}];
  const NIDs = nodes.map((node) => util.id.getNID(node));

  const kid = 'f'.repeat(64);
  const expected = NIDs.sort()[0];

  expect(id.consistentHash(kid, NIDs)).toEqual(expected);
});

test('(1 pts) student test', () => {
  const key = 'random';
  const kid = id.getID(key);
  const nodes = [
    {ip: '127.0.0.1', port: 13000},
    {ip: '127.0.0.1', port: 13001},
    {ip: '127.0.0.1', port: 13002},
  ];
  const nids = nodes.map((node) => id.getNID(node));
  const expected = [...nids]
      .map((nid) => ({
        nid,
        score: BigInt(`0x${id.getID(kid + nid)}`),
      }))
      .sort((a, b) => (a.score > b.score ? -1 : a.score < b.score ? 1 : 0))[0]
      .nid;

  expect(id.rendezvousHash(kid, nids)).toEqual(expected);
});
