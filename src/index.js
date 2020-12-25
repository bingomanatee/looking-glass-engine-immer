import { enableMapSet } from 'immer';
import ValueStream from './ValueStream';
import Event from './Event';

import * as constants from './constants';

enableMapSet();

export default {
  ...constants,
  Event,
  ValueStream,
};
