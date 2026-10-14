import { ModularLegoConfig } from './types.ts';

export function assembleMarkdownFromLego(config: ModularLegoConfig, req: string): string {
  const title = req.trim() || config.name;
  let body = `# ${title} 核心技能与操作规范 (SOP)\n\n`;

  if (config.scopeTriggers) {
    body += `## 1. 适用边界与职责 (Scope & Triggers)\n- **何时使用 (When to use)**：处理涉及「${title}」相关的工程任务、代码编写、架构设计与重构时强制遵循。\n- **何时严禁使用 (When NOT to use)**：纯日常问答、只读调研或完全无关的技术栈环境。\n\n`;
  }

  const techItems: string[] = [];
  if (config.techStack.reactTs) {
    techItems.push('- **React 19 & TypeScript 5**：强制使用严谨强类型与现代 Hook，杜绝 any 滥用与过时类组件模式。');
  }
  if (config.techStack.tailwindCss) {
    techItems.push('- **Tailwind CSS 4 弹性防御**：所有文本容器强制配置 min-w-0、whitespace-nowrap 或 truncate 防溢出截断，严禁绝对像素写死宽度。');
  }
  if (config.techStack.pythonAsync) {
    techItems.push('- **Python 3.12+ AsyncIO**：优先采用异步并发与强类型注解 (Type Hints)，遵循 PEP 8 命名规范。');
  }
  if (config.techStack.rustSystems) {
    techItems.push('- **Rust Systems 健壮性**：严格利用所有权模型与模式匹配消除 panic，提供明确的 Result/Option 错误治理。');
  }
  if (config.techStack.generalClean) {
    techItems.push('- **高内聚低耦合架构**：坚持单一职责原则，模块间依赖单向传递，保持代码边界清晰透明。');
  }

  if (techItems.length > 0) {
    body += `## 2. 技术栈核心范式与编码约束 (Tech Stacks)\n${techItems.join('\n')}\n\n`;
  }

  const safetyItems: string[] = [];
  if (config.safety.surgicalDiff) {
    safetyItems.push('1. **外科手术式局部修改**：严格执行最小侵入式增量改动，严禁盲目大面积覆写，完整保留原有注释与代码结构。');
  }
  if (config.safety.zeroDataLoss) {
    safetyItems.push('2. **零数据丢失硬性红线**：严禁未经用户明确授权擅自删除既有业务代码、数据库表结构或生产环境配置文件。');
  }
  if (config.safety.authorIntent) {
    safetyItems.push('3. **原作者原意保真规范**：深入理解既有上下文与架构脉络，严禁主观臆测或擅自推翻已验证的业务逻辑。');
  }
  if (config.safety.secretsIsolation) {
    safetyItems.push('4. **敏感凭据绝对隔离**：严禁在日志、提示词或持久化文件中硬编码明文 API Key、私钥或生产密码。');
  }

  if (safetyItems.length > 0) {
    body += `## 3. 严格禁止项与安全红线 (Strict Negative Constraints)\n${safetyItems.join('\n')}\n\n`;
  }

  const workflowSteps: string[] = [];
  if (config.workflow.planFirst) {
    workflowSteps.push('1. **前置侦察与计划先行**：优先使用只读探针扫描基线，向用户提出明确方案，获得确认前绝不擅自动手修改；');
  } else {
    workflowSteps.push('1. **基线侦察**：优先利用只读探针扫描并定位现有依赖关系与调用链路；');
  }
  workflowSteps.push('2. **最小侵入实施**：严格遵照预定方案实施外科手术式改动，每处修改保持原子化；');
  if (config.workflow.diffAudit) {
    workflowSteps.push('3. **真机闭环验证与自测**：变更完成后必须执行本地构建与类型检查 (如 tsc / npm run build)，确保零报错交付；');
  } else {
    workflowSteps.push('3. **结果验证**：核验变更逻辑并检查返回预期；');
  }
  if (config.workflow.noAutoGitCommit) {
    workflowSteps.push('4. **禁止擅自 Git 提交**：严禁私自执行 git commit 或 git push，所有版本入库必须交由用户统一主导。');
  }

  body += `## 4. 标准执行作业程序 (Step-by-step Execution SOP)\n${workflowSteps.join('\n')}\n\n`;

  if (config.verificationChecklist) {
    body += `## 5. 交付验收自检清单 (Verification Checklist)\n- [ ] 是否已核验变更 Diff，确保未引入意外连带破坏？\n- [ ] 本地构建测试与代码规范检查是否 100% 通过？\n- [ ] 是否已逐条对照并符合所有负向安全红线？\n- [ ] 是否已向用户透明说明修改动机与改动边界？\n\n`;
  }

  if (config.rollbackSop) {
    body += `## 6. 应急降级与回滚预案 (Rollback Procedure)\n若执行出现不可预期报错或测试红灯：\n1. 立即中止所有后续写操作，防止破坏扩散；\n2. 从自动生成的快照 (.bak) 或 Git 版本控制恢复无损基线；\n3. 记录报错现场日志与调用栈，向用户如实复盘汇报。`;
  }

  return body;
}
