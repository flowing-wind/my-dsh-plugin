---
description: "删除已保存对话或工作区登记，并显式确认是否删除磁盘文件。"
kind: "package-bundle"
---

# @deepseek-ai/dsh-experimental-workspace-management

[English](README.md) | 中文

## 概述

从原生侧栏菜单删除对话，包括归档条目。工作区删除弹窗提供两个独立且默认未勾选的选项：删除受管理的磁盘目录、删除该工作区的全部对话（含归档）。

## 目录

- [使用本包](#use-this-package)
- [理解实现](#understand-the-implementation)
- [进一步探索](#further-exploration)
- [模型体验](#model-experience)
- [已知限制与延后工作](#known-limitations-and-deferred-work)

<a id="use-this-package"></a>
## 使用本包

发行包 `@flowing-wind/dsh-workspace-management` 的 `1.0.5` 版本支持官方 Harness `0.2.1-rc.2` Windows Desktop 与 Linux Web。从[仓库索引](https://raw.githubusercontent.com/flowing-wind/my-dsh-plugin/main/market/index.json)安装这一个包即可；包内包含匹配的管理提供方和工作区确认扩展，应用程序本身保持官方版本。

安装、升级或停用前先等待正在运行的任务结束，再按提示重启。停用后恢复标准 profile 的提供方。源码部署使用配套 Host 补丁。

可选的 `managedWorkspaceRoot` 将文件删除范围限制在一个已存在的绝对父目录下。服务器可以保留现有设置；标准桌面端无需配置。

```yaml
- name: '@deepseek-ai/dsh-experimental-workspace-management'
  config:
    managedWorkspaceRoot: /absolute/path/to/managed-workspaces
```

配置根目录时，只有其子目录可以从磁盘删除。未配置时，可删除不同磁盘上符合条件的已登记工作区目录。磁盘及共享根目录、用户主目录及其父目录、Harness 数据、应用程序和系统目录受到保护。删除对话先停止其所属 Agent，再删除日志并解除工作区关联。删除工作区时，只有勾选对应选项才会删除文件或日志。删除文件前会停止相关所属 Agent。停用插件会移除菜单和归档列表中的删除操作，并恢复普通工作区确认弹窗。

打包配置层在存在 `DSH_WORKSPACE_ROOT` 时读取该值。删除使用 Host 当前账号已有的权限，不请求提权。文件占用或权限不足会使删除失败；文件删除失败时保留工作区登记，但已删除的文件不会恢复。确认弹窗显示实际登记目录。

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现细节——点击展开</summary>

[Host](src/index.ts)通过对话控制器关闭活动写入者，通过工作区登记服务移除登记。它按当前平台的路径规则检查实际目录，并删除符合条件的目录，不跟随工作区路径别名。[客户端](src/client/actions.tsx)要求显式确认。持久化和工作区提供方拥有持久记录，本包不维护独立索引，因此不提供 invariant 配套模块。

</details>

<a id="further-exploration"></a>
## 进一步探索

- [对话控制器](../../api/session-controller/README.zh.md)
- [对话持久化](../../session/session-persistence/README.zh.md)
- [工作区登记](../../workspace/workspace/README.zh.md)

<a id="model-experience"></a>
## 模型体验

### 浏览器删除

#### 模型看到的内容

无。`workspace-management` 提供已认证的浏览器删除功能，不增加模型工具或提示词。

#### Token 影响

无。

#### KV Cache 影响

删除不改写保留的对话或其可复用请求前缀。

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
