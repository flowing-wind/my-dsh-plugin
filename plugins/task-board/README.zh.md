---
description: "在服务器上安排一次性、每天或每周的任务，并从全局任务看板打开执行对话。"
kind: "package-bundle"
---

# @deepseek-ai/dsh-experimental-task-board

[English](README.md) | 中文

## 摘要

在服务器上安排一次性、每天或每周的任务，并从全局任务看板打开执行对话。

## 目录

- [使用](#use-this-package)
- [实现](#implementation)
- [模型体验](#model-experience)
- [限制](#known-limitations-and-deferred-work)

<a id="use-this-package"></a>
## 使用

安装此包的 cordis.patch.yml 配置层，在插件列表中独立开启或关闭。迁移时携带包及配置，目标 Harness 必须具有所使用的官方接口和 UI 扩展点。

pollMs 控制服务器轮询。计划保存在 task_board 存储域。输入时间采用北京时间。关闭插件停止后续调度，保留计划和已经接收的对话。

<a id="implementation"></a>
## 实现

Host 入口拥有认证接口；浏览器入口通过生命周期注册 UI。卸载释放相应注册，不删除工作区数据。

没有独立的 ./invariant 入口：插件直接投影所属服务与文件，不维护需要跨观察点核对的副本。

<a id="model-experience"></a>
## 模型体验

不添加模型工具或额外系统提示词；用户操作调用已有接口。

<a id="known-limitations-and-deferred-work"></a>
## 限制

服务必须运行。过期计划在恢复时补执行一次，跳过重复错过的执行次数。提交错误会停用计划，直到手动恢复。已提交只表示收件箱接收，不代表成功完成。

## Dev Note

无。
