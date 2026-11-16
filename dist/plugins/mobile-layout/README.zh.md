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

宽度小于 700px 时，左右侧栏铺满手机视口，并以当前主题的背景覆盖下层文字。点击左上角按钮打开导航抽屉，点击抽屉顶部按钮收起。设置分类也占满可用宽度。本包无需配置。

<a id="implementation"></a>
## 实现

Host 入口激活浏览器包。浏览器入口注册可卸载的样式，并使用宿主提供的 Harness 导航抽屉。

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
