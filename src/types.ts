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