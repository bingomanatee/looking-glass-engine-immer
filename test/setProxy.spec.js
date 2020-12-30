/* eslint-disable camelcase */
import produce from 'immer';

const tap = require('tap');
const p = require('./../package.json');

const { setProxy } = require('./../lib/index');

tap.test(p.name, (suite) => {
  suite.test('setProxy', (spTest) => {
    const history = [];
    const onChange = history.push.bind(history);

    const s = setProxy(onChange);

    spTest.same(s.size, 0);
    s.add(100);
    spTest.same(s.size, 1);

    spTest.end();
  });


  suite.end();
});
