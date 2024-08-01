# gc-hook

[![build status](https://github.com/WebReflection/gc-hook/actions/workflows/node.js.yml/badge.svg)](https://github.com/WebReflection/gc-hook/actions) [![Coverage Status](https://coveralls.io/repos/github/WebReflection/gc-hook/badge.svg?branch=main)](https://coveralls.io/github/WebReflection/gc-hook?branch=main)

<sup>**Social Media Photo by [Steve Johnson](https://unsplash.com/@steve_j) on [Unsplash](https://unsplash.com/)**</sup>

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

## Use Cases

<details>
  <summary><strong>Internal Objects</strong></summary>
  <div markdown=1>

In case you'd like to be notified when an object not meant to leak has been collected,
you can use the `create` function in its most simple way:

```js
import { create } from 'gc-hook';

const privateObject = {};
const onGC = privateObject => {
  console.log(privateObject, 'not used anymore');
};

export create(privateObject, onGC);
```

  </div>
</details>

<details>
  <summary><strong>FFI Objects</strong></summary>
  <div markdown=1>

If you are handling *FFI* related references, you can hold on internal values and yet return whatever artifact you like in the wild.

```js
import { create } from 'gc-hook';

export const createWrap = reference => {

  const onGC = reference => {
    ffi.gc.decreaseRefCounting(reference);
  };

  const wrap = function (...args) {
    return ffi.apply(reference, args);
  };

  wrap.destroy = onGC;

  // will return the wrap as it is without holding
  // the reference in the wild
  return create(reference, onGC, { return: wrap });
};
```

This use case was designed after *pyodide* Proxy and GC dance around passed references to the *JS* world.

  </div>
</details>

<details>
  <summary><strong>Primitives</strong></summary>
  <div markdown=1>

In case you need to relate a specific object to a unique id (*[coincident](https://github.com/WebReflection/coincident)* use case) and you don't need to ever unregister the held reference / id internally:

```js
import { create } from 'gc-hook';

const onGC = id => {
  console.log(id.valueOf(), 'not needed anymore');
};

// id can be any primitive in here and ref must be used as return
export const relate = (id, ref) => {
  return create(
    typeof id === 'string' ? new String(id) : new Number(id),
    onGC,
    { token: false, return: ref }
  );
};
```

  </div>
</details>

<details>
  <summary><strong>Primitives + Drop</strong></summary>
  <div markdown=1>

In case you need to relate a specific object to a unique id but you still would like to drop the reference from the *FinalizationRegistry* later on:

```js
import { create, drop } from 'gc-hook';

const onGC = ({ id, time }) => {
  console.log(id, 'created at', time, 'not needed anymore');
};

// id can be any primitive in here
export const relate = (id, wrap) => {
  const token = { id, time: Date.now() };
  const hold = typeof id === 'string' ? new String(id) : new Number(id);
  return {
    value: create(hold, onGC, { token, return: wrap }),
    drop: () => drop(token)
  };
};
```

  </div>
</details>

<details>
  <summary><strong>Complex held values</strong></summary>
  <div markdown=1>

One does not need to pass to the *GC* callback just a specific kind of value so that it's possible to combine various operations at once:

```js
import { create, drop } from 'gc-hook';

export const createComplexHeld = ref => {
  const onGC = ({ ref, destroy, time }) => {
    destroy();
    console.log(ref, 'created at', time, 'not needed');
  };

  const wrap = function (...args) {
    return ffi.apply(ref, args);
  };

  wrap.destroy = () => {
    drop(held);
    ffi.gc.decreaseRefCounting(ref);
  };

  const held = {
    ref,
    destroy: wrap.destroy,
    time: Date.now(),
  };

  return create(held, onGC, { return: wrap });
}:
```

The only and most important thing is to never return something part of the `held` logic otherwise that returned value cannot possibly ever be Garbage Collected.

  </div>
</details>

### gc-hook/track

If you'd like to track one or more reference you can use `gc-hook/track` helper.

All it does is to notify in console, via `console.debug`, that such reference has eventually be collected.

```js
// or use https://esm.run/gc-hook/track live
import BUG_GC from 'gc-hook/track';

// HINT: use a constant so that rollup or bundlers
// can eventually remove all the dead code in production
const D = true;

// create any reference
let test = { any: 'value' };

// when debugging, pass an object literal to simplify
// naming -> references convention
D&&BUG_GC({ test });

setTimeout(() => { test = null; });
// now press the Collect Garbage button in devtools
// and see the lovely message: **test** collected
```

## API

```js
// returns a ProxyHandler<hold> or whatever
// the `return` option wants to return.
// The returned reference is the one that
// notifies the GC handler once destroyed
// or not referenced anymore in the consumer code.
create(
  // the reference or primitive to keep in memory
  // until the returned value is used. It can be
  // a primitive, but it requires `token = false`,
  // or any reference to hold in memory.
  hold,
  // a callback that will receive the held value
  // whenever its Proxy or wrapper is not referenced
  // anymore in the program using it.
  onGarbageCollected,
  // optional properties:
  {
    // if passed along, it will be used automatically
    // to create the ProxyHandler<hold>.
    handler = Object.create(null),
    // override the otherwise automatically created Proxy
    // for the `held` reference.
    return = new Proxy(hold, handler),
    // allow dropping from the registry via something
    // different from the returned value itself.
    // If this is explicitly `false`, no token is used
    // to register the retained value.
    token = hold,
    // if explicitly set as `true` it will `console.debug`
    // the fact the held value is not retained anymore out there.
    debug = false,
  } = {}
);

// Returns `true` if the `token` successfully
// unregistered the proxy reference from the registry.
drop(
  // it's either the held value waiting to be passed
  // to the GC callback, or the explicit `token` passed
  // while creating the reference around it.
  token
);
```
