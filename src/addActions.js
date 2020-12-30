import {
  A_ACTION, e, toMap,
} from './constants';
import ValueMapStream from './ValueMapStream';

const SET_RE = /^set(.+)$/i;

const actionProxy = (stream) => new Proxy(stream, {
  get(target, name) {
    if (target._actions.has(name)) {
      return (...args) => target._actions.get(name)(target, ...args);
    }
    if (target instanceof ValueMapStream) {
      const nameString = `${name}`;
      if (SET_RE.test(nameString)) {
        // eslint-disable-next-line no-unused-vars
        const [setName, restOfName] = SET_RE.exec(nameString);
        const keyLCFirst = restOfName.substr(0, 1).toLowerCase + restOfName.substr(1);

        if (target.value.has(keyLCFirst)) return (value) => target.set(keyLCFirst, value);
        const keyLC = restOfName.toLowerCase();
        const matchingKey = [...target.value.keys()]
          .reduce((found, candidate) => {
            if (found) return found;
            if (typeof candidate === 'string') {
              if (candidate.toLowerCase() === keyLC) {
                return candidate;
              }
              return false;
            }
          }, false);
        if (matchingKey) {
          return (value) => target.set(matchingKey, value);
        }
      }
    }

    if (target.send) {
      return (...args) => {
        target.send(A_ACTION, {
          name,
          args,
        });
      };
    }
    throw e(`no action ${name}`, target);
  },
});

const doObj = (stream) => {
  const out = {};

  stream._actions.forEach((fn, name) => {
    out[name] = (...args) => fn(stream, ...args);
  });

  return out;
};

export default (stream, actions) => Object.assign(stream, {
  addActions(objOrMap) {
    toMap(objOrMap).forEach((fn, name) => {
      stream.addAction(name, fn);
    });
    return stream;
  },
  _actions: toMap(actions),
  addAction(name, fn) {
    if (!(typeof fn === 'function')) {
      console.error('cannot add ', name, ' -- not a function', fn);
      return stream;
    }
    if (stream._actions.has(name)) {
      console.warn('redefining action', name);
    }
    stream._actions.set(name, fn);
    return stream;
  },

  get do() {
    if (typeof Proxy === 'undefined') {
      return doObj(stream);
    }
    if (!stream._doProxy) {
      stream._doProxy = actionProxy(stream);
    }
    return stream._doProxy;
  },
});
