export function create<H extends unknown, R>(hold: H, onGarbageCollected: (held: H) => void, { debug, return: R, token }?: {
    debug?: true;
    return?: R;
    token?: false | H;
}): R | ProxyHandler<any>;
export function drop(token: unknown): boolean;
