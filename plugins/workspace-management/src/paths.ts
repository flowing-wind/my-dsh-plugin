/** Canonical directory checks shared by desktop and Web workspace deletion. */
import { lstat, realpath, stat } from 'node:fs/promises'
import { isAbsolute, relative, resolve } from 'node:path'

/**
 * Test strict directory containment using the host platform's path rules.
 * @param root - Absolute parent directory.
 * @param target - Absolute candidate directory.
 * @returns Whether target is a child of root, excluding root itself.
 */
export function below(root: string, target: string): boolean {
  const child = relative(root, target)
  return child !== '' && child !== '..' && !child.startsWith('../') && !child.startsWith('..\\') && !isAbsolute(child)
}

/**
 * Check a registered directory without following an alias into another tree.
 * @param target - Registered absolute directory.
 * @param root - Optional administrator-imposed parent directory.
 * @param home - User home, which cannot itself be deleted with its ancestors.
 * @param protectedTrees - Harness storage, application and operating-system directories.
 * @returns Whether this existing directory may be selected for disk deletion.
 */
export async function canRemoveDirectory(
  target: string, root: string | undefined, home: string, protectedTrees: readonly string[],
): Promise<boolean> {
  if (!isAbsolute(target)) return false
  const directory = resolve(target)
  if (resolve(directory, '..') === directory || relative(directory, home) === '' || below(directory, home)) return false
  if (root !== undefined && !below(root, directory)) return false
  if (protectedTrees.some(tree => relative(tree, directory) === '' || below(tree, directory) || below(directory, tree))) return false
  try {
    if (root !== undefined) {
      // UNC shares can be case-sensitive even when Windows path comparison is not.
      const ancestor = resolve(directory, ...relative(root, directory).split(/[\\/]/).map(() => '..'))
      const [allowed, actual] = await Promise.all([stat(root, { bigint: true }), stat(ancestor, { bigint: true })])
      if (allowed.dev !== actual.dev || allowed.ino !== actual.ino) return false
    }
    const info = await lstat(directory)
    return info.isDirectory() && !info.isSymbolicLink() && relative(directory, await realpath(directory)) === ''
  } catch (error) {
    if (['ENOENT', 'ENOTDIR'].includes((error as NodeJS.ErrnoException).code ?? '')) return false
    throw error
  }
}
