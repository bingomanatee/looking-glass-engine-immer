/* eslint-disable camelcase */
import produce from 'immer';

const tap = require('tap');
const p = require('./../package.json');

const { ValueStream, ValueMapStream, addActions } = require('./../lib/index');

tap.test(p.name, (suite) => {
  suite.test('addActions', (testA) => {
    testA.test('simple actions', (sim) => {
      const stream = addActions(
        new ValueStream({ x: 0, y: 0 }),
        {
          offset(s, dX, dY) {
            const next = { ...s.value };
            next.x += dX;
            next.y += dY;
            s.next(next);
          },
          magnitude({ value: { x, y } }) {
            return Math.round(Math.sqrt(x ** 2 + y ** 2));
          },
        },
      );

      sim.same(stream.value, { x: 0, y: 0 });
      sim.same(stream.do.magnitude(), 0);
      stream.do.offset(2, 5);
      sim.same(stream.value, { x: 2, y: 5 });
      sim.same(stream.do.magnitude(), 5);
      stream.do.offset(2, 7);
      sim.same(stream.value, { x: 4, y: 12 });
      sim.same(stream.do.magnitude(), 13);
      sim.end();
    });

    testA.test('map setters', (msTest) => {
      const coord = addActions(new ValueMapStream({
        x: 0,
        y: 0,
      }));

      coord.do.setX(3);

      msTest.same(coord.value, new Map([['x', 3], ['y', 0]]));

      coord.do.setY(4);

      msTest.same(coord.value, new Map([
        ['x', 3],
        ['y', 4],
      ]));

      msTest.end();
    });

    testA.end();
  });

  suite.end();
});
