---
description: "将独立的 Token 与流量统计组合到一个浏览器看板。"
kind: "package-bundle"
---

# @deepseek-ai/dsh-experimental-usage-dashboard

[English](README.md) | 中文

## 概述

一个“用量总览”入口容纳可独立拆卸的统计区域。本包负责导航与布局，不采集 Token、余额或流量。

## 目录

- [使用本包](#use-this-package)
- [理解实现](#understand-the-implementation)
- [进一步探索](#further-exploration)
- [模型体验](#model-experience)
- [已知限制与延后工作](#known-limitations-and-deferred-work)

<a id="use-this-package"></a>
## 使用本包

包内包含 `dsh.bundle` 覆盖配置，可安装到 profile 并在插件页面切换。迁移需要包含下述扩展插槽和 Host API 的 Harness 构建；安装压缩包不会自动修补旧版 Harness。

在插件页面的“已安装”区域切换此包；关闭后卸载它的配置层，重新开启会恢复该层。迁移时携带包内的 `cordis.patch.yml` 并调整其中的部署配置。

在 Web profile 中挂载 `@deepseek-ai/dsh-experimental-usage-dashboard`，并挂载一个或两个统计插件。无需配置。移除统计插件只移除其区域；移除本看板会隐藏其中的区域，但不会停止统计或每日费用确认。

页面在主面板内独立滚动，展开明细表不会隐藏导航。

<a id="understand-the-implementation"></a>
## 理解实现

浏览器入口声明根作用域的列表插槽 `usage-dashboard.section`。各统计插件注册自己的本地化组件，并读取自己的认证接口。本包不提供不变量伴随模块，因为看板不拥有独立的数据观测。

<a id="further-exploration"></a>
## 进一步探索

- [Token 统计](../usage-billing/README.zh.md)
- [网络统计](../network-usage/README.zh.md)

<a id="model-experience"></a>
## 模型体验

无，因为浏览器布局不会添加模型可见输入。

#### KV 缓存影响

看板导航不会改变模型请求或其可复用前缀。

## 已知限制与延后工作

<a id="known-limitations-and-deferred-work"></a>

各区域按照所属统计插件配置的间隔独立刷新；其观测不是一个原子的组合快照。

### 开发者备注

<details>
<summary>维护者工作上下文——点击展开</summary>

无。

</details>
