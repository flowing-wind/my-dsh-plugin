---
description: "Download workspace files from the file tree and preview tabs."
kind: "package-bundle"
---

# @deepseek-ai/dsh-experimental-workspace-download

English | [中文](README.zh.md)

## Summary

Download workspace files directly from file-tree rows or their open preview tabs. Reads use the selected conversation's workspace permissions. Existing uploads remain attachments; this package does not relocate them into the workspace.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Further Exploration](#further-exploration)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)

<a id="use-this-package"></a>
## Use this package

The package includes a `dsh.bundle` patch for installation in a profile and switching from the Plugins page. Portability requires a Harness build with the extension slots and Host APIs used below; a tarball does not patch an older Harness automatically.

Switch this package in the Plugins page’s Installed group. Disabling unloads its profile layer; enabling restores it. Migrate its packaged `cordis.patch.yml` together with the code and update deployment configuration.

Mount this row in a Web profile that already includes workspace files, Session persistence, the right sidebar. Configure archiveDirectory, confirmationBytes, and archiveLifetimeMs.

```yaml
- name: '@deepseek-ai/dsh-experimental-workspace-download'
  config:
    archiveDirectory: /home/harness/.dsh/download-cache
    confirmationBytes: 20000000
    archiveLifetimeMs: 300000
```

The existing file tree opens supported previews and exposes a download action on each regular file. The preview tab menu also offers download. Disabling the package removes these actions and preserves workspace files.

Folder actions first create a temporary ZIP on the server. Archives exceeding confirmationBytes require a second explicit confirmation before the download route accepts them. The bundled threshold is 20,000,000 bytes (20 MB); archives expire after five minutes and are removed after download, cancellation, or unload. Symbolic links and special files are omitted and reported. Compression streams through bounded buffers and runs one folder at a time. ZIP32 limits apply: each file and the complete archive must be smaller than 4 GiB, with fewer than 65,535 entries. Files changing during compression cause an error; the directory is not an atomic snapshot.

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

The authenticated [download endpoint](src/index.ts) derives the workspace from the Session and streams bounded reads through the existing workspace-files service. It cancels reads when the browser cancels and rejects a file version change during transfer. The [client](src/client/view.tsx) contributes file-tree and preview-tab actions. Temporary archives have one lifecycle owner; no separate runtime invariant companion is published. Archive storage must be outside the folder being compressed.

</details>

<a id="further-exploration"></a>
## Further Exploration

- [Workspace files](../../api/workspace-files/README.md)
- [Session persistence](../../session/session-persistence/README.md)

<a id="model-experience"></a>
## Model Experience

### Browser downloads

#### What the model sees

None. `workspace-download` adds browser file actions.

#### Token effect

No automatic prompt input is added by a download.

#### KV Cache effect

Downloads leave model requests and reusable prefixes unchanged.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- Preview formats depend on the existing file preview providers.
- A file must still exist and remain readable when downloaded; a delivered path is not a frozen copy.
- Uploads use the attachment store. The Agent must explicitly copy an attachment when a task requires a workspace file.

### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
