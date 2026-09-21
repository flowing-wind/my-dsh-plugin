---
description: "提供手机全宽对话、覆盖式工作区导航与大触控按钮，同时保留桌面布局。"
kind: "package-bundle"
---

# @deepseek-ai/dsh-experimental-mobile-layout

[English](README.md) | 中文

## 摘要

提供手机全宽对话、覆盖式工作区导航与大触控按钮，同时保留桌面布局。

## 目录

- [使用](#use-this-package)
- [实现](#implementation)
- [模型体验](#model-experience)
- [限制](#known-limitations-and-deferred-work)

<a id="use-this-package"></a>
## 使用

安装此包的 cordis.patch.yml 配置层，在插件列表中独立开启或关闭。迁移时携带包及配置，目标 Harness 必须具有所使用的官方接口和 UI 扩展点。

无配置项。浏览器插件在宽度小于 700px 时添加可卸载样式与左上角侧栏展开按钮。左右侧栏均铺满手机视口，以独立壁纸背景覆盖下层文字，通过顶部按钮收起。会话标题为左侧展开图标留出空间。

<a id="implementation"></a>
## 实现

Host 入口仅激活浏览器包。浏览器入口通过生命周期注册样式和导航控件；卸载时移除它们。

没有独立的 ./invariant 入口：插件直接投影所属服务与文件，不维护需要跨观察点核对的副本。

<a id="model-experience"></a>
## 模型体验

不添加模型工具或额外系统提示词；用户操作调用已有接口。

<a id="known-limitations-and-deferred-work"></a>
## 限制

这是浏览器布局，不是独立手机应用或推送通知服务。

## Dev Note

无。
