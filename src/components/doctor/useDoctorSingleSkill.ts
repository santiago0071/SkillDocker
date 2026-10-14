import { useState, useEffect } from 'react';
import { SkillMeta, DiagnosticReport } from '../../types/index.ts';
import { AiConfig, UniversalAiClient } from '../../core/aiClient.ts';
import { AiService } from '../../core/aiService.ts';
import { readSkillContent, saveSkillContent } from '../../core/clientBridge.ts';
import { SkillParser } from '../../core/parser.ts';
import { generateDiffSummary, validateContentPreservation } from '../../core/diffHelper.ts';
import { TriggerBenchmarkResult } from '../../core/doctor.ts';
import {
  isProFeatureAvailable,
  isFeatureUnavailableError,
  isProLicenseRequiredError,
  getProGateStatus,
  openLicenseSettings,
} from '../../pro-api/index.ts';
import { Language } from '../../i18n/index.ts';
import { DiffPreviewData } from '../CommitConfirmModal.tsx';
import { DoctorMode } from './doctorModalTypes.ts';
import { useDoctorSkillFileOps } from './useDoctorSkillFileOps.ts';
import { useDoctorOptimization } from './useDoctorOptimization.ts';

interface UseDoctorSingleSkillParams {
  skills: SkillMeta[];
  initialSkillId?: string;
  isOpen: boolean;
  aiConfig: AiConfig;
  lang: Language;
  onSkillRemedied?: (updatedSkill: SkillMeta) => void;
  setFeedbackMsg: (msg: { text: string; type: 'success' | 'error' | 'info' } | null) => void;
}

export function useDoctorSingleSkill({
  skills,
  initialSkillId,
  isOpen,
  aiConfig,
  lang,
  onSkillRemedied,
  setFeedbackMsg,
}: UseDoctorSingleSkillParams) {
  const [uploadedSkills, setUploadedSkills] = useState<SkillMeta[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState<string>(initialSkillId || skills[0]?.id || '');
  const [mode, setMode] = useState<DoctorMode>('ai');
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [isRemedying, setIsRemedying] = useState(false);
  const [diffConfirmData, setDiffConfirmData] = useState<DiffPreviewData | null>(null);

  // L3 Trigger Benchmark state
  const [isTestingTriggers, setIsTestingTriggers] = useState(false);
  const [triggerBenchmarkResult, setTriggerBenchmarkResult] = useState<TriggerBenchmarkResult | null>(null);

  const allSkills = [...uploadedSkills, ...skills];

  // Sync initial skill when modal opens
  useEffect(() => {
    if (initialSkillId && allSkills.some((s) => s.id === initialSkillId)) {
      setSelectedSkillId(initialSkillId);
    } else if (allSkills.length > 0 && !allSkills.some((s) => s.id === selectedSkillId)) {
      setSelectedSkillId(allSkills[0].id);
    }
  }, [initialSkillId, skills, uploadedSkills.length]);

  const activeSkill = allSkills.find((s) => s.id === selectedSkillId) || allSkills[0];

  // File operations (upload, copy, download)
  const {
    isCopied,
    handleLoadFile,
    handleFileInputChange,
    handleCopyContent,
    handleDownloadSkill,
  } = useDoctorSkillFileOps({
    lang,
    setFeedbackMsg,
    setSelectedSkillId,
    setUploadedSkills,
  });

  // AI Optimization sub-hook
  const {
    isOptimizing,
    optimizationResult,
    setOptimizationResult,
    showOptimizationView,
    setShowOptimizationView,
    isApplyingOptimization,
    handleTriggerOptimization,
    handleApplyOptimization,
  } = useDoctorOptimization({
    activeSkill,
    report,
    aiConfig,
    lang,
    onSkillRemedied,
    setFeedbackMsg,
    setDiffConfirmData,
    setUploadedSkills,
    onDiagnosisRequested: () => {
      handleRunDiagnosis();
    },
  });

  const handleRunTriggerBenchmark = async () => {
    if (!activeSkill) return;
    if (!isProFeatureAvailable('triggerBenchmark')) {
      setFeedbackMsg({
        text: lang === 'zh' ? '此版本不包含该功能' : 'This edition does not include trigger benchmark',
        type: 'error',
      });
      return;
    }
    if (getProGateStatus('triggerBenchmark') === 'locked') {
      setFeedbackMsg({
        text: lang === 'zh' ? '需要 Pro 授权' : 'Pro license required',
        type: 'error',
      });
      openLicenseSettings();
      return;
    }
    if (!UniversalAiClient.hasApiKey(aiConfig)) {
      setFeedbackMsg({
        text: '需要配置 AI 才能运行触发测试',
        type: 'info',
      });
      return;
    }
    setIsTestingTriggers(true);
    setFeedbackMsg(null);
    try {
      let rawContent = activeSkill.rawContent || '';
      if (!rawContent && activeSkill.rawPath) {
        rawContent = await readSkillContent(activeSkill.rawPath);
      }
      const candidates = allSkills.map((s) => ({ name: s.name, description: s.description || '' }));
      const result = await AiService.testSkillTriggers(
        activeSkill.name,
        activeSkill.description || '',
        rawContent,
        candidates,
        aiConfig
      );
      setTriggerBenchmarkResult(result);
      setFeedbackMsg({
        text: lang === 'zh'
          ? `✓ 触发测试完成！精确率: ${Math.round(result.precision * 100)}%，召回率: ${Math.round(result.recall * 100)}% (20 项评测用例)`
          : `✓ Trigger benchmark complete! Precision: ${Math.round(result.precision * 100)}%, Recall: ${Math.round(result.recall * 100)}%`,
        type: 'success',
      });
    } catch (err: any) {
      if (isProLicenseRequiredError(err)) {
        setFeedbackMsg({
          text: lang === 'zh' ? '需要 Pro 授权' : 'Pro license required',
          type: 'error',
        });
        openLicenseSettings();
      } else {
        const isUn = isFeatureUnavailableError(err);
        const msg = isUn ? (lang === 'zh' ? '此版本不包含该功能' : 'This edition does not include trigger benchmark') : (lang === 'zh' ? `触发测试执行异常: ${err.message || err}` : `Benchmark failed: ${err.message || err}`);
        setFeedbackMsg({ text: msg, type: 'error' });
      }
    } finally {
      setIsTestingTriggers(false);
    }
  };

  const handleRunDiagnosis = async () => {
    if (!activeSkill) return;
    setIsDiagnosing(true);
    setFeedbackMsg(null);
    setShowOptimizationView(false);
    setOptimizationResult(null);
    setTriggerBenchmarkResult(null);

    try {
      let content = activeSkill.rawContent || '';
      if (!content && activeSkill.rawPath) {
        content = await readSkillContent(activeSkill.rawPath);
      }
      const reportData = await AiService.diagnoseSkill(
        activeSkill.name,
        content,
        mode,
        aiConfig
      );
      setReport(reportData);
    } catch (err: any) {
      console.warn('Diagnosis error, fallback to heuristic:', err);
      try {
        const fallback = await AiService.diagnoseSkill(
          activeSkill.name,
          activeSkill.rawContent || '',
          'heuristic'
        );
        setReport(fallback);
      } catch (_fallbackErr) {
        setFeedbackMsg({
          text: lang === 'zh'
            ? '诊断引擎异常，请点击“重新体检”重试'
            : 'Diagnosis engine error, please retry',
          type: 'error',
        });
      }
    } finally {
      setIsDiagnosing(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeSkill) {
      handleRunDiagnosis();
    }
  }, [isOpen, selectedSkillId, mode]);

  const handleApplyRemedy = async () => {
    if (!activeSkill || !report?.remedyPatch) return;
    setFeedbackMsg(null);

    try {
      let rawContent = activeSkill.rawContent || '';
      if (!rawContent && activeSkill.rawPath) {
        rawContent = await readSkillContent(activeSkill.rawPath);
      }
      const remediedContent = AiService.remedySkill(rawContent, report.remedyPatch);
      const diffSummary = generateDiffSummary(rawContent, remediedContent);

      setDiffConfirmData({
        title: lang === 'zh' ? '一键追加安全补丁 · 写入前确认' : 'Apply Security Patch · Confirm Commit',
        skillName: activeSkill.uploadedFileName || activeSkill.name,
        originalContent: rawContent,
        newContent: remediedContent,
        summaryOfChanges: diffSummary,
        onConfirmDiff: async () => {
          await executeCommitRemediedContent(remediedContent);
        },
      });
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || '补丁准备失败', type: 'error' });
    }
  };

  const executeCommitRemediedContent = async (remediedContent: string) => {
    setIsRemedying(true);
    try {
      let rawContent = activeSkill.rawContent || '';
      if (!rawContent && activeSkill.rawPath) {
        rawContent = await readSkillContent(activeSkill.rawPath);
      }
      const pres = validateContentPreservation(rawContent, remediedContent);
      if (!pres.isValid) {
        setFeedbackMsg({
          text: lang === 'zh' ? `写入拒绝：内容完整性校验失败 (${pres.reason})` : 'Write rejected: Content preservation failed',
          type: 'error',
        });
        return;
      }

      if (activeSkill.rawPath) {
        await saveSkillContent(activeSkill.rawPath, remediedContent);
      }

      const parsed = SkillParser.parse(remediedContent, activeSkill.name, activeSkill.rawPath || activeSkill.name);
      const updatedSkill: SkillMeta = {
        ...activeSkill,
        ...parsed.meta,
        rawContent: remediedContent,
        uploadedFileName: activeSkill.uploadedFileName,
      };

      setUploadedSkills((prev) =>
        prev.map((s) => (s.id === activeSkill.id ? updatedSkill : s))
      );

      setFeedbackMsg({
        text: lang === 'zh'
          ? (activeSkill.rawPath
              ? '✓ 优化分析建议已成功写入技能正文，原文件已创建 .bak 备份！'
              : '✓ 优化补丁已应用到当前文件！您可以复制或下载修复后的内容。')
          : '✓ Optimization remedy applied successfully!',
        type: 'success',
      });

      if (onSkillRemedied) {
        onSkillRemedied(updatedSkill);
      }
      setTimeout(() => {
        handleRunDiagnosis();
      }, 500);
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || '修复调用失败', type: 'error' });
    } finally {
      setIsRemedying(false);
    }
  };

  return {
    uploadedSkills,
    allSkills,
    activeSkill,
    selectedSkillId,
    setSelectedSkillId,
    mode,
    setMode,
    report,
    isDiagnosing,
    isRemedying,
    isOptimizing,
    optimizationResult,
    showOptimizationView,
    setShowOptimizationView,
    isApplyingOptimization,
    diffConfirmData,
    setDiffConfirmData,
    isTestingTriggers,
    triggerBenchmarkResult,
    isCopied,
    handleRunTriggerBenchmark,
    handleRunDiagnosis,
    handleLoadFile,
    handleFileInputChange,
    handleCopyContent,
    handleDownloadSkill,
    handleApplyRemedy,
    handleTriggerOptimization,
    handleApplyOptimization,
  };
}
