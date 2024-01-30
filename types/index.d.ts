export function create<H extends unknown>(hold: H, onGarbageCollected: (held: H) => void, { debug, handler, return: r, token }?: GCHookOptions<H>): H;
export function drop(token: unknown): boolean;
export type GCHookOptions<H extends unknown> = {
    /**
     * if `true`, logs values once these can get collected.
     */
    debug?: boolean;
    /**
     * optional proxy handler to use instead of the default one.
     */
    handler?: ProxyHandler<object>;
    /**
     * if specified, overrides the returned proxy with its value.
     */
    return?: H;
    /**
     * it's the held value by default, but it can be any other token except the returned value itself.
     */
    token?: unknown;
};
