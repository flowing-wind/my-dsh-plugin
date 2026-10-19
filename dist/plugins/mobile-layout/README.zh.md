---
description: "提供手机全宽对话、覆盖式工作区导航与大触控按钮，同时保留桌面布局。"
kind: "package-bundle"
---

# @deepseek-ai/dsh-experimental-mobile-layout

[English](README.md) | 中文

## 概述

提供手机全宽对话、覆盖式工作区导航与大触控按钮，同时保留桌面布局。

## 目录

- [使用](#use-this-package)
- [实现](#implementation)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)

<a id="use-this-package"></a>
## 使用

安装此包的 cordis.patch.yml 配置层，在插件列表中独立开启或关闭。迁移时携带包及配置，目标 Harness 必须具有所使用的官方接口和 UI 扩展点。

无配置项。浏览器插件在宽度小于 700px 时添加可卸载样式与左上角侧栏展开按钮。左右侧栏均铺满手机视口，以官方主题的不透明背景覆盖下层文字，通过顶部按钮收起。会话标题为左侧展开图标留出空间。展开按钮使用独立的不透明主题背景，遮挡滚动到其下方的文字。

<a id="implementation"></a>
## 实现

Host 入口仅激活浏览器包。浏览器入口通过生命周期注册样式和导航控件；卸载时移除它们。

没有独立的 ./invariant 入口：插件直接投影所属服务与文件，不维护需要跨观察点核对的副本。

<a id="model-experience"></a>
## 模型体验

### 浏览器布局

#### 模型看到的内容

无。`mobile-layout` 仅改变浏览器布局和导航。

#### Token 影响

无。

#### KV Cache 影响

布局偏好不改变模型请求内容。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

- 这是浏览器布局，不是独立手机应用或推送通知服务。

### 开发备注

无。
