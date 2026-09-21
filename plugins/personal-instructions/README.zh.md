---
description: "Home 目录内的个性化要求文件、设置编辑器与系统提示贡献。"
kind: "package-bundle"
---

# @deepseek-ai/dsh-experimental-personal-instructions

[English](README.md) | 中文

## 概述

用户可以编辑应用于所有对话的要求，而无需修改 Agent 预设。插件将文本保存在服务账户 Home 目录下的一个文件中，并在设置中提供编辑入口。

## 目录

- [使用](#use)
- [实现](#implementation)
- [模型体验](#model-experience)
- [限制](#limitations)

<a id="use"></a>
## 使用

在 Web profile 中安装包内配置层。设置 → 个性化会读取和保存配置文件。默认路径为 `.dsh/agent.md`，相对于操作系统用户的 Home 目录解析。超出该目录的路径会使插件在启动时失败。

工作区 `AGENTS.md` 文件继续由原有功能加载。个性化要求是独立的部署级输入，不修改 Agent 预设。

<a id="implementation"></a>
## 实现

Host 在启动时读取文件，以仅限当前用户访问的权限原子写入更新，并为设置编辑器提供经过身份验证的 JSON 接口。系统提示注册表在每次组装时读取当前内存文本。保存后发出注册表变更事件，使活动对话通过现有提示投影记录更新后的系统提示。

<a id="model-experience"></a>
## 模型体验

### 个性化要求

#### 模型看到的内容

非空内容会作为 `Personal instructions` 系统提示分区应用于所有 Agent scope。

#### Token 影响

每次请求都会包含保存的文本，因此输入用量随文本长度增加。

#### KV Cache 影响

文本未变化时可在请求间保持稳定。保存新文本会改变系统提示前缀，并可能降低缓存复用率。

<a id="limitations"></a>
## 限制

插件为部署用户提供一个共享文件，不提供按账户或工作区覆盖。配置的文件大小上限默认为 128 KiB。关闭插件会移除设置入口和提示贡献，但保留文件。
