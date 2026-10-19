---
description: "Delete saved conversations or workspace registrations with explicit file-deletion consent."
kind: "package-bundle"
---

# @deepseek-ai/dsh-experimental-workspace-management

English | [中文](README.zh.md)

## Summary

Delete conversations from native sidebar menus, including archived rows. The Workspace deletion dialog offers independent, initially unchecked options to remove its managed directory and all its conversations, including archived ones.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Further Exploration](#further-exploration)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)

<a id="use-this-package"></a>
## Use this package

The published `@flowing-wind/dsh-workspace-management` bundle version `1.0.5` supports official Harness `0.2.1-rc.2` Windows Desktop and Linux Web. Install this single package from the [repository index](https://raw.githubusercontent.com/flowing-wind/my-dsh-plugin/main/market/index.json). It includes matching management providers and the Workspace confirmation extension; the application executable is unchanged.

Wait for running tasks to finish before installing, upgrading or disabling this package, then restart as prompted. Disabling restores the standard profile providers. Source deployments use the matching Host patch.

The optional `managedWorkspaceRoot` restricts file deletion to child directories of an existing absolute parent. Servers can retain their existing setting; standard desktop installations need no configuration.

```yaml
- name: '@deepseek-ai/dsh-experimental-workspace-management'
  config:
    managedWorkspaceRoot: /absolute/path/to/managed-workspaces
```

When a root is configured, only its child directories can be removed from disk. Without one, eligible registered workspace directories can be removed across drives. Drive/share roots, the user home and its ancestors, Harness storage, application files and system directories are protected. Conversation deletion stops its owned Agent, deletes logs, and detaches workspace membership. Workspace deletion retains files and logs unless their separate checkboxes are selected. File deletion stops related owned Agents before removing the directory. Disabling the plugin removes its menu and archive actions and restores the ordinary Workspace confirmation.

The packaged layer reads `DSH_WORKSPACE_ROOT` when present. Deletion uses the Host account’s existing permissions and requests no elevation. Locked or inaccessible files can fail deletion; the workspace registration remains on file-removal failure, but files already removed are not restored. The confirmation displays the actual registered directory.

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

The [Host](src/index.ts) uses the Session controller to close active writers and the workspace registry to remove registrations. It checks canonical paths using platform path rules and removes eligible directories without following workspace aliases. The [client](src/client/actions.tsx) requires explicit confirmation. No runtime invariant companion is published because persistence and workspace providers own the durable records; this package maintains no independent index.

</details>

<a id="further-exploration"></a>
## Further Exploration

- [Session controller](../../api/session-controller/README.md)
- [Session persistence](../../session/session-persistence/README.md)
- [Workspace registry](../../workspace/workspace/README.md)

<a id="model-experience"></a>
## Model Experience

### Browser deletion

#### What the model sees

None. `workspace-management` adds authenticated browser deletion without model tools or prompts.

#### Token effect

No model input is added.

#### KV Cache effect

Deletion does not rewrite surviving conversations or their reusable request prefixes.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- Permanent deletion has no undo or recycle bin.
- Directory deletion rejects protected paths, paths outside an explicitly configured root and symbolic-link or junction workspace aliases.
- Files in retained conversation logs can refer to a workspace directory that has been deleted.

### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
