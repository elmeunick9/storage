import { FSTabEntry } from "../types.ts"

export class FSTab {
    private _fstab = new Map<string, FSTabEntry>()
    
    clear() {
        this._fstab.clear()
    }
}

export const fstab = new FSTab()
