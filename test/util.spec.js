/* eslint-disable camelcase */
import produce from 'immer';

const tap = require('tap');
const p = require('./../package.json');

const { Å, eqÅ } = require('./../lib/index');

tap.test(p.name, (suite) => {
  suite.test('utils', (utils) => {
    utils.ok(eqÅ(1, 1));
    utils.ok(eqÅ(1, Å));
    utils.notOk(eqÅ(1, 2));
    utils.end();
  });
  suite.end();
});

// eslint-disable-next-line import/prefer-default-export
export function e(msg, meta) {
  if (msg instanceof Error) {
    return Object.assign(msg, { meta });
  }
  return Object.assign(new Error(e), { meta });
}
