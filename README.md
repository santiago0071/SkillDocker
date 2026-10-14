# SkillDocker 🛸

> **The Visual Dock & Live Steering Hub for AI Agent Skills**  
> **面向 AI Agent Skill 的桌面可视化驾驭与动态注入底座**  
> *A local-first, lightweight desktop HUD to discover, inspect, and hot-inject directives across Google Antigravity, Anthropic Claude Code, OpenAI Codex, and Cursor.*

[![Release: v1.0.0](https://img.shields.io/badge/Release-v1.0.0-blue.svg)](https://github.com/santiago0071/SkillDocker/releases)
[![License: MIT / Open-Core](https://img.shields.io/badge/License-MIT%20%7C%20Open--Core-emerald.svg)](LICENSE)
[![Platform: Windows | macOS](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS-indigo.svg)](https://github.com/santiago0071/SkillDocker/releases)
[![Stack: Tauri 2.0 | Rust | React 19](https://img.shields.io/badge/Stack-Tauri%202.0%20%7C%20Rust%20%7C%20React%2019-cyan.svg)](https://v2.tauri.app/)

---

![SkillDocker Main HUD Cockpit](assets/screenshots/hero-hud-dark.png)

---

## 📖 核心初衷与设计哲学 / Philosophy & Problem Statement

在当前智能体开发日常中，开发者往往在本地积累了数十乃至上百个技能规约与提示词规则（分布在 `~/.gemini`、`~/.claude`、`~/.codex`、`.cursorrules` 等各个目录）。然而在实际协作中，开发者常面临两个真实的工程痛点：

In modern AI agent workflows, developers routinely accumulate dozens or hundreds of skills, rule files, and prompt directives across diverse tools (`~/.gemini`, `~/.claude`, `~/.codex`, `.cursorrules`). In day-to-day work, two distinct frictions emerge:

1. **盲区与碎片化 (Invisible & Fragmented Assets)**：
   规约文件分散在多层文件树中。没有统一的可视化面板，开发者极易遗忘当前有哪些规则在生效，各技能之间是否存在行为重叠或逻辑冲突。
   *Skills are scattered deep inside disparate dot-directories. Without visual inspection, it is difficult to maintain situational awareness of which directives are active.*

2. **临时指令与沉淀规约的鸿沟 (Ephemeral Prompts vs. Permanent Policies)**：
   我们在会话中反复向 Agent 叮嘱“不要修改某个模块”、“按照特定风格编码”，这些临时提示词一旦会话结束或上下文被压缩后即告丢失；而手动打开编辑器修改对应配置文件又存在较高的切换阻力。
   *Chat prompts are temporary orders that disappear when conversations compact. SkillDocker provides a fast, tactile way to bridge on-the-fly steering with persistent skill assets.*

![Novice Academy Quote](assets/screenshots/novice-academy-quote.png)

> *"A Prompt is a temporary order; a Skill is permanent company policy!"*  
> *“Prompt 只是临时交代的工作指令，Skill 才是沉淀下来的企业级执行章程。”*

---

## ✨ 核心特性 / Core Capabilities

### 1. 🎛️ 全生态技能资产雷达 (Visual Skill Cockpit)
* **跨工具无感扫描**：自动探测全局与项目工作区内的技能资产（Google Antigravity、Claude Code、Codex、Cursor、Roo）。
* **卡片式沉浸阅读**：一键查阅各 Skill 的规约详情、工具依赖、触发条件与运行状态，支持毫秒级全文检索与分类筛选。
* **物理开关控制**：可视化切换技能挂载状态，无需手动翻找并重命名目录。

### 2. ⚡ 跨工具通用指令热注入 (Universal Directive Hot-Injector)
* **全局快捷键一键唤醒**：在任何编程界面按下 `Alt + Space`（macOS 为 `Option + Space`），即刻呼出极简悬浮面板。
* **就地输入与同步编译**：输入自然语言微调指令（如“本次修复聚焦于模块 A，严禁变动公网接口”），后台自动安全同步至对应 Agent 的规则上下文，实现轻量级敏捷调控。

### 3. 🎨 极客审美：赛博暗黑 HUD 与 Win98 怀旧皮肤 (Adaptive Themes)
* **Dark HUD 驾驶舱**：高对比度、沉浸式赛博朋克极客暗黑风，信息层级清晰明了。
* **SkillDocker 98 怀旧皮肤**：完整致敬经典的 Windows 98 灰白立体倒角、经典点阵图标与状态栏，给日常开发注入一份复古浪漫。

![SkillDocker 98 Retro Nostalgic Skin](assets/screenshots/skin-win98-retro.png)

### 4. 🛠️ Skill Forge 技能工坊 (Visual Studio)
* **乐高积木拼装**：将指令、约束规则、触发条件模块化拼装。
* **自主模型接入 (BYOK)**：支持通过自定义 API Key 调用主流模型进行规约诊断与自动润色。

![Skill Forge Studio](assets/screenshots/skill-forge-studio.png)

### 5. 🛡️ 纯本地离线优先与密码学验证 (Local-First & Offline Security)
* **0 云端依赖**：所有文件扫描、解析与修改均在本地操作系统通过白名单路径严格执行，绝无任何常驻云端守护进程或隐私遥测回传。
* **Ed25519 离线验签**：商业版许可证采用工业级非对称数字签名，完全在客户端本地完成离线密码学校验，授权永久有效。

---

## 📥 下载安装 / Download & Quick Start

请在 [GitHub Releases (v1.0.0)](https://github.com/santiago0071/SkillDocker/releases) 页面下载适合您操作系统的预编译安装包：

| 平台 / Platform | 安装包格式 / Package | 架构 / Architecture | 说明 / Notes |
|---|---|---|---|
| **Windows** | `.msi` / `.exe` | x64 (64-bit) | 双击运行安装向导，开箱即用 |
| **macOS** | `.dmg` | Apple Silicon (M1/M2/M3/M4) & Intel | 挂载后将应用拖拽入 Applications 目录 |

### 快捷唤醒 (Shortcut)
* **Windows**: `Alt + Space`
* **macOS**: `Option + Space`

---

## 🏛️ 版本划分 / Editions (Open-Core)

SkillDocker 采用国际成熟的 **Open-Core** 架构模式：

| 功能维度 / Feature | 社区开源版 (Community) | 商业专业版 (Pro) |
|---|:---:|:---:|
| 全生态多工具 Skill 扫描与 HUD 展示 | ✅ 支持 | ✅ 支持 |
| 全局快捷键呼出与通用指令热注入 | ✅ 支持 | ✅ 支持 |
| 赛博暗黑 HUD / Win98 复古怀旧等多套皮肤 | ✅ 支持 | ✅ 支持 |
| 纯本地白名单沙箱与离线运行 | ✅ 支持 | ✅ 支持 |
| L3 对抗性问题集与量化精准率基准测试 | ❌ | ✅ 专业版独占 |
| 跨 Skill 行为死锁与架构全景会诊 | ❌ | ✅ 专业版独占 |
| AI 一键靶向自动优化与写入确认 | ❌ | ✅ 专业版独占 |
| 授权形式 / Licensing | **MIT 开源免费** | **一次性买断 (永久离线可用)** |

> 商业版授权可在官方网站 [https://skilldocker.com/buy/](https://skilldocker.com/buy/) 获取（支持信用卡、PayPal、Apple Pay、Google Pay 等全球主流结算方式）。

---

## 🛡️ 本地质量门禁验证 (Engineering Verification)

本项目遵循严苛的工业级防呆与代码质量防线。所有提交均须通过本地 7 道核心自动化门禁：

```powershell
# 运行 7 道全量门禁 (TypeScript + ESLint + 单元测试 + 社区版物理隔离防泄密 + Rust Clippy + 64 项 Rust 单元测试)
powershell -ExecutionPolicy Bypass -File .\scripts\verify.ps1
```

门禁包含专门的物理隔离测试（`verify-community.ps1`），在拔除闭源模块的环境下独立构建并进行反泄漏二进制扫描（Anti-Leak Audit），确保开源社区版绝不夹带任何闭源残留。

---

## ☕ 赞助与支持 / Sponsor & Support

SkillDocker 由独立开发者利用业余时间精心研发与持续维护。如果您在日常工作流中感受到了它带来的秩序与便利，欢迎通过以下方式给予支持：

If SkillDocker brings order and clarity to your daily agent workflow, any support for its continued independent maintenance is deeply appreciated:

### 1. 软件支持 / Commercial License
* 在官网获取 [SkillDocker Pro 商业买断授权](https://skilldocker.com/buy/)，享受完整深度诊断特性。

### 2. 社区捐赠 / Ko-fi
* **Ko-fi**: [https://ko-fi.com/unistudio](https://ko-fi.com/unistudio) (支持信用卡 / PayPal / Apple Pay)

### 3. 加密货币支持 / Crypto Donations (Direct On-Chain)
面向全球极客开发者，支持以下链上直接赞助地址：

```text
Bitcoin (BTC):
1888z7bmtkwdj7PsFRG6Xctw4g4aJJjjZT

EVM Compatible (Ethereum, BNB Chain, Polygon, Arbitrum, Base - ETH / USDT / USDC):
0x888888F17960daF6f21847c0f9B3A9F5d52d3eEd

Solana (SOL / SPL Tokens):
88886b1EW3S9rNtbtaWmZoiz6H4A536cuUw9rRLhc7kn

Algorand (ALGO):
66666RUJ7XE76NKJIMS72JPXAFIFQNZGN6NYARGOKS4JFIML5ICBOTSFBM

NEAR Protocol:
8888618.near
```

### 4. 开源支持 / Open Source
* 给本仓库点亮一颗 **Star 🌟**，或将它分享给身边正在被散乱 Prompt 困扰的朋友！

---

## 📄 许可证 / License

* 核心框架代码采用 [MIT License](LICENSE) 开源许可；
* Pro 商业扩展模块适用 [LICENSE-PRO](LICENSE-PRO) 专有商业许可。

Crafted with care by **UniStudio** (by UniPublisher).  
Official Website: [https://skilldocker.com](https://skilldocker.com)
