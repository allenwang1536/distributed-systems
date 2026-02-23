require('../../distribution.js')();
require('../helpers/sync-guard');

const distribution = globalThis.distribution;

test('performance', (done) => {
  const N = 10;
  const basePort = 9100;

  const nodes = Array.from({length: N}, (_, i) => ({
    ip: '127.0.0.1',
    port: basePort + i,
  }));

  const latenciesMs = [];

  const stopNode = (node, cb) => {
    distribution.local.comm.send([], {node, service: 'status', method: 'stop'}, () => cb());
  };

  const cleanup = (cb) => {
    let i = 0;
    const next = () => {
      if (i >= nodes.length) {
        if (globalThis.distribution.node.server) {
          globalThis.distribution.node.server.close();
        }
        cb();
        return;
      }
      stopNode(nodes[i], () => {
        i += 1;
        next();
      });
    };
    next();
  };

  const spawnSeq = (i, startedAtAll) => {
    if (i >= nodes.length) {
      const totalMs = Number(process.hrtime.bigint() - startedAtAll) / 1e6;

      const avg =
        latenciesMs.reduce((a, b) => a + b, 0) / (latenciesMs.length || 1);
      const throughput = nodes.length / (totalMs / 1000);

      console.log('\n[M3 spawn performance]');
      console.log(`N=${nodes.length}`);
      console.log(`Total time: ${totalMs.toFixed(2)} ms`);
      console.log(`Throughput: ${throughput.toFixed(2)} nodes/sec`);
      console.log(`Avg latency: ${avg.toFixed(2)} ms`);

      cleanup(done);
      return;
    }

    const t0 = process.hrtime.bigint();
    distribution.local.status.spawn(nodes[i], (e) => {
      const t1 = process.hrtime.bigint();
      const ms = Number(t1 - t0) / 1e6;
      latenciesMs.push(ms);

      if (e) {
        console.log(`Spawn failed at i=${i}, port=${nodes[i].port}:`, e);
        cleanup(() => done(e));
        return;
      }

      spawnSeq(i + 1, startedAtAll);
    });
  };

  distribution.node.start((e) => {
    if (e) return done(e);
    const startedAtAll = process.hrtime.bigint();
    spawnSeq(0, startedAtAll);
  });
});

function percentile(arr, p) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.min(
      sorted.length - 1,
      Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
  );
  return sorted[idx];
}

