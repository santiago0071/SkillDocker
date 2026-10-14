import React, { useState } from 'react';
import { SkillMeta, DiagnosticReport, OptimizationResult } from '../../types/index.ts';
import { AiConfig } from '../../core/aiClient.ts';
import { AiService } from '../../core/aiService.ts';
import { readSkillContent, saveSkillContent } from '../../core/clientBridge.ts';
import { SkillParser } from '../../core/parser.ts';
import { generateDiffSummary, validateContentPreservation } from '../../core/diffHelper.ts';
import {
  isProFeatureAvailable,
  isFeatureUnavailableError,
  isProLicenseRequiredError,
  getProGateStatus,
  openLicenseSettings,
} from '../../pro-api/index.ts';
import { Language } from '../../i18n/index.ts';
import { DiffPreviewData } from '../CommitConfirmModal.tsx';

interface UseDoctorOptimizationParams {
  activeSkill: SkillMeta | undefined;
  report: DiagnosticReport | null;
  aiConfig: AiConfig;
  lang: Language;
  onSkillRemedied?: (updatedSkill: SkillMeta) => void;
  setFeedbackMsg: (msg: { text: string; type: 'success' | 'error' | 'info' } | null) => void;
  setDiffConfirmData: (data: DiffPreviewData | null) => void;
  setUploadedSkills: React.Dispatch<React.SetStateAction<SkillMeta[]>>;
  onDiagnosisRequested: () => void;
}

export function useDoctorOptimization({
  activeSkill,
  report,
  aiConfig,
  lang,
  onSkillRemedied,
  setFeedbackMsg,
  setDiffConfirmData,
  setUploadedSkills,
  onDiagnosisRequested,
}: UseDoctorOptimizationParams) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [showOptimizationView, setShowOptimizationView] = useState(false);
  const [isApplyingOptimization, setIsApplyingOptimization] = useState(false);

  const handleTriggerOptimization = async () => {
    if (!activeSkill || !report) return;
    if (!isProFeatureAvailable('aiOptimizer')) {
      setFeedbackMsg({
        text: lang === 'zh' ? '此版本不包含该功能' : 'This edition does not include AI optimizer',
        type: 'error',
      });
      return;
    }
    if (getProGateStatus('aiOptimizer') === 'locked') {
      setFeedbackMsg({
        text: lang === 'zh' ? '需要 Pro 授权' : 'Pro license required',
        type: 'error',
      });
      openLicenseSettings();
      return;
    }
    setIsOptimizing(true);
    setFeedbackMsg(null);

    try {
      let rawContent = activeSkill.rawContent || '';
      if (!rawContent && activeSkill.rawPath) {
        rawContent = await readSkillContent(activeSkill.rawPath);
      }
      const optResult = await AiService.optimizeSkill(
        activeSkill.name,
        rawContent,
        report,
        aiConfig
      );

      if (optResult && optResult.optimizedContent) {
        setOptimizationResult({
          optimizedContent: optResult.optimizedContent,
          summaryOfChanges: optResult.diffSummary ? [optResult.diffSummary] : generateDiffSummary(rawContent, optResult.optimizedContent),
          supplements: report.supplementSuggestions || [],
        });
        setShowOptimizationView(true);
      } else {
        setFeedbackMsg({ text: 'AI 优化生成失败', type: 'error' });
      }
    } catch (err: any) {
      if (isProLicenseRequiredError(err)) {
        setFeedbackMsg({
          text: lang === 'zh' ? '需要 Pro 授权' : 'Pro license required',
          type: 'error',
        });
        openLicenseSettings();
      } else {
        const isUn = isFeatureUnavailableError(err);
        setFeedbackMsg({
          text: isUn ? (lang === 'zh' ? '此版本不包含该功能' : 'This edition does not include AI optimizer') : (err.message || 'AI 优化调用异常'),
          type: 'error',
        });
      }
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleApplyOptimization = async () => {
    if (!activeSkill || !optimizationResult?.optimizedContent) return;
    setFeedbackMsg(null);

    try {
      let rawContent = activeSkill.rawContent || '';
      if (!rawContent && activeSkill.rawPath) {
        rawContent = await readSkillContent(activeSkill.rawPath);
      }
      const diffSummary = generateDiffSummary(rawContent, optimizationResult.optimizedContent);

      setDiffConfirmData({
        title: lang === 'zh' ? '采纳 AI 优化版本 · 写入前确认' : 'Adopt Optimization · Confirm Commit',
        skillName: activeSkill.uploadedFileName || activeSkill.name,
        originalContent: rawContent,
        newContent: optimizationResult.optimizedContent,
        summaryOfChanges: diffSummary,
        onConfirmDiff: async () => {
          await executeCommitOptimizedContent(optimizationResult.optimizedContent);
        },
      });
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || '优化准备失败', type: 'error' });
    }
  };

  const executeCommitOptimizedContent = async (optContent: string) => {
    if (!activeSkill) return;
    setIsApplyingOptimization(true);
    try {
      let rawContent = activeSkill.rawContent || '';
      if (!rawContent && activeSkill.rawPath) {
        rawContent = await readSkillContent(activeSkill.rawPath);
      }
      const pres = validateContentPreservation(rawContent, optContent);
      if (!pres.isValid) {
        setFeedbackMsg({
          text: lang === 'zh' ? `写入拒绝：内容完整性校验失败 (${pres.reason})` : 'Write rejected: Content preservation failed',
          type: 'error',
        });
        return;
      }

      if (activeSkill.rawPath) {
        await saveSkillContent(activeSkill.rawPath, optContent);
      }

      const parsed = SkillParser.parse(
        optContent,
        activeSkill.name,
        activeSkill.rawPath || activeSkill.name
      );
      const updatedSkill: SkillMeta = {
        ...activeSkill,
        ...parsed.meta,
        rawContent: optContent,
        uploadedFileName: activeSkill.uploadedFileName,
      };

      setUploadedSkills((prev) =>
        prev.map((s) => (s.id === activeSkill.id ? updatedSkill : s))
      );

      setFeedbackMsg({
        text: lang === 'zh'
          ? (activeSkill.rawPath
              ? '✓ AI 优化重构版本已成功落盘！原文件已自动创建 .bak 阴影备份。'
              : '✓ AI 优化重构版本已应用！您可以复制或下载更新后的文件。')
          : '✓ AI optimization applied!',
        type: 'success',
      });

      if (onSkillRemedied) {
        onSkillRemedied(updatedSkill);
      }
      setShowOptimizationView(false);
      setOptimizationResult(null);
      setTimeout(() => {
        onDiagnosisRequested();
      }, 600);
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || '优化应用失败', type: 'error' });
    } finally {
      setIsApplyingOptimization(false);
    }
  };

  return {
    isOptimizing,
    optimizationResult,
    setOptimizationResult,
    showOptimizationView,
    setShowOptimizationView,
    isApplyingOptimization,
    handleTriggerOptimization,
    handleApplyOptimization,
  };
}
