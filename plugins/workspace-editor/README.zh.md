---
description: "从文件树编辑已有 UTF-8 工作区文件。保存时核对打开文件时的 SHA-256 版本，拒绝覆盖已变化的文件。"
kind: "package-bundle"
---

# @deepseek-ai/dsh-experimental-workspace-editor

[English](README.md) | 中文

## 概述

从文件树编辑已有 UTF-8 工作区文件。保存时核对打开文件时的 SHA-256 版本，拒绝覆盖已变化的文件。

## 目录

- [使用](#use-this-package)
- [实现](#implementation)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)

<a id="use-this-package"></a>
## 使用

安装此包的 cordis.patch.yml 配置层，在插件列表中独立开启或关闭。迁移时携带包及配置，目标 Harness 必须具有所使用的官方接口和 UI 扩展点。

maxBytes 限制可编辑文件大小。二进制文件与对话工作区外的路径会被拒绝。关闭未保存内容时需要确认。

编辑器随浏览器窗口自适应，最大宽 1200px、高 900px；文本区域独立滚动，路径使用紧凑单行展示。手机布局适应可用视口。

<a id="implementation"></a>
## 实现

Host 入口拥有认证接口；浏览器入口通过生命周期注册 UI。卸载释放相应注册，不删除工作区数据。

没有独立的 ./invariant 入口：插件直接投影所属服务与文件，不维护需要跨观察点核对的副本。

<a id="model-experience"></a>
## 模型体验

### 浏览器编辑

#### 模型看到的内容

无。`workspace-editor` 增加浏览器操作，修改后的文件内容仅通过后续普通文件读取进入模型。

#### Token 影响

编辑操作不自动增加提示词输入。

#### KV Cache 影响

编辑文件保留先前消息，后续文件读取可增加新内容。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

- 这是纯文本编辑器，不包含语言服务器、调试器、Notebook 内核或协同锁。版本检查之后的并发写入不受锁保护。

### 开发备注

无。
