import {
  A_ACTION, e, toMap,
} from './constants';

const actionProxy = (stream) => new Proxy(stream, {
  get(target, name) {
    if (target._actions.has(name)) {
      return (...args) => {
        target._actions.get(name)(target, ...args);
      };
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

export default (stream, actions) => {
  return Object.assign(stream, {
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
      if (!(typeof Proxy === 'undefined')) {
        return doObj(stream);
      }
      if (!stream._doProxy) {
        stream._doProxy = actionProxy(stream);
      }
      return stream._doProxy;
    },
  });
};
