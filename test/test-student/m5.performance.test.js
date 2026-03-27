require('../../distribution.js')();
require('../helpers/sync-guard');

const distribution = globalThis.distribution;
const id = distribution.util.id;

jest.setTimeout(120000);

test('M5 performance characterization', (done) => {
  const gid = 'm5perf';
  const n1 = {ip: '127.0.0.1', port: 7260};
  const n2 = {ip: '127.0.0.1', port: 7261};
  const n3 = {ip: '127.0.0.1', port: 7262};
  const group = {};

  group[id.getSID(n1)] = n1;
  group[id.getSID(n2)] = n2;
  group[id.getSID(n3)] = n3;

  const mapper = (key, value) => {
    return value
        .toLowerCase()
        .split(/\W+/)
        .filter((word) => word.length > 0)
        .map((word) => ({[word]: 1}));
  };

  const reducer = (key, values) => {
    const out = {};
    out[key] = values.reduce((sum, value) => sum + value, 0);
    return out;
  };

  const dataset = [];
  for (let i = 0; i < 200; i++) {
    dataset.push({
      ['doc-' + i]: [
        'map reduce systems',
        'distributed systems',
        'brown university',
        'map reduce',
        'performance testing',
      ].join(' '),
    });
  }

  const keys = dataset.map((entry) => Object.keys(entry)[0]);
  const rounds = 3;
  const latencies = [];

  const cleanup = (callback) => {
    const remote = {service: 'status', method: 'stop'};

    remote.node = n1;
    distribution.local.comm.send([], remote, () => {
      remote.node = n2;
      distribution.local.comm.send([], remote, () => {
        remote.node = n3;
        distribution.local.comm.send([], remote, () => {
          if (globalThis.distribution.node.server) {
            globalThis.distribution.node.server.close();
            globalThis.distribution.node.server = null;
          }
          callback();
        });
      });
    });
  };

  const runRound = (round, callback) => {
    if (round === rounds) {
      callback();
      return;
    }

    const startedAt = process.hrtime.bigint();
    distribution[gid].mr.exec({keys, map: mapper, reduce: reducer}, (error, results) => {
      if (error) {
        callback(error);
        return;
      }

      const endedAt = process.hrtime.bigint();
      const latencyMs = Number(endedAt - startedAt) / 1e6;
      latencies.push(latencyMs);

      try {
        expect(results.length).toBeGreaterThan(0);
      } catch (assertionError) {
        callback(assertionError);
        return;
      }

      runRound(round + 1, callback);
    });
  };

  distribution.node.start((error) => {
    if (error) {
      done(error);
      return;
    }

    distribution.local.status.spawn(n1, (error) => {
      if (error) {
        cleanup(() => done(error));
        return;
      }

      distribution.local.status.spawn(n2, (error) => {
        if (error) {
          cleanup(() => done(error));
          return;
        }

        distribution.local.status.spawn(n3, (error) => {
          if (error) {
            cleanup(() => done(error));
            return;
          }

          distribution.local.groups.put({gid}, group, (error) => {
            if (error && Object.keys(error).length > 0) {
              cleanup(() => done(error));
              return;
            }

            distribution[gid].groups.put({gid}, group, (error) => {
              if (error && Object.keys(error).length > 0) {
                cleanup(() => done(error));
                return;
              }

              let count = 0;
              dataset.forEach((entry) => {
                const key = Object.keys(entry)[0];
                const value = entry[key];

                distribution[gid].store.put(value, key, (error) => {
                  if (error) {
                    cleanup(() => done(error));
                    return;
                  }

                  count += 1;
                  if (count === dataset.length) {
                    runRound(0, (error) => {
                      if (error) {
                        cleanup(() => done(error));
                        return;
                      }

                      const totalMs = latencies.reduce((sum, value) => sum + value, 0);
                      const avgLatencyMs = totalMs / latencies.length;
                      const throughput = (dataset.length * rounds) / (totalMs / 1000);

                      console.log('\n[M5 performance characterization]');
                      console.log('Workflow: word frequency');
                      console.log('Nodes: 3');
                      console.log('Documents: ' + dataset.length);
                      console.log('Rounds: ' + rounds);
                      console.log('Average latency: ' + avgLatencyMs.toFixed(2) + ' ms/job');
                      console.log('Throughput: ' + throughput.toFixed(2) + ' docs/sec');

                      try {
                        expect(avgLatencyMs).toBeGreaterThan(0);
                        expect(throughput).toBeGreaterThan(0);
                        cleanup(() => done());
                      } catch (assertionError) {
                        cleanup(() => done(assertionError));
                      }
                    });
                  }
                });
              });
            });
          });
        });
      });
    });
  });
});
