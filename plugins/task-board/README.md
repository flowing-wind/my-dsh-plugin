---
description: "Schedule one-time, daily, or weekly prompts on the server and open their conversations from a global task board."
kind: "package-bundle"
---

# @deepseek-ai/dsh-experimental-task-board

English | [中文](README.zh.md)

## Summary

Schedule one-time, daily, or weekly prompts on the server and open their conversations from a global task board.

## Table of Contents

- [Use this package](#use-this-package)
- [Implementation](#implementation)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)

<a id="use-this-package"></a>
## Use this package

Install the bundled cordis.patch.yml layer and switch the feature independently in the Plugins list. Migration carries the package and configuration; the target Harness must expose the official APIs and UI extension slots used here.

pollMs controls server polling. Plans persist in the task_board storage domain. Input times use Asia/Shanghai. Disabling the plugin stops future scheduling but retains plans and already accepted conversations.

<a id="implementation"></a>
## Implementation

The Host entry owns authenticated endpoints; the browser entry registers lifecycle-owned UI. Unloading releases registrations without deleting workspace data.

There is no separate ./invariant entry: the plugin projects owned services and files without maintaining independently observed replicas.

<a id="model-experience"></a>
## Model Experience

No model tools or additional system sections; user actions call existing APIs.

<a id="known-limitations-and-deferred-work"></a>
## Known Limitations and Deferred Work

The service must be running. An overdue plan runs once on recovery; repeated missed occurrences are skipped. Admission errors disable a plan until resumed. Submitted means inbox acceptance, not successful completion.

## Dev Note

None.
