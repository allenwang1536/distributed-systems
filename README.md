# distribution

This is the distribution library. 

## Environment Setup

We recommend using the prepared [container image](https://github.com/brown-cs1380/container).

## Installation

After you have setup your environment, you can start using the distribution library.
When loaded, distribution introduces functionality supporting the distributed execution of programs. To download it:

```sh
$ npm i '@brown-ds/distribution'
```

This command downloads and installs the distribution library.

## Testing

There are several categories of tests:
  *	Regular Tests (`*.test.js`)
  *	Scenario Tests (`*.scenario.js`)
  *	Extra Credit Tests (`*.extra.test.js`)
  * Student Tests (`*.student.test.js`) - inside `test/test-student`

### Running Tests

By default, all regular tests are run. Use the options below to run different sets of tests:

1. Run all regular tests (default): `$ npm test` or `$ npm test -- -t`
2. Run scenario tests: `$ npm test -- -c` 
3. Run extra credit tests: `$ npm test -- -ec`
4. Run the `non-distribution` tests: `$ npm test -- -nd`
5. Combine options: `$ npm test -- -c -ec -nd -t`

## Usage

To try out the distribution library inside an interactive Node.js session, run:

```sh
$ node
```

Then, load the distribution library:

```js
> let distribution = require("@brown-ds/distribution")();
> distribution.node.start(console.log);
```

Now you have access to the full distribution library. You can start off by serializing some values. 

```js
> s = distribution.util.serialize(1); // '{"type":"number","value":"1"}'
> n = distribution.util.deserialize(s); // 1
```

You can inspect information about the current node (for example its `sid`) by running:

```js
> distribution.local.status.get('sid', console.log); // null 8cf1b (null here is the error value; meaning there is no error)
```

You can also store and retrieve values from the local memory:

```js
> distribution.local.mem.put({name: 'nikos'}, 'key', console.log); // null {name: 'nikos'} (again, null is the error value) 
> distribution.local.mem.get('key', console.log); // null {name: 'nikos'}

> distribution.local.mem.get('wrong-key', console.log); // Error('Key not found') undefined
```

You can also spawn a new node:

```js
> node = { ip: '127.0.0.1', port: 8080 };
> distribution.local.status.spawn(node, console.log);
```

Using the `distribution.all` set of services will allow you to act 
on the full set of nodes created as if they were a single one.

```js
> distribution.all.status.get('sid', console.log); // {} { '8cf1b': '8cf1b', '8cf1c': '8cf1c' } (now, errors are per-node and form an object)
```

You can also send messages to other nodes:

```js
> distribution.local.comm.send(['sid'], {node: node, service: 'status', method: 'get'}, console.log); // null 8cf1c
```

Most methods in the distribution library are asynchronous and take a callback as their last argument.
This callback is invoked when the method completes, with the first argument being an error (if any) and the second argument being the result.
The following runs the sequence of commands described above inside a script (note the nested callbacks):

```js
let distribution = require("@brown-ds/distribution")();
// Now we're only doing a few of the things we did above
const out = (cb) => {
  distribution.local.status.stop(cb); // Shut down the local node
};
distribution.node.start(() => {
  // This will run only after the node has started
  const node = {ip: '127.0.0.1', port: 8765};
  distribution.local.status.spawn(node, (e, v) => {
    if (e) {
      return out(console.log);
    }
    // This will run only after the new node has been spawned
    distribution.all.status.get('sid', (e, v) => {
      // This will run only after we communicated with all nodes and got their sids
      console.log(v); // { '8cf1b': '8cf1b', '8cf1c': '8cf1c' }
      // Shut down the remote node
      distribution.local.comm.send([], {service: 'status', method: 'stop', node: node}, () => {
        // Finally, stop the local node
        out(console.log); // null, {ip: '127.0.0.1', port: 1380}
      });
    });
  });
});
```

# Results and Reflections

# M0: Setup & Centralized Computing

* name: `Allen Wang`

* email: `allen_wang1@brown.edu`

* cslogin: `awang299`


## Summary

My implementation consists of 8 components addressing T1–8. The most challenging aspect was merging the local and global inverted indices because it required carefully maintaining multiple invariants at once (correct frequency aggregation, per term URL ordering, and consistent output formatting) while handling edge cases like missing or empty global index files.

## Correctness & Performance Characterization

To characterize correctness, I developed 9 tests (in addition to the given tests) that test the following cases:
- URL extraction and resolution (getURLs.js)
- HTML to text extraction (getText.js)
- token normalization and stopword removal (process.sh)
- stemming (stem.js)
- n-gram generation (combine.sh)
- local inverted index formatting (invert.sh)
- correct merging and frequency aggregation into the global index + missing file behavior (merge.js)
- query normalization + matching behavior including stopword-only queries (query.js)
- simple end-to-end test

*Performance*: The throughput of various subsystems is described in the `"throughput"` portion of package.json. The characteristics of my development machines are summarized in the `"dev"` portion of package.json.

## Wild Guess

I think the fully distributed version will take around 5000 lines of code. The centralized version is small, but the distributed system will involve a lot of integrations that will quickly add up. The many different tools and libraries needed will greatly inflate the code count, even if the core logic is the same.


# M1: Serialization / Deserialization

## Summary

My implementation consists of 1 core component (`serialization.js`) integrated into the existing distribution utility library, totaling around 200 lines of code. The biggest challenges were handling JS's dynamically typed values in a uniform way, supporting functions and special objects (Date, Error), and ensuring that objects were parsed correctly. To address these challenges, I introduced explicit type tags during serialization so that it could be reconstructed during deserialization. For objects in particular, I had to change up my code to define 'encode'/'decode' functions so that I could recursively send nested objects without losing type info.

## Correctness & Performance Characterization

*Correctness*: I wrote 10 tests (including both unit tests and required scenario tests); these tests take around 1s to execute. These tests cover base types, functions, nested and recursive objects, arrays, dates, errors, malformed inputs, and round-trip serialization–deserialization correctness. I also tested on the full given test suite that is much more comprehensive testing the edge cases.

*Performance*: The latency of various subsystems is described in the `"latency"` portion of package.json. The characteristics of my development machines are summarized in the `"dev"` portion of package.json. You can find the code in test/student/m1.latency.test.js.

Latency: Three workloads (base values, functions, complex objects) were evaluated. I measured average serialization + deserialization times for each (measured in us).

Throughput: Throughput values were derived from latency measurements. The values listed in dev are measured in operations / second.


# M2: Actors and Remote Procedure Calls (RPC)

## Summary
My implementation comprises 4 software components, totaling 200 lines of code. Key challenges included: 1. getting error handling right without crashing the runtime 2. making routing work consistently across both direct calls and HTTP 3. ensuring function messages remain executable

## Correctness & Performance Characterization
Correctness: I wrote 5 student tests plus 3 scenario tests. The tests took around a second to execute.

Performance: I characterized the performance of comm and RPC by sending 1000 service requests in a tight loop. Average throughput and latency is recorded in `package.json`. Average latency is measured in ms, throughput is measured in requests per second.

## Key Feature
createRPC lets another computer ask your computer to run a piece of logic and send back its result. For instance, let's say computer A has a function that addsFive to a running value. It can wrap this up into a function called addsFiveRPC. When computer B calls addsFiveRPC, under the hood it's simply sending a request over to A to addFive and waiting on a result back.

# M3: Node Groups & Gossip Protocols

## Summary
My implementation comprises 6 new software components, totaling ~250 lines of codes over the previous implementation. Key challenges included 1. getting group instantiation right without breaking existing local and all behavior 2. making request routing consistent across local vs distributed execution by correctly interpreting /<gid>/<service>/<method> paths 3. matching the test suite's expected error semantics (per node error maps, empty value maps on partial failure, etc). 

## Correctness & Performance Characterization
Correctness: I validated correctness by running the full provided test suite (regular + scenario) + 5 student tests that I created. These tests centered around group creation / deletion edge cases, dynamic membership updates, and distributed fanout error handling. The total test suite ran in around 3s.

Performance: I tested performance using a sequential spawn benchmark with N = 10 nodes. I've recorded the average latency (ms / node) and throughput (nodes / sec) in the package.json file. 

## Key Feature
The point of gossip is so that we can scale to large group sizes and ensure robustness under partial failures. If a node sent updates to every peer, it would become very expensive very quickly. 

With gossip, each nodes sends to only a small subset and the information spreads gradually. This reduces per node load and makes the system resilient. Even if some nodes are slow / unreachable, the update can still propagate through other paths.

# M4: Distributed Storage

## Summary 

My implementation for M4 adds both local and dsitributed storage over the existing node group framework. I implemented local mem and store services with put, get, and del, then built distributed mem and store services that route objects to the correct node by hashing the key and forwarding the reques. I also added consistentHash and rendezvousHash to support placement policies beyond naive modulo hashing.

The main challenges were: 1. keeping objects from different distributed service instances isolated by gid even when the same key maps to the same physical node, 2. making the persistent store robust by namespacing data on disk and sanitizing filenames, and 3. making sure hashing and distributed routing agreed exactly with the test suite’s expectations.

## Correctness & Performance Characterization

*Correctness*: I validated correctness by running the provided M4 regular tests, scenario tests, and my student tests. In total, I used 79 M4 tests (including the provided suites and my additional tests), and the test suite completed in around 2s. These tests covered local storage behavior, distributed storage behavior, group-relative key isolation, key hashing, and basic end-to-end placement behavior.

*Performance*: I characterized performance with a client benchmark that first generated 1000 random key-value pairs locally, then measured insertion and retrieval separately against three manually started cloud nodes. The client benchmark was ran locally on my computer. The measured insertion average latency was **32.23 ms** with throughput **30.63 ops/sec**. The measured retrieval average latency was **31.15 ms** with throughput **31.70 ops/sec**. These values are also recorded on the package.json

## Key Feature
reconf is designed to first identify which keys need to move before relocating objects because this minimizes unnecessary work and avoids touching objects whose placement does not change. By deciding relocation purely from the key under the old and new group configurations, the system only transfers the objects that must move, which reduces bandwidth and avoids redundant operations.

