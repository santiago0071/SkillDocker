import { useState } from 'react';
import { SkillMeta } from '../../types/index.ts';
import { AiConfig, UniversalAiClient } from '../../core/aiClient.ts';
import { AiService } from '../../core/aiService.ts';
import { readSkillContent } from '../../core/clientBridge.ts';
import { Language } from '../../i18n/index.ts';
import {
  isProFeatureAvailable,
  isFeatureUnavailableError,
  isProLicenseRequiredError,
  getProGateStatus,
  openLicenseSettings,
} from '../../pro-api/index.ts';
import {
  SkillDoctor,
  LibraryAuditReport,
  LibraryConsultationReport,
  LibraryConsultationSkillInput,
} from '../../core/doctor.ts';
import { LibraryCategoryFilter, ConsultationConfirmState } from './doctorModalTypes.ts';

interface UseDoctorLibraryConsultationParams {
  allSkills: SkillMeta[];
  aiConfig: AiConfig;
  lang: Language;
  setFeedbackMsg: (msg: { text: string; type: 'success' | 'error' | 'info' } | null) => void;
}

export function useDoctorLibraryConsultation({
  allSkills,
  aiConfig,
  lang,
  setFeedbackMsg,
}: UseDoctorLibraryConsultationParams) {
  const [isConsultingLibrary, setIsConsultingLibrary] = useState(false);
  const [libraryReport, setLibraryReport] = useState<LibraryConsultationReport | null>(null);
  const [libraryStaticAudit, setLibraryStaticAudit] = useState<LibraryAuditReport | null>(null);
  const [libraryCategoryFilter, setLibraryCategoryFilter] = useState<LibraryCategoryFilter>('all');
  const [consultationConfirmState, setConsultationConfirmState] = useState<ConsultationConfirmState | null>(null);

  const handleRequestLibraryConsultation = async () => {
    if (!isProFeatureAvailable('libraryConsultation')) {
      setFeedbackMsg({
        text: lang === 'zh' ? '此版本不包含该功能' : 'This edition does not include library consultation',
        type: 'error',
      });
      return;
    }

    if (getProGateStatus('libraryConsultation') === 'locked') {
      setFeedbackMsg({
        text: lang === 'zh' ? '需要 Pro 授权' : 'Pro license required',
        type: 'error',
      });
      openLicenseSettings();
      return;
    }

    if (!UniversalAiClient.hasApiKey(aiConfig)) {
      setFeedbackMsg({
        text: lang === 'zh' ? '需要配置 AI 才能运行技能库全景会诊' : 'AI configuration required to run library consultation',
        type: 'info',
      });
      return;
    }

    const targets = allSkills.filter((s) => s.enabled !== false);
    if (targets.length === 0) {
      setFeedbackMsg({
        text: lang === 'zh' ? '暂无可用的活跃技能' : 'No active skills available to audit',
        type: 'error',
      });
      return;
    }

    setFeedbackMsg(null);
    try {
      const preparedSkills: LibraryConsultationSkillInput[] = await Promise.all(
        targets.map(async (s) => {
          let content = s.rawContent || '';
          if (!content && s.rawPath) {
            try {
              content = await readSkillContent(s.rawPath);
            } catch (_e) {
              content = '';
            }
          }
          return {
            id: s.id,
            name: s.name,
            description: s.description,
            content,
            path: s.rawPath,
            enabled: s.enabled,
          };
        })
      );

      const estimate = SkillDoctor.estimateLibraryConsultationPayload(preparedSkills);
      setConsultationConfirmState({
        estimate,
        preparedSkills,
      });
    } catch (err: any) {
      console.error('Failed to prepare library consultation:', err);
      setFeedbackMsg({
        text: lang === 'zh'
          ? `准备全景会诊数据失败: ${err.message || err}`
          : `Failed to prepare consultation data: ${err.message || err}`,
        type: 'error',
      });
    }
  };

  const handleConfirmLibraryConsultation = async () => {
    if (!consultationConfirmState) return;
    if (getProGateStatus('libraryConsultation') === 'locked') {
      setFeedbackMsg({
        text: lang === 'zh' ? '需要 Pro 授权' : 'Pro license required',
        type: 'error',
      });
      openLicenseSettings();
      return;
    }
    const { preparedSkills } = consultationConfirmState;
    setConsultationConfirmState(null);
    setIsConsultingLibrary(true);
    setFeedbackMsg(null);
    try {
      const staticRes = SkillDoctor.auditLibrary(preparedSkills);
      setLibraryStaticAudit(staticRes);

      const aiRes = await AiService.consultLibraryAi(preparedSkills, aiConfig);
      setLibraryReport(aiRes);

      setFeedbackMsg({
        text: lang === 'zh'
          ? `✓ 技能库 AI 全景会诊完成！整体健康评分: ${aiRes.overallHealthScore}/100`
          : `✓ Library AI Consultation complete! Overall score: ${aiRes.overallHealthScore}/100`,
        type: 'success',
      });
    } catch (err: any) {
      console.error('Library AI Consultation failed:', err);
      if (isProLicenseRequiredError(err)) {
        setFeedbackMsg({
          text: lang === 'zh' ? '需要 Pro 授权' : 'Pro license required',
          type: 'error',
        });
        openLicenseSettings();
      } else {
        const isUn = isFeatureUnavailableError(err);
        setFeedbackMsg({
          text: isUn
            ? (lang === 'zh' ? '此版本不包含该功能' : 'This edition does not include library consultation')
            : (lang === 'zh' ? `全景会诊失败: ${err.message || err}` : `Consultation failed: ${err.message || err}`),
          type: 'error',
        });
      }
    } finally {
      setIsConsultingLibrary(false);
    }
  };

  return {
    isConsultingLibrary,
    libraryReport,
    libraryStaticAudit,
    libraryCategoryFilter,
    setLibraryCategoryFilter,
    consultationConfirmState,
    setConsultationConfirmState,
    handleRequestLibraryConsultation,
    handleConfirmLibraryConsultation,
  };
}
