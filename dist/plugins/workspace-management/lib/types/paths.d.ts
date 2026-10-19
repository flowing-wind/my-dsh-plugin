/**
 * Test strict directory containment using the host platform's path rules.
 * @param root - Absolute parent directory.
 * @param target - Absolute candidate directory.
 * @returns Whether target is a child of root, excluding root itself.
 */
export declare function below(root: string, target: string): boolean;
/**
 * Check a registered directory without following an alias into another tree.
 * @param target - Registered absolute directory.
 * @param root - Optional administrator-imposed parent directory.
 * @param home - User home, which cannot itself be deleted with its ancestors.
 * @param protectedTrees - Harness storage, application and operating-system directories.
 * @returns Whether this existing directory may be selected for disk deletion.
 */
export declare function canRemoveDirectory(target: string, root: string | undefined, home: string, protectedTrees: readonly string[]): Promise<boolean>;
//# sourceMappingURL=paths.d.ts.map