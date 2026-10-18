---
description: "密码验证与仅由当前浏览器页面持有的可撤销凭证。"
kind: "package-bundle"
---

# @deepseek-ai/dsh-experimental-page-login

[English](README.md) | 中文

## 概述

公开页面在原生深色或浏览器已选壁纸上显示密码弹窗。验证成功后才初始化私有应用内容，并在左侧栏账号菜单上方显示登出操作。

## 目录

- [配置](#configuration)
- [身份验证](#authentication)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)

<a id="configuration"></a>
## 配置

在 Web profile 中启用包内配置层，并提供 passwordHash、idleMs 和 attemptsPerMinute。passwordHash 由随机 16 字节盐与 64 字节 scrypt 摘要组成，均编码为小写十六进制，中间用冒号分隔。摘要使用 Node 的 scrypt 默认参数（N=16384、r=8、p=1）。明文密码仅用于验证请求，不写入插件包或服务器配置。idleMs 设置空闲有效期，最小为 60000 毫秒。attemptsPerMinute 按直接连接地址限制每分钟验证次数；反向代理后的请求共享该额度。

<a id="authentication"></a>
## 身份验证

插件替换 Connection 默认的启动令牌与 Cookie 验证，同时保留 Host/Origin 校验。根页面、登录接口与两张内置壁纸公开访问。受保护的 HTTP 请求与 WebSocket 升级需要内存凭证。页面不保存登录 Cookie、localStorage 或 sessionStorage。新开页面或刷新页面都需要重新输入密码。

关闭页面时尽力发送撤销请求；退出登录会主动撤销凭证及相关 WebSocket。浏览器崩溃可能阻止撤销请求，但重新打开的页面没有凭证。空闲过期会清理服务器上的遗留记录。浏览器原生预览与下载在请求 URL 中携带所属页面的凭证；反向代理访问日志必须隐藏 pageToken 查询参数。静态 HTML 预览把凭证保留在隔离内容 iframe 之外。已经下载的文件或已经显示的预览无法通过退出登录收回。

<a id="model-experience"></a>
## 模型体验

### 浏览器认证

#### 模型看到的内容

`page-login` 浏览器验证不增加模型工具、提示词或对话事件。登录和登出不停止 Agent 工作。

#### Token 影响

认证不增加模型输入。

#### KV Cache 影响

登录状态不改变模型请求前缀。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

- 公网域名应通过 HTTPS 提供登录服务。当前使用一个共享密码，不提供账户或角色管理。关闭插件会恢复部署原有的身份验证提供方。不单独导出 invariant 入口：验证直接读取自身凭证表，不维护独立副本。

### 开发备注

无。
