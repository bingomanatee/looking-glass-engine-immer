/* eslint-disable camelcase */
import produce from 'immer';

const tap = require('tap');
const p = require('../package.json');

const { Event, ABSENT } = require('../lib');

tap.test(p.name, (suite) => {
  suite.test('Event', (testEvent) => {
    testEvent.test('advance - immer', (testEC) => {
      let e = new Event('update', 1, ['a', 'b', 'c']);
      testEC.notOk(e.isComplete);
      testEC.equal(e.stage, 'a');

      e = produce(e, (ee) => void ee.advance());
      testEC.notOk(e.isComplete);
      testEC.equal(e.stage, 'b');

      e = produce(e, (ee) => void ee.advance());
      testEC.ok(e.isComplete);
      testEC.ok(e.stage, 'c');

      e = produce(e, (ee) => void ee.advance());
      testEC.ok(e.isComplete);
      testEC.equal(e.stage, 'c');

      testEC.end();
    });

    testEvent.test('advance - direct', (testEC) => {
      let e = new Event('update', 1, ['a', 'b', 'c']);

      testEC.notOk(e.isComplete);
      testEC.equal(e.stage, 'a');

      e = e.advance();
      testEC.notOk(e.isComplete);
      testEC.equal(e.stage, 'b');

      e = e.advance();
      testEC.ok(e.isComplete);
      testEC.ok(e.stage, 'c');

      e = e.advance();
      testEC.ok(e.isComplete);
      testEC.equal(e.stage, 'c');

      testEC.end();
    });

    testEvent.test('matching', (eMatch) => {
      const eventA = new Event('update', 3, 'a,b,c'.split(','));
      const eventB = new Event('update', 6, 'b', 'a,b,c'.split(','));
      const eventI = new Event('increment', 10, 'a,b,c'.split(','));
      eMatch.test('name only', (eMatchNO) => {
        const filter = new Event.EventFilter({
          name: (name) => name === 'update',
        });

        eMatchNO.ok(filter.matches(eventA));
        eMatchNO.ok(filter.matches(eventB));
        eMatchNO.notOk(filter.matches(eventI));

        const filterByExample = new Event.EventFilter({
          name: 'update',
        });

        eMatchNO.ok(filterByExample.matches(eventA));
        eMatchNO.ok(filterByExample.matches(eventB));
        eMatchNO.notOk(filterByExample.matches(eventI));

        eMatchNO.end();
      });

      eMatch.test('value only', (eMatchVO) => {
        const filter = new Event.EventFilter({
          value: (value) => (typeof value === 'number') && (!(value % 3)),
        });

        eMatchVO.ok(filter.matches(eventA));
        eMatchVO.ok(filter.matches(eventB));
        eMatchVO.notOk(filter.matches(eventI));


        const filterByExample = new Event.EventFilter({
          value: 6,
        });

        eMatchVO.notOk(filterByExample.matches(eventA));
        eMatchVO.ok(filterByExample.matches(eventB));
        eMatchVO.notOk(filterByExample.matches(eventI));

        eMatchVO.end();
      });

      eMatch.test('stage only', (eMatchSO) => {
        const filter = new Event.EventFilter({
          stage: (stage) => stage === 'a',
        });

        eMatchSO.ok(filter.matches(eventA));
        eMatchSO.notOk(filter.matches(eventB));
        eMatchSO.ok(filter.matches(eventI));

        const filterByExample = new Event.EventFilter({
          stage: 'a',
        });

        eMatchSO.ok(filterByExample.matches(eventA));
        eMatchSO.notOk(filterByExample.matches(eventB));
        eMatchSO.ok(filterByExample.matches(eventI));
        eMatchSO.end();
      });

      eMatch.test('full filter', (eMatchFF) => {
        const filter = new Event.EventFilter({
          stage: (stage) => stage === 'a',
          name: (name) => name === 'update',
          value: (value) => (typeof value === 'number') && (!(value % 3)),
        });

        eMatchFF.ok(filter.matches(eventA));
        eMatchFF.notOk(filter.matches(eventB));
        eMatchFF.notOk(filter.matches(eventI));

        const filterByExample = new Event.EventFilter({
          stage: 'a',
          name: 'update',
          value: 3,
        });

        eMatchFF.ok(filterByExample.matches(eventA));
        eMatchFF.notOk(filterByExample.matches(eventB));
        eMatchFF.notOk(filterByExample.matches(eventI));
        eMatchFF.end();
      });
      eMatch.end();
    });

    testEvent.test('broadcast errors', (eErr) => {
      const eventAE = new Event('update', 3, 'a,b,c'.split(','));

      const errorAE = eventAE.error('life is hard');

      eErr.ok(errorAE.isComplete);
      eErr.ok(errorAE.hasErrors);
      eErr.same(eventAE.errors.map(({ message }) => message), ['life is hard']);

      eErr.end();
    });

    testEvent.end();
  });

  suite.end();
});
