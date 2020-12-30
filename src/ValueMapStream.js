import { catchError, filter, switchMap } from 'rxjs/operators';
import {
  Subject, BehaviorSubject, from, of as ofStream,
} from 'rxjs';
import intersection from 'lodash/intersection';
import lGet from 'lodash/get';
import ValueStream from './ValueStream';
import {
  setEvents,
  A_NEXT, A_SET, E_COMMIT, E_INITIAL, E_PRECOMMIT, E_PRE_MAP_MERGE,
  mapNextEvents, E_MAP_MERGE, toMap, e, Å, E_RESTRICT,
} from './constants';
import { EventFilter } from './Event';

const onInitialNext = new EventFilter({
  action: A_NEXT,
  stage: E_INITIAL,
});

const onMergeNext = new EventFilter({
  action: A_NEXT,
  stage: E_MAP_MERGE,
});

const onPrecommitSet = new EventFilter({
  action: A_SET,
  stage: E_PRECOMMIT,
});

const onCommitSet = new EventFilter({
  action: A_SET,
  stage: E_COMMIT,
});

const onRestrictKeyForSet = new EventFilter({
  action: A_SET,
  stage: E_RESTRICT,
});

const SR_FROM_SET = Symbol('action:set');

function onlyMap(e) {
  if (!(e.value instanceof Map)) {
    e.error('only accepts map values');
  }
}

function onlyOldKeys(event, target) {
  const oldKeys = [...target.value.keys()];
  event.value.forEach((value, key) => {
    if (!oldKeys.includes(key)) {
      throw e(`key ${key} must be present in ${oldKeys.join(', ')}`, target);
    }
  });
}

const setToNext = (event, target) => {
  const nextValue = new Map(target.value);
  if (event.value instanceof Map) {
    event.value.forEach((value, key) => nextValue.set(key, value));
  }
  event.complete();
  target.send(A_NEXT, nextValue);
};

const mergeNext = (event, target) => {
  const next = new Map(target.value);
  if (event.value instanceof Map) {
    event.value.forEach((value, key) => next.set(key, value));
  }
  event.next(next);
};

export default class ValueMapStream extends ValueStream {
  constructor(value, options, ...args) {
    super(toMap(value), options, ...args);
    this.fieldSubjects = new Map();
    this._eventTree.set(A_NEXT, mapNextEvents);
    this._eventTree.set(A_SET, setEvents);
    if (lGet(options, 'noNewKeys')) {
      this.when(onlyOldKeys, onRestrictKeyForSet);
    }
    this._watchSet();
  }

  _watchSet() {
    this.when(onlyMap, onPrecommitSet);
    this.when(mergeNext, onMergeNext);
    this.when(onlyMap, onInitialNext);
    this.when(setToNext, onCommitSet);
  }

  onField(fn, name, stage = E_PRECOMMIT) {
    const names = Array.isArray(name) ? [...name] : [name];
    const ifIntersects = (value) => {
      if (!(value instanceof Map)) {
        return false;
      }
      const matches = [...value.keys()].filter((key) => names.includes(key));
      return matches.length;
    };

    // first - if any changes are sent through set() to the fields of interest
    const onTargets = new EventFilter(A_SET, ifIntersects, stage);

    this.when(fn, onTargets);

    const onStraightNext = new EventFilter({
      action: A_NEXT,
      stage: E_PRE_MAP_MERGE,
      value: ifIntersects,
      source: (src) => src !== SR_FROM_SET,
    });

    this.when(fn, onStraightNext);
  }

  set(key, value, fromSubject) {
    if (key instanceof Map) {
      return this.send(A_SET, key);
    }
    if (!fromSubject && this.fieldSubjects.has(key)) {
      this.fieldSubjects.get(key).next(value);
      return this;
    }
    return this.send(A_SET, new Map([[key, value]]));
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
