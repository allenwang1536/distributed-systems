/*
    In this file, add your own test cases that correspond to functionality introduced for each milestone.
    You should fill out each test case so it adequately tests the functionality you implemented.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/

const distribution = require('../../distribution.js')();
require('../helpers/sync-guard');

const id = distribution.util.id;

const mrshapeGroup = {};
const mrscatterGroup = {};
const mrwordfreqGroup = {};
const mrmatchGroup = {};
const mrindexGroup = {};

const n1 = {ip: '127.0.0.1', port: 7210};
const n2 = {ip: '127.0.0.1', port: 7211};
const n3 = {ip: '127.0.0.1', port: 7212};


test('(1 pts) student test', (done) => {
  const mapper = (key, value) => {
    const out = {};
    out[value.kind] = value.amount;
    return out;
  };

  const reducer = (key, values) => {
    const out = {};
    out[key] = values.reduce((sum, value) => sum + value, 0);
    return out;
  };

  const dataset = [
    {'shape-a': {kind: 'circle', amount: 2}},
    {'shape-b': {kind: 'square', amount: 5}},
    {'shape-c': {kind: 'circle', amount: 3}},
  ];

  const doMapReduce = () => {
    distribution.mrshape.mr.exec({
      keys: dataset.map((entry) => Object.keys(entry)[0]),
      map: mapper,
      reduce: reducer,
    }, (error, results) => {
      try {
        expect(error).toBeFalsy();
        expect(results).toEqual(expect.arrayContaining([
          {circle: 5},
          {square: 5},
        ]));
        expect(results).toHaveLength(2);
        done();
      } catch (assertionError) {
        done(assertionError);
      }
    });
  };

  let count = 0;
  dataset.forEach((entry) => {
    const key = Object.keys(entry)[0];
    const value = entry[key];
    distribution.mrshape.store.put(value, key, () => {
      count += 1;
      if (count === dataset.length) {
        doMapReduce();
      }
    });
  });
});


test('(1 pts) student test', (done) => {
  const mapper = (key, value) => {
    const parts = value.split(/(\s+)/).filter((entry) => entry !== ' ');
    const out = {};
    out[parts[1]] = parseInt(parts[3]);
    return [out];
  };

  const reducer = (key, values) => {
    const out = {};
    out[key] = values.reduce((max, value) => Math.max(max, value), -Infinity);
    return out;
  };

  const dataset = [
    {'scatter-a': '006701199099999 1950 0515070049999999N9 +0000 1+9999'},
    {'scatter-b': '004301199099999 1950 0515120049999999N9 +0022 1+9999'},
    {'scatter-c': '004301199099999 1950 0515180049999999N9 -0011 1+9999'},
    {'scatter-d': '004301265099999 1949 0324120040500001N9 +0111 1+9999'},
    {'scatter-e': '004301265099999 1949 0324180040500001N9 +0078 1+9999'},
  ];

  const doMapReduce = () => {
    distribution.mrscatter.mr.exec({
      keys: dataset.map((entry) => Object.keys(entry)[0]),
      map: mapper,
      reduce: reducer,
    }, (error, results) => {
      try {
        expect(error).toBeFalsy();
        expect(results).toEqual(expect.arrayContaining([
          {'1950': 22},
          {'1949': 111},
        ]));
        expect(results).toHaveLength(2);
        done();
      } catch (assertionError) {
        done(assertionError);
      }
    });
  };

  let count = 0;
  dataset.forEach((entry) => {
    const key = Object.keys(entry)[0];
    const value = entry[key];
    distribution.mrscatter.store.put(value, key, () => {
      count += 1;
      if (count === dataset.length) {
        doMapReduce();
      }
    });
  });
});


test('(1 pts) student test', (done) => {
  const mapper = (key, value) => {
    return value
        .toLowerCase()
        .split(/\W+/)
        .filter((word) => word !== '')
        .map((word) => ({[word]: 1}));
  };

  const reducer = (key, values) => {
    const out = {};
    out[key] = values.reduce((sum, value) => sum + value, 0);
    return out;
  };

  const dataset = [
    {'wf-1': 'Red fish blue fish'},
    {'wf-2': 'Blue sky red bird'},
    {'wf-3': 'Bird song blue note'},
  ];

  const doMapReduce = () => {
    distribution.mrwordfreq.mr.exec({
      keys: dataset.map((entry) => Object.keys(entry)[0]),
      map: mapper,
      reduce: reducer,
    }, (error, results) => {
      try {
        expect(error).toBeFalsy();
        expect(results).toEqual(expect.arrayContaining([
          {red: 2},
          {blue: 3},
          {bird: 2},
          {fish: 2},
          {sky: 1},
          {song: 1},
          {note: 1},
        ]));
        done();
      } catch (assertionError) {
        done(assertionError);
      }
    });
  };

  let count = 0;
  dataset.forEach((entry) => {
    const key = Object.keys(entry)[0];
    const value = entry[key];
    distribution.mrwordfreq.store.put(value, key, () => {
      count += 1;
      if (count === dataset.length) {
        doMapReduce();
      }
    });
  });
});

test('(1 pts) student test', (done) => {
  const mapper = (key, value) => {
    if (/fox|brown/i.test(value)) {
      return [{[key]: true}];
    }
    return [];
  };

  const reducer = (key, values) => {
    const out = {};
    out[key] = values.some(Boolean);
    return out;
  };

  const dataset = [
    {'sm-1': 'quiet meadow and river'},
    {'sm-2': 'the brown fox jumps high'},
    {'sm-3': 'brown leaves fall quickly'},
  ];

  const doMapReduce = () => {
    distribution.mrmatch.mr.exec({
      keys: dataset.map((entry) => Object.keys(entry)[0]),
      map: mapper,
      reduce: reducer,
    }, (error, results) => {
      try {
        expect(error).toBeFalsy();
        expect(results).toEqual(expect.arrayContaining([
          {'sm-2': true},
          {'sm-3': true},
        ]));
        expect(results).toHaveLength(2);
        done();
      } catch (assertionError) {
        done(assertionError);
      }
    });
  };

  let count = 0;
  dataset.forEach((entry) => {
    const key = Object.keys(entry)[0];
    const value = entry[key];
    distribution.mrmatch.store.put(value, key, () => {
      count += 1;
      if (count === dataset.length) {
        doMapReduce();
      }
    });
  });
});

test('(1 pts) student test', (done) => {
  const mapper = (key, value) => {
    const terms = [...new Set(
        value.toLowerCase().split(/\W+/).filter((word) => word !== ''),
    )];

    return terms.map((term) => ({[term]: key}));
  };

  const reducer = (key, values) => {
    const out = {};
    out[key] = [...new Set(values)].sort();
    return out;
  };

  const dataset = [
    {'ix-1': 'alpha beta alpha'},
    {'ix-2': 'beta gamma'},
    {'ix-3': 'gamma delta alpha'},
  ];

  const doMapReduce = () => {
    distribution.mrindex.mr.exec({
      keys: dataset.map((entry) => Object.keys(entry)[0]),
      map: mapper,
      reduce: reducer,
    }, (error, results) => {
      try {
        expect(error).toBeFalsy();
        expect(results).toEqual(expect.arrayContaining([
          {alpha: ['ix-1', 'ix-3']},
          {beta: ['ix-1', 'ix-2']},
          {gamma: ['ix-2', 'ix-3']},
          {delta: ['ix-3']},
        ]));
        done();
      } catch (assertionError) {
        done(assertionError);
      }
    });
  };

  let count = 0;
  dataset.forEach((entry) => {
    const key = Object.keys(entry)[0];
    const value = entry[key];
    distribution.mrindex.store.put(value, key, () => {
      count += 1;
      if (count === dataset.length) {
        doMapReduce();
      }
    });
  });
});


beforeAll((done) => {
  mrshapeGroup[id.getSID(n1)] = n1;
  mrshapeGroup[id.getSID(n2)] = n2;
  mrshapeGroup[id.getSID(n3)] = n3;

  mrscatterGroup[id.getSID(n1)] = n1;
  mrscatterGroup[id.getSID(n2)] = n2;
  mrscatterGroup[id.getSID(n3)] = n3;

  mrwordfreqGroup[id.getSID(n1)] = n1;
  mrwordfreqGroup[id.getSID(n2)] = n2;
  mrwordfreqGroup[id.getSID(n3)] = n3;

  mrmatchGroup[id.getSID(n1)] = n1;
  mrmatchGroup[id.getSID(n2)] = n2;
  mrmatchGroup[id.getSID(n3)] = n3;

  mrindexGroup[id.getSID(n1)] = n1;
  mrindexGroup[id.getSID(n2)] = n2;
  mrindexGroup[id.getSID(n3)] = n3;

  distribution.node.start((error) => {
    if (error) {
      done(error);
      return;
    }

    distribution.local.status.spawn(n1, (error) => {
      if (error) {
        done(error);
        return;
      }

      distribution.local.status.spawn(n2, (error) => {
        if (error) {
          done(error);
          return;
        }

        distribution.local.status.spawn(n3, (error) => {
          if (error) {
            done(error);
            return;
          }

          distribution.local.groups.put({gid: 'mrshape'}, mrshapeGroup, () => {
            distribution.mrshape.groups.put({gid: 'mrshape'}, mrshapeGroup, () => {
              distribution.local.groups.put({gid: 'mrscatter'}, mrscatterGroup, () => {
                distribution.mrscatter.groups.put({gid: 'mrscatter'}, mrscatterGroup, () => {
                  distribution.local.groups.put({gid: 'mrwordfreq'}, mrwordfreqGroup, () => {
                    distribution.mrwordfreq.groups.put({gid: 'mrwordfreq'}, mrwordfreqGroup, () => {
                      distribution.local.groups.put({gid: 'mrmatch'}, mrmatchGroup, () => {
                        distribution.mrmatch.groups.put({gid: 'mrmatch'}, mrmatchGroup, () => {
                          distribution.local.groups.put({gid: 'mrindex'}, mrindexGroup, () => {
                            distribution.mrindex.groups.put({gid: 'mrindex'}, mrindexGroup, () => {
                              done();
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});

afterAll((done) => {
  const remote = {service: 'status', method: 'stop'};

  remote.node = n1;
  distribution.local.comm.send([], remote, () => {
    remote.node = n2;
    distribution.local.comm.send([], remote, () => {
      remote.node = n3;
      distribution.local.comm.send([], remote, () => {
        if (globalThis.distribution.node.server) {
          globalThis.distribution.node.server.close();
        }
        done();
      });
    });
  });
});
