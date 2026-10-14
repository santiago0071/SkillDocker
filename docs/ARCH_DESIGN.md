# SkillDocker 架构设计白皮书 (Architecture Design Document)

## 一、系统愿景与设计哲学

SkillDocker 的使命是解决 AI Agent 时代最关键的人机协作断层：**从“黑盒文件配置”进化为“透明可控的即时交互坞”**。

### 核心设计原则 (Design Principles)
1. **零阻力唤起 (Zero-Friction Summoning)**：以系统级全局热键（如 `Alt + Space`）随时随地在任何应用上方以浮层形式弹出，完成指令输入后毫秒级隐入后台。
2. **非侵入式同步 (Non-Intrusive Synchronization)**：不改变各家 Agent 原生的文件组织逻辑，只在底层做优雅的 AST 解析与双向热编译，不污染开发者的 Git 分支。
3. **极轻量原生底盘 (Ultra-Lightweight Footprint)**：基于 Tauri 2.0 (Rust)，将后台待机内存严格压制在 30MB 以内，CPU 占用趋近于 0%，绝不做沉重臃肿的 Electron 怪物。

---

## 二、整体系统分层架构

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Layer 1: Presentation & Interaction                  │
│   Raycast-style Floating Overlay | Skill Cards | Live Directive Box    │
│                     (React 19 + TailwindCSS + Motion)                  │
├──────────────────────────────────┬─────────────────────────────────────┤
│                                  │                                     │
│  Layer 2: IPC & State Bridge     │  Layer 3: Workspace Sensor (Rust)   │
│  Tauri Commands & Event Emitter  │  Active Window & IDE Detection      │
│                                  │                                     │
├──────────────────────────────────┴─────────────────────────────────────┤
│                                                                        │
│                Layer 4: Universal Skill Compiler (AST)                 │
│         Parses, Normalizes, and Compiles Agent Capabilities            │
│                                                                        │
├──────────────────┬──────────────────┬──────────────────┬───────────────┤
│ Target A:        │ Target B:        │ Target C:        │ Target D:     │
│ Antigravity      │ Claude Code      │ Cursor /         │ MCP Server    │
│ (.agents/skills) │ (CLAUDE.md)      │ Windsurf Rules   │ Dynamic Config│
└──────────────────┴──────────────────┴──────────────────┴───────────────┘
```

---

## 三、四大核心子系统设计

### 1. 工作区自动感知器 (Workspace Sensor)
- **触发机制**：监听操作系统前台活动窗口变迁（Windows Win32 `GetForegroundWindow` / macOS `NSWorkspace`）；
- **解析逻辑**：
  1. 获取活动 IDE（VS Code、Cursor、Windsurf、CLion、WebStorm 或 Windows Terminal）；
  2. 读取活动窗口标题与进程打开的文件路径，自动解析出当前正在工作的项目根目录（Project Root）；
  3. 自动扫描根目录下的 Agent 配置文件指纹：
     - 是否存在 `.agents/skills/`（Google Antigravity）
     - 是否存在 `CLAUDE.md`（Claude Code）
     - 是否存在 `.cursorrules` 或 `.windsurfrules`（Cursor / Windsurf）

### 2. 统一技能抽象语法树 (Unified Skill AST)
为了让一个 Skill 在所有 AI 框架下无缝流转，定义统一的内部数据结构：

```typescript
interface UnifiedSkill {
  id: string;                      // 唯一标识符，如 "growth-marketing"
  name: string;                    // 友好显示名称
  version: string;                 // 版本号，如 "2.2.0"
  description: string;             // 核心作用简述
  enabled: boolean;                // 当前工作区是否激活
  category: 'marketing' | 'safety' | 'writing' | 'devops' | 'custom';
  
  // 核心规则结构
  directives: {
    corePhilosophy: string[];      // 底层红线与不可逾越原则
    workflowSOPs: WorkflowStep[];  // 标准作业流程
    dynamicDirectives: string[];   // 创始人/用户即时注入的动态微调规则
  };

  // 依赖与工具
  toolsRequired?: string[];        // 依赖的 CLI 或 MCP 脚本
}
```

### 3. 双向热编译器与写入门禁 (Universal Compiler & Hot-Reload)
- **向外编译 (Compile)**：
  - 当用户在 SkillDocker 界面开关某个技能或敲下一段即时指令：
  - 编译器瞬间将 `UnifiedSkill` 生成对应的原生文件：
    - 输出为 `.agents/skills/<name>/SKILL.md`（Antigravity 格式）
    - 追加至 `CLAUDE.md` 的 Active Directives 区块（Claude Code 格式）
    - 写入 `.cursorrules`（Cursor 格式）
- **向内反向解析 (Reverse Ingest)**：
  - 如果开发者在 VS Code 中直接手动改动了 `SKILL.md`，Rust 监听器（`notify` crate）毫秒级捕捉变更，逆向同步至 SkillDocker 浮窗，保证双向绝对一致。

### 4. 动态指令注入框 (Live Directive Injector)
- **定位**：解决“临时叮嘱一句话，却不想大动干戈改文件”的高频场景。
- **机制**：
  - 浮窗底部的即时输入框常驻激活；
  - 用户敲入：*“注意：下周二发布会前，不要在任何文案中泄露定价信息”*；
  - 注入器自动将其标注为高优先级 `[Live Directive - 2026-10-06]`，直接附着在所有活动 Skill 的最前沿；
  - 支持“单次会话生效”或“持久化写入”。

---

## 四、安全与数据主权 (Security & Privacy)

1. **绝对本地优先 (100% Local-First)**：
   - 所有 Skill 解析、编译、写入全部在用户个人电脑本地完成；
   - 零云端依赖，零私有代码与商业机密上传。
2. **防误触文件备份 (Shadow Backup)**：
   - 任何由 SkillDocker 触发的文件改写，均在内存与 `.skilldocker/history/` 留存轻量级 Diff 快照；
   - 支持一键撤销（Undo All Injections），彻底杜绝误操作。

---

## 五、开发演进阶段表

| 阶段 | 核心里程碑 | 交付物 |
| :--- | :--- | :--- |
| **M1: 极简内核** | Tauri 2.0 桌面工程初始化 + 全局快捷键呼出 | 可运行的桌面悬浮毛玻璃面板 |
| **M2: 文件感知** | 本地 `.agents/skills` 扫描与卡片式状态渲染 | 可视化技能卡片与开关切换 |
| **M3: 即时注入** | 动态指令输入框 + 毫秒级写入生效 | 真正解决“即时随手改规矩”的痛点 |
| **M4: 全生态转译** | 同时支持 Antigravity / Claude Code / Cursor | 真正的 Universal Agent Cockpit |
| **M5: 社区与开源** | GitHub 开源发布 + Product Hunt 冲榜 | 全球开发者社区推广 |
