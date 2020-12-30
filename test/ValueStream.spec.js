/* eslint-disable camelcase */
import {
  produce, createDraft, enableMapSet, current,
} from 'immer';

enableMapSet();
const tap = require('tap');
const p = require('./../package.json');

const { ValueStream, ABSENT } = require('./../lib/index');

tap.test(p.name, (suite) => {
  suite.test('ValueStream', (testVS) => {
    testVS.test('constructor', (testVSc) => {
      testVSc.test('basic', (basicTest) => {
        const basic = new ValueStream(3);

        basicTest.same(basic.value, 3);
        basicTest.end();
      });
      testVSc.test('named', (namedTest) => {
        const named = new ValueStream(3, { name: 'Bob' });

        namedTest.same(named.value, 3);
        namedTest.same(named.name, 'Bob');
        namedTest.end();
      });

      testVSc.end();
    });

    testVS.test('next', (testVSNext) => {
      const basic = new ValueStream(3);

      basic.next(4);
      testVSNext.same(basic.value, 4);

      basic.next(8);
      testVSNext.same(basic.value, 8);

      testVSNext.end();
    });

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

    testVS.test('finalize', (testVSfin) => {
      const basic = new ValueStream(produce([], () => {}), {
        finalize: (event, target) => {
          event.next(produce(target.value, (list) => {
            if (Array.isArray(event.value)) {
              return event.value;
            }
            list.push(event.value);
          }));
        },
      });

      testVSfin.same((basic.value), []);
      basic.next(1);

      testVSfin.same((basic.value), [1]);
      let immutableError;
      try {
        basic.value.push(2);
      } catch (err) {
        immutableError = err;
      }
      testVSfin.same(immutableError.message, 'Cannot add property 1, object is not extensible');

      basic.next([2, 3, 4]);
      testVSfin.same(basic.value, [2, 3, 4]);
      let immutableError2;
      try {
        basic.value.push(2);
      } catch (err) {
        immutableError2 = err;
      }
      testVSfin.same(immutableError2.message, 'Cannot add property 3, object is not extensible');

      testVSfin.end();
    });

    testVS.end();
  });

  suite.end();
});
