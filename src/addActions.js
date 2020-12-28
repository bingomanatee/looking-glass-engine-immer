import { BehaviorSubject, from, Subject } from 'rxjs';
import isEqual from 'lodash/isEqual';
import {
  combineLatest, distinctUntilChanged, filter, map,
} from 'rxjs/operators';
import lGet from 'lodash/get';
import Event, { EventFilter } from './Event';
import {
  E_COMMIT, E_FILTER, E_INITIAL, E_VALIDATE, A_NEXT, E_COMPLETE, A_ANY, A_ACTION,
  defaultEventTree, eqÅ, Å, e,
} from './constants';

import setProxy, { SET_AFTER, SET_BEFORE } from './setProxy';

export default (baseClass) => {
  class NextClass extends baseClass {
    constructor(...args) {
      const [value, options] = args;
      super(...args);
      this._trans = setProxy(this.onTransChange.bind(this));
      this._actions = new Map();
      const newActions = lGet(options, 'actions');
      if (newActions) {
        this.addAdtions(newActions);
      }
    }

    get do() {
      if (!(typeof Proxy === 'undefined')) {
        return this._doMap();
      }
      return new Proxy(this, {
        get(target, key) {
          if (target._actions.has(key)) {
            return (...args) => {
              target._actions.get(key)(target, ...args);
            };
          }
          return (...args) => {
            target.send(A_ACTION, {
              name: key,
              value: args,
            });
          };
        },
      });
    }
  }
  return NextClass;
};
