/*
    In this file, add your own test cases that correspond to functionality introduced for each milestone.
    You should fill out each test case so it adequately tests the functionality you implemented.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/

const distribution = require('../../distribution.js')();
require('../helpers/sync-guard');

const util = distribution.util;

// base values round trip
test('(1 pts) student test', () => {
  const values = [3, -1.5, 'hello', '', true, false, null, undefined];

  for (const v of values) {
    const s = util.serialize(v);
    const out = util.deserialize(s);
    expect(out).toEqual(v);
  }
});

// function round trip
test('(1 pts) student test', () => {
  const f = (a, b) => a * 10 + b;

  let s = util.serialize(f);
  let out = util.deserialize(s);
  expect(typeof out).toBe('function');
  expect(out(2, 3)).toBe(23);
  expect(out(1, 7)).toBe(17);

  function add(x, y) {
    return x + y;
  }
  s = util.serialize(add);
  out = util.deserialize(s);
  expect(typeof out).toBe('function');
  expect(out(2, 3)).toBe(5);
  expect(out(1, 7)).toBe(8);
});


// nested object / array
test('(1 pts) student test', () => {
  const obj = {
    title: 'NBA',
    teams: [
      {name: 'OKC', players: ['SGA', 'Chet']},
      {name: 'Lakers', players: ['Luka', 'LBJ']},
    ],
    meta: {active: true, missing: undefined},
  };

  const s = util.serialize(obj);
  const out = util.deserialize(s);

  expect(out).toEqual(obj);
  expect(Array.isArray(out.teams)).toBe(true);
  expect(out.teams[0].players[1]).toBe('Chet');
});

// date + error round trip
test('(1 pts) student test', () => {
  const d = new Date(1700000000);
  const e = new Error('error');
  e.name = 'RangeError';

  const obj = {when: d, err: e};

  const s = util.serialize(obj);
  const out = util.deserialize(s);

  expect(out.when instanceof Date).toBe(true);
  expect(out.when.getTime()).toBe(d.getTime());

  expect(out.err instanceof Error).toBe(true);
  expect(out.err.name).toBe('RangeError');
  expect(out.err.message).toBe('error');
});

// valid JSON but not serialized object
test('(1 pts) student test', () => {
  const notWireFormat = '{"a":1,"b":2}';
  expect(() => {
    util.deserialize(notWireFormat);
  }).toThrow(SyntaxError);
});
