---
description: "Password verification with revocable credentials held by one browser page."
kind: "package-bundle"
---

# @deepseek-ai/dsh-experimental-page-login

English | [中文](README.zh.md)

## Summary

The public page shows a blurred wallpaper and password dialog. It uses the browser's selected preset or local wallpaper, and falls back to the default wallpaper when no preference exists. Private application initialization waits for authentication. A logout action appears above Settings in the left sidebar after login.

## Table of Contents

- [Configuration](#configuration)
- [Authentication](#authentication)
- [Model Experience](#model-experience)
- [Limitations](#limitations)

<a id="configuration"></a>
## Configuration

Enable the bundled layer in a Web profile and supply passwordHash, idleMs, and attemptsPerMinute. passwordHash contains a random 16-byte salt and a 64-byte scrypt digest as lowercase hex separated by a colon. The digest uses Node's scrypt defaults (N=16384, r=8, p=1). Plaintext passwords belong only in the verification request; neither the plugin package nor its server configuration stores them. idleMs sets idle expiry, with a minimum of 60000 milliseconds. attemptsPerMinute limits verification attempts per direct peer address; a reverse proxy shares that allowance.

<a id="authentication"></a>
## Authentication

The plugin replaces Connection's startup-token and cookie authentication while retaining Host/Origin validation. Root HTML, the login endpoint, and the two packaged wallpapers are public. Protected HTTP requests and WebSocket upgrades require an in-memory credential. The page keeps no login cookie, localStorage entry, or sessionStorage entry. New pages and refreshes require another password entry.

Closing the page sends a best-effort revocation beacon; logout explicitly revokes its credential and connected WebSockets. Crashes may prevent the beacon, but a reopened page has no credential. Idle expiry removes abandoned server entries. Browser-native previews and downloads carry the parent page's credential in their request URL; reverse-proxy access logs must redact the pageToken query parameter. Static HTML previews keep that credential outside their opaque content iframe. An already downloaded file or already rendered preview cannot be recalled by logout.

<a id="model-experience"></a>
## Model Experience

This plugin adds no tools, prompts, or Session events. Login and logout do not stop agent work on the server.

<a id="limitations"></a>
## Limitations

Use HTTPS when serving the login over a public domain. There is one shared password and no account or role management. Disabling the plugin restores the configured default authentication provider. No separate invariant entry is exported: authentication reads its own credential registry rather than maintaining independent replicas.
