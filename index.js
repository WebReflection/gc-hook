// (c) Andrea Giammarchi - ISC

const registry = new FinalizationRegistry(
  ([onGarbageCollected, held]) => onGarbageCollected(held)
);

const handler = Object.create(null);

/**
 * Register a generic reference to hold in memory, returning either an explicit replacement for it, if specified as optional extra option, or just a `ProxyHandler<hold>` to allow the GC to collect such proxy later on.
 * @template H,R
 * @param {H} hold the reference to retain in memory until the returned value is not collected.
 * @param {(held:H) => void} onGarbageCollected the callback to invoke once the returned value is collected.
 * @param {{return?:R, token?:H | false}} [options] optionally override the returned value or the token to unregister.
 * @returns {R | ProxyHandler<H>} a transparent proxy for the held reference or whatever override was passed as `return` field of the options.
 */
const create = (
  hold,
  onGarbageCollected,
  { return: R, token = hold } = handler
) => {
  // if no reference to return is defined,
  // create a proxy for the held one and register that instead.
  const target = R || new Proxy(hold, handler);
  const args = [target, [onGarbageCollected, hold]];
  if (token !== false) args.push(token);
  // register the target reference in a way that
  // the `onGarbageCollected(held)` callback will eventually notify.
  registry.register(...args);
  return target;
};

/**
 * If previously registered as either `token` or `hold` value, allow explicit removal of the entry in the registry.
 * @param {unknown} token the token used during registration. If no `token` was passed, this can be the same `hold` reference.
 * @returns {boolean} `true` if successfully unregistered.
 */
const drop = token => registry.unregister(token);

// TODO: this is probably overkill / unnecessary
// const registered = new WeakMap;
// if (registered.has(keep))
//   unregister(registered.get(keep));
// registered.set(keep, token || keep);

export { create, drop };
