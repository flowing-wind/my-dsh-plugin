---
description: "云端网页按需查询 API Key 余额，并提供官方账单链接。"
kind: "package-bundle"
---

# @deepseek-ai/dsh-experimental-account-balance

[English](README.md) | 中文

## 概述

设置 → API 余额查询当前 DeepSeek API Key 对应的余额，并链接到官方用量和充值页面。

## 目录

- [使用](#use)
- [实现](#implementation)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)

<a id="use"></a>
## 使用

在 Web profile 加载随包 `cordis.patch.yml`。必填配置指定凭据引用 `apiKeyEnv`、HTTPS 地址 `balanceUrl` 和 `requestTimeoutMs`。配置层使用 `DEEPSEEK_API_KEY`、`https://api.deepseek.com/user/balance` 和 15000 毫秒。通过 Harness 模型设置添加 API Key，再打开余额分区或点击刷新。

<a id="implementation"></a>
## 实现

已认证的 Host 接口 `/api/account-balance` 每次请求解析凭据，将 Bearer 密钥发送至配置的 HTTPS 地址。它校验余额字段，并省略上游错误正文。响应使用 `cache-control: no-store`。插件不维护账本或轮询，因此没有独立的运行时 invariant 配套模块。

<a id="model-experience"></a>
## 模型体验

### 账号设置

#### 模型看到的内容

无。`account-balance` 提供浏览器设置，不增加工具、提示词或对话事件。

#### Token 影响

无。

#### KV Cache 影响

余额查询不改变请求内容或可复用的前缀。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

- 余额以服务商为准。用量及充值链接打开官方平台，平台可能要求登录。此分区保留 Harness 原生账号登录流程。公网 HTTPS 部署使用 API Key 凭据，因为官方账号 OAuth 要求 HTTP loopback 来源。

### 开发备注

无。
