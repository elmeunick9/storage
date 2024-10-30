import { fstab } from "./core/fstab.ts";
import { VFS } from "./core/vfs.ts";
import * as uuid from "./utils/uuid/index.ts"

export function createVFS() {
    const storageId = uuid.v4()
    return new VFS({
        adapterConfiguration: { storageId },
        adapter: undefined,
        middleware: [],
        storageId,
        fstab: fstab
    })
}