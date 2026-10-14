# SkillDocker v1.0.0 官方宣发与 GitHub SEO 资产包 (Launch Kit)

> 适用范围：GitHub 仓库设置、GitHub Releases 发布说明、Show HN、V2EX、X (Twitter) 与开发者社区。  
> 风格基调：**冷静、克制、实事求是、杜绝夸大**。

---

## 一、 GitHub 仓库自身 SEO 设定 (Repository Settings)

进入 GitHub 仓库主页，点击右上角 `About` 旁边的 ⚙️ 小齿轮，直接复制粘贴以下内容：

### 1. Description（仓库一句话简介，权重最高）
```text
A lightweight desktop floating dock to inspect, toggle, and hot-inject directives across Claude Code, Cursor, Antigravity, and Codex. 集中查看与管理多款 AI 编程工具 Skills 的本地桌面悬浮面板。
```

### 2. Website（官方站点）
```text
https://skilldocker.com
```

### 3. Topics（精准搜索标签，全部添加）
```text
ai-agents, agentic-coding, claude-code, cursor, antigravity, tauri, rust, desktop-app, developer-tools, local-first, prompt-engineering, skills
```

### 4. 社交媒体分享卡片 (Social Preview)
* GitHub 仓库 `Settings` ➔ `General` ➔ `Social preview` ➔ 上传 `assets/screenshots/hero-hud-dark.png`。
* 当有人在 Twitter、Discord、Telegram、Slack 或微信分享仓库链接时，会自动展开高清暗黑 HUD 卡片。

---

## 二、 GitHub Releases (v1.0.0) 官方发布文案

当打上 `v1.0.0` 标签后，在 GitHub Releases 页面填入以下内容：

### Release Title
```text
SkillDocker v1.0.0: Floating Dock for AI Agent Skills (Official Debut)
```

### Release Body (Markdown)
```markdown
## What is SkillDocker? / 这是什么？

SkillDocker is a lightweight, local-first desktop floating dock designed for developers using multiple AI coding tools (Google Antigravity, Claude Code, OpenAI Codex, Cursor). If you have dozens of Skills scattered across deep hidden directories (`~/.claude/skills`, `~/.gemini`, `.cursorrules`), SkillDocker lets you inspect, toggle, and steer them from a single floating dock.

SkillDocker 是一个极轻量的本地桌面悬浮面板。日常写代码使用 Claude Code、Cursor、Google Antigravity 或 Codex 时，各类 Skills 常常散落在深层隐藏目录里。SkillDocker 帮你把它们集中展示在一处，随时一键开关、随时按快捷键为当前 AI 追加临时要求。完全本地离线运行，不上传任何代码。

---

## Key Highlights in v1.0.0 / 核心能力

- 🎛️ **Centralized Skills Viewer**: Automatically discovers and displays Skills across `~/.claude/skills`, `~/.gemini`, `~/.codex`, and local workspaces without cloud relay.
- ⚡ **Quick Directive Injector**: Press `Alt + Space` (Windows) or `Option + Space` (macOS) anywhere to quickly type a steering instruction for the active agent without digging into config files.
- 🎨 **Modern Dark HUD & Retro Win98 Skin**: Switch between a sleek cyberpunk HUD and a fully functional nostalgic Windows 98 skin.
- 🛠️ **Skill Forge**: Modular rule assembler with BYOK (Bring Your Own Key) model checks to craft clean Skill files.
- 🛡️ **100% Local-First & Offline**: Pure local file operations. Zero telemetry, zero cloud tracking, and offline Ed25519 verification.


---

## Downloads & Installation / 安装包下载

| Platform | File | Checksum / Architecture |
|---|---|---|
| **Windows** | `SkillDocker_1.0.0_x64-setup.exe` / `.msi` | x64 (Windows 10/11) |
| **macOS** | `SkillDocker_1.0.0_aarch64.dmg` | Apple Silicon (M1/M2/M3/M4) & Intel |

### Quick Start
1. Install and launch SkillDocker.
2. Press `Alt + Space` (`Option + Space` on macOS) anywhere to toggle the HUD.
3. Manage your skills or type a quick directive to steer your active agent.

---

*Open source under MIT License. Pro edition available at [skilldocker.com](https://skilldocker.com).*
```

---

## 三、 社区宣发草稿 (Community Launch Posts)

### 1. Hacker News (Show HN)
* **Title**: `Show HN: SkillDocker – A local-first desktop HUD for AI agent skills`
* **Text**:
```text
Hi HN,

I built SkillDocker because my local environment was turning into an unmanageable mess of AI rules, skills, and prompt directives across different tools (Google Antigravity, Claude Code, Codex, and Cursor).

In day-to-day coding, two recurring problems kept bugging me:
1. Visibility: Rules are scattered across ~/.claude/skills, ~/.gemini, and .cursorrules. I often forgot which guidelines were actively modifying the agent's behavior.
2. Ephemeral vs. Permanent: In chat, typing "don't touch file X" or "use this format" works for a few turns until context compacts and it's forgotten. Opening IDE files to manually update YAML/Markdown every time has too much friction.

SkillDocker is a lightweight native desktop dock (built with Tauri 2.0 and Rust) that you summon with Alt+Space / Option+Space:
- It discovers all your skills locally without any cloud backend.
- Lets you hot-inject steering directives on the fly.
- Completely offline: license verification uses Ed25519 asymmetric cryptography locally, no phone-home servers.
- Built-in Windows 98 nostalgic skin for fun alongside the dark HUD.

Code is open source (Open-Core): https://github.com/santiago0071/SkillDocker
Site & standalone binaries: https://skilldocker.com

Would love any critical feedback on rule organization and multi-agent workflows.
```

---

### 2. V2EX (程序员 / 分享创造)
* **Title**: `[分享创造] 做了一个开源的 AI Agent Skill 桌面驾驶舱，解决多工具规则散落与指令丢失（顺手做了套 Win98 怀旧皮肤）`
* **Content**:
```markdown
各位 V 友大家好，

最近半年深度使用各类 AI 编程 Agent（Claude Code、Cursor、Google Antigravity、Codex 等），本地积累了上百个业务规范和技能规约（分布在各个隐藏目录下的 Markdown 和 YAML 里）。

在日常高强度使用中，遇到两个非常头疼的真实痛点：
1. **资产碎片化与黑盒**：很多规约写完了就塞在深层文件夹里，开工时根本记不清当前到底挂载了哪些规则，各技能之间有没有逻辑冲突。
2. **临时 Prompt 与制度的鸿沟**：在聊天窗口反复交代的临时提示词（如“这次不要改模块 B”），会话一刷新或上下文一压缩就没了；而每次手动去翻配置文件改规约，切换阻力又太大。

于是做了一个轻量级本地桌面 HUD 工具 —— **SkillDocker**：
- **全局快捷键**：随时按 `Alt + Space` 唤起浮动窗口；
- **全生态扫描**：自动探测并可视化展示本机的 Skill 资产与运行状态；
- **就地热注入**：输入一句自然语言指令，后台自动安全同步至对应 Agent 规则中；
- **纯本地、0 云端**：基于 Tauri 2.0 + Rust 研发，内存占用极低，没有常驻云端守护进程，商业版激活也是纯本地 Ed25519 离线验签；
- **一点极客恶趣味**：除了默认的赛博暗黑驾驶舱，还完整做了一套致敬经典的 **Windows 98 复古怀旧皮肤**。

- 核心代码开源：https://github.com/santiago0071/SkillDocker
- 官网：https://skilldocker.com

核心功能完全开源免费，商业版为一次性买断。目前刚刚发布 v1.0.0，欢迎各位提出宝贵的吐槽和改进建议！
```

---

### 3. X (Twitter) 宣发 Thread
```text
🧵 1/4
Managing AI coding rules across Claude Code, Cursor, and Antigravity was getting out of hand.

So I built SkillDocker: A local-first, lightweight desktop HUD for your agent skills.

Summon with Alt+Space. Zero cloud lock-in.

Open source: github.com/santiago0071/SkillDocker
[附图: hero-hud-dark.png]

---

2/4
"A prompt is a temporary order; a skill is permanent company policy."

Chat prompts disappear after context compaction. SkillDocker bridges quick on-the-fly steering directives with your persistent skill files.
[附图: novice-academy-quote.png]

---

3/4
Built with Tauri 2.0 & Rust (< 20MB RAM).
Features:
- Live skill asset radar
- Cross-tool directive injector
- BYOK Skill Forge studio
- Pure offline Ed25519 verification
- And yes, a full Windows 98 nostalgic skin 👾
[附图: skin-win98-retro.png]

---

4/4
v1.0.0 is officially live with Windows & macOS builds.

Try it out: skilldocker.com
GitHub: github.com/santiago0071/SkillDocker

Feedback and stars are deeply appreciated! 🛸
```
