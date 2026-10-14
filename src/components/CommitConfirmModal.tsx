import React from 'react';
import { DiffPreviewData, CommitConfirmModalProps } from './commit/commitModalTypes.ts';
import { DiffPreviewModalView } from './commit/DiffPreviewModalView.tsx';
import { DirectiveCommitModalView } from './commit/DirectiveCommitModalView.tsx';

export type { DiffPreviewData, CommitConfirmModalProps };

export const CommitConfirmModal: React.FC<CommitConfirmModalProps> = ({
  isOpen,
  onClose,
  directive,
  skills = [],
  defaultSkillId,
  aiConfig,
  lang = 'zh',
  onConfirm,
  diffPreview,
}) => {
  if (!isOpen) return null;

  if (diffPreview) {
    return (
      <DiffPreviewModalView
        diffPreview={diffPreview}
        onClose={onClose}
        lang={lang}
      />
    );
  }

  if (!directive) return null;

  return (
    <DirectiveCommitModalView
      directive={directive}
      skills={skills}
      defaultSkillId={defaultSkillId}
      aiConfig={aiConfig}
      lang={lang}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
};
