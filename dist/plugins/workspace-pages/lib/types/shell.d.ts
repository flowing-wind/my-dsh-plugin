/** Trusted wrapper packs local dependencies before executing HTML in an opaque iframe. */
interface Input {
    sessionId: string;
    path: string;
    maxAssetBytes: number;
    maxTotalBytes: number;
    maxAssets: number;
}
/**
 * Render the isolated static preview wrapper.
 * @param input - Server-validated root file and configured resource limits.
 * @returns Standalone authenticated preview shell.
 */
export declare function pageShell(input: Input): string;
export {};
//# sourceMappingURL=shell.d.ts.map