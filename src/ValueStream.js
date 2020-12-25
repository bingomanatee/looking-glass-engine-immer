import { BehaviorSubject, Subject } from 'rxjs';
import { createDraft, produce, current } from 'immer';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';
import Event, { EventFilter } from './Event';
import {
  E_COMMIT, E_FILTER, E_INITIAL, E_VALIDATE, A_NEXT, E_COMPLETE, A_ANY,
  defaultEventTree,
} from './constants';

const nextCommit = new EventFilter({
  name: A_NEXT, stage: E_COMMIT,
});

export default class ValueStream {
  constructor(value, options = {}) {
    this._valueSubject = new BehaviorSubject(createDraft([value]));
    this._eventTree = new Map(defaultEventTree);
    this._eventStream = new Subject();
    this._errorStream = new Subject();
    // eslint-disable-next-line no-shadow
    const { filter, name } = options;
    if (typeof filter === 'function') {
      this.filter = filter;
    }
    this.name = name;

    this._watchEvents();
  }

  _watchEvents() {
    this._eventStream
      .pipe(filter((event) => event && !event.isError && nextCommit.matches(event)))
      .subscribe((event) => {
        if (event.isComplete && (!event.isError)) {
          this._updateValue(event.value);
        }
      });
  }

  _updateValue(value) {
    this._valueSubject.next(produce(this._valueSubject.value, (list) => {
      // eslint-disable-next-line no-param-reassign
      list[0] = value;
    }));
  }

  _onEventError(error, originalValue, currentValue, currentStage) {
    this._errorStream.next({
      error,
      originalValue,
      currentValue,
      currentStage,
    });
  }

  _stream(value, currentStage) {
    console.log('-streaming:', value, currentStage);
    const stages = this._eventTree.get(A_NEXT);
    const stage = currentStage || stages[0];
    const nextStage = stages[stages.indexOf(stage) + 1];
    const event = new BehaviorSubject(value);
    event.stage = stage;
    event.subscribe((value) => {
      console.log('value changed to ', value);
    },
    (error) => {
      this._onEventError(error, value, event.getValue(), stage);
    },
    () => {
      if (nextStage) {
        this._stream(event.getValue(), nextStage);
      } else {
        this._updateValue(event.getValue());
      }
    });
    this._eventStream.next(event);
    if (!event.hasError) {
      if (!event.closed) {
        event.complete();
      }
    }
  }

  next(value) {
    const list = produce(this._valueSubject.value, (list) => {
      list[0] = value;
    });
    this._stream(value);
  }

  get value() {
    return this._valueSubject.value[0];
  }

  getValue() {
    return this._valueSubject.value[0];
  }
}
