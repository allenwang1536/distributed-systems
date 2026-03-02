require('../../distribution.js')({ip: '127.0.0.1', port: 9500});
require('../helpers/sync-guard');

const distribution = globalThis.distribution;
const id = distribution.util.id;

jest.setTimeout(120000);

function randomString() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function randomObject(i) {
  return {
    id: i,
    name: 'user-' + randomString(),
    active: i % 2 === 0,
    score: i,
    nested: {
      token: randomString(),
      bucket: i % 17,
    },
  };
}

function average(values) {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function runPuts(store, pairs, latencies, callback) {
  let i = 0;
  const startedAt = Date.now();

  const next = () => {
    if (i === pairs.length) {
      callback(null, Date.now() - startedAt);
      return;
    }

    const pair = pairs[i];
    const t0 = Date.now();

    store.put(pair.value, pair.key, (e, v) => {
      if (e) {
        callback(e);
        return;
      }

      latencies.push(Date.now() - t0);

      try {
        expect(v).toEqual(pair.value);
      } catch (error) {
        callback(error);
        return;
      }

      i += 1;
      next();
    });
  };

  next();
}

function runGets(store, pairs, latencies, callback) {
  let i = 0;
  const startedAt = Date.now();

  const next = () => {
    if (i === pairs.length) {
      callback(null, Date.now() - startedAt);
      return;
    }

    const pair = pairs[i];
    const t0 = Date.now();

    store.get(pair.key, (e, v) => {
      if (e) {
        callback(e);
        return;
      }

      latencies.push(Date.now() - t0);

      try {
        expect(v).toEqual(pair.value);
      } catch (error) {
        callback(error);
        return;
      }

      i += 1;
      next();
    });
  };

  next();
}

beforeAll((done) => {
  distribution.node.start((e) => done(e || null));
});

afterAll((done) => {
  if (globalThis.distribution.node.server) {
    globalThis.distribution.node.server.close();
  }
  done();
});

test('M4 performance characterization', (done) => {
  const nodes = [
    {ip: '13.58.213.161', port: 8080},
    {ip: '13.58.213.161', port: 8081},
    {ip: '13.58.213.161', port: 8082},
  ];

  const group = {};
  group[id.getSID(nodes[0])] = nodes[0];
  group[id.getSID(nodes[1])] = nodes[1];
  group[id.getSID(nodes[2])] = nodes[2];

  const gid = 'm4perf';
  const config = {gid, hash: id.consistentHash};

  const pairs = [];
  for (let i = 0; i < 1000; i++) {
    pairs.push({
      key: 'm4-' + randomString() + '-' + i,
      value: randomObject(i),
    });
  }

  const putLatencies = [];
  const getLatencies = [];

  distribution.local.groups.put(config, group, (e) => {
    if (e) {
      done(e);
      return;
    }

    const store = distribution[gid].store;

    runPuts(store, pairs, putLatencies, (e, putTotalMs) => {
      if (e) {
        done(e);
        return;
      }

      runGets(store, pairs, getLatencies, (e, getTotalMs) => {
        if (e) {
          done(e);
          return;
        }

        const putAvg = average(putLatencies);
        const getAvg = average(getLatencies);
        const putThroughput = (pairs.length / putTotalMs) * 1000;
        const getThroughput = (pairs.length / getTotalMs) * 1000;

        console.log('\n[M4 performance characterization]');
        console.log('Nodes: ' + nodes.length);
        console.log('Objects: ' + pairs.length);
        console.log('Insertion total: ' + putTotalMs + ' ms');
        console.log('Insertion avg latency: ' + putAvg.toFixed(2) + ' ms');
        console.log('Insertion throughput: ' + putThroughput.toFixed(2) + ' ops/sec');
        console.log('Retrieval total: ' + getTotalMs + ' ms');
        console.log('Retrieval avg latency: ' + getAvg.toFixed(2) + ' ms');
        console.log('Retrieval throughput: ' + getThroughput.toFixed(2) + ' ops/sec');

        try {
          expect(putThroughput).toBeGreaterThan(0);
          expect(getThroughput).toBeGreaterThan(0);
          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });
});
