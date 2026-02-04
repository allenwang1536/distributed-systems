const distribution = require('../../distribution.js')();
const util = distribution.util;

function bench(name, fn, iters = 10000, warmup = 2000) {
  // warmup
  for (let i = 0; i < warmup; i++) fn();

  const times = new Array(iters);
  for (let i = 0; i < iters; i++) {
    const t0 = process.hrtime.bigint();
    fn();
    const t1 = process.hrtime.bigint();
    times[i] = Number(t1 - t0);
  }

  const sum = times.reduce((a, b) => a + b, 0);
  const avgUs = (sum / iters) / 1000;

  return {name, avgUs};
}

test('M1 latency characterization (T5)', () => {
  const workloads = [];

  // workload 1: base types (T2)
  workloads.push(bench('T2 serialize number', () => util.serialize(123.456)));
  workloads.push(bench('T2 deserialize number', () => util.deserialize(util.serialize(123.456))));

  // workload 2: function (T3)
  const fn = (a, b) => a + b;
  workloads.push(bench('T3 serialize function', () => util.serialize(fn)));
  workloads.push(bench('T3 deserialize function', () => util.deserialize(util.serialize(fn))));

  // workload 3: complex recursive (T4)
  const complex = {
    a: [1, 'one', {x: true}],
    b: {nested: {arr: [1, 2, 3, {d: new Date(0)}]}},
    c: new Error('missing'),
    d: new Date(),
    e: null,
    f: undefined,
  };
  const complexS = util.serialize(complex);
  workloads.push(bench('T4 serialize complex', () => util.serialize(complex), 5000, 500));
  workloads.push(bench('T4 deserialize complex', () => util.deserialize(complexS), 5000, 500));

  console.log('\nLatency (microseconds):');
  for (const w of workloads) {
    console.log(
        `${w.name}: avg=${w.avgUs.toFixed(2)}us`,
    );
  }

  expect(workloads.length).toBeGreaterThan(0);
});
