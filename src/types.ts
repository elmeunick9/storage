import type { FSTab } from "./core/fstab.ts";
import type { VFS } from "./core/vfs.ts";
import type { VFT } from "./core/vft.ts";

/** Interface for an entry in the VFT */
export interface Entry {
    type: "file" | "directory" | "link"
    name: string
    meta?: any
    parent?: string

    // The following are mutually exclusive
    text?: string // If external may store object info
    link?: string // For symlinks, must be of the form [storage-id]/[inode]
    blob?: Blob // For when binary files are to be stored in memory
}

export interface IndexEntry extends Entry {
    inode: string
    children?: string[] // For directories
    timestamp: string // ISO 8601 UTC
    external: boolean // For files whose content is backed in an external storage, e.g. S3.
    size: number // In KB, 0 for links and directories.
}

export interface VFTInfo {
    size: number // In KB
    entries: number
}

export interface VFSInfo {
    memory: VFTInfo
    storage?: StorageInfo
}

export interface StorageInfo {
    id: string
    size: number // In KB
}

export interface StorageAdapterConfiguration {
    storageId: string
}

export interface StorageAdapter {
    mount(): Promise<void>
    unmount(): Promise<void>
    info(): Promise<StorageInfo>
    index(): Promise<FileIndex>
    get(ids: string[]): Promise<FileBatch>
    set(batch: FileBatch): Promise<void>
    upload(data: FileData): Promise<FileDataRef>
    download(objectId: string): Promise<Blob>
    restore(ids: string[]): Promise<void>
    history(inode: string): Promise<FileHistory>
}

export interface FileBatch {
    insert?: FileIndexEntryExtended[]
    delete?: string[]
    hardDelete?: boolean
}

export interface FileIndexEntry {
    inode: string
    name?: string
    parent?: string
    directory?: boolean
    timestamp?: string
}

export interface FileIndexEntryExtended extends FileIndexEntry {
    objectId?: string
    link?: string
    text?: string
    meta?: any
}

export interface FileData {
    partition: string,
    inode?: string,
    parent: string,
    name: string,
    directory: boolean,
    body?: Blob
    meta?: any
    object?: string
}

export interface FileDataRef {
    inode: string
    objectId: string
}

export type FileIndex = FileIndexEntry[]

export interface VFSConfiguration<T extends StorageAdapterConfiguration> {
    adapterConfiguration: T;

    /** Use this for persistence or extended features */
    adapter?: (configuration: T) => StorageAdapter

    /** Use this for extended features */
    middleware: ((adapter: StorageAdapter) => StorageAdapter)[]

    /** Use this to resolve sym-links */
    storageId: string

    /** This instance of FSTab to use, defaults to the global */
    fstab: FSTab
}

export interface FSTabEntry {
    configuration: VFSConfiguration<any>
    vfs: VFS<any>
    vft: VFT
}

export interface FileHistoryEntry {
    object: {
        id: string
        created_at: string
        size: number // In KB
        text?: string
        link?: string
        external: boolean
        md5?: string
    }
    timestamp: string
}

export type FileHistory = FileHistoryEntry[]