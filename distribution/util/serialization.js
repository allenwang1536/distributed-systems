// @ts-check

function encode(object) {
  const t = typeof object;

  if (object === null) {
    return {type: 'null'};
  }

  if (t === 'undefined') {
    return {type: 'undefined'};
  }

  if (t === 'number') {
    if (Number.isNaN(object)) {
      return {type: 'number', value: 'NaN'};
    }

    if (object === Infinity) {
      return {type: 'number', value: 'Infinity'};
    }
    if (object === -Infinity) {
      return {type: 'number', value: '-Infinity'};
    }

    return {type: 'number', value: object};
  }

  if (t === 'string') {
    return {type: 'string', value: object};
  }

  if (t === 'boolean') {
    return {type: 'boolean', value: object};
  }

  if (t === 'function') {
    return {type: 'function', value: object.toString()};
  }

  if (t === 'object') {
    if (object instanceof Error) {
      return {type: 'error', name: object.name, message: object.message};
    }

    if (Array.isArray(object)) {
      return {type: 'array', value: object.map(encode)};
    }

    if (object instanceof Date) {
      return {type: 'date', value: object.getTime()};
    }

    const obj = {};
    for (const k of Object.keys(object)) {
      obj[k] = encode(object[k]);
    }

    return {type: 'object', value: obj};
  }

  throw new TypeError(`Unsupported type: ${t}`);
}

/**
 * @param {any} object
 * @returns {string}
 */
function serialize(object) {
  return JSON.stringify(encode(object));
}

function decode(parsed) {
  switch (parsed.type) {
    case 'null':
      return null;
    case 'undefined':
      return undefined;
    case 'number':
      if (parsed.value === 'NaN') return NaN;
      if (parsed.value === 'Infinity') return Infinity;
      if (parsed.value === '-Infinity') return -Infinity;
      if (typeof parsed.value !== 'number') throw new SyntaxError('Invalid number payload');
      return parsed.value;
    case 'string':
      if (typeof parsed.value !== 'string') throw new SyntaxError('Invalid string payload');
      return parsed.value;
    case 'boolean':
      if (typeof parsed.value !== 'boolean') throw new SyntaxError('Invalid boolean payload');
      return parsed.value;
    case 'function':
      if (typeof parsed.value !== 'string') throw new SyntaxError('Not passed string for function deserialization');
      try {
        const func = eval('(' + parsed.value + ')');

        if (typeof func !== 'function') throw new SyntaxError('Passed string does not represent a function');
        return func;
      } catch (e) {
        throw new SyntaxError('cannot evalute parsed code');
      }
    case 'error':
      if (typeof parsed.name !== 'string' || typeof parsed.message !== 'string') throw new SyntaxError('Not passed string for error deserialization');

      const error = new Error();
      error.name = parsed.name;
      error.message = parsed.message;

      return error;
    case 'array':
      if (!(Array.isArray(parsed.value))) throw new SyntaxError('Not passed array for array deserialization');
      const arr = parsed.value;
      return arr.map(decode);
    case 'date':
      if (typeof parsed.value !== 'number') throw new SyntaxError('Not passed number for date deserialization');
      const date = new Date(parsed.value);
      return date;
    case 'object':
      if (typeof parsed.value !== 'object') throw new SyntaxError('Not passed object for object deserialization');

      const obj = {};
      for (const [k, v] of Object.entries(parsed.value)) {
        obj[k] = decode(v);
      }
      return obj;
    default:
      throw new SyntaxError(`Unknown type tag: ${parsed.type}`);
  }
}

/**
 * @param {string} string
 * @returns {any}
 */
function deserialize(string) {
  if (typeof string !== 'string') {
    throw new Error(`Invalid argument type: ${typeof string}.`);
  }

  const parsed = JSON.parse(string);
  if (!parsed || typeof parsed !== 'object' || typeof parsed.type !== 'string') {
    throw new SyntaxError('Invalid serialized object.');
  }

  return decode(parsed);
}

module.exports = {
  serialize,
  deserialize,
};
