import {
  BehaviorSubject, from as fromEffect, Subject, of, combineLatest, Observable,
} from 'rxjs';
import isEqual from 'lodash/isEqual';
import {
  filter, map, tap, switchMap, catchError,
} from 'rxjs/operators';
import lGet from 'lodash/get';
import { nanoid } from 'nanoid';
import Event, { EventFilter } from './Event';
import {
  E_COMMIT, E_PRECOMMIT, E_FILTER, E_INITIAL, E_VALIDATE, A_NEXT, E_COMPLETE, A_ANY,
  defaultEventTree, eqÅ, Å, e,
} from './constants';

const nextFilter = new EventFilter({
  action: A_NEXT,
  stage: E_COMMIT,
});

const onPreCommitNext = new EventFilter({
  action: A_NEXT,
  stage: E_PRECOMMIT,
});

export default class ValueStream {
  constructor(value, options = {}) {
    this._valueSubject = new BehaviorSubject(value);
    this._eventTree = new Map(defaultEventTree);

    this._errorStream = new Subject()
      .pipe(
        map((errorDef) => {
          if (errorDef.error && errorDef.error.message && !errorDef.message) {
            return { ...errorDef, message: errorDef.error.message };
          }
          return errorDef;
        }),
      );
    // eslint-disable-next-line no-shadow
    const {
      filter: myFilter, name, debug = false, finalize,
    } = options;
    if (typeof myFilter === 'function') {
      this.filter(myFilter);
    }
    this.name = name || nanoid();
    this.debug = debug;

    if (typeof finalize === 'function') {
      this.when(finalize, onPreCommitNext);
    }
    this._watchEvents();
  }

  get _eventSubject() {
    if (!this._$eventSubject) {
      this._$eventSubject = new Subject();
    }
    return this._$eventSubject;
  }

  get _eventStream() {
    const target = this;
    if (!this._$eventStream) {
      this._$eventStream = new Subject()
        .pipe(
          switchMap((value) => new BehaviorSubject(value)),
          catchError((error) =>
          //   target.error(error);
            fromEffect([Å])),
          filter((anEvent) => anEvent instanceof Event),
        );
    }

    return this._$eventStream;
  }

  error(error, event) {
    if (lGet(error, 'error')) {
      return this._errorStream.next({ ...error, target: this });
    }
    this._errorStream.next({
      target: this,
      event,
      error,
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
      filter((event) => {
        const out = test.matches(event);
        if (this.debug && out) {
          console.log('matched', event.toString(), 'to:', fn.toString());
        }
        return out;
      }),
    ).subscribe((event) => {
      if (this.debug) console.log('doing ', event.toString(), fn.toString());
      fn(event, target);
    });
    return this;
  }

  send(action, value, stages) {
    const actionStages = stages || this._eventTree.get(action) || this._eventTree.get(A_ANY);
    const onError = this._errorStream.next.bind(this._errorStream);
    const subject = new BehaviorSubject(value);
    subject.subscribe({ error: onError });
    combineLatest(of(action), of(subject), fromEffect(actionStages))
      // eslint-disable-next-line no-unused-vars
      .pipe(
        // eslint-disable-next-line no-unused-vars
        filter(([_, stream]) => !stream.isStopped),
        map((args) => new Event(...args)),
      )
      .subscribe({
        next: this._eventStream.next.bind(this._eventStream),
      });
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

  subscribe(onNext, onError, onComplete) {
    if (typeof onNext === 'object') {
      const { next, error, complete } = onNext;
      return this.subscribe(next, error, complete);
    }

    let failSub;
    if (typeof onError === 'function') {
      failSub = this._errorStream.subscribe(onError);
    }

    const manifest = {
      complete: () => {
        if (failSub) {
          failSub.unsubscribe();
          if (typeof onComplete === 'function') {
            onComplete();
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

  pipe(...args) {
    return this._valueSubject.pipe(...args);
  }
}
