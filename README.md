# SkillDocker 🛸

> **A beginner-friendly, all-in-one lightweight desktop manager to inspect, cast, learn, and diagnose AI skills.**  
> *Manage, toggle, and hot-inject directives across Claude Code, Cursor, Antigravity, and Codex. 100% local and offline.*

[English](#skilldocker-) | [中文说明](#-skilldocker-中文说明)

[![Release: v1.0.0](https://img.shields.io/badge/Release-v1.0.0-blue.svg)](https://github.com/santiago0071/SkillDocker/releases)
[![License: MIT / Open-Core](https://img.shields.io/badge/License-MIT%20%7C%20Open--Core-emerald.svg)](LICENSE)
[![Platform: Windows | macOS](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS-indigo.svg)](https://github.com/santiago0071/SkillDocker/releases)
[![Stack: Tauri 2.0 | Rust | React 19](https://img.shields.io/badge/Stack-Tauri%202.0%20%7C%20Rust%20%7C%20React%2019-cyan.svg)](https://v2.tauri.app/)

---

![SkillDocker Main HUD Cockpit](assets/screenshots/hero-hud-dark.png)

---

## 📖 What Problem Does SkillDocker Solve?

When using multiple AI coding assistants (Claude Code, Cursor, Google Antigravity, Codex), skills and rules end up scattered across hidden dot-directories (`~/.claude/skills`, `.cursor/rules`, `~/.gemini`, `.codex`). Two practical headaches constantly arise:

1. **Invisible & Hard to Track**: Skills live in separate folders. When starting a project, it is hard to see which skills are active and whether any of them contradict each other.
2. **Temporary Directives Get Lost**: Instructing an AI in chat (e.g. *"Only fix frontend bugs, do not touch backend APIs"*) gets forgotten once context compacts. But manually digging into hidden folders to modify skill files creates unnecessary friction.

> *"A Prompt is a temporary order; a Skill is permanent company policy!"*

---

## ✨ Four Core Pillars

### 1. 🎛️ Skills Management (Inspect, Toggle & Hot-Inject)
- **Auto-Discovery**: Automatically scans and aggregates skills from Claude Code, Cursor, Antigravity, and Codex into one unified panel.
- **One-Click Toggle**: Enable or disable any skill instantly without renaming files manually.
- **Directive Hot-Injector (`Alt + Space`)**: Press a global hotkey to summon a floating input bar. Type a temporary instruction, and SkillDocker injects it into your active AI session so the agent never forgets.

### 2. 🛠️ Skill Forge (Visual Creation)
- **Visual Builder**: Build structured, standard skill files (`SKILL.md`, `.mdc`) using guided templates instead of writing boilerplate from scratch.
- **BYOK AI Review**: Connect your own API key to get instant AI feedback on skill phrasing, triggers, and constraints.

### 3. 🎓 Novice Academy (Beginner-Friendly Learning)
- **Curated Templates**: Built-in best practice rules, system directives, and skill templates designed to help beginners master AI-assisted programming.
- **Clear Explanations**: Understand how skills work, when they trigger, and how to avoid prompt drift.

### 4. 🩺 Health & Diagnosis
- **Syntax & Format Check**: Automatically inspect skills for missing frontmatter, broken links, and malformed YAML.
- **Conflict Detection**: Identify overlapping globs and contradicting instructions across multiple active rules.

---

## 🎨 Themes: Modern Dark HUD & Retro Win98

- **Cyber Dark HUD**: High-contrast, clean floating cockpit designed for dark-mode IDE setups.
- **Retro Windows 98**: Authentic classic 3D gray beveled borders, pixel icons, and nostalgic status bar.

![SkillDocker 98 Retro Nostalgic Skin](assets/screenshots/skin-win98-retro.png)

---

## 🛡️ 100% Local-First & Privacy Invariant

- **Zero Cloud Services**: Runs entirely on your local machine. Never uploads your source code, project paths, or private prompts to any external server.
- **Ultra-Lightweight**: Built natively with Tauri 2.0 & Rust. Idle memory consumption is ~40MB RAM.

---

## 📥 Download & Quick Start

Download pre-built binaries from [GitHub Releases (v1.0.0)](https://github.com/santiago0071/SkillDocker/releases):

| Platform | Format | Architecture | Notes |
|---|---|---|---|
| **Windows** | `.exe` / `.msi` | x64 | Double-click installer, ready to use |
| **macOS** | `.dmg` | Apple Silicon / Intel | Drag and drop into Applications folder |

### Global Hotkey
- **Windows**: `Alt + Space`
- **macOS**: `Option + Space`

### Run from Source
```bash
git clone https://github.com/santiago0071/SkillDocker.git
cd SkillDocker
npm install
npm run tauri dev
```

---

## 🏛️ Editions (Open-Core)

SkillDocker follows an open-core architecture:

| Feature | Community Edition (Free) | Pro Edition (Commercial) |
|---|:---:|:---:|
| Multi-AI Skill Auto-Scanning & HUD | ✅ Yes | ✅ Yes |
| Global Hotkey & Directive Hot-Injection | ✅ Yes | ✅ Yes |
| Dark HUD & Retro Win98 Themes | ✅ Yes | ✅ Yes |
| 100% Local-First Sandbox & Offline Operation | ✅ Yes | ✅ Yes |
| L3 Adversarial Benchmark Test Suite | ❌ No | ✅ Pro Exclusive |
| Cross-Skill Deadlock & Architecture Health Check | ❌ No | ✅ Pro Exclusive |
| AI Targeted Auto-Optimization & Write Confirmation | ❌ No | ✅ Pro Exclusive |
| License | **MIT (Open Source)** | **One-Time Buyout (Perpetual Offline)** |

> Commercial Pro licenses can be purchased at [https://skilldocker.com/buy/](https://skilldocker.com/buy/).

---

## ☕ Sponsor & Support

If SkillDocker brings clarity to your daily coding workflow, support for independent development is warmly welcome:

- **Pro License**: [Get SkillDocker Pro](https://skilldocker.com/buy/)
- **Ko-fi**: [https://ko-fi.com/unistudio](https://ko-fi.com/unistudio)
- **Crypto (Direct On-Chain)**:
  - BTC: `1888z7bmtkwdj7PsFRG6Xctw4g4aJJjjZT`
  - EVM (ETH/USDT/USDC): `0x888888F17960daF6f21847c0f9B3A9F5d52d3eEd`
  - SOL: `88886b1EW3S9rNtbtaWmZoiz6H4A536cuUw9rRLhc7kn`
  - NEAR: `8888618.near`
- **Star**: Leave a **Star 🌟** on GitHub to help more developers discover the tool!

---

## 📄 License

- Core framework code is licensed under [MIT License](LICENSE).
- Pro commercial extensions are licensed under [LICENSE-PRO](LICENSE-PRO).

Official Website: [https://skilldocker.com](https://skilldocker.com)

---
---

# 🛸 SkillDocker (中文说明)

> **AI Skills 新人友好的 Skill 管理、铸造、诊断、学习一体化轻量管理器**  
> *集中查看、一键开关、随时为正在运行的 AI 追加临时要求。纯本地离线运行，不上传代码。*

## 📖 这个工具解决什么实际问题？

平时用多个 AI 编程助手（Claude Code、Cursor、Google Antigravity、Codex）写代码时，Skills 散落在各个深层隐藏目录（`~/.claude/skills`、`.cursor/rules`、`~/.gemini`、`.codex`）。日常开发常常遇到两个烦人痛点：

1. **看不见、记不清**：Skills 藏在不同的文件夹里。开工时根本记不清当前到底有哪些 Skills 在生效，不同的 Skills 之间会不会相互冲突。
2. **临时叮嘱容易忘，每次手动改文件太麻烦**：在聊天窗口里临时交代 AI“这次只改前端，不要动后端接口”，会话一刷新或上下文一压缩，AI 扭头就忘了；而如果每次都手动翻隐藏文件夹改文件，又非常繁琐。

> *“聊天里的 Prompt 只是随口交代的临时要求，写成文件沉淀下来的 Skill 才是长期执行的规章制度。”*

---

## ✨ 四大核心功能

### 1. 🎛️ Skills 管理（集中查看、开关与热注入）
* **自动汇总多工具 Skills**：自动识别本地 Claude Code、Google Antigravity、Codex 和 Cursor 项目里的所有 Skills，集中展示。
* **一键开关**：点击按钮即可启用或停用某个 Skill，软件自动在后台切换，无需手动重命名文件。
* **随时追加临时要求 (`Alt + Space`)**：在写代码的任何时候按下全局快捷键，立即呼出轻量输入框，输入一句要求即可同步给当前 AI，防止遗忘。

### 2. 🛠️ Skills 创造（可视化铸造工坊）
* **积木式编写**：将角色设定、约束条件、触发词等模块化快速拼装成标准的 Skill 文件。
* **自带模型检查 (BYOK)**：填入自己的 API Key，即可调用大模型帮您检查 Skill 质量并给出润色建议。

### 3. 🎓 小白学习（新手友好学习与模版）
* **常用模版与规则参考**：内置行业经过实战检验的标准 Skills 模版，新手也能快速弄懂 AI 编程指令。
* **通俗大白话解析**：解释清楚技能生效时机与防飘原则，让新手不踩坑。

### 4. 🩺 Skills 诊断（健康检查与防冲突）
* **语法与格式体检**：自动扫描 YAML 头部缺失、死链、格式错误等常见毛病。
* **多规则冲突排查**：检查多个正在生效的规则是否存在指令冲突与上下文过度膨胀。

---

## 🎨 两种主题风格：极客暗黑与 Win98 怀旧复古

* **赛博暗黑驾驶舱**：高对比度、清晰直观的现代极客暗黑界面。
* **Windows 98 复古皮肤**：完整还原经典的灰白立体边框、复古像素图标与状态栏，给日常编程换个心情。

---

## 🛡️ 纯本地离线运行，绝不上传您的代码

* **0 云端依赖**：所有 Skills 扫描、读取与修改只在您的本地电脑执行，绝无任何常驻云端服务，绝不上传您的项目代码与私密提示词。
* **极低资源占用**：基于 Tauri 2.0 + Rust 原生开发，后台内存占用仅约 40MB。

---

## 📥 下载安装

请在 [GitHub Releases (v1.0.0)](https://github.com/santiago0071/SkillDocker/releases) 页面下载适合您操作系统的预编译安装包：

| 平台 | 安装包格式 | 架构 | 说明 |
|---|---|---|---|
| **Windows** | `.msi` / `.exe` | x64 (64-bit) | 双击运行安装向导，开箱即用 |
| **macOS** | `.dmg` | Apple Silicon / Intel | 挂载后将应用拖拽入 Applications 目录 |

### 快捷唤醒
* **Windows**: `Alt + Space`
* **macOS**: `Option + Space`

---

## 🏛️ 版本划分 (Open-Core)

| 功能维度 | 社区开源版 (Community) | 商业专业版 (Pro) |
|---|:---:|:---:|
| 全生态多工具 Skill 扫描与 HUD 展示 | ✅ 支持 | ✅ 支持 |
| 全局快捷键呼出与通用指令热注入 | ✅ 支持 | ✅ 支持 |
| 赛博暗黑 HUD / Win98 复古怀旧等多套皮肤 | ✅ 支持 | ✅ 支持 |
| 纯本地白名单沙箱与离线运行 | ✅ 支持 | ✅ 支持 |
| L3 对抗性问题集与量化精准率基准测试 | ❌ | ✅ 专业版独占 |
| 跨 Skill 行为死锁与架构全景会诊 | ❌ | ✅ 专业版独占 |
| AI 一键靶向自动优化与写入确认 | ❌ | ✅ 专业版独占 |
| 授权形式 | **MIT 开源免费** | **一次性买断 (永久离线可用)** |

> 商业版授权可在官方网站 [https://skilldocker.com/buy/](https://skilldocker.com/buy/) 获取。

---

## ☕ 赞助与支持

欢迎通过以下方式随缘支持：
* **商业授权**：在官网获取 [SkillDocker Pro 商业买断授权](https://skilldocker.com/buy/)
* **Ko-fi**：[https://ko-fi.com/unistudio](https://ko-fi.com/unistudio)
* **开源支持**：点亮一颗 **Star 🌟**，或将它分享给身边正在被散乱 Prompt 困扰的朋友！

---

## 📄 许可证

* 核心框架代码采用 [MIT License](LICENSE) 开源许可；
* Pro 商业扩展模块适用 [LICENSE-PRO](LICENSE-PRO) 专有商业许可。

官网主页：[https://skilldocker.com](https://skilldocker.com)
