## Node and Shell Tips
Quick tips for running and testing this repo from the shell.

### Run a node
```bash
node distribution.js --config '{"ip":"127.0.0.1","port":9001}'
```

### Run tests
```bash
npm test -- -t
```

### Run extra-credit tests
```bash
npm test -- -ec
```

### Typecheck
```bash
npx tsc
```

### Useful Node tricks
Run a one-off script:
```bash
node -e "require('./distribution.js')(); console.log(globalThis.distribution.util.id.getNID({ip:'1.2.3.4', port: 1}))"
```

Start a REPL with the library loaded:
```bash
node
> require('./distribution.js')()
> globalThis.distribution.local.status.get('nid', console.log)
```

### Shell safety
- Kill stale node processes if ports are stuck: `pkill -f "node .*distribution.js"`.
- Prefer explicit ports to avoid conflicts when running multiple nodes.
