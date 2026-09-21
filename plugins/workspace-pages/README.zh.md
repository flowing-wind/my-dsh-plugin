---
description: "通过需要认证的 Harness 域名，在浏览器新标签页查看 PDF、图片、文本与静态 HTML 说明。"
kind: "package-bundle"
---

# @deepseek-ai/dsh-experimental-workspace-pages

[English](README.md) | 中文

## 摘要

通过需要认证的 Harness 域名，在浏览器新标签页查看 PDF、图片、文本与静态 HTML 说明。

## 目录

- [使用](#use-this-package)
- [实现](#implementation)
- [模型体验](#model-experience)
- [限制](#known-limitations-and-deferred-work)

<a id="use-this-package"></a>
## 使用

安装此包的 cordis.patch.yml 配置层，在插件列表中独立开启或关闭。迁移时携带包及配置，目标 Harness 必须具有所使用的官方接口和 UI 扩展点。

maxAssetBytes、maxTotalBytes 和 maxAssets 限制本地资源。HTML 依赖被打包为 data URL，在不透明来源的沙盒内执行。支持本地普通脚本、CSS、图片与 CSS url 引用。

<a id="implementation"></a>
## 实现

Host 入口拥有认证接口；浏览器入口通过生命周期注册 UI。卸载释放相应注册，不删除工作区数据。

没有独立的 ./invariant 入口：插件直接投影所属服务与文件，不维护需要跨观察点核对的副本。

<a id="model-experience"></a>
## 模型体验

启用时注册系统提示词，说明交付格式和浏览器交互方式。提示词进入正常记录的模型请求。

<a id="known-limitations-and-deferred-work"></a>
## 限制

不启动 Python/Node 服务，不支持远程请求、ES 模块、CSS @import、表单跳转或 Harness API 访问。直接查看 PDF 也受单资源大小限制。

## Dev Note

无。

交付操作通过 deliverables.file.action 插槽显示在统一文件卡片菜单内；卸载插件会移除对应操作。
