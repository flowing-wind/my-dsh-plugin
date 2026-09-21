---
description: "按对话统计流量，并在达到配置的每日费用阈值时要求确认。"
kind: "package-bundle"
---

# @deepseek-ai/dsh-experimental-network-usage

[English](README.md) | 中文

## 概述

查看每个对话以及保留历史的入网、出网流量。配置滚动窗口限速和北京时间自然日费用确认。Linux shell 命令可以通过独立网络命名空间内的计量代理联网。费用按十进制 GB 出网估算，不等同于云服务商的完整账单。 明细按工作区合计与所属对话分组，归档对话带有标记；工作区小计不重复加入全局累计。 无名称、未归档且零消耗的空白占位对话不列入明细。

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

在具有存储和 Agent 服务的 Web profile 中挂载本包。移除其 profile 条目即可移除界面和限制；重新挂载后仍可读取保存的总量。

网络区域显示在[共享用量看板](../usage-dashboard/README.zh.md)中。“关闭本次限速”会释放排队等待限速的传输，仅对本次超额生效。滚动费用回落到阈值以内（含阈值）后恢复自动监测；之后再次超额会重新限速。每日费用仍需确认。手动关闭状态只在当前进程内保留，服务重启会清除该状态。

```yaml
- name: '@deepseek-ai/dsh-experimental-network-usage'
  config:
    cnyPerGB: 0.8
    windowMs: 600000
    windowCny: 0.5
    throttledMbps: 2
    dailyStepCny: 10
    checkpointMs: 1000
    refreshMs: 3000
```

所有字段均必填。费用单位为人民币，带宽为十进制 Mbps，时长为毫秒。出网费用严格超过 `windowCny` 时启用共享限速。每达到一个 `dailyStepCny` 档位，计量传输和 Agent 步骤会暂停，直到浏览器确认当天当前档位。北京时间午夜重置自然日。没有历史总量、单对话或单文件大小上限。

要限制 shell 联网，还需挂载 `/proxy`，设置私有绝对路径 `socketDirectory`、`allowPrivateAddresses: false` 和 `connectTimeoutMs: 15000`。用 `/sandbox` 替换现有本地沙盒提供方，配置 `runnerCommand: [/usr/bin/bwrap]` 和 `runnerFailureSignatures: ['bwrap:']`。只有受沙盒限制的权限预设才执行此联网策略。`/bash` 执行器为获准完全访问的命令注入会话专属代理凭据，保持原有审批；遵循代理变量的下载仍计入对应会话。套接字目录必须支持 Unix 套接字。

启动打包配置层前，将 `DSH_NETWORK_SOCKET_DIRECTORY` 设为支持 Unix socket 的私有绝对目录。看板依次展示今日出网量与费用、距离下一次当日确认的剩余额度、累计出网量与费用。明细只包含现有及归档对话；后台传输及已删除对话仍计入汇总。

区域标题不显示副标题，中间卡片突出账户余额或当日费用确认前的剩余额度。

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现细节——点击展开</summary>

[预算](src/budget.ts)管理滚动观测和每日确认。[服务](src/index.ts)独立于对话日志保存总量。[代理](src/proxy.ts)计量 HTTP 正文和 CONNECT 隧道字节；[沙盒提供方](src/sandbox-plugin.ts)通过命名空间内桥接暴露对话专属 Unix 套接字。浏览器中间件计量已认证的文件传输。没有 Session 所有者的请求只计入汇总统计。计数器和限制决策共用一个账本，没有独立观测，因此不提供 invariant 配套模块。

</details>

<a id="further-exploration"></a>
## 进一步探索

- [本地沙盒](../../sandbox/sandbox-local/README.zh.md)
- [存储域](../../storage/storage-domain/README.zh.md)
- [客户端连接](../../client/connection/README.zh.md)

<a id="model-experience"></a>
## 模型体验

无；流量计量和传输准入不增加面向模型的输入。

#### KV Cache 影响

传输暂停不会改变请求 Token，也不会使已可复用的前缀失效。

## 已知限制与延后工作

<a id="known-limitations-and-deferred-work"></a>

- 计数不含 IP/TCP 开销和重传。浏览器正文计量可能与压缩后的传输大小不同。
- shell 限制需要 Linux bubblewrap，且不适用于未受限权限模式。绕过所安装 HTTP dispatcher 的 Host 程序不在代理计量范围内。
- 检查点间隔决定持久化时效；进程突然退出可能丢失尚未保存的最新流量。

### 开发备注

<details>
<summary>维护者工作上下文——点击展开</summary>

无。

</details>

点击深色工作区合计行可折叠或展开所属对话明细；合计数值保持显示。
