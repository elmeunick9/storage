import * as uuid from "../utils/uuid/index.ts"
import { normalize } from "../utils/file/path.ts"
import { isTextFile } from "../utils/file/contentType.ts"
import { VFSError, VFSErrorCodes as ERROR } from "../errors.ts"
import { IndexEntry, VFTInfo } from "../types.ts"

/** VFT (Virtual File Tree) 
 * Stores file entries in a tree like structure and provides common operations.
*/
export class VFT {
    private index = new Map<string, IndexEntry>()
    private _root: string
    private _size_in_bytes: number = 0

    constructor() {
        this._root = uuid.v4()
        this.add({ inode: this._root })
    }

    get root(): string { return this._root }
    get size(): number { return this.index.size }

    info(): VFTInfo {
        return {
            size: Math.ceil(this._size_in_bytes / 1024),
            entries: this.index.size
        }
    }

    /**
     * Resolves a path into an inode. Must be absolute path, will be normalized.
     * 
     * @param path
     * @returns inode
     */
    inode(path: string): string {
        if (path.trim() === "" || path.trim() === "/") {
            return this._root
        }

        const xpath = normalize(path).split('/').filter(x => x.trim() != "")
        let current_node: IndexEntry = this.get(this._root)
        while (xpath.length > 0) {
            const part = xpath.shift()

            if (current_node.type === "file") {
                if (current_node.name === part && xpath.length === 0) return current_node.inode
                else throw VFSError(ERROR.FILE_NOT_FOUND, `Failed to retrieve inode at "${part}" for path: ${path}.`)
            }
            const child = current_node.children
                ?.map(inode => this.index.get(inode))
                .find(x => x?.name === part)

            if (!child) throw VFSError(ERROR.FILE_NOT_FOUND, `Failed to retrieve inode at "${part}" for path: ${path}.`)
            current_node = child

            if (current_node.link !== undefined) {
                if (current_node.name === part) return current_node.inode
                else throw VFSError(ERROR.FILE_NOT_FOUND, `Failed to retrieve inode (link) at "${part}" for path: ${path}.`)
            }
        }

        return current_node.inode
    }

    /**
     * Generates the path from an inode
     * 
     * @param inode
     * @returns path
     */
    path(inode: string): string {
        let current_inode: string|undefined = inode
        let xpath: string[] = []
        for (let i = 0; i < 255 && current_inode !== undefined; i++) {
            const node = this.index.get(current_inode)
            if (!node) break
            xpath.push(node.name)
            current_inode = node.parent
        }
        
        xpath = xpath.reverse()
        return xpath.join('/') || "/"
    }

    private constructEntry(entry: Partial<IndexEntry>): IndexEntry {
        if (!entry.inode) throw VFSError(ERROR.INVALID_INDEX_ENTRY, `No inode provided.`)
        if (uuid.validate(entry.inode) === false) throw VFSError(ERROR.INVALID_INDEX_ENTRY, `Invalid inode: ${entry.inode}.`)

        if (entry.type === "directory") {
            if (entry.external) throw VFSError(ERROR.INVALID_INDEX_ENTRY, `A directory can not be marked external.`)
            if (entry.text) throw VFSError(ERROR.INVALID_INDEX_ENTRY, `A directory can not contain text.`)
        }

        const type = entry.type ?? (entry.text === undefined ? "directory" : "file")

        if (!entry.name) throw VFSError(ERROR.INVALID_INDEX_ENTRY, `No name provided`)
        const name = entry.name!.trim()
        if (name.length == 0 || name.length > 80) throw VFSError(ERROR.INVALID_INDEX_ENTRY, `Invalid name length: ${entry.name}.`)

        const meta = entry.meta ?? {}
        const timestamp = entry.timestamp ?? (new Date()).toISOString()

        if (entry.link) {
            if (entry.link.trim().length === 0) throw VFSError(ERROR.INVALID_INDEX_ENTRY, `Invalid link: ${entry.link}.`)
            if (entry.link.trim().length > 80) throw VFSError(ERROR.INVALID_INDEX_ENTRY, `Invalid link length: ${entry.link}.`)
            if (entry.text) throw VFSError(ERROR.INVALID_INDEX_ENTRY, `A symlink can not contain text.`)
            if (entry.external) throw VFSError(ERROR.INVALID_INDEX_ENTRY, `A symlink can not be marked external.`)
            if (entry.children) throw VFSError(ERROR.INVALID_INDEX_ENTRY, `A symlink can not contain children.`)
            const [storageId, linkId] = entry.link.split('/')
            if (uuid.validate(storageId) === false) throw VFSError(ERROR.INVALID_INDEX_ENTRY, `Invalid link: ${entry.link}.`)
            if (uuid.validate(linkId) === false) throw VFSError(ERROR.INVALID_INDEX_ENTRY, `Invalid link: ${entry.link}.`)
            return {
                inode: entry.inode,
                external: false,
                type, name, parent: entry.parent, meta,
                timestamp,
                link: entry.link,
                size: 0
            }
        }

        const external = type === "file" ? (entry.external ?? !isTextFile(name)) : false
        const text = type === "file" ? (entry.text ?? "") : undefined

        if (entry.external && !entry.size) throw VFSError(ERROR.INVALID_INDEX_ENTRY, `External files must have a size.`)
        return {
            inode: entry.inode,
            type, name, parent: entry.parent, meta, external,
            text,
            timestamp,
            children: type === "directory" ? [] : undefined,
            size: entry.external ? (entry.size ?? 0) : (new TextEncoder().encode(text ?? "").length)
        }
    }

    private addToParent(entry: IndexEntry) {
        if (!entry.parent) throw VFSError(ERROR.INVALID_INDEX_ENTRY, `Can not add to parent of root.`)

        const parentEntry = this.index.get(entry.parent)
        if (parentEntry === undefined) throw VFSError(ERROR.INVALID_INDEX_ENTRY, `Parent not found: ${entry.parent}.`)
        if (parentEntry.type !== "directory") throw VFSError(ERROR.INVALID_INDEX_ENTRY, `Invalid parent type: ${entry.parent}.`)

        parentEntry.children = parentEntry.children ?? []
        if (parentEntry.children.map(x => this.index.get(x)).find(x => x?.name === entry.name)) {
            throw VFSError(ERROR.INVALID_INDEX_ENTRY, `Can not insert file because a file with the same name already exists on parent directory.`)
        } else {
            parentEntry.children.push(entry.inode)
        }
    }

    /**
     * Adds a new entry to the VFT.
     * 
     * This method will try to complete the entry with default values if not present.
     * Will validate the entry before adding it.
     * 
     * If a parent is not set it will replace the VFT root.
     * 
     * @param entry A partial of an entry with enough information.
     * @returns Added entry
     * @throws {VFSError}
     */
    add(entry: Partial<IndexEntry>): IndexEntry {
        if (Object.keys(entry).length === 0) throw VFSError(ERROR.INVALID_INDEX_ENTRY, `Empty entry.`)
        const inode = entry.inode ?? uuid.v4()

        if (entry.type === "directory") {
            if (entry.external) throw VFSError(ERROR.INVALID_INDEX_ENTRY, `A directory can not be marked external.`)
            if (entry.text) throw VFSError(ERROR.INVALID_INDEX_ENTRY, `A directory can not contain text.`)
        }

         /* Special case where trying to add/replace root node */
        if (!entry.parent) {
            if (entry.name !== undefined && !["", "/", "\\"].includes(entry.name)) {
                throw VFSError(ERROR.INVALID_INDEX_ENTRY, `Can not add root entry! Invalid name: ${entry.name}.`)
            }
            const name = ""
            const type = entry.type ?? "directory"
            if (type !== "directory") throw VFSError(ERROR.INVALID_INDEX_ENTRY, `Can not add root entry! Invalid type: ${entry.type}.`)

            this._root = inode
            this.index.clear()
            this.index.set(inode, {
                inode, type, name, parent: undefined, children: [], meta: {}, external: false,
                timestamp: (new Date()).toISOString(),
                size: 0
            })

            return this.index.get(inode)!
        }

        const result = this.constructEntry({ ...entry, inode })
        this.addToParent(result)
        this.index.set(inode, result)
        this._size_in_bytes += result.size ?? 0

        return result
    }

    has(inode: string): boolean {
        return this.index.has(inode)
    }

    get(inode: string): IndexEntry {
        const entry = this.index.get(inode)
        if (!entry) throw VFSError(ERROR.INVALID_INDEX_ENTRY, `Failed to retrieve entry for inode ${inode}.`)
        return entry
    }

    set(inode: string, value: Partial<IndexEntry>) {
        const entry = this.index.get(inode)
        if (!entry) throw VFSError(ERROR.FILE_NOT_FOUND, `Failed to retrieve entry for setting on inode ${inode}.`)
        if (value.inode !== undefined && entry.inode !== value.inode) throw VFSError(ERROR.IS_READ_ONLY_PROPERTY, `The property "inode" is a read-only property, delete and create a new file instead.`)
        if (value.type !== undefined && entry.type !== value.type) throw VFSError(ERROR.IS_READ_ONLY_PROPERTY, `The property "type" is a read-only property.`)
        if (value.children !== undefined && entry.children?.length !== value.children?.length) throw VFSError(ERROR.IS_READ_ONLY_PROPERTY, `The property "children" is a read-only property.`)
        if (value.timestamp !== undefined && entry.timestamp !== value.timestamp) throw VFSError(ERROR.IS_READ_ONLY_PROPERTY, `The property "timestamp" is a read-only property. It will be updated automatically.`)
        if (value.external !== undefined && entry.external !== value.external) throw VFSError(ERROR.IS_READ_ONLY_PROPERTY, `The property "external" is a read-only property.`)

        if (value.text !== undefined && entry.text !== value.text && entry.external && !value.size) {
            throw VFSError(ERROR.IS_READ_ONLY_PROPERTY, `The property "text" is a read-only property.`)
        }

        const filteredValue = {
            name: value.name ?? entry.name,
            text: value.text ?? entry.text,
            meta: value.meta ?? entry.meta,
            link: value.link ?? entry.link,
            size: value.size ?? entry.size,
        }
        const result = this.constructEntry({ ...entry, ...filteredValue, timestamp: (new Date()).toISOString() })
        if (result.parent && result.parent !== entry.parent) {
            this.move(entry.inode, result.parent)
        }

        this.index.set(inode, result)
        this._size_in_bytes += result.size ?? 0
        return result
    }

    /**
     * Moves a file or directory to another directory.
     * @param inode The inode to be moved
     * @param pinode The new parent directory inode
     */
    move(inode: string, pinode: string) {
        const entry = this.index.get(inode)
        if (!entry) throw VFSError(ERROR.FILE_NOT_FOUND, `Failed to retrieve entry for moving on inode ${inode}.`)
        if (entry.parent === pinode) return

        /* Remove from current parent */
        if (!entry.parent) throw VFSError(ERROR.INVALID_INDEX_ENTRY, `A root directory can not be moved.`)
        const parent = this.index.get(entry.parent)
        if (!parent) throw VFSError(ERROR.FILE_NOT_FOUND, `Failed to retrieve current parent for moving on inode ${inode}.`)
        if (parent.type !== "directory") throw VFSError(ERROR.INVALID_INDEX_ENTRY, `Invalid parent type: ${parent.type}.`)
        parent.children = parent.children?.filter(x => x !== inode)
        
        entry.parent = pinode
        this.addToParent(entry)
    }

    delete(inode: string) {
        const entry = this.index.get(inode)
        if (!entry) throw VFSError(ERROR.FILE_NOT_FOUND, `Failed to retrieve entry for deleting on inode ${inode}.`)

        /* Remove from current parent */
        if (!entry.parent) throw VFSError(ERROR.FILE_NOT_WRITABLE, `A root directory can not be deleted. Use add() instead to replace it.`)
        const parent = this.index.get(entry.parent)
        if (!parent) throw VFSError(ERROR.FILE_NOT_FOUND, `Failed to retrieve current parent for deleting on inode ${inode}.`)
        if (parent.type !== "directory") throw VFSError(ERROR.INVALID_INDEX_ENTRY, `Invalid parent type: ${parent.type}.`)
        parent.children = parent.children?.filter(x => x !== inode)
        
        this.index.delete(inode)
    }

    list(inode: string): string[] {
        if (inode === null) return [...this.index.keys()]
        const entry = this.index.get(inode)
        if (!entry) throw VFSError(ERROR.FILE_NOT_FOUND, `Failed to retrieve entry for listing on inode ${inode}.`)
        if (entry.type !== "directory") throw VFSError(ERROR.INVALID_INDEX_ENTRY, `Invalid entry type for listing: ${entry.type}.`)
        return entry.children ?? []
    }
}