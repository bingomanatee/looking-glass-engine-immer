import { Å } from './constants';


export default function setProxy(onChange) {
  if (typeof Proxy !== 'undefined') {
    const proxy = new Proxy(new Set(), {
      get(theSet, key) {
        if (key in theSet) {
          if (typeof theSet[key] === 'function') {
            return (...args) => {
              onChange(key, args, Å);
              const result = theSet[key].apply(theSet, args);
              onChange(key, args, result);
              return result;
            };
          }
          return theSet[key];
        }
        return undefined;
      },
    });
    return proxy;
  }
  return new Set();
}

export const SET_BEFORE = Symbol('SET_BEFORE');
export const SET_AFTER = Symbol('SET_AFTER');
