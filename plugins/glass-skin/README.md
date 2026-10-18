---
description: "An optional glass skin with a centered wallpaper and browser-local appearance settings."
kind: "package-bundle"
---

# @deepseek-ai/dsh-experimental-glass-skin

English | [中文](README.zh.md)

## Summary

A removable appearance extension with native Harness dark mode, Oregairu and Whiteout wallpapers, and browser-local custom images. The sidebar uses the official Harness wordmark.

## Table of Contents

- [Use](#use)
- [Implementation](#implementation)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)

<a id="use"></a>
## Use

Install the bundled cordis.patch.yml layer and enable the plugin. Settings → Background offers Native dark, Oregairu, Whiteout, and local images. A fresh browser starts with native appearance; existing wallpaper preferences remain active. Selecting a preset sets the theme to dark. Wallpaper panel opacity ranges from 0 to 1, initially 0.7, and is disabled in native mode. Images use center / cover without changing text opacity.

Custom PNG, JPEG, WebP, AVIF and GIF images are decoded and converted to WebP in the browser, with the longest side capped at 2560 pixels. Animated images use a single frame. Image bytes stay in IndexedDB; opacity stays in localStorage. No custom wallpaper is sent to the server. Disabling the plugin removes its stylesheet, controls and Host route, while retaining local preferences for re-enabling.

<a id="implementation"></a>
## Implementation

The authenticated Host routes serve preset wallpapers with private browser caching. Native mode removes the wallpaper attribute and uses official theme styles. Wallpaper mode contributes theme colors and paints matching backgrounds on raised surfaces to cover text underneath. Menus use the official components. Browser storage is the sole preference owner, so there is no independent runtime invariant companion.

<a id="model-experience"></a>
## Model Experience

### Appearance

#### What the model sees

Nothing. `glass-skin` contributes no tools, prompts or session events.

#### Token effect

No model input is added.

#### KV Cache effect

No model input is added.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- Preferences are local to a browser and site origin. Clearing browser site data removes them. Custom images require available browser storage. Embedded PDFs, external pages and generated isolated HTML retain their own styling. Low opacity can reduce readability on bright wallpapers; the setting includes a contrast hint. The packaged wallpaper is the installation owner's supplied asset.

File icons use a subset of Material Icon Theme 5.38.1 SVG artwork; its MIT license ships in assets/Material-Icon-Theme-LICENSE.txt.

### Dev Note

None.
