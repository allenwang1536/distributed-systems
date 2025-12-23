## Gradual typing
The distribution library uses [JSDoc](https://jsdoc.app/) to add type hints throughout the codebase, and then uses the TypeScript compiler (`tsc`) to check the types.

### Global/Shared Types
There are types that are shared across different modules in the project. These shared types are declared in [`types.js`](project/distribution/types.js) and imported appropriately.
The syntax for importing types in JSDoc is as follows:
```js
/**
 * @typedef {import("../types.js").Callback} Callback
 * @typedef {import("../types.js").Config} Config
 */
```

### Running the checker
You will need the TypeScript compiler (`tsc`) for this. It is already listed in `devDependencies`, so you can install it with:

```bash
npm install
```

Then, run the typechecker from the project root:

```bash
npx tsc
```

If you are using the Docker container, run the same command inside the container at `/usr/src/app`:

```bash
docker exec -it cs1380-dev /bin/bash
cd /usr/src/app
npx tsc
```

### Adding your own type annotations
You can annotate functions and variables with JSDoc so the typechecker can validate them.

Function with typed parameters and return:
```js
/**
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
function add(a, b) {
  return a + b;
}
```

Function that uses a shared type:
```js
/**
 * @typedef {import("../types.js").Callback} Callback
 */

/**
 * @param {Callback} callback
 * @returns {void}
 */
function doWork(callback) {
  callback(null, 'ok');
}
```

Typed variables:
```js
/** @type {string} */
const gid = 'local';

/** @type {Object.<string, number>} */
const counts = {};
```

Typed objects:
```js
/** @type {{ip: string, port: number}} */
const node = {ip: '127.0.0.1', port: 8080};
```
