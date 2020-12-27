/* eslint-disable camelcase */
import produce from 'immer';

const tap = require('tap');
const p = require('../package.json');

const { ValueMapStream, ABSENT } = require('../lib');

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
    /*

    testVS.test('filter', (testVSFilter) => {
      const abs = (n, context) => {
        //   console.log('abs: ', n, context);
        if (typeof n !== 'number') throw new Error(`${n} must be a number`);
        return Math.abs(n);
      };

      testVSFilter.test('update value', (updateValue) => {
        const filtered = new ValueStream(3).filter(abs);

        filtered.next(4);
        updateValue.same(filtered.value, 4);

        filtered.next(-8);
        updateValue.same(filtered.value, 8);

        filtered.next(2);
        updateValue.same(filtered.value, 2);
        updateValue.end();
      });

      testVSFilter.test('throw', (filterThrow) => {
        const filtered = new ValueStream(3).filter(abs);

        filtered.next(4);
        filterThrow.same(filtered.value, 4);

        filtered.next(-8);
        filterThrow.same(filtered.value, 8);

        filtered.next('6');
        filterThrow.same(filtered.value, 8);

        filterThrow.end();
      });

      testVSFilter.test('subscribe', (subTest) => {
        const filtered = new ValueStream(3).filter(abs);
        const history = [];
        const errors = [];

        filtered.subscribe(history.push.bind(history), ({ message }) => errors.push(message));

        subTest.same(history, [3]);
        subTest.same(errors, []);

        filtered.next(4);
        subTest.same(history, [3, 4]);
        subTest.same(errors, []);

        filtered.next(-8);
        subTest.same(history, [3, 4, 8]);
        subTest.same(errors, []);

        filtered.next('6');
        subTest.same(history, [3, 4, 8]);
        subTest.same(errors, ['6 must be a number']);

        subTest.end();
      });

      testVSFilter.end();
    });
*/

    testVS.end();
  });

  suite.end();
});
