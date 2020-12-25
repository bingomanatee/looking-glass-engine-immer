import { createDraft } from 'immer';

export const E_INITIAL = 'E_INITIAL';

export const E_FILTER = 'E_FILTER';

export const E_VALIDATE = 'E_VALIDATE';

export const E_COMMIT = 'E_COMMIT';

export const E_COMPLETE = 'E_COMPLETE';

export const A_NEXT = 'next';
export const A_ANY = 'A_ANY';

export const defaultEventTree = new Map([
  [A_NEXT, [E_INITIAL, E_FILTER, E_VALIDATE, E_COMMIT, E_COMPLETE]],
  [A_ANY, [E_INITIAL, E_COMMIT, E_COMPLETE]],
]);

export const ABSENT =  Symbol('ABSENT')
