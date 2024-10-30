export type UUIDTypes = string | Uint8Array

export type Version4Options = {
    random?: Uint8Array
    rng?: () => Uint8Array
}

export type Version7Options = {
    random?: Uint8Array
    msecs?: number
    seq?: number
    rng?: () => Uint8Array
}