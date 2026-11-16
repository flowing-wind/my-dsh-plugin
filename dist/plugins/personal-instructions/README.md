---
description: "Edit the Harness global AGENTS.md file in Settings."
kind: "package-bundle"
---

# @deepseek-ai/dsh-experimental-personal-instructions

English | [中文](README.zh.md)

## Summary

Settings → Personalization edits the Harness global `AGENTS.md`. The stock instruction loader supplies the saved text to new or reopened sessions.

## Table of Contents

- [Use](#use)
- [Upgrade from 1.0.8](#upgrade)
- [Implementation](#implementation)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)

<a id="use"></a>
## Use

Install the bundle in the Web or Desktop profile and open Settings → Personalization → Global AGENTS.md. The editor reads and writes `$DSH_HOME/AGENTS.md`, which defaults to `~/.dsh/AGENTS.md`. Workspace instruction files and the shared `$DSH_AGENTS_HOME/AGENTS.md` are also loaded by the native instruction plugin.

If the file changes after the editor loads it, saving reports a conflict and retains the draft. Copy your draft before reopening the page and merging it with the current file.

<a id="upgrade"></a>
## Upgrade from 1.0.8

Back up the previous instruction file. Copy the contents of `~/.dsh/agent.md`, or the previous configured `path`, into `$DSH_HOME/AGENTS.md`. If the destination already exists, merge the two files and keep both sets of instructions. Remove the previous `path` option from any `personal-instructions` profile patch and restart Harness after upgrading the plugin.

<a id="implementation"></a>
## Implementation

The authenticated settings endpoint reads the current file from disk. Saves compare the revision loaded by the editor and replace the file atomically with owner-only permissions. An existing symbolic link is kept and the editor updates its target.

<a id="model-experience"></a>
## Model Experience

Harness includes the text in its native user-global instruction chain. Existing open sessions refresh according to the [native instruction loader](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.2-rc.3/packages/context/agent-instructions/README.md#known-limitations-and-deferred-work).

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- The editor's `maxBytes` setting limits file writes and defaults to 128 KiB. The native loader applies its own prompt budget to the combined global instruction chain.

### Dev Note

None.
