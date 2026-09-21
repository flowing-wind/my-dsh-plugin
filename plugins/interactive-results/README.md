---
description: "Render Agent-delivered .interactive.json files as searchable tables, bar charts, and forms beneath conversation turns."
kind: "package-bundle"
---

# @deepseek-ai/dsh-experimental-interactive-results

English | [中文](README.zh.md)

## Summary

Render Agent-delivered .interactive.json files as searchable tables, bar charts, and forms beneath conversation turns.

## Table of Contents

- [Use this package](#use-this-package)
- [Implementation](#implementation)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)

<a id="use-this-package"></a>
## Use this package

Install the bundled cordis.patch.yml layer and switch the feature independently in the Plugins list. Migration carries the package and configuration; the target Harness must expose the official APIs and UI extension slots used here.

maxBytes bounds JSON input. The schema is defined in src/wire.ts. Local filtering and editing do not call the model. Submitting a form sends its values as an ordinary logged user message.

<a id="implementation"></a>
## Implementation

The Host entry owns authenticated endpoints; the browser entry registers lifecycle-owned UI. Unloading releases registrations without deleting workspace data.

There is no separate ./invariant entry: the plugin projects owned services and files without maintaining independently observed replicas.

<a id="model-experience"></a>
## Model Experience

When enabled, a system-prompt section explains delivery formats and browser interaction. It enters normally recorded model requests.

<a id="known-limitations-and-deferred-work"></a>
## Known Limitations and Deferred Work

No arbitrary code or remote resources. Delivered files must remain in the conversation workspace; editing the file changes the next displayed result.

## Dev Note

None.
