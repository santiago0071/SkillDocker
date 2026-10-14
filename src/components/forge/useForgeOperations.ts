import { useState, useRef, useCallback } from 'react';
import { SkillMeta, EcosystemTarget } from '../../types/index.ts';
import { AiConfig } from '../../core/aiClient.ts';
import { AiService } from '../../core/aiService.ts';
import {
  createSkillNative,
  deployToWorkspaceNative,
  pickAndRegisterWorkspaceNative,
} from '../../core/clientBridge.ts';
import { Language } from '../../i18n/index.ts';
import { CompiledSkillResult } from '../../core/crossCompiler.ts';
import { ModularLegoConfig } from './types.ts';
import { PROVIDERS_MENU } from './constants.ts';
import { assembleMarkdownFromLego } from './useForgeAssembly.ts';

export interface UseForgeOperationsParams {
  prompt: string;
  setPrompt: (p: string) => void;
  skillName: string;
  setSkillName: (name: string) => void;
  skillCategory: string;
  setSkillCategory: (cat: string) => void;
  skillDescription: string;
  setSkillDescription: (desc: string) => void;
  skillBodyMarkdown: string;
  setSkillBodyMarkdown: (md: string) => void;
  skillVersion: string;
  deployEcosystem: 'antigravity' | 'claude' | 'codex' | 'agents' | 'all';
  setGeneratedSource: (src: 'llm' | 'template') => void;
  setStage: (stage: 'input' | 'revealed') => void;
  setSaveSuccessInfo: (info: { skillName: string; filePath: string; ecosystem: string; time: number } | null) => void;
  saveToHistory: (item: {
    name: string;
    category: string;
    description: string;
    markdown: string;
    doctorScore?: number;
    gradeLabel?: string;
    prompt?: string;
    source?: 'llm' | 'template';
  }) => void;
  legoConfig: ModularLegoConfig;
  customRequirement: string;
  aiConfig: AiConfig;
  hasValidApiKey: boolean;
  currentCompiled: CompiledSkillResult;
  onSkillCreated: (skill: SkillMeta) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  lang: Language;
}

export function useForgeOperations({
  prompt,
  skillName,
  setSkillName,
  skillCategory,
  setSkillCategory,
  skillDescription,
  setSkillDescription,
  skillBodyMarkdown,
  setSkillBodyMarkdown,
  skillVersion,
  deployEcosystem,
  setGeneratedSource,
  setStage,
  setSaveSuccessInfo,
  saveToHistory,
  legoConfig,
  customRequirement,
  aiConfig,
  hasValidApiKey,
  currentCompiled,
  onSkillCreated,
  showToast,
  lang,
}: UseForgeOperationsParams) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isDeployingToWorkspace, setIsDeployingToWorkspace] = useState(false);

  // Resizable split ratio in revealed stage
  const [forgeSplitRatio, setForgeSplitRatio] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('skilldocker_forge_split_ratio');
      if (saved) return parseFloat(saved);
    } catch {}
    return 50;
  });
  const forgeSplitContainerRef = useRef<HTMLDivElement>(null);

  const handleForgeSplitResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!forgeSplitContainerRef.current) return;
      const rect = forgeSplitContainerRef.current.getBoundingClientRect();
      const rawPct = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      const clamped = Math.min(Math.max(rawPct, 20), 80);
      setForgeSplitRatio(clamped);
    };

    const onMouseUp = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      setForgeSplitRatio((latest) => {
        try {
          localStorage.setItem('skilldocker_forge_split_ratio', String(latest));
        } catch {}
        return latest;
      });
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, []);

  const handleForgeSplitReset = useCallback(() => {
    setForgeSplitRatio(50);
    try {
      localStorage.setItem('skilldocker_forge_split_ratio', '50');
    } catch {}
  }, []);

  // AI Fallback Dialog State
  const [aiFallbackDialog, setAiFallbackDialog] = useState<{
    isOpen: boolean;
    providerName: string;
    reason: string;
    isKeyMissing: boolean;
  } | null>(null);

  const applyGeneratedBlueprint = useCallback((
    gen: { name?: string; category?: string; description?: string; bodyMarkdown?: string },
    source: 'llm' | 'template'
  ) => {
    const sName = gen.name || 'custom-agent-skill';
    const sCat = gen.category || 'workflow';
    const sDesc = gen.description || (lang === 'zh' ? `针对 [${prompt.trim()}] 的专用 Agent 技能与规则约束。` : `Tailored Agent skill for "${prompt.trim()}".`);
    const sMd = gen.bodyMarkdown || '';

    setSkillName(sName);
    setSkillCategory(sCat);
    setSkillDescription(sDesc);
    setSkillBodyMarkdown(sMd);
    setGeneratedSource(source);
    setStage('revealed');
    saveToHistory({
      name: sName,
      category: sCat,
      description: sDesc,
      markdown: sMd,
      doctorScore: 96,
      gradeLabel: source === 'llm' ? 'AI 智能生成' : '模板生成',
      prompt: prompt.trim(),
      source: source,
    });
    showToast(
      lang === 'zh'
        ? (source === 'llm'
            ? `✓ 真实 AI 大模型智能构想完成！已激活体检医生`
            : `✓ 已使用本地高确定性预设模板生成！已激活体检医生`)
        : (source === 'llm' ? `✓ Skill crafted via real AI model!` : `✓ Skill generated via offline template!`),
      'success'
    );
  }, [prompt, lang, setSkillName, setSkillCategory, setSkillDescription, setSkillBodyMarkdown, setGeneratedSource, setStage, saveToHistory, showToast]);

  const handleAiForge = async () => {
    if (!prompt.trim() || isGenerating) return;

    const currentProvider = PROVIDERS_MENU.find((p) => p.id === aiConfig.activeProvider);
    const providerName = currentProvider ? currentProvider.label : (aiConfig.activeProvider || '').toUpperCase();

    if (!hasValidApiKey) {
      setAiFallbackDialog({
        isOpen: true,
        providerName,
        reason: lang === 'zh'
          ? `当前选择的驱动模型为 [${providerName}]，尚未在系统设置中配置有效 API Key。`
          : `The active provider [${providerName}] has no valid API Key configured in Settings.`,
        isKeyMissing: true,
      });
      return;
    }

    setIsGenerating(true);
    showToast(
      lang === 'zh'
        ? `✨ AI 架构师 (${providerName}) 正在构想 [${prompt.trim()}] 的专属技能与规则约束...`
        : `✨ AI Architect (${providerName}) crafting Skill & SOP for "${prompt.trim()}"...`,
      'info'
    );

    try {
      const data = await AiService.forgeSkill(prompt.trim(), 'workflow', aiConfig);
      if (data && data.generated) {
        applyGeneratedBlueprint(data.generated, data.source);
      }
    } catch (err: any) {
      console.warn('AI Forge generation failed:', err);
      const errorMsg = err?.message || (lang === 'zh' ? '大模型接口响应异常或网络连接超时' : 'AI model request failed or timed out');
      setAiFallbackDialog({
        isOpen: true,
        providerName,
        reason: errorMsg,
        isKeyMissing: false,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFallbackToTemplate = () => {
    setAiFallbackDialog(null);
    const result = AiService.forgeSkillWithTemplate(prompt.trim(), 'workflow');
    applyGeneratedBlueprint(result.generated, 'template');
  };

  const handleAssembleManualSkill = () => {
    const title = customRequirement.trim() || legoConfig.name;
    const cleanId = (legoConfig.name || 'custom-skill')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-');

    const body = assembleMarkdownFromLego(legoConfig, title);
    const desc = `针对 [${title}] 的模块化技能与规则。触发场景：在处理相关工程任务与架构决策时必须优先激活遵守；在无关领域切勿调用。`;

    setSkillName(cleanId);
    setSkillCategory(legoConfig.category);
    setSkillDescription(desc);
    setSkillBodyMarkdown(body);
    setGeneratedSource('template');
    setStage('revealed');
    saveToHistory({
      name: cleanId,
      category: legoConfig.category,
      description: desc,
      markdown: body,
      doctorScore: 98,
      gradeLabel: '合规',
      prompt: customRequirement.trim() || legoConfig.name,
      source: 'template',
    });
    showToast(lang === 'zh' ? '✓ 模块拼装完成！已激活体检医生诊断看板' : '✓ Modular skill assembled!', 'success');
  };

  const handleDeployToWorkspace = async (target: EcosystemTarget) => {
    setIsDeployingToWorkspace(true);
    try {
      const workspaceDir = await pickAndRegisterWorkspaceNative();
      if (!workspaceDir) {
        showToast(lang === 'zh' ? '已取消选择部署目录' : 'Deployment cancelled', 'info');
        return;
      }

      const data = await deployToWorkspaceNative(
        {
          name: skillName,
          description: skillDescription,
          category: skillCategory,
          version: skillVersion,
          bodyMarkdown: skillBodyMarkdown,
        },
        target,
        workspaceDir
      );

      if (data.success) {
        showToast(
          lang === 'zh'
            ? `⚡ 成功装载至工程 [${workspaceDir}]！已生成 [${data.fileName}] (${data.badge})`
            : `⚡ Deployed to [${workspaceDir}] as [${data.fileName}]!`,
          'success'
        );
      } else {
        showToast(data.error || '装载工程失败', 'error');
      }
    } catch (err: any) {
      showToast(`Workspace deploy error: ${err.message}`, 'error');
    } finally {
      setIsDeployingToWorkspace(false);
    }
  };

  const handleDeployGlobal = async (targetEco?: string) => {
    const finalEco = targetEco || deployEcosystem;
    if (!skillName.trim()) {
      showToast(lang === 'zh' ? '请输入合法的技能英文标识符' : 'Invalid skill identifier', 'error');
      return;
    }

    setIsDeploying(true);
    try {
      let data = await createSkillNative({
        name: skillName.trim(),
        category: skillCategory,
        description: skillDescription.trim(),
        version: skillVersion,
        bodyText: skillBodyMarkdown,
        ecosystem: finalEco,
        overwrite: false,
      });

      if (!data.success && (data.alreadyExists || (data.error && data.error.includes('already exists')))) {
        const confirmOverwrite = window.confirm(
          lang === 'zh'
            ? '已存在同名技能，是否覆盖或改名？点击【确定】覆盖已有技能，点击【取消】返回修改技能名称。'
            : 'Skill already exists. Overwrite or rename? Click [OK] to overwrite, or [Cancel] to rename.'
        );
        if (confirmOverwrite) {
          data = await createSkillNative({
            name: skillName.trim(),
            category: skillCategory,
            description: skillDescription.trim(),
            version: skillVersion,
            bodyText: skillBodyMarkdown,
            ecosystem: finalEco,
            overwrite: true,
          });
        } else {
          showToast(lang === 'zh' ? '已取消覆盖，请修改技能名称' : 'Cancelled overwrite. Please rename the skill.', 'info');
          return;
        }
      }

      if (data.success && data.skill) {
        const savedPath = data.skill.rawPath || `~/.gemini/config/skills/${skillName.trim()}/SKILL.md`;
        setSaveSuccessInfo({
          skillName: skillName.trim(),
          filePath: savedPath,
          ecosystem: finalEco === 'all' ? '全生态同步' : finalEco.toUpperCase(),
          time: Date.now(),
        });
        showToast(
          lang === 'zh'
            ? `🎉 技能 [${skillName.trim()}] 锻造成功！已真实写入本地全局库 (${finalEco === 'all' ? '全生态同步' : finalEco.toUpperCase()})`
            : `🎉 Skill [${skillName.trim()}] deployed successfully to global ${finalEco}!`,
          'success'
        );
        onSkillCreated(data.skill);
      } else {
        showToast(data.error || '创建技能失败', 'error');
      }
    } catch (err: any) {
      showToast(`Deploy error: ${err.message}`, 'error');
    } finally {
      setIsDeploying(false);
    }
  };

  const handleCopyCurrentCompiled = () => {
    navigator.clipboard.writeText(currentCompiled.compiledContent);
    showToast(
      lang === 'zh'
        ? `✓ 已复制 [${currentCompiled.badge}] 规范代码 (${currentCompiled.fileName})！`
        : `✓ Copied ${currentCompiled.badge} format!`,
      'success'
    );
  };

  return {
    isGenerating,
    isDeploying,
    isDeployingToWorkspace,
    forgeSplitRatio,
    forgeSplitContainerRef,
    handleForgeSplitResizeStart,
    handleForgeSplitReset,
    aiFallbackDialog,
    setAiFallbackDialog,
    handleAiForge,
    handleFallbackToTemplate,
    handleAssembleManualSkill,
    handleDeployToWorkspace,
    handleDeployGlobal,
    handleCopyCurrentCompiled,
  };
}
