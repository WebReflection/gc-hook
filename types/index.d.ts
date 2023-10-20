export function create<H, R>(hold: H, onGarbageCollected: (held: H) => void, { debug, return: R, token }?: {
    debug?: true;
    return?: R;
    token?: false | H;
}): R | ProxyHandler<H>;
export function drop(token: unknown): boolean;
