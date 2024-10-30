import { describe, it } from "jsr:@std/testing/bdd";
import { expect } from "jsr:@std/expect";
import { fromString, toString, validate } from './b58.ts';

describe('string-utils/base/b58', () => {
    it('should encode and decode', () => {
        const bytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"

        // Test encoding and decoding
        expect(toString(bytes)).toBe("9Ajdvzr");
        expect(fromString("9Ajdvzr")).toEqual(bytes);
        expect(toString(fromString('JxF12TrwUP45BMd'))).toBe('JxF12TrwUP45BMd');
    });

    it('should correctly validate a string representing b58', () => {
        // Test base58 validation
        expect(validate('9Ajdvzr')).toBe(true);
        expect(validate('Hello')).toBe(false);
    });
});