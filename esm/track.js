import { create } from './index.js';

const { entries } = Object;

const debug = true;
const token = false;

const known = new WeakSet;

export default literal => {
  for (const [key, value] of entries(literal)) {
    if (!known.has(value)) {
      known.add(value);
      create(key, String, { debug, token, return: value });
    }
  }
};
