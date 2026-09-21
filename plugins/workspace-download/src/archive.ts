/** Bounded-memory ZIP creation; links and special files are omitted. */
import { open, readdir, realpath, stat } from 'node:fs/promises'
import { constants } from 'node:fs'
import { basename, isAbsolute, relative, resolve, sep } from 'node:path'
import { Zip, ZipDeflate, ZipPassThrough } from 'fflate'

/**
 * Compress a directory inside a workspace to a private output file.
 * @param root - Canonical workspace root.
 * @param directory - Canonical directory contained by root.
 * @param output - Exclusive temporary archive filename.
 * @param signal - Request and plugin-lifetime cancellation.
 * @returns Compressed bytes and omitted link/special-file count.
 */
export async function archiveDirectory(root: string, directory: string, output: string, signal: AbortSignal): Promise<{ bytes: number; skipped: number }> {
  const file = await open(output, 'wx', 0o600)
  const chunks: Uint8Array[] = []
  let failure: Error | null = null
  let bytes = 0
  let skipped = 0
  let entries = 0
  const zip = new Zip((error, data) => { if (error) failure = error; else chunks.push(data) })
  const flush = async () => {
    if (failure) throw failure
    for (const chunk of chunks.splice(0)) {
      signal.throwIfAborted()
      let offset = 0
      while (offset < chunk.length) { const result = await file.write(chunk, offset, chunk.length - offset); offset += result.bytesWritten }
      bytes += chunk.length
      if (bytes >= 0xffffffff) throw new Error('Archive exceeds the ZIP32 format size; download smaller folders')
    }
  }
  const contained = async (path: string) => {
    const target = await realpath(path)
    const child = relative(root, target)
    if (child === '..' || child.startsWith(`..${sep}`) || isAbsolute(child)) throw new Error('Directory entry is outside the workspace')
    return target
  }
  const walk = async (path: string, name: string): Promise<void> => {
    signal.throwIfAborted()
    if (++entries >= 65535) throw new Error('Archive exceeds the ZIP32 entry limit; download smaller folders')
    const folder = new ZipPassThrough(name + '/')
    zip.add(folder); folder.push(new Uint8Array(), true); await flush()
    for (const entry of await readdir(await contained(path), { withFileTypes: true })) {
      signal.throwIfAborted()
      if (entry.name.includes('\\')) throw new Error('ZIP filenames cannot contain backslashes')
      const child = resolve(path, entry.name)
      const archiveName = name + '/' + entry.name
      if (entry.isDirectory()) { await walk(child, archiveName); continue }
      if (!entry.isFile()) { skipped++; continue }
      if (++entries >= 65535) throw new Error('Archive exceeds the ZIP32 entry limit; download smaller folders')
      const source = await open(await contained(child), constants.O_RDONLY | constants.O_NOFOLLOW)
      try {
        const before = await source.stat()
        if (!before.isFile() || before.size >= 0xffffffff) throw new Error('Entry is not a ZIP32 regular file')
        const compressed = new ZipDeflate(archiveName, { level: 6 })
        zip.add(compressed)
        const buffer = Buffer.allocUnsafe(64 * 1024)
        let read = 0
        for (;;) {
          signal.throwIfAborted()
          const part = await source.read(buffer, 0, buffer.length, null)
          if (part.bytesRead === 0) break
          read += part.bytesRead
          compressed.push(buffer.subarray(0, part.bytesRead), false)
          await flush()
        }
        const after = await source.stat()
        if (read !== before.size || after.size !== before.size || after.mtimeMs !== before.mtimeMs) throw new Error('A file changed during compression; retry after writing finishes')
        compressed.push(new Uint8Array(), true); await flush()
      } finally { await source.close() }
    }
  }
  try {
    if (!(await stat(directory)).isDirectory()) throw new Error('Download target must be a directory')
    await walk(directory, basename(directory))
    zip.end(); await flush()
    return { bytes, skipped }
  } finally { zip.terminate(); await file.close() }
}
