---
description: "删除已保存对话或工作区登记，并显式确认是否删除磁盘文件。"
kind: "package-bundle"
---

# @deepseek-ai/dsh-experimental-workspace-management

[English](README.md) | 中文

## 概述

从侧栏对话菜单或设置中的已归档对话列表删除对话。原有工作区删除弹窗提供两个独立且默认未勾选的选项：删除受管理的磁盘目录、删除该工作区的全部对话（含归档）。

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

在 Web profile 中挂载以下条目。必填的 `managedWorkspaceRoot` 必须为已存在的绝对路径。

```yaml
- name: '@deepseek-ai/dsh-experimental-workspace-management'
  config:
    managedWorkspaceRoot: /absolute/path/to/managed-workspaces
```

只有此根目录的子目录可以从磁盘删除。删除对话先停止其所属 Agent，再删除日志并解除工作区关联。删除工作区时，只有勾选对应选项才会删除文件或日志。删除文件前会停止相关所属 Agent。停用插件会移除菜单和归档列表中的删除操作，并恢复普通工作区确认弹窗。

启动打包配置层前，将 `DSH_WORKSPACE_ROOT` 设为允许删除的工作区所在的现有绝对父目录。插件不能删除该父目录本身。

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现细节——点击展开</summary>

[Host](src/index.ts)通过对话控制器关闭活动写入者，通过工作区登记服务移除登记。它解析并检查磁盘路径，再重命名受管理目录并删除。[客户端](src/client/actions.tsx)要求显式确认。持久化和工作区提供方拥有持久记录，本包不维护独立索引，因此不提供 invariant 配套模块。

</details>

<a id="further-exploration"></a>
## 进一步探索

- [对话控制器](../../api/session-controller/README.zh.md)
- [对话持久化](../../session/session-persistence/README.zh.md)
- [工作区登记](../../workspace/workspace/README.zh.md)

<a id="model-experience"></a>
## 模型体验

无；已认证的浏览器删除操作不增加面向模型的输入。

#### KV Cache 影响

删除不会重写保留对话的请求 Token，也不会使其已可复用的前缀失效。

## 已知限制与延后工作

<a id="known-limitations-and-deferred-work"></a>

- 永久删除没有撤销或回收站。
- 删除目录会拒绝配置根目录之外的路径，以及解析目标与登记路径不同的路径。
- 保留的对话日志中，文件引用可能指向已被删除的工作区目录。

### 开发备注

<details>
<summary>维护者工作上下文——点击展开</summary>

无。

</details>
