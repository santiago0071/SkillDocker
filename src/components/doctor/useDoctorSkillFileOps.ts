import React, { useState } from 'react';
import { SkillMeta } from '../../types/index.ts';
import { SkillParser } from '../../core/parser.ts';
import { Language } from '../../i18n/index.ts';

interface UseDoctorSkillFileOpsParams {
  lang: Language;
  setFeedbackMsg: (msg: { text: string; type: 'success' | 'error' | 'info' } | null) => void;
  setSelectedSkillId: (id: string) => void;
  setUploadedSkills: React.Dispatch<React.SetStateAction<SkillMeta[]>>;
}

export function useDoctorSkillFileOps({
  lang,
  setFeedbackMsg,
  setSelectedSkillId,
  setUploadedSkills,
}: UseDoctorSkillFileOpsParams) {
  const [isCopied, setIsCopied] = useState(false);

  const handleLoadFile = async (file: File) => {
    try {
      if (file.size > 256 * 1024) {
        setFeedbackMsg({
          text: lang === 'zh'
            ? `上传文件大小超过 256KB 限制 (${(file.size / 1024).toFixed(1)}KB > 256KB)，已拒绝处理`
            : `File size exceeds 256KB limit (${(file.size / 1024).toFixed(1)}KB)`,
          type: 'error',
        });
        return;
      }

      const text = await file.text();
      if (!text.trim()) {
        setFeedbackMsg({
          text: lang === 'zh' ? '上传的文件内容为空，无法进行体检' : 'Uploaded file is empty',
          type: 'error',
        });
        return;
      }

      const cleanName = file.name.replace(/\.[^/.]+$/, '') || 'uploaded-skill';
      const parsed = SkillParser.parse(text, cleanName, file.name);

      const newSkill: SkillMeta = {
        id: `uploaded-${Date.now()}-${cleanName}`,
        name: parsed.meta.name || cleanName,
        description: parsed.meta.description || (lang === 'zh' ? `本地上传: ${file.name}` : `Uploaded local file: ${file.name}`),
        enabled: true,
        category: 'custom',
        ecosystem: undefined,
        rawContent: text,
        rawPath: '',
        uploadedFileName: file.name,
      };

      setUploadedSkills((prev) => [
        newSkill,
        ...prev.filter((s) => s.id !== newSkill.id && s.uploadedFileName !== file.name),
      ]);
      setSelectedSkillId(newSkill.id);
      setFeedbackMsg({
        text: lang === 'zh' ? `✓ 已成功载入文件 [${file.name}]，正在体检...` : `✓ Loaded [${file.name}], auditing...`,
        type: 'success',
      });
    } catch (err: any) {
      setFeedbackMsg({
        text: lang === 'zh' ? `文件读取失败: ${err.message || err}` : `Failed to read file: ${err.message || err}`,
        type: 'error',
      });
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleLoadFile(file);
    }
    e.target.value = '';
  };

  const handleCopyContent = (content: string) => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    setFeedbackMsg({
      text: lang === 'zh' ? '✓ 内容已复制到剪贴板！' : '✓ Copied to clipboard!',
      type: 'success',
    });
  };

  const handleDownloadSkill = (name: string, content: string, defaultFileName?: string) => {
    if (!content) return;
    const fileName = defaultFileName || (name.endsWith('.md') ? name : `${name}.md`);
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setFeedbackMsg({
      text: lang === 'zh' ? `✓ 已下载文件 [${fileName}]！` : `✓ Downloaded [${fileName}]!`,
      type: 'success',
    });
  };

  return {
    isCopied,
    handleLoadFile,
    handleFileInputChange,
    handleCopyContent,
    handleDownloadSkill,
  };
}
