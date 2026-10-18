---
description: "Edit existing UTF-8 workspace files from the file tree. Saving checks the loaded SHA-256 version and rejects stale edits."
kind: "package-bundle"
---

# @deepseek-ai/dsh-experimental-workspace-editor

English | [中文](README.zh.md)

## Summary

Edit existing UTF-8 workspace files from the file tree. Saving checks the loaded SHA-256 version and rejects stale edits.

## Table of Contents

- [Use this package](#use-this-package)
- [Implementation](#implementation)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)

<a id="use-this-package"></a>
## Use this package

Install the bundled cordis.patch.yml layer and switch the feature independently in the Plugins list. Migration carries the package and configuration; the target Harness must expose the official APIs and UI extension slots used here.

maxBytes limits editable file size. Binary files and paths outside the conversation workspace are rejected. Closing with unsaved changes asks for confirmation.

The editor uses the available browser window up to 1200px wide and 900px tall, with a scrollable text area and a compact path line. Phone layouts fit the viewport.

<a id="implementation"></a>
## Implementation

The Host entry owns authenticated endpoints; the browser entry registers lifecycle-owned UI. Unloading releases registrations without deleting workspace data.

There is no separate ./invariant entry: the plugin projects owned services and files without maintaining independently observed replicas.

<a id="model-experience"></a>
## Model Experience

### Browser editing

#### What the model sees

None. `workspace-editor` adds browser actions; changed file contents become visible only through subsequent ordinary file reads.

#### Token effect

No automatic prompt input is added by an edit.

#### KV Cache effect

Editing a file leaves earlier messages intact; a later file read can add new content.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- This is a plain text editor, without language servers, debugging, notebook kernels, or collaborative locking. Concurrent writes after the version check are not locked.

### Dev Note

None.

Delivery actions register in the shared file card through deliverables.file.action; unloading removes the contributed action.
