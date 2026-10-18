---
description: "可选玻璃皮肤：居中壁纸与浏览器本地外观设置。"
kind: "package-bundle"
---

# @deepseek-ai/dsh-experimental-glass-skin

[English](README.md) | 中文

## 概述

可拆卸外观扩展，提供 Harness 原生深色、春物及 Whiteout 壁纸和浏览器本地图片。侧栏使用官方 Harness 完整标志。

## 目录

- [使用](#use)
- [实现](#implementation)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)

<a id="use"></a>
## 使用

安装随包 cordis.patch.yml 配置层并开启插件。设置 → 背景外观提供原生深色、春物、Whiteout 和本地图片。首次使用采用原生界面，已有壁纸偏好继续生效。选择预设会切换为深色主题。壁纸面板不透明度为 0～1，初始值为 0.7，原生模式下禁用。图片使用 center / cover，文字透明度不变。

自定义 PNG、JPEG、WebP、AVIF 和 GIF 在浏览器内解码并转换为 WebP，最长边限制为 2560 像素。动画图片使用单帧。图片内容保存在 IndexedDB，不透明度保存在 localStorage，不向服务器发送自定义壁纸。关闭插件会移除样式、控件和 Host 接口，但保留本地偏好供再次开启时使用。

<a id="implementation"></a>
## 实现

已认证的 Host 接口提供预设壁纸，允许浏览器私有缓存。原生模式移除壁纸属性，使用官方主题样式。壁纸模式提供主题颜色，并在浮层绘制匹配背景以遮住下层文字。菜单使用官方组件。浏览器存储是偏好的唯一持有方，因此没有独立的运行时 invariant 配套模块。

<a id="model-experience"></a>
## 模型体验

### 外观

#### 模型看到的内容

无。`glass-skin` 不添加工具、提示词或对话事件。

#### Token 影响

无。

#### KV Cache 影响

无。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

- 偏好仅属于当前浏览器和网站源，清除网站数据会将其移除。自定义图片需要可用的浏览器存储。内嵌 PDF、外部页面和生成的隔离 HTML 保持自身样式。低不透明度可能降低明亮壁纸上的可读性，设置中提供了对比度提示。随包壁纸为安装者提供的素材。

文件图标采用 Material Icon Theme 5.38.1 的 SVG 子集；MIT 许可随 assets/Material-Icon-Theme-LICENSE.txt 分发。

### 开发备注

无。
