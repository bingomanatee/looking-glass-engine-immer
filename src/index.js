import { enableMapSet } from 'immer';
import ValueStream from './ValueStream';
import ValueMapStream from './ValueMapStream';
import Event from './Event';
import setProxy from './setProxy';
import * as constants from './constants';
import addTrans from './addTrans';

enableMapSet();

export default {
  ...constants,
  Event,
  ValueStream,
  ValueMapStream,
  setProxy,
  addTrans,
};
