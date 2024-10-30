import { hex, b58 } from '../base/index.ts'

export function toB58(uuid: string): string {
    return b58.toString(hex.fromString(uuid.replace(/-/g, '')))
}

export function fromB58(b58uuid: string): string {
    return hex.toString(b58.fromString(b58uuid)).replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5')
}