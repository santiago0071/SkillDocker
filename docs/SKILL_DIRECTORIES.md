# Agent Skills 存放目录规范与官方对照表 (SKILL_DIRECTORIES.md)

本文档根据各平台官方文档逐页核实（核验日期：2026-10-10），系统梳理 Claude Code、Codex、Gemini CLI、Google Antigravity 与 Agent Skills 开放规范在不同操作系统下的技能（Skills）存放目录规则，涵盖用户级（全局）、工作区级（项目级）与系统级目录。

---

## 一、各工具技能目录规范对照表

| 工具 / 生态 | 级别 | 目录路径 (以类 Unix / Windows 为例) | 官方文档 URL | 规范要求与技术特性 |
| :--- | :--- | :--- | :--- | :--- |
| **Claude Code** | 用户级 (全局) | `~/.claude/skills/<skill-name>/SKILL.md` | [Claude Code Skills](https://code.claude.com/docs/en/skills) | **官方标准目录**。<br>支持 Live change detection（新增、编辑、删除 SKILL.md，当前会话内即时生效，无需重启）。官方文档未列出 `~/.agents/skills`。 |
| **Claude Code** | 用户级 (同步) | `~/.claude/skills/synced/<skill-name>/SKILL.md` | [Claude Code Skills](https://code.claude.com/docs/en/skills) | **官方同步目录**。<br>从 claude.ai 云端自动同步，`synced` 为保留名，本地修改会被同步覆盖，客户端应标记为只读。 |
| **Claude Code** | 用户级 (回收站) | `~/.claude/skills/.trash/` | [Claude Code Skills](https://code.claude.com/docs/en/skills) | **官方回收站目录**。<br>存放已移除的技能，客户端扫描时应排除。 |
| **Claude Code** | 项目级 (工作区) | `<workspace>/.claude/skills/<skill-name>/SKILL.md` | [Claude Code Skills](https://code.claude.com/docs/en/skills) | **官方项目目录**。<br>仓库根目录下定义，供团队成员共享，同样支持会话内实时热重载。 |
| **Codex** | 用户级 (全局) | `$HOME/.agents/skills/<skill-name>/SKILL.md` | [Codex Skills Docs](https://developers.openai.com/codex/skills) | **官方用户级目录**。<br>个人全局可用技能。 |
| **Codex** | 仓库级 (工作区) | `<workspace>/.agents/skills/<skill-name>/SKILL.md` | [Codex Skills Docs](https://developers.openai.com/codex/skills) | **官方仓库级目录**。<br>按当前目录、上级目录、仓库根目录层级寻址加载。 |
| **Codex** | 系统级 (管理员) | `/etc/codex/skills/<skill-name>/SKILL.md` | [Codex Skills Docs](https://developers.openai.com/codex/skills) | **官方管理员级目录**。<br>系统全局预配技能。 |
| **Codex (兼容)** | 用户/项目级 | `~/.codex/skills/`<br>`<workspace>/.codex/skills/` | [Codex Skills Docs](https://developers.openai.com/codex/skills) | **官方文档未列出，可能是旧版路径，待实测**。<br>客户端扫描时标记为 legacy，新建与部署目标重定向至 `.agents/skills`。 |
| **Gemini CLI** | 用户级 (全局) | `~/.gemini/skills/<skill-name>/SKILL.md`<br>别名：`~/.agents/skills/<skill-name>/SKILL.md` | [Gemini CLI Skills](https://geminicli.com/docs/cli/skills/) | **官方全局目录及别名**。<br>优先读取 `~/.gemini/skills/`，同时支持 `~/.agents/skills/` 别名。 |
| **Gemini CLI** | 工作区 (项目级) | `<workspace>/.gemini/skills/<skill-name>/SKILL.md`<br>别名：`<workspace>/.agents/skills/<skill-name>/SKILL.md` | [Gemini CLI Skills](https://geminicli.com/docs/cli/skills/) | **官方工作区目录及别名**。<br>支持项目本地技能，需在受信任工作区（`/trust`）中生效。 |
| **Google Antigravity** | 全局 (用户级) | `~/.gemini/config/skills/<skill-name>/SKILL.md` | [Antigravity Skills](https://antigravity.google/docs/skills) | **官方首选全局目录**。<br>Antigravity 全局配置级首要发现路径。 |
| **Google Antigravity** | 全局 (旧目录) | `~/.gemini/antigravity/skills/<skill-name>/SKILL.md` | [Antigravity Skills](https://antigravity.google/docs/skills) | **官方兼容旧目录**。<br>旧版运行时技能路径，官方持续予以支持。 |
| **Google Antigravity** | 工作区 (项目级) | `<workspace>/.agents/skills/<skill-name>/SKILL.md`<br>`<workspace>/.agent/skills/<skill-name>/SKILL.md` | [Antigravity Skills](https://antigravity.google/docs/skills) | **官方工作区目录**。<br>支持 `.agents/` 与 `.agent/`，自当前工作目录向上寻址至 VCS 根目录。 |
| **Antigravity CLI** | 全局 (命令行) | `~/.gemini/antigravity-cli/skills/<skill-name>/SKILL.md` | [Antigravity Skills](https://antigravity.google/docs/skills) | **官方 CLI 全局目录**。<br>Antigravity CLI 命令行客户端专属全局技能目录。 |
| **Agent Skills 开放规范** | 跨生态通用 | 根目录下 `SKILL.md`，推荐放置于 `.agents/skills/` | [Agent Skills Specification](https://agentskills.io/specification) | **跨生态开放标准规范**。<br>规范了 frontmatter、name、description、目录同名校验及渐进式披露原则。 |

---

## 二、目录与工具读取关系对照表 (readBy)

根据官方文档规范，技能目录与 AI 工具之间存在明确的多对多读取关系：

| 目录路径 | 读取工具 (`readBy`) | 说明 |
| :--- | :--- | :--- |
| `~/.claude/skills/` (不含 synced/.trash) | `["claude-code"]` | Claude Code 专属个人技能目录 |
| `~/.claude/skills/synced/` | `["claude-code"]` | Claude Code 从 claude.ai 同步的只读技能 |
| `<workspace>/.claude/skills/` | `["claude-code"]` | Claude Code 项目级技能目录 |
| `~/.agents/skills/` | `["codex", "gemini-cli"]` | Codex 官方用户级目录，Gemini CLI 官方别名目录 |
| `<workspace>/.agents/skills/` | `["codex", "gemini-cli", "antigravity"]` | Codex 仓库级目录、Gemini CLI 工作区别名、Antigravity 工作区首选目录 |
| `<workspace>/.agent/skills/` | `["antigravity"]` | Antigravity 工作区兼容目录 |
| `~/.gemini/skills/` | `["gemini-cli"]` | Gemini CLI 官方用户级首选目录 |
| `<workspace>/.gemini/skills/` | `["gemini-cli"]` | Gemini CLI 官方工作区首选目录 |
| `~/.gemini/config/skills/` | `["antigravity"]` | Antigravity 官方全局首要目录 |
| `~/.gemini/antigravity/skills/` | `["antigravity"]` | Antigravity 官方兼容旧全局目录 |
| `~/.gemini/antigravity-cli/skills/` | `["antigravity-cli"]` | Antigravity CLI 命令行专属全局目录 |
| `~/.codex/skills/` (legacy) | `["codex"]` | Codex 旧版/生态惯用路径（官方文档未列出，标记为 legacy） |
| `<workspace>/.codex/skills/` (legacy) | `["codex"]` | Codex 旧版工作区路径（官方文档未列出，标记为 legacy） |

---

## 三、SkillDocker 扫描、部署与安全实现策略

1. **扫描发现策略**：
   - 用户级覆盖：`~/.gemini/config/skills`、`~/.gemini/skills`、`~/.gemini/antigravity/skills`、`~/.gemini/antigravity-cli/skills`、`~/.claude/skills`（含 `synced/`，排除 `.trash/`）、`~/.agents/skills`，以及兼容扫描 `~/.codex/skills`（标为 `legacy: true`）；
   - 工作区级覆盖：授权工作区的 `.claude/skills`、`.gemini/skills`、`.agents/skills`、`.agent/skills`，以及兼容扫描 `.codex/skills`；
   - 过滤规则：跳过 `~/.claude/skills/.trash/`；对 `~/.claude/skills/synced/` 下的技能标记 `readOnly: true`；
   - 属性注入：为每个发现的技能注入 `sourceDir`、`readBy`、`readOnly`、`isLegacy` 等元数据。

2. **新建与部署策略**：
   - 当目标生态为 `codex` 时，默认写入用户级 `~/.agents/skills/<name>/SKILL.md`（项目级写入 `<workspace>/.agents/skills/<name>/SKILL.md`）；
   - 对 `readOnly` 技能（如 claude synced）阻断写操作与回滚操作，给出明确引导提示。

3. **安全路径白名单 (`is_path_safe_internal` & `is_dir_safe_internal`)**：
   - 将 `~/.gemini/antigravity-cli/skills`、`~/.agents/skills` 及各工作区合法技能目录均纳入安全沙箱白名单。
