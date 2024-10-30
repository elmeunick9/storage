export const fromString = (hexString: string): Uint8Array =>
    Uint8Array.from((hexString.match(/.{1,2}/g) ?? []).map((byte) => parseInt(byte, 16)))
  
export const toString = (bytes: Uint8Array): string =>
    bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '')

export const validate = (hexString: string): boolean => {
    if (!hexString || typeof hexString !== 'string') return false
    if (hexString.match(/^[0-9a-f]+$/)) return true
    if (hexString.match(/^[0-9A-F]+$/)) return true
    return false
}