require('../../distribution.js')({ip: '127.0.0.1', port: 4567});
require('../helpers/sync-guard');

const distribution = globalThis.distribution;

beforeAll((done) => {
  distribution.node.start((e) => done(e || null));
});

afterAll((done) => {
  if (globalThis.distribution.node.server) {
    globalThis.distribution.node.server.close();
  }
  done();
});

test('M2 Latency', (done) => {
  jest.setTimeout(60000);

  const N = 1000;
  const local = distribution.local;
  const node = distribution.node.config;
  const remote = {node, service: 'status', method: 'get'};

  const start = Date.now();
  let i = 0;

  function loop() {
    if (i === N) {
      const ms = Date.now() - start;
      const throughput = (N / ms) * 1000; // req/s
      const latency = ms / N; // ms/request (avg)

      console.log(`[T6] totalMs=${ms} avgLatencyMs=${latency.toFixed(4)} throughputRps=${throughput.toFixed(2)}`);

      expect(ms).toBeGreaterThan(0);
      done();
      return;
    }

    local.comm.send(['nid'], remote, (e) => {
      if (e) return done(e);
      i += 1;
      loop();
    });
  }

  loop();
});
