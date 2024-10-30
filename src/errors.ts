export class VirtualFileSystemError extends Error {
    constructor(message: string, public code: number = 0) {
        super(`VFS Error: ${message}`)
        this.name = "VirtualFileSystemError"
    }
}

export const VFSError = (code: number, message: string) => new VirtualFileSystemError(message, code)

export const VFSErrorCodes = {
    FILE_NOT_FOUND: 1,
    FILE_NOT_READABLE: 2,
    FILE_NOT_WRITABLE: 3,
    FILE_NOT_DIRECTORY: 4,
    FILE_NOT_TEXT: 5,
    FILE_NOT_BINARY: 6,
    INVALID_INDEX_ENTRY: 7,
    IS_READ_ONLY_PROPERTY: 8,
}
