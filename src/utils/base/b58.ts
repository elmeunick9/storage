// Adapted from: https://github.com/pur3miish/base58-js

const BASE58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"

export function fromString(base58String: string): Uint8Array {
    if (!base58String || typeof base58String !== "string") throw new Error(`Expected base58 string but got "${base58String}"`)
    if (base58String.match(/[IOl0]/gmu)) throw new Error(`Invalid base58 character "${base58String.match(/[IOl0]/gmu)}"`)
    const lz = base58String.match(/^1+/gmu)
    const psz = lz ? lz[0].length : 0
    const size = ((base58String.length - psz) * (Math.log(58) / Math.log(256)) + 1) >>> 0

    return new Uint8Array([
        ...new Uint8Array(psz),
        ...(base58String
            .match(/.{1}/gmu) ?? [])
            .map((i) => BASE58.indexOf(i))
            .reduce((acc, i) => {
                acc = acc.map((j) => {
                    const x = j * 58 + i;
                    i = x >> 8;
                    return x;
                });
                return acc;
            }, new Uint8Array(size))
            .reverse()
            .filter(
                (
                    (lastValue) => (value) =>
                        // @ts-ignore
                        (lastValue = lastValue || value)
                )(false)
            ),
    ]);
}

const create_base58_map = () => {
    const base58M = Array(256).fill(-1);
    for (let i = 0; i < BASE58.length; ++i)
        base58M[BASE58.charCodeAt(i)] = i;

    return base58M;
}

const base58Map = create_base58_map()

export function toString(uint8array: Uint8Array): string {
    const result = [];

    for (const byte of uint8array) {
        let carry = byte;
        for (let j = 0; j < result.length; ++j) {
            // @ts-ignore
            const x = (base58Map[result[j]] << 8) + carry;
            result[j] = BASE58.charCodeAt(x % 58);
            carry = (x / 58) | 0;
        }
        while (carry) {
            result.push(BASE58.charCodeAt(carry % 58));
            carry = (carry / 58) | 0;
        }
    }

    for (const byte of uint8array)
        if (byte) break;
        else result.push("1".charCodeAt(0));

    result.reverse();

    return String.fromCharCode(...result);
}

export function validate(base58String: string): boolean {
    if (!base58String || typeof base58String !== "string") return false
    if (base58String.match(/^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/g)) return true
    return false
}