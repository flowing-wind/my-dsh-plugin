/** Real host paths for the single desktop/Web deletion plugin. */
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { below, canRemoveDirectory } from '../plugins/workspace-management/src/paths.ts'

const parent = process.env.DSH_TEST_TMP ?? fileURLToPath(new URL('../.codex/', import.meta.url))

test('registered directories, explicit roots and protected paths', async () => {
  await fs.mkdir(parent, { recursive: true })
  const base = await fs.mkdtemp(path.join(parent, 'workspace-paths-'))
  try {
    const root = path.join(base, 'projects')
    const target = path.join(root, '中文 project')
    const home = path.join(base, 'home')
    const protectedTree = path.join(root, 'harness-data')
    await fs.mkdir(target, { recursive: true })
    await fs.mkdir(home)
    await fs.mkdir(protectedTree)
    assert.equal(await canRemoveDirectory(target, undefined, home, [protectedTree]), true)
    assert.equal(await canRemoveDirectory(target, root, home, [protectedTree]), true)
    assert.equal(await canRemoveDirectory(root, root, home, []), false)
    assert.equal(await canRemoveDirectory(target, home, home, []), false)
    assert.equal(await canRemoveDirectory(protectedTree, root, home, [protectedTree]), false)
    assert.equal(await canRemoveDirectory(root, undefined, home, [protectedTree]), false)
    assert.equal(await canRemoveDirectory(home, undefined, home, []), false)
    assert.equal(await canRemoveDirectory(base, undefined, home, []), false)
    assert.equal(await canRemoveDirectory(path.parse(base).root, undefined, home, []), false)
    assert.equal(await canRemoveDirectory('relative', undefined, home, []), false)
    assert.equal(await canRemoveDirectory(path.join(root, 'absent'), undefined, home, []), false)
    assert.equal(below(root, path.join(base, 'projects-other')), false)
    const caseRoot = path.join(base, 'CaseRoot')
    const otherRoot = path.join(base, 'caseroot')
    await fs.mkdir(caseRoot, { recursive: true })
    await fs.mkdir(otherRoot, { recursive: true })
    const otherChild = path.join(otherRoot, 'child')
    await fs.mkdir(otherChild)
    const [a, b] = await Promise.all([fs.stat(caseRoot, { bigint: true }), fs.stat(otherRoot, { bigint: true })])
    assert.equal(await canRemoveDirectory(otherChild, caseRoot, home, []), a.dev === b.dev && a.ino === b.ino)
    await fs.writeFile(path.join(target, '内容.txt'), 'owned directory')
    await fs.rm(target, { recursive: true })
    await assert.rejects(fs.stat(target), { code: 'ENOENT' })
    assert.equal((await fs.stat(root)).isDirectory(), true)
    if (process.platform === 'win32') {
      assert.equal(await canRemoveDirectory(protectedTree.toUpperCase(), root.toLowerCase(), home, [protectedTree.toLowerCase()]), false)
      const differentlyCased = path.join(root, 'MixedCase')
      await fs.mkdir(differentlyCased)
      const casing = value => value.startsWith('\\\\') ? value.replace(/^\\\\[^\\]+/, host => host.toUpperCase()) : value.toUpperCase()
      assert.equal(await canRemoveDirectory(casing(differentlyCased), casing(root), home, []), true)
    }
  } finally { await fs.rm(base, { recursive: true, force: true }) }
})

test('directory aliases are rejected and nested links preserve their targets', { skip: process.platform === 'win32' ? 'Creating symlinks needs an OS privilege; ordinary Windows deletion is checked above.' : false }, async () => {
  await fs.mkdir(parent, { recursive: true })
  const base = await fs.mkdtemp(path.join(parent, 'workspace-links-'))
  try {
    const target = path.join(base, 'workspace')
    const outside = path.join(base, 'outside')
    await fs.mkdir(target)
    await fs.mkdir(outside)
    await fs.writeFile(path.join(outside, 'keep.txt'), 'preserved')
    await fs.symlink(outside, path.join(base, 'alias'), 'dir')
    assert.equal(await canRemoveDirectory(path.join(base, 'alias'), base, path.join(base, 'home'), []), false)
    await fs.symlink(outside, path.join(target, 'link'), 'dir')
    await fs.rm(target, { recursive: true })
    assert.equal(await fs.readFile(path.join(outside, 'keep.txt'), 'utf8'), 'preserved')
  } finally { await fs.rm(base, { recursive: true, force: true }) }
})
