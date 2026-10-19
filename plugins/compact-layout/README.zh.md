---
description: "设置可拖动的紧凑右侧面板，并显示官方侧栏标识。"
kind: "package-bundle"
---

# @deepseek-ai/dsh-experimental-compact-layout

[English](README.md) | 中文

## 概述

右侧面板默认 300px，侧栏显示官方 DeepSeek Harness 标识。支持匹配版本的官方 Web 和 Desktop profile。

## 目录

- [使用此包](#use-this-package)
- [实现](#implementation)
- [模型体验](#model-experience)
- [已知限制及后续工作](#known-limitations-and-deferred-work)

<a id="use-this-package"></a>
## 使用此包

安装 cordis.patch.yml 配置层。实时配置 initialWidth 接受 300～2000 像素，默认 300。官方拖动控件调整当前窗口的宽度，收起后重新展开会保持；新窗口使用 initialWidth。官方响应式布局仍会判断面板是否能放入视口。

<a id="implementation"></a>
## 实现

客户端通过附加的 shell.overlay 注册共享 ui-layout 的根存储，由官方渲染器提供操作接口。适配器固定兼容 Harness 0.2.1-rc.2，该版本的根注册共享同一存储实例；官方布局 API 变化时需更新适配器。sidebar.brand.name 插槽使用官方 BrandWordmark 组件，已有官方注册保持原位。宿主配置通过官方配置表单传到客户端。

此插件贡献界面，不维护独立状态副本，因此没有单独的 ./invariant 入口。

<a id="model-experience"></a>
## 模型体验

### 浏览器布局

#### 模型看到的内容

`compact-layout` 不增加模型输入或会话事件。

#### Token 影响

不增加模型输入。

#### KV Cache 影响

宽度偏好不改变模型请求内容。

## 已知限制及后续工作

<a id="known-limitations-and-deferred-work"></a>

- 宽度偏好属于每个打开的客户端窗口。其他 Harness 版本需验证兼容性。

### 开发备注

无。
