import { enableMapSet } from 'immer';
import ValueStream from './ValueStream';
import ValueMapStream from './ValueMapStream';
import Event from './Event';
import setProxy from './setProxy';
import * as constants from './constants';
import addTrans from './addTrans';
import addActions from './addActions';

enableMapSet();

export default {
  ...constants,
  addActions,
  Event,
  ValueStream,
  ValueMapStream,
  setProxy,
  addTrans,
};
