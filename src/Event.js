import { immerable, produce } from 'immer';
import isEqual from 'lodash/isEqual';
import lGet from 'lodash/get';
import { ABSENT } from './constants';
export default class Event {
  /**
   *
   * @param name {any}
   * @param value {any}
   * @param stage {any}
   * @param stages {any}
   */
  constructor(name = ABSENT, value = ABSENT, stage = ABSENT, stages = ABSENT) {
    this[immerable] = true; // Option 2
    if (typeof name === 'object') {
      this._initParams(name);
    } else {
      this._initArgs(name, value, stage, stages);
    }

    if (!Array.isArray(this.stages) && this.stage && typeof this.stage !== 'function') {
      this.stages = [this.stage];
    }
  }

  _initParams({
    name = ABSENT,
    value = ABSENT,
    stage = ABSENT,
    stages = ABSENT,
  }) {
    this._initArgs(name, value, stage, stages);
  }

  _initArgs(name, value, stage, stages) {
    this.name = name;
    this.value = value;
    if (Array.isArray(stage)) {
      this.stage = stage[0];
      this.stages = stage;
    } else {
      this.stage = stage;
      this.stages = stages;
    }
  }

  get hasErrors() {
    return this._errors && this._errors.length;
  }

  get errors() {
    return Array.isArray(this._errors) ? [...this._errors] : [];
  }

  error(err) {
    if (typeof err === 'string') return this.error(new Error(err));
    if (typeof err === 'object' && (err !== this)) {
      Object.assign(err, { event: this });
    }
    if (!this._errors) {
      this._errors = [err];
    } else if (!Array.isArray(this._errors)) {
      this._error = [this._error, err];
    } else {
      this._errors.push(err);
    }
    return this;
  }

  advance() {
    if (Array.isArray(this.stages)) {
      if (this.stage === ABSENT) {
        // eslint-disable-next-line prefer-destructuring
        this.stage = this.stages[0];
        return this;
      }
      if (this.index === -1) {
        throw Object.assign(new Error('broadcast has invalid stage:'),
          { target: this });
      }
      if (!this.isComplete) {
        this.stage = this.stages[this.index + 1];
      }
      return this;
    }
    return this.error(new Error('cannot advance an broadcast without an array of stages'));
  }

  get index() {
    return this.stages.indexOf(this.stage);
  }

  get isComplete() {
    if (this.hasErrors) {
      return true;
    }
    return !(this.stages[this.index + 1]);
  }

  complete() {
    if (!this.isComplete) {
      if (!Array.isArray(this.stages)) {
        return this.error(new Error('attempted to complete an broadcast without an array of stages'));
      }
      this.stage = [...this.stages].pop();
    }
    return this;
  }

  matches(otherEvent, matchRaw = false) {
    if ((!matchRaw) && !(otherEvent instanceof Event)) {
      return false;
    }
    return this.nameMatches(otherEvent, matchRaw)
      && this.stageMatches(otherEvent, matchRaw)
      && this.valueMatches(otherEvent, matchRaw);
  }

  _matches(target, key, isRaw) {
    if (this[key] === ABSENT) return true;
    if (target instanceof Event) {
      return this._matches(lGet(target, key), key);
    }
    if (isRaw) {
      const subProp = lGet(target, key, ABSENT);
      if (subProp !== ABSENT) {
        return this._matches(target, subProp);
      }
    }
    return this[key] === target;
  }

  valueMatches(value, isRaw) {
    return this._matches(value, 'value', isRaw);
  }

  stageMatches(stage, isRaw) {
    return this._matches(stage, 'stage', isRaw);
  }

  nameMatches(name, isRaw) {
    return this._matches(name, 'name', isRaw);
  }
}

Event[immerable] = true;

Event.compare = (e1, e2) => {
  if (!(e1 && e2) || (!e1 && !e2)) {
    return false;
  }
  if (e1 instanceof Event) {
    return e1.matches(e2);
  } if (e2 instanceof Event) {
    return e2.matches(e1);
  }
  return (e1.name === e2.name) && (e1.stage === e2.stage)
    && (isEqual(e1.value, e2.value));
};

/**
 * this is a class that determines whether an broadcast matches a pattern.
 */
export class EventFilter extends Event {
  _matches(target, key, isRaw) {
    if (this[key] === ABSENT) return true;
    if (target instanceof EventFilter) {
      console.error('comparing two EventFilters', this, target);
      return false;
    }
    if (target instanceof Event) {
      return this._matches(lGet(target, key, ABSENT), key);
    }
    if (isRaw) {
      const subProp = lGet(target, key, ABSENT);
      if (subProp !== ABSENT) {
        return this._matches(subProp, key);
      }
    }
    if (typeof this[key] === 'function') return this[key](target, this);
    return super._matches(target, key, isRaw);
  }

  valueMatches(value, isRaw) {
    return this._matches(value, 'value', isRaw);
  }

  stageMatches(stage, isRaw) {
    return this._matches(stage, 'stage', isRaw);
  }

  nameMatches(name, isRaw) {
    return this._matches(name, 'name', isRaw);
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
        return this._equals(supProp, key);
      }
    }
    if (typeof this[key] === 'function') return this[key](target, this);
    return super._equals(target, key, isRaw);
  }

  valueEquals(value, isRaw) {
    return this._equals(value, 'value', isRaw);
  }

  stageEquals(stage, isRaw) {
    return this._equals(stage, 'stage', isRaw);
  }

  nameEquals(name, isRaw) {
    return this._equals(name, 'name', isRaw);
  }

  equals(otherEvent, isRaw) {
    return this.nameEquals(otherEvent, isRaw)
      && this.stageEquals(otherEvent, isRaw)
      && this.valueEquals(otherEvent, isRaw);
  }
}

EventFilter[immerable] = true;

Event.EventFilter = EventFilter;
