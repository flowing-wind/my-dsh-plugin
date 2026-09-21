---
description: "把 Agent 交付的 .interactive.json 文件渲染为对话下方可筛选的表格、柱状图与表单。"
kind: "package-bundle"
---

# @deepseek-ai/dsh-experimental-interactive-results

[English](README.md) | 中文

## 摘要

把 Agent 交付的 .interactive.json 文件渲染为对话下方可筛选的表格、柱状图与表单。

## 目录

- [使用](#use-this-package)
- [实现](#implementation)
- [模型体验](#model-experience)
- [限制](#known-limitations-and-deferred-work)

<a id="use-this-package"></a>
## 使用

安装此包的 cordis.patch.yml 配置层，在插件列表中独立开启或关闭。迁移时携带包及配置，目标 Harness 必须具有所使用的官方接口和 UI 扩展点。

maxBytes 限制 JSON 输入。格式由 src/wire.ts 定义。本地筛选和填写不调用模型。提交表单会将值作为正常记录的用户消息发送。

<a id="implementation"></a>
## 实现

Host 入口拥有认证接口；浏览器入口通过生命周期注册 UI。卸载释放相应注册，不删除工作区数据。

没有独立的 ./invariant 入口：插件直接投影所属服务与文件，不维护需要跨观察点核对的副本。

<a id="model-experience"></a>
## 模型体验

启用时注册系统提示词，说明交付格式和浏览器交互方式。提示词进入正常记录的模型请求。

<a id="known-limitations-and-deferred-work"></a>
## 限制

不执行任意代码，也不加载远程资源。交付文件必须保留在对话工作区中；修改文件会改变下次展示的内容。

## Dev Note

无。
