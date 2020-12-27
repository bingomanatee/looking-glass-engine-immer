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

import setProxy, { SET_AFTER, SET_BEFORE } from './setProxy';

export default (baseClass) => {
  class NextClass extends baseClass {
    constructor(...args) {
      super(...args);
      this._trans = setProxy(this.onTransChange.bind(this));
      this._transCount = new BehaviorSubject(0);
    }

    onTransChange(key, args, when) {
      if (when === SET_AFTER && (this._transCount.value !== this.setProxy.size)) {
        this._transCount.next(this.setProxy.size);
      }
    }

    addTrans(stream) {
      const complete = () => void (this._trans.delete(stream));
      this._trans.add(stream);
      stream.subscribe({ complete, error: complete });
    }

    get _transStream() {
      if (!this._$transStream) {
        this._$transStream = combineLatest(
          this._valueStream,
          this._transCount,
        )
          .pipe(
            filter(([v, count]) => count === 0),
            map(([v]) => v),
          );
      }
      return this._$transStream;
    }

    suscribe() {
      return this._transStream.subscribe();
    }
  }
  return NextClass;
};
