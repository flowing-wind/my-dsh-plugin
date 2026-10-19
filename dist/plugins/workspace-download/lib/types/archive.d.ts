/**
 * Compress a directory inside a workspace to a private output file.
 * @param root - Canonical workspace root.
 * @param directory - Canonical directory contained by root.
 * @param output - Exclusive temporary archive filename.
 * @param signal - Request and plugin-lifetime cancellation.
 * @returns Compressed bytes and omitted link/special-file count.
 */
export declare function archiveDirectory(root: string, directory: string, output: string, signal: AbortSignal): Promise<{
    bytes: number;
    skipped: number;
}>;
//# sourceMappingURL=archive.d.ts.map