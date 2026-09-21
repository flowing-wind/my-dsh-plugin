---
description: "Delete saved conversations or workspace registrations with explicit file-deletion consent."
kind: "package-bundle"
---

# @deepseek-ai/dsh-experimental-workspace-management

English | [中文](README.zh.md)

## Summary

Delete conversations from their sidebar menus or the archived-session settings list. The existing Workspace deletion dialog offers independent, initially unchecked options to remove its managed directory and all its conversations, including archived ones.

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

Mount the following row in a Web profile. The required `managedWorkspaceRoot` must already exist and be absolute.

```yaml
- name: '@deepseek-ai/dsh-experimental-workspace-management'
  config:
    managedWorkspaceRoot: /absolute/path/to/managed-workspaces
```

Only child directories of this root can be removed from disk. Conversation deletion stops its owned Agent, deletes logs, and detaches workspace membership. Workspace deletion retains files and logs unless their separate checkboxes are selected. File deletion stops related owned Agents before removing the directory. Disabling the plugin removes its menu and archive actions and restores the ordinary Workspace confirmation.

Set `DSH_WORKSPACE_ROOT` to the existing absolute parent directory of removable workspaces before launching the packaged layer. This directory itself cannot be deleted through the plugin.

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

The [Host](src/index.ts) uses the Session controller to close active writers and the workspace registry to remove registrations. It resolves and checks disk paths before renaming a managed directory for removal. The [client](src/client/actions.tsx) requires explicit confirmation. No runtime invariant companion is published because persistence and workspace providers own the durable records; this package maintains no independent index.

</details>

<a id="further-exploration"></a>
## Further Exploration

- [Session controller](../../api/session-controller/README.md)
- [Session persistence](../../session/session-persistence/README.md)
- [Workspace registry](../../workspace/workspace/README.md)

<a id="model-experience"></a>
## Model Experience

None, as authenticated browser deletion adds no model-facing input.

#### KV Cache effect

Deletion does not rewrite surviving conversations' request tokens or invalidate their already-reusable prefixes.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- Permanent deletion has no undo or recycle bin.
- Directory deletion rejects paths outside the configured root and paths whose resolved target differs from the registered path.
- Files in retained conversation logs can refer to a workspace directory that has been deleted.

### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
