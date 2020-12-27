
import ValueStream from './ValueStream';
import {
  A_SET, A_NEXT, E_COMMIT, E_INITIAL, E_PRECOMMIT,
} from './constants';
import { EventFilter } from './Event';

const toMap = (item) => {
  if (item instanceof Map) return item;
  const out = new Map();
  if (typeof item === 'object') {
    [...Object.keys(item)].forEach((key) => out.set(key, item[key]));
    return out;
  }
  return out;
};

const preNext = new EventFilter({
  action: A_NEXT,
  stage: E_INITIAL,
});

const preCommitNext = new EventFilter({
  action: A_NEXT,
  stage: E_PRECOMMIT,
});

const preSet = new EventFilter({
  action: A_SET,
  stage: E_PRECOMMIT,
});

const commitSet = new EventFilter({
  action: A_SET,
  stage: E_COMMIT,
});

function onlyMap(e) {
  if (!(e.value instanceof Map)) {
    e.error('only accepts map values');
  }
}

const setToNext = (event, target) => {
  console.log('--- onSet: ', event.toString(), event.value);
  const next = new Map(target.value);
  if (event.value instanceof Map) {
    event.value.forEach((value, key) => next.set(value, key));
    console.log('--- updated from ', event.value, 'to', next);
  } else {
    console.log('--- _onSet skipping ', event.value);
  }
  event.complete();
  target.next(next);
}

const mergeNext = (event, target) => {
  console.log('--- onSet: ', event.toString(), event.value);
  const next = new Map(target.value);
  if (event.value instanceof Map) {
    event.value.forEach((value, key) => next.set(key, value));
    console.log('--- updated from ', event.value, 'to', next, 'from');
  } else {
    console.log('--- _onSet skipping ', event.value);
  }
  event.next(next);
}

export default class ValueMapStream extends ValueStream {
  constructor(value, ...args) {
    super(toMap(value), ...args);
    this._watchSet();
  }

  _watchSet() {
    this.when(onlyMap, preSet);
    this.when(onlyMap, preNext);
    this.when(setToNext, commitSet);
    this.when(mergeNext, preCommitNext);
  }

  set(key, value) {
    if (key instanceof Map) {
      return this.stream(A_SET, key);
    }
    return this.stream(A_SET, new Map([[key, value]]));
  }

  get(key) {
    return this.value.get(key);
  }

  get object() {
    return [...this.value.keys()].reduce((out, key) => {
      try {
        // eslint-disable-next-line no-param-reassign
        out[key] = this.get(key);
      } catch (err) {

      }
      return out;
    }, {});
  }

  _valueProxy() {
    return new Proxy(this, {
      get(vms, key) {
        return vms.get(key);
      },
      set(vms, key, value) {
        return vms.set(key, value);
      },
    });
  }

  get my() {
    if (!(typeof Proxy === 'undefined')) {
      if (!this._myProxy) {
        this._myProxy = this._valueProxy();
      }
      return this._myProxy;
    }
    return this.object;
  }
}
