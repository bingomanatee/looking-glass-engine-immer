/* eslint-disable camelcase */
import produce from 'immer';

const tap = require('tap');
const p = require('./../package.json');

const { ValueStream, addActions } = require('./../lib/index');

tap.test(p.name, (suite) => {
  suite.test('addActions', (testA) => {
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

    testA.same(stream.value, { x: 0, y: 0 });
    testA.same(stream.do.magnitude(), 0);
    stream.do.offset(2, 5);
    testA.same(stream.value, { x: 2, y: 5 });
    testA.same(stream.do.magnitude(), 5);
    stream.do.offset(2, 7);
    testA.same(stream.value, { x: 4, y: 12 });
    testA.same(stream.do.magnitude(), 13);

    testA.end();
  });

  suite.end();
});
