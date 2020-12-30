/* eslint-disable camelcase */
import { produce } from 'immer';
import { BehaviorSubject, Subject } from 'rxjs';
import { tap as tapFilter } from 'rxjs/operators';

const tap = require('tap');
const p = require('../package.json');

const { ValueMapStream, ValueStream } = require('../lib');

const initial = Object.freeze(
  new Map([
    ['a', 1],
    ['b', ['alpha', 'beta', 'gamma']],
  ]),
);


tap.test(p.name, (suite) => {
  suite.test('ValueMapStream', (testVS) => {
    testVS.test('constructor', (testVSc) => {
      testVSc.test('basic', (basicTest) => {
        const basic = new ValueMapStream(new Map(initial));

        basicTest.same(basic.value, initial);
        basicTest.end();
      });

      testVSc.end();
    });

    testVS.test('next', (testVSNext) => {
      const basic = new ValueMapStream(new Map(initial));
      basic.next(new Map([['a', 2], ['c', 3]]));

      testVSNext.same(basic.value, new Map([
        ['a', 2],
        ['b', ['alpha', 'beta', 'gamma']],
        ['c', 3],
      ]));

      testVSNext.end();
    });

    testVS.test('set', (testVSNext) => {
      const basic = new ValueMapStream(new Map(initial));
      basic.set('a', 100);

      testVSNext.same(basic.value, new Map([
        ['a', 100],
        ['b', ['alpha', 'beta', 'gamma']],
      ]));

      basic.set('z', 200);

      testVSNext.same(basic.value, new Map([
        ['a', 100],
        ['b', ['alpha', 'beta', 'gamma']],
        ['z', 200],
      ]));

      testVSNext.end();
    });

    testVS.test('onField', (afsTest) => {
      const coord = new ValueMapStream({
        x: 0,
        y: 0,
      });

      const throwIfNotNumber = (field) => (event) => {
        if (!(typeof event.value.get(field) === 'number')) {
          event.error(new Error(`${field} must be a number`), event);
        }
      };

      coord.onField(throwIfNotNumber('x'), 'x');
      coord.onField(throwIfNotNumber('y'), 'y');

      const errors = [];
      const history = [];

      coord.subscribe({
        next: history.push.bind(history),
        error: (e) => {
          errors.push(e.message);
        },
      });

      const e1 = new Map([
        ['x', 0],
        ['y', 0],
      ]);
      const e2 = new Map([
        ['x', 2],
        ['y', 0],
      ]);
      const e2y1 = new Map([
        ['x', 2],
        ['y', 1],
      ]);
      const e3 = new Map([
        ['x', 4],
        ['y', 1],
      ]);
      const e4 = new Map([
        ['x', 4],
        ['y', 3],
      ]);
      const e4x6 = new Map([
        ['x', 6],
        ['y', 3],
      ]);

      afsTest.same(e1, coord.value);
      afsTest.same([], errors);
      afsTest.same(history, [e1]);

      coord.set('x', 2);

      afsTest.same(e2, coord.value);
      afsTest.same([], errors);
      afsTest.same(history, [e1, e2]);

      coord.set('x', 'three');
      afsTest.same(history, [e1, e2]);
      afsTest.same(errors, [
        'x must be a number',
      ]);

      coord.set('y', 1);
      afsTest.same(errors, [
        'x must be a number',
      ]);
      afsTest.same(history, [e1, e2, e2y1]);

      coord.set('x', 4);
      afsTest.same(errors, [
        'x must be a number',
      ]);
      afsTest.same(history, [e1, e2, e2y1, e3]);

      coord.set('x', 'five');
      afsTest.same(errors, [
        'x must be a number',
        'x must be a number',
      ]);
      afsTest.same(history, [e1, e2, e2y1, e3]);

      coord.set('y', 'two');
      afsTest.same(errors, [
        'x must be a number',
        'x must be a number',
        'y must be a number',
      ]);
      afsTest.same(history, [e1, e2, e2y1, e3]);


      coord.set('y', 3);
      coord.set('x', 6);
      afsTest.same(errors, [
        'x must be a number',
        'x must be a number',
        'y must be a number',
      ]);
      afsTest.same(history, [e1, e2, e2y1, e3, e4, e4x6]);

      afsTest.end();
    });

    testVS.end();
  });

  suite.end();
});
