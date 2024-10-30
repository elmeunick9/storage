import { FSTabEntry } from "../types.ts"

export class FSTab {
    private _fstab = new Map<string, FSTabEntry>()
    
    set(storageId: string, entry: FSTabEntry) {
        this._fstab.set(storageId, entry)
    }

    get(storageId: string): FSTabEntry | undefined {
        return this._fstab.get(storageId)
    }

    has(storageId: string): boolean {
        return this._fstab.has(storageId)
    }

    clear() {
        this._fstab.clear()
    }
}

export const fstab = new FSTab()
