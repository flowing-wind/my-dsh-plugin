---
description: "显示 DeepSeek 余额、每对话 Token 费用估算及保留的历史总费用。"
kind: "package-bundle"
---

# @deepseek-ai/dsh-experimental-usage-billing

[English](README.md) | 中文

## 概述

查看今日 Token 与预估费用、账户人民币余额，以及累计用量和缓存命中率。带生效日期的价格版本按照请求开始时间计价。明细只包含现有及归档对话；删除明细时将其计入不含对话标识的汇总计数。按请求开始日期归入北京时间自然日。估算使用提供方报告的 Token；实际扣费以提供方为准。 明细按工作区合计与所属对话分组，归档对话带有标记；工作区小计不重复加入全局累计。 无名称、未归档且零消耗的空白占位对话不列入明细。

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

在具有对话持久化、存储域、凭据服务和[共享用量看板](../usage-dashboard/README.zh.md)的 Web profile 中挂载 `@deepseek-ai/dsh-experimental-usage-billing`。配置以下必填字段；移除条目会移除其看板区域和对话费用提示，同时保留已存储账本及其他插件的区域。

| 字段 | 含义 |
|---|---|
| `apiKeyEnv` | 凭据引用，例如 `DEEPSEEK_API_KEY` |
| `balanceUrl` | HTTPS 余额接口，例如 `https://api.deepseek.com/user/balance` |
| `balanceCacheMs` | 新余额请求的最小间隔 |
| `requestTimeoutMs` | 余额请求超时 |
| `refreshMs` | 浏览器刷新间隔 |
| `generations` | 按 `effectiveAt` 严格递增排列的非空列表 |

每个价格版本指定 `provider`、Unix 毫秒时间戳 `effectiveAt`、格式为 `YYYY-MM-DD` 的北京时间节假日 `holidays`，以及 `models` 字典。每个模型的 `peak` 和 `offPeak` 分别包含 `input`、`cacheRead`、`output`，单位为元/百万 Token。提供方名称必须与配置的适配器匹配；内置官方适配器使用 `deepseek-official`。峰时为北京时间工作日的 09:00–12:00 和 14:00–18:00，排除配置的节假日。价格和节假日日历属于部署数据，必须显式维护。

每日用量可从保留的对话日志重建。引入每日统计前已删除的日志只保留此前保存的累计用量，无法恢复其每日明细。

区域标题不显示副标题，中间卡片突出账户余额或当日费用确认前的剩余额度。

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现细节——点击展开</summary>

[估算器](src/estimate.ts)汇总持久化的请求和助手用量事件，排除 fork 继承历史，并处理同一次尝试中的替换用量。[服务](src/index.ts)在对话 flush 后及日志删除前刷新独立账本。余额请求解析服务器凭据，并合并同时发生的刷新。本包没有独立 Token 计数器，估算由对话日志派生，因此不提供 invariant 配套模块。

</details>

<a id="further-exploration"></a>
## 进一步探索

- [对话控制器](../../api/session-controller/README.zh.md)
- [存储域](../../storage/storage-domain/README.zh.md)
- [凭据](../../credentials/credentials/README.zh.md)

<a id="model-experience"></a>
## 模型体验

无；账本读取已报告的用量，余额查询不调用模型。

#### KV Cache 影响

计费统计不会改变模型请求，也不会使已可复用的前缀失效。

## 已知限制与延后工作

<a id="known-limitations-and-deferred-work"></a>

- 未知提供方或模型价格显示为未计价请求，不计入预估费用。
- 子对话独立显示，其用量不合并到父对话行。
- 余额可能包含本 Harness 实例之外的账户活动。

### 开发备注

<details>
<summary>维护者工作上下文——点击展开</summary>

无。

</details>

点击深色工作区合计行可折叠或展开所属对话明细；合计数值保持显示。
