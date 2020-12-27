import { BehaviorSubject, from, Subject } from 'rxjs';
import isEqual from 'lodash/isEqual';
import {
  combineLatest, distinctUntilChanged, filter, map,
} from 'rxjs/operators';
import lGet from 'lodash/get';
import Event, { EventFilter } from './Event';
import {
  E_COMMIT, E_FILTER, E_INITIAL, E_VALIDATE, A_NEXT, E_COMPLETE, A_ANY,
  defaultEventTree, eqÅ, Å, e,
} from './constants';

const nextFilter = new EventFilter({
  action: A_NEXT,
  stage: E_COMMIT,
});

export default class ValueStream {
  constructor(value, options = {}) {
    this._valueSubject = new BehaviorSubject(value);
    this._eventTree = new Map(defaultEventTree);
    this._eventSubject = new Subject();
    this._eventStream = this._eventSubject.pipe(map((data) => new Event(data)));
    this._errorStream = new Subject();
    // eslint-disable-next-line no-shadow
    const { filter, name } = options;
    if (typeof filter === 'function') {
      this.filter = filter;
    }
    this.name = name;

    this._watchEvents();
  }

  error(error, event) {
    if (lGet(error, 'error')) {
      return this._errorStream.next(error);
    }
    this._errorStream.next({
      ...error,
      error,
      message: error.message,
      target: this,
      event,
    });
    return this;
  }

  _watchEvents() {
    this.when(({ valueStream }) => {
      this._updateValue(valueStream.value);
      valueStream.complete();
    }, nextFilter);
  }

  _updateValue(value) {
    this._valueSubject.next(value);
  }

  filter(fn) {
    const target = this;
    return this.on(((event) => {
      try {
        const next = fn(event.value, event, this);
        event.next(next);
      } catch (error) {
        event.error(error);
        target.error(error, event);
      }
    }), A_NEXT, E_FILTER);
  }

  on(fn, onAction = A_NEXT, onStage = E_FILTER, onValue = Å) {
    if (typeof fn !== 'function') {
      throw e('on() requires function', fn);
    }
    if (onAction instanceof EventFilter) {
      return this.when(fn, onAction);
    }
    const test = new EventFilter({
      action: onAction,
      stage: onStage,
      value: onValue,
    });

    return this.when(fn, test);
  }

  /**
   *
   * @param fn {function)}
   * @param test {EventFilter}
   * @returns {ValueStream}
   */
  when(fn, test) {
    if (!(typeof fn === 'function')) {
      throw e('when() requires function', fn);
    }
    if (!(test instanceof EventFilter)) throw e('cannot call when() without a formal event filter', test);

    const target = this;

    this._eventStream.pipe(
      filter((event) => test.matches(event)),
    ).subscribe((event) => {
      try {
        fn(event, target);
      } catch (error) {
        target.error({
          message: lGet(error, 'message', ''),
          error,
          target,
        });
      }
    });
    return this;
  }

  _onEventError(error, originalValue, currentValue, currentStage) {
    this._errorStream.next({
      error,
      originalValue,
      currentValue,
      currentStage,
    });
  }

  send(action, value, stages) {
    const valueStream = new BehaviorSubject(value);
    const actionStages = stages || this._eventTree.get(action) || this._eventTree.get(A_ANY);

    const stageStream = from(actionStages);
    let currentStage = null;

    const manifest = {
      next: (stage) => {
        currentStage = stage;
        if (!valueStream.isStopped) {
          this._eventSubject.next({
            action,
            valueStream,
            stage,
          });
        }
      },
      error: (error) => {
        this._onEventError(error, value, valueStream.getValue(), currentStage);
      },
      complete: () => {
        if (!valueStream.isStopped) {
          valueStream.complete();
        }
      },
    };

    stageStream.subscribe(manifest);
  }

  next(value) {
    this.send(A_NEXT, value);
  }

  get value() {
    return this._valueSubject.value;
  }

  getValue() {
    return this._valueSubject.value;
  }

  complete() {
    this._valueSubject.complete();
  }

  subscribe(onNext, onError, onDone) {
    let failSub;
    if (typeof onError === 'function') {
      failSub = this._errorStream.subscribe(onError);
    }

    const manifest = {
      done: () => {
        if (failSub) {
          failSub.unsubscribe();
          if (typeof onDone === 'function') {
            onDone();
          }
        }
      },
    };
    if (typeof onError === 'function') {
      manifest.error = onError;
    }

    if (typeof onNext === 'function') {
      manifest.next = onNext;
    }
    return this._valueSubject.subscribe(manifest);
  }
}
