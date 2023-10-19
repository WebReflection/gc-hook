# gc-hook

[![build status](https://github.com/WebReflection/gc-hook/actions/workflows/node.js.yml/badge.svg)](https://github.com/WebReflection/gc-hook/actions) [![Coverage Status](https://coveralls.io/repos/github/WebReflection/gc-hook/badge.svg?branch=main)](https://coveralls.io/github/WebReflection/gc-hook?branch=main)

A simplified [FinalizationRegistry](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/FinalizationRegistry) utility that works:

  * it does the right thing by never leaking the reference meant to be notified
  * it allows overriding the returned proxy with any other more complex wrapper or indirection
  * it allows references owners to *drop* from the registry explicitly, either via the *held* reference or an explicit token, if passed as extra option
  * it avoids understanding how the FinalizationRegistry works, helping you to focus on more complex issues instead of re-implementing the same dance over and over

### Example

```js
// available as commonjs too
import { create, drop } from 'gc-hook';

// keep a count of all passed references created here
let references = 0;

// notify how many references are still around
const onGarbageCollected = myUtility => {
  console.log(--references, 'references still used');
};

export default options => {
  const myUtility = { ...options, do: 'something' };
  console.log(++references, 'references provided');
  // return a proxy to avoid holding directly myUtility
  // while keeping the utility in memory until such proxy
  // is not needed, used, or referenced anymore
  return create(myUtility, onGarbageCollected);
};

// as module consumer
import createUtility from './module.js';

let util = createUtility({some: 'thing'});
// do something  amazing with the util ... then
setTimeout(() => {
  // clear the utility or don't reference it anymore anywhere
  util = null;
  // once the GC kicks in, the module.js will log how many
  // utilities are still around and never collected
});
```
