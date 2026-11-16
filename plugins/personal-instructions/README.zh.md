---
description: "在设置中编辑 Harness 的全局 AGENTS.md。"
kind: "package-bundle"
---

# @deepseek-ai/dsh-experimental-personal-instructions

[English](README.md) | 中文

## 概述

设置 → 个性化可编辑 Harness 的全局 `AGENTS.md`。原生指令加载器会将保存的正文提供给新建或重新打开的会话。

## 目录

- [使用](#use)
- [从 1.0.8 升级](#upgrade)
- [实现](#implementation)
- [模型体验](#model-experience)
- [已知限制与暂缓事项](#known-limitations-and-deferred-work)

<a id="use"></a>
## 使用

在 Web 或 Desktop profile 中安装插件包，打开设置 → 个性化 → 全局 AGENTS.md。编辑器读写 `$DSH_HOME/AGENTS.md`，默认是 `~/.dsh/AGENTS.md`。原生指令插件也会加载工作区指令文件和共享的 `$DSH_AGENTS_HOME/AGENTS.md`。

如果文件在编辑器打开后发生变化，保存时会提示冲突并保留草稿。重新打开页面前先复制草稿，再将草稿与文件当前内容合并。

<a id="upgrade"></a>
## 从 1.0.8 升级

备份旧指令文件。将 `~/.dsh/agent.md` 或此前通过 `path` 指定的文件内容复制到 `$DSH_HOME/AGENTS.md`。如果目标已存在，请合并两个文件并保留双方的指令。从 `personal-instructions` 的 profile 补丁中移除旧 `path` 选项，升级插件后重启 Harness。

<a id="implementation"></a>
## 实现

设置接口经过认证并从磁盘读取当前内容。保存时比较编辑器加载的版本，然后以仅限所有者访问的权限原子替换文件。文件为符号链接时保留链接，并更新其目标。

<a id="model-experience"></a>
## 模型体验

Harness 将正文纳入原生的用户全局指令链。已经打开的会话按[原生指令加载器](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.2-rc.3/packages/context/agent-instructions/README.md#known-limitations-and-deferred-work)的规则刷新。

## 已知限制与暂缓事项

<a id="known-limitations-and-deferred-work"></a>

- 编辑器的 `maxBytes` 限制写入大小，默认是 128 KiB。原生加载器对合并后的全局指令链使用自己的提示词字节预算。

### 开发注记

无。
