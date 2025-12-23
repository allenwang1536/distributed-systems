## Debugging (Centralized and Distributed)
This repo uses a mix of local node services and distributed calls. Here are concrete tactics tied to the codebase.

### Centralized debugging (single node)
Start a single node and exercise local services:
```bash
node distribution.js --config '{"ip":"127.0.0.1","port":9001}'
```

Common entry points:
- `distribution/local/comm.js` for RPC send failures.
- `distribution/local/routes.js` for service lookup issues.
- `distribution/local/node.js` for server request handling.

Add temporary logs:
```js
const log = require('../util/log.js');
log(`[routes.get] service=${service} gid=${gid}`);
```

### Distributed debugging (multiple nodes)
Start two nodes on different ports and verify calls:
```bash
node distribution.js --config '{"ip":"127.0.0.1","port":9001}'
node distribution.js --config '{"ip":"127.0.0.1","port":9002}'
```

Check that group membership is correct:
```js
distribution.local.groups.get('mygroup', (e, v) => console.log(e, v));
```

Verify RPC routing:
```js
const remote = {node: {ip: '127.0.0.1', port: 9002}, service: 'status', method: 'get'};
distribution.local.comm.send(['nid'], remote, console.log);
```

### Debugging common failures
**"Service not found"**
- Check `distribution/local/routes.js` and confirm `routes.put` was called.
- Verify `gid` in `routes.get({service, gid})`.

**"Message must be an array"**
- Calls to `local.comm.send` must always pass an array for the message.

**"Method not found in service"**
- Confirm the service exposes that method in its returned object.

**Stuck tests / ECONNRESET**
- Make sure old node processes are stopped.
- Check the cleanup logic in tests that spawn nodes.

### Inspecting node traffic
Set a log statement in `distribution/local/node.js`:
```js
log(`[server] ${req.method} ${req.url}`);
```

### Minimal repro strategy
- Start with one service (`local.status.get`) and one node.
- Add one remote node and test `local.comm.send`.
- Add group-level services (e.g., `mygroup.status.get`).
