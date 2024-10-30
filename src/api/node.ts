import type { FSTab } from "../core/fstab.ts";
import type { VFT } from "../core/vft.ts";

export class SyncNodeFS {
    private vft: VFT

    constructor(
        private fstab: FSTab,
        private storageId: string
    ) {
        const fstabEntry = fstab.get(storageId)
        if (!fstabEntry) throw new Error("VFS not mounted")
        
        this.vft = fstabEntry.vft
    }

    

}