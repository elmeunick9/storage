import { describe, it } from "jsr:@std/testing/bdd";
import { expect } from "jsr:@std/expect";
import { VFT } from './vft.ts'
import * as uuid from '../utils/uuid/index.ts'

describe('VFS VFT', () => {
    it('should be initialized with root', () => {
        const vft = new VFT()
        expect(uuid.validate(vft.root)).toBe(true)
        expect(vft.size).toBe(1)
    })

    it('should add entries', () => {
        const vft = new VFT()

        const entry = vft.add({ text: 'Hello World', name: "a.txt", parent: vft.root })
        expect(uuid.validate(entry.inode)).toBe(true)
        expect(entry.name).toBe('a.txt')
        expect(entry.text).toBe('Hello World')
        expect(entry.type).toBe('file')
        expect(entry.external).toBe(false)
        expect(entry.timestamp).toBeDefined()
        expect(vft.get(entry.inode)).toEqual(entry)
    })

    it('should autodetect external entries', () => {
        const vft = new VFT()
        const entry = vft.add({ text: 'e2a1df96-2856-4051-b264-684bbdd4c194', name: "a.pdf", parent: vft.root })
        expect(entry.external).toBe(true)
    })

    it('should create folders and get paths', () => {
        const vft = new VFT()

        const folder1 = vft.add({ name: "a", parent: vft.root, type: "directory" })
        const folder2 = vft.add({ name: "b", parent: folder1.inode, type: "directory" })
        const file = vft.add({ name: "c.txt", parent: folder2.inode, type: "file" })

        expect(vft.path(file.inode)).toBe('/a/b/c.txt')
        expect(vft.path(folder1.inode)).toBe('/a')
        expect(vft.path(folder2.inode)).toBe('/a/b')

        expect(vft.inode(vft.path(file.inode))).toBe(file.inode)
        expect(vft.inode(vft.path(folder1.inode))).toBe(folder1.inode)
        expect(vft.inode(vft.path(folder2.inode))).toBe(folder2.inode)

        expect(vft.inode('a\\\\b\\..\\b\\c.txt')).toBe(file.inode)
    })

    it('should move files and folders including contents', () => {
        const vft = new VFT()

        const folder1 = vft.add({ name: "a", parent: vft.root, type: "directory" })
        const folder2 = vft.add({ name: "b", parent: vft.root, type: "directory" })
        const file = vft.add({ name: "c.txt", parent: folder1.inode, type: "file" })

        vft.move(file.inode, folder2.inode)
        expect(vft.path(file.inode)).toBe('/b/c.txt')

        vft.move(folder2.inode, folder1.inode)
        expect(vft.path(file.inode)).toBe('/a/b/c.txt')

        vft.set(folder2.inode, { name: "b2" })
        expect(vft.path(file.inode)).toBe('/a/b2/c.txt')
    })

    it('should be able to set metadata and other properties', () => {
        const vft = new VFT()

        const folder = vft.add({ name: "a", parent: vft.root, type: "directory" })
        const file = vft.add({ name: "b.txt", parent: folder.inode, type: "file" })
        expect(vft.get(file.inode)?.text).toEqual("")

        vft.set(file.inode, { meta: { foo: "bar" }, text: "Hello World" })
        expect(vft.get(file.inode)?.meta).toEqual({ foo: "bar" })
        expect(vft.get(file.inode)?.text).toEqual("Hello World")
    })

    it('should partially resolve paths until soft-link', () => {
        const vft = new VFT()

        const folder1 = vft.add({ name: "a", parent: vft.root, type: "directory" })
        const folder2 = vft.add({ name: "b", parent: folder1.inode, type: "directory" })
        const file = vft.add({ name: "c", parent: folder2.inode, type: "directory", link: `513298be-57af-4684-b4e1-94cea393d2d2/2cbe88ab-7088-430c-a0d4-cf08b518044d` })

        expect(file.link).toEqual(`513298be-57af-4684-b4e1-94cea393d2d2/2cbe88ab-7088-430c-a0d4-cf08b518044d`)
        const inode = vft.inode('/a/b/c/d/e.txt')

        expect(vft.path(inode)).toBe('/a/b/c')
        expect(vft.get(inode)?.link).toEqual(`513298be-57af-4684-b4e1-94cea393d2d2/2cbe88ab-7088-430c-a0d4-cf08b518044d`)
    })
})