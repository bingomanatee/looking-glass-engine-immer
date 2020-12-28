import { immerable, produce } from 'immer';
import isEqual from 'lodash/isEqual';
import lGet from 'lodash/get';
import { ABSENT, Å, e } from './constants';

export default class Event {
  /**
   *
   * @param action {any}
   * @param valueStream {any}
   * @param stage {any}
   */
  constructor(action, valueStream, stage, target) {
    this[immerable] = true; // Option 2
    if (typeof action === 'object') {
      this._initParams(action);
    } else {
      this._initArgs(action, valueStream, stage, target);
    }
  }

  _initParams({
    action = ABSENT,
    valueStream = ABSENT,
    stage = ABSENT,
  }) {
    this._initArgs(action, valueStream, stage);
  }

  _initArgs(action = Å, valueStream = Å, stage = Å, target = Å) {
    this.action = action;
    this.valueStream = valueStream;
    this.stage = stage;
    this.target = target;
  }

  get value() {
    if (!this.activeStream) {
      return Å;
    }
    return this.valueStream.getValue();
  }

  get activeStream() {
    return !this.valueStream.isStopped && !this.valueStream.hasError;
  }

  next(value) {
    if (this.activeStream) {
      this.valueStream.next(value);
    } else throw e('attempt to update a stalled stream', this);
  }

  error(error) {
    if (this.activeStream) {
      this.valueStream.error(error);
    } else {
      console.error('cannot register an error on suspended stream', error, this);
    }
  }

  complete() {
    if (this.valueStream) this.valueStream.complete();
  }

  subscribe(...args) {
    if (this.valueStream) return this.valueStream.subscribe(...args);
    throw e('attempted to subscribe to a stream-less Event', this);
  }

  toString() {
    const list = ['<<'];
    if (this.action !== Å) list.push('action: ', this.action.toString());
    if (this.stage !== Å) list.push('stage:', this.stage.toString());
    if (this.value !== Å) list.push('value', this.value.toString());
    list.push('>>');
    return list.join(' ');
  }
}

Event[immerable] = true;

Event.toEvent = (data) => {
  if (!data) return new Event({});
  if (data instanceof Event) return data;
  if (Array.isArray(data)) return new Event(...data);
  return new Event(data);
};
/**
 * this is a class that determines whether an broadcast matches a pattern.
 */
export class EventFilter {
  constructor(action, value, stage, target) {
    this[immerable] = true; // Option 2
    if (typeof action === 'object') {
      this._initParams(action);
    } else {
      this._initArgs(action, value, stage, target);
    }
  }

  _initArgs(action = Å, value = Å, stage = Å, target = Å) {
    this.action = action;
    this.value = value;
    this.stage = stage;
    this.target = target;
  }

  _initParams({
    action = ABSENT,
    valueStream = ABSENT,
    stage = ABSENT,
  }) {
    this._initArgs(action, valueStream, stage);
  }

  _matches(target, key, isRaw) {
    const myValue = lGet(this, key);
    if (myValue === Å) return true;
    if (target instanceof EventFilter) {
      console.error('comparing two EventFilters', this, target);
      return false;
    }
    if (target instanceof Event) {
      return this._matches(lGet(target, key), key);
    }
    if (isRaw) {
      const subProp = lGet(target, key, Å);
      if (subProp !== Å) {
        return this._matches(subProp, key);
      }
    }
    if (typeof myValue === 'function') return myValue(target, this);

    return target === myValue;
  }

  valueMatches(value, isRaw) {
    return this._matches(value, 'value', isRaw);
  }

  stageMatches(stage, isRaw) {
    return this._matches(stage, 'stage', isRaw);
  }

  nameMatches(action, isRaw) {
    return this._matches(action, 'action', isRaw);
  }

  matches(otherEvent, isRaw) {
    return this.nameMatches(otherEvent, isRaw)
      && this.stageMatches(otherEvent, isRaw)
      && this.valueMatches(otherEvent, isRaw);
  }
  // equals

  _equals(target, key, isRaw) {
    if (target instanceof EventFilter) {
      console.error('comparing two EventFilters', this, target);
      return false;
    }
    if (target instanceof Event) {
      return this._equals(lGet(target, key, ABSENT), key);
    }
    if (isRaw) {
      const subProp = lGet(target, key, ABSENT);
      if (subProp !== ABSENT) {
        return this._equals(subProp, key);
      }
    }
    if (typeof this[key] === 'function') return this[key](target, this);
    return isEqual(lGet(this, key), target);
  }

  valueEquals(value, isRaw) {
    return this._equals(value, 'value', isRaw);
  }

  stageEquals(stage, isRaw) {
    return this._equals(stage, 'stage', isRaw);
  }

  nameEquals(action, isRaw) {
    return this._equals(action, 'action', isRaw);
  }

  equals(otherEvent, isRaw) {
    return this.nameEquals(otherEvent, isRaw)
      && this.stageEquals(otherEvent, isRaw)
      && this.valueEquals(otherEvent, isRaw);
  }
}

EventFilter[immerable] = true;

Event.EventFilter = EventFilter;
