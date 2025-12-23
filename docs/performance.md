## Performance Measurement (Distribution Library)
Focus on repeatable tests and consistent environments.

### 1) Measure local service latency
Use `time` for a coarse check:
```bash
time node -e "require('./distribution.js')(); const d=globalThis.distribution; d.local.status.get('nid', ()=>{});"
```

### 2) Measure RPC latency
Start a node on a port, then call it:
```bash
node distribution.js --config '{"ip":"127.0.0.1","port":9001}'
node -e "require('./distribution.js')(); const d=globalThis.distribution; d.local.comm.send(['nid'], {node:{ip:'127.0.0.1', port:9001}, service:'status', method:'get'}, console.log);"
```

### 3) Measure distributed fan-out
Use `all.status.get` and time it:
```bash
node -e "require('./distribution.js')(); const d=globalThis.distribution; d.mygroup.status.get('nid', console.timeEnd.bind(console,'fanout')); console.time('fanout');"
```

### 4) Logging for performance
Add time checkpoints in hot paths:
- `distribution/local/comm.js` for request/response.
- `distribution/util/wire.js` for RPC dispatch.
- `distribution/all/*` for fan-out and aggregation.

Example:
```js
const start = Date.now();
globalThis.distribution.local.comm.send(message, remote, (e, v) => {
  log(`[perf] comm.send ${Date.now() - start}ms`);
  callback(e, v);
});
```

### 5) Control variables
- Run on the same machine and ports.
- Clear `store/` if measuring persistent store operations.
- Warm up once before timing.

### 6) Compare hash strategies
If you switch hash functions (`naiveHash`, `consistentHash`, `rendezvousHash`), re-run the same workload and compare:
- Distribution of keys across nodes.
- Time to `reconf` in mem/store services.
