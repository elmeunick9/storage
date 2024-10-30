import type { StorageAdapter, StorageAdapterConfiguration, VFSConfiguration, VFSInfo } from "../types.ts";
import { VFT } from "./vft.ts";

function createAdapter<T extends StorageAdapterConfiguration>(
    adapter: (configuration: T) => StorageAdapter,
    configuration: T,
    middleware: ((adapter: StorageAdapter) => StorageAdapter)[]
) {
    return middleware.reduceRight((a, x) => x(a), adapter(configuration))
}

export class VFS<T extends StorageAdapterConfiguration> {
    private vft = new VFT()
    private adapter: StorageAdapter|undefined

    constructor(private config: VFSConfiguration<T>) {
        if (config.adapter) {
            this.adapter = createAdapter(
                config.adapter,
                config.adapterConfiguration,
                config.middleware
            )
        }
    }

    async info(): Promise<VFSInfo> {
        return {
            memory: this.vft.info(),
            storage: this.adapter 
                ? await this.adapter.info() 
                : undefined
        }
    }
}