---
description: "Home-scoped personal instructions with a settings editor and system-prompt contribution."
kind: "package-bundle"
---

# @deepseek-ai/dsh-experimental-personal-instructions

English | [中文](README.zh.md)

## Summary

Users can edit instructions that apply to every conversation without changing an Agent preset. The plugin stores the text in one file below the service account home directory and exposes it in Settings.

## Table of Contents

- [Use](#use)
- [Implementation](#implementation)
- [Model Experience](#model-experience)
- [Limitations](#limitations)

<a id="use"></a>
## Use

Install the bundled layer in a Web profile. Settings → Personalization loads and saves the configured file. The default path is `.dsh/agent.md`, resolved below the operating-system user home directory. A path that escapes that directory fails during plugin startup.

Workspace `AGENTS.md` files continue to apply through their existing owner. Personal instructions are a separate deployment-wide input and do not edit Agent presets.

<a id="implementation"></a>
## Implementation

The Host loads the file at startup, writes updates atomically with user-only permissions, and serves an authenticated JSON endpoint for the settings editor. The system-prompt registry reads the current in-memory text for each assembly. Saving emits the registry change event so active sessions can record an updated system prompt through the existing prompt projection.

<a id="model-experience"></a>
## Model Experience

### Personal instructions

#### What the model sees

Non-empty content appears in a `Personal instructions` system-prompt section for every Agent scope.

#### Token impact

Each request includes the saved text, so input usage grows with its length.

#### KV Cache impact

Unchanged text remains stable across requests. Saving new text changes the system-prompt prefix and can reduce cache reuse.

<a id="limitations"></a>
## Limitations

The plugin provides one shared file for the deployment user. It does not provide per-account or per-workspace overrides. The configured maximum file size defaults to 128 KiB. Disabling the plugin removes its settings section and prompt contribution while retaining the file.
