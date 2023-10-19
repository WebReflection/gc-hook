export function create<H, R>(hold: H, onGarbageCollected: (held: H) => void, { return: R, token }?: {
    return?: R;
    token?: H;
}): R | ProxyHandler<H>;
export function drop(token: unknown): boolean;
