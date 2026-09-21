---
description: "可选玻璃皮肤：居中壁纸与浏览器本地外观设置。"
kind: "package-bundle"
---

# @deepseek-ai/dsh-experimental-glass-skin

[English](README.md) | 中文

## 概述

可拆卸壁纸皮肤，使用中性半透明面板。默认春物图片为 68 KB WebP，另有 244 KB 的 Whiteout 预设；两张原始 PNG 均保留。

## 目录

- [使用](#use)
- [实现](#implementation)
- [模型体验](#model-experience)
- [限制](#limitations)

<a id="use"></a>
## 使用

安装随包 cordis.patch.yml 配置层并开启插件。在设置 → 透明背景中调整 0～1 的不透明度，初始值为 0.7，通过缩略图切换预设、选择本地图片或恢复默认背景。图片使用 center center / cover：保持宽高比，让图片中心对齐窗口中心，裁剪超出的边缘。文字透明度不受影响。

自定义 PNG、JPEG、WebP、AVIF 和 GIF 在浏览器内解码并转换为 WebP，最长边限制为 2560 像素。动画图片使用单帧。图片内容保存在 IndexedDB，不透明度保存在 localStorage，不向服务器发送自定义壁纸。关闭插件会移除样式、控件和 Host 接口，但保留本地偏好供再次开启时使用。

<a id="implementation"></a>
## 实现

已认证的 Host 接口提供随包默认壁纸，并允许浏览器私有缓存。Client 注册设置分区及可卸载的主题覆盖。侧栏边框和中性底色区分各区域，不使用模糊。输入框、菜单、摘要浮层、弹窗和全屏面板绘制当前壁纸副本，遮住下层文字。原生单选控件打开与壁纸一致的网页内列表，支持鼠标和键盘选择。皮肤不修改原有主题偏好。浏览器存储是偏好的唯一持有方，因此没有独立的运行时 invariant 配套模块。

<a id="model-experience"></a>
## 模型体验

### 外观

#### 模型看到的内容

无。皮肤不添加工具、提示词或对话事件。

#### Token 影响

无。

#### KV Cache 影响

无。

<a id="limitations"></a>
## 限制

偏好仅属于当前浏览器和网站源，清除网站数据会将其移除。自定义图片需要可用的浏览器存储。内嵌 PDF、外部页面和生成的隔离 HTML 保持自身样式。低不透明度可能降低明亮壁纸上的可读性，设置中提供了对比度提示。随包壁纸为安装者提供的素材。


文件图标采用 Material Icon Theme 5.38.1 的 SVG 子集；MIT 许可随 assets/Material-Icon-Theme-LICENSE.txt 分发。
