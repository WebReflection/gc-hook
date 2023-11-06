// (c) Andrea Giammarchi - ISC

const registry = new FinalizationRegistry(
  ([onGarbageCollected, held, debug]) => {
    if (debug) console.debug(`Held value ${String(held)} not relevant anymore`);
    onGarbageCollected(held);
  }
);

const handler = Object.create(null);

/**
 * Register a generic reference to hold in memory, returning either an explicit replacement for it, if specified as optional extra option, or just a `ProxyHandler<hold>` to allow the GC to collect such proxy later on.
 * @template {object} H
 * @template R
 * @param {H} hold the reference to retain in memory until the returned value is not collected.
 * @param {(held:H) => void} onGarbageCollected the callback to invoke once the returned value is collected.
 * @param {{debug?: true, return?:R, token?:H | false}} [options] optionally override the returned value or the token to unregister. If `debug` is true it will log once FinalizationRegistry kicked in.
 * @returns {R | ProxyHandler<typeof hold>} a transparent proxy for the held reference or whatever override was passed as `return` field of the options.
 */
export const create = (
  hold,
  onGarbageCollected,
  { debug, return: R, token = hold } = handler
) => {
  // if no reference to return is defined,
  // create a proxy for the held one and register that instead.
  const target = R || new Proxy(hold, handler);
  const args = [target, [onGarbageCollected, hold, !!debug]];
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
export const drop = token => registry.unregister(token);

// TODO: this is probably overkill / unnecessary
// const registered = new WeakMap;
// if (registered.has(keep))
//   unregister(registered.get(keep));
// registered.set(keep, token || keep);
