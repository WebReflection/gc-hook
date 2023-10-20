export function create<H, R>(hold: H, onGarbageCollected: (held: H) => void, { return: R, token }?: {
    return?: R;
    token?: false | H;
}): R | ProxyHandler<H>;
export function drop(token: unknown): boolean;
