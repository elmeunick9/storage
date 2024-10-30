# A Virtual File System Library for JS

This library in intended to support a virtual file-system on any browser. To do so memory is used to story the files. It also supports persisting the files into different storages through a adapters.

## Getting started

To create a standard VFS you can use the `create API` like below:

```ts
import { createVFS } from 'vfs'

const vfs = createVFS()
```

This will create a memory-only VFS without persistence. Additionally you can pass a configuration object to specify the storage adapter details, e.g:

```ts
const vfs = createVFS({
    endpoint: "storage.example.com",
    authentication: "none",
    storageId: 'abc123',
    access: 'read-only',
    name: 'root',
    mount: '/'
})
```

File Systems created this way will automatically be mounted and added to the global `fstab` instance. This allows accessing such file systems from anywhere.

```ts
import { fstab } from 'vfs'

const vfs = fstab.get({ storageId: 'abc123' })
// or
const vfs = fstab.get({ name: 'root' })
```

Note that permissions are handled at file system level. More information about a file system, such as the allocated and free space, can be extracted with `vfs.info()`. On mount if the file system is connected to a storage the index will be downloaded. At any point you can call `vfs.sync()` to force all pending changes to be sent to the storage. You can also call `vfs.watch(callback)` to observe any changes to the file system.

To perform operations on the file system we have multiple APIs.

### Node API
This is compatibility layer for `node:fs`. Use it like this:

```ts
const fs = vfs.nodeAPI()

fs.mkdir(path, callback, recursive)
fs.writeFile(path, data, callback)
fs.stat(path)
fs.cwd()
```

### Virtual API
This is an API designed to be more feature complete for the browsers, supporting history, trash, etc.

```ts
const fs = vfs.virtualAPI()

const file = fs.root().add({ name: "fileA.txt", text: "Hello" })
file.move('/B/C/fileA_1.txt')
file.write('Hello2')
const text = file.read()
const history = file.history()
file.delete()
fs.trash.get('/B/C/fileA_1.txt').restore()
fs.get('/B/C')
    .add({ name: "D", directory: true })
    .add({ name: "E", link: "/T" })
    .info()
fs.get("/B/f.txt").watch(callback)
```

## Middlewares

MiddleWares are used to add functionality to persistence storage adapters in a general way. In this section you'll find a description of the build-in middlewares, but you can implement your own (and your own storage adapters too).

A middleware is defined as a class implementing a StorageAdapter and depending on another storage adapter in its constructor.

### Sequencer
The Sequencer middleware uses an AsyncQueue to ensure that all requests to the StorageAdapter (asynchronous) are executed in order, retrying a request if it fails.

### Batcher
The Batcher middleware groups multiple requests for modification into a single batch. It does so by waiting for some time and accumulating requests before making an actual call. This allows multi-selection delete, or multi-selection rename for instance to be performed in a single request. It also allows for fast coping of directories.

### Encrypt
This Middleware will encrypt/decrypt all content (not the index) with a user provided key.

# Contribute
This project is made in Deno 2.0 and follows its standard conventions.