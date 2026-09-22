---
description: "An optional glass skin with a centered wallpaper and browser-local appearance settings."
kind: "package-bundle"
---

# @deepseek-ai/dsh-experimental-glass-skin

English | [中文](README.zh.md)

## Summary

A removable wallpaper skin with neutral translucent surfaces. The default Oregairu image is a 68 KB WebP; Whiteout is also available as a 244 KB preset. Both supplied PNGs remain unchanged.

## Table of Contents

- [Use](#use)
- [Implementation](#implementation)
- [Model Experience](#model-experience)
- [Limitations](#limitations)

<a id="use"></a>
## Use

Install the bundled cordis.patch.yml layer and enable the plugin. Settings → Transparent background controls opacity from 0 to 1, initially 0.7, thumbnail preset selection, local image selection, and restoring the default wallpaper. The image uses center center / cover: it preserves aspect ratio, aligns image and viewport centers, and crops excess edges. Text opacity is unaffected.

Custom PNG, JPEG, WebP, AVIF and GIF images are decoded and converted to WebP in the browser, with the longest side capped at 2560 pixels. Animated images use a single frame. Image bytes stay in IndexedDB; opacity stays in localStorage. No custom wallpaper is sent to the server. Disabling the plugin removes its stylesheet, controls and Host route, while retaining local preferences for re-enabling.

<a id="implementation"></a>
## Implementation

The authenticated Host route serves the packaged default wallpaper with private browser caching. The Client registers a settings section and removable theme overrides. Sidebar borders and neutral shading separate surfaces without blur. Composers, menus, tooltips, dialogs, trajectory details, code-block banners and fullscreen panels paint an opaque copy of the current wallpaper to cover text underneath. Native single-select controls open a wallpaper-backed in-page list with pointer and keyboard selection. The skin does not change the underlying theme preference. Browser storage is the sole preference owner, so there is no independent runtime invariant companion.

<a id="model-experience"></a>
## Model Experience

### Appearance

#### What the model sees

Nothing. The skin contributes no tools, prompts or session events.

#### Token impact

None.

#### KV Cache impact

None.

<a id="limitations"></a>
## Limitations

Preferences are local to a browser and site origin. Clearing browser site data removes them. Custom images require available browser storage. Embedded PDFs, external pages and generated isolated HTML retain their own styling. Low opacity can reduce readability on bright wallpapers; the setting includes a contrast hint. The packaged wallpaper is the installation owner's supplied asset.

File icons use a subset of Material Icon Theme 5.38.1 SVG artwork; its MIT license ships in assets/Material-Icon-Theme-LICENSE.txt.
