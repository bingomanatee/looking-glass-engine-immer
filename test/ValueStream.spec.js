/* eslint-disable camelcase */
import produce from 'immer';

const tap = require('tap');
const p = require('./../package.json');

const { ValueStream, ABSENT } = require('./../lib/index');

tap.test(p.name, (suite) => {
  suite.test('ValueStresm', (testVS) => {
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

    testVS.test('next', (testVSnext) => {
      const basic = new ValueStream(3);

      basic.next(4);
      testVSnext.same(basic.value, 4);


      testVSnext.end();
    });
    testVS.end();
  });

  suite.end();
});
