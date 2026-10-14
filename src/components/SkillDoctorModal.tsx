import React, { useState, useRef } from 'react';
import { UploadCloud } from 'lucide-react';
import { CommitConfirmModal } from './CommitConfirmModal.tsx';
import {
  SkillDoctorModalProps,
  DoctorTab,
} from './doctor/doctorModalTypes.ts';
import { useDoctorSingleSkill } from './doctor/useDoctorSingleSkill.ts';
import { useDoctorLibraryConsultation } from './doctor/useDoctorLibraryConsultation.ts';
import { DoctorHeader } from './doctor/DoctorHeader.tsx';
import { DoctorTabsNav } from './doctor/DoctorTabsNav.tsx';
import { DoctorSingleTargetBar } from './doctor/DoctorSingleTargetBar.tsx';
import { DoctorSingleView } from './doctor/DoctorSingleView.tsx';
import { DoctorLibraryView } from './doctor/DoctorLibraryView.tsx';
import { DoctorConsultationModal } from './doctor/DoctorConsultationModal.tsx';

export type { SkillDoctorModalProps };

export const SkillDoctorModal: React.FC<SkillDoctorModalProps> = ({
  isOpen,
  onClose,
  skills,
  initialSkillId,
  aiConfig,
  lang = 'zh',
  onSkillRemedied,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<DoctorTab>('single');
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const singleSkill = useDoctorSingleSkill({
    skills,
    initialSkillId,
    isOpen,
    aiConfig,
    lang,
    onSkillRemedied,
    setFeedbackMsg,
  });

  const libraryConsultation = useDoctorLibraryConsultation({
    allSkills: singleSkill.allSkills,
    aiConfig,
    lang,
    setFeedbackMsg,
  });

  const handleDropFiles = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      singleSkill.handleLoadFile(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-start bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      {/* Left Studio Drawer */}
      <div
        data-doctor-modal="true"
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={handleDropFiles}
        className={`relative w-full ${activeTab === 'library' ? 'sm:w-[720px] md:w-[820px]' : 'sm:w-[620px] md:w-[680px]'} h-full bg-[#0d101b] border-r border-indigo-500/30 shadow-2xl flex flex-col overflow-hidden text-gray-100 font-sans animate-in slide-in-from-left duration-200 transition-all`}
      >
        {/* Drag Overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-50 bg-indigo-950/90 backdrop-blur-sm border-2 border-dashed border-indigo-400 flex flex-col items-center justify-center pointer-events-none animate-in fade-in duration-150">
            <UploadCloud className="w-16 h-16 text-indigo-300 animate-bounce mb-3" />
            <div className="text-base font-bold text-white mb-1">
              {lang === 'zh' ? '松开鼠标立即载入并体检文件' : 'Drop file here to audit'}
            </div>
            <div className="text-xs text-indigo-200">
              {lang === 'zh' ? '支持 .md、.markdown、.txt、.cursorrules 等任意格式' : 'Supports .md, .cursorrules, CLAUDE.md, etc.'}
            </div>
          </div>
        )}

        {/* 1. Header */}
        <DoctorHeader
          lang={lang}
          mode={singleSkill.mode}
          onSetMode={singleSkill.setMode}
          onUploadClick={() => fileInputRef.current?.click()}
          onClose={onClose}
        />

        {/* Navigation Tabs */}
        <DoctorTabsNav
          lang={lang}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          totalSkillsCount={singleSkill.allSkills.length}
        />

        {activeTab === 'single' ? (
          <>
            {/* 2. Target Selector Toolbar */}
            <DoctorSingleTargetBar
              lang={lang}
              selectedSkillId={singleSkill.selectedSkillId}
              onSelectSkillId={singleSkill.setSelectedSkillId}
              uploadedSkills={singleSkill.uploadedSkills}
              skills={skills}
              activeSkill={singleSkill.activeSkill}
              fileInputRef={fileInputRef}
              onFileInputChange={singleSkill.handleFileInputChange}
              isCopied={singleSkill.isCopied}
              onCopyContent={singleSkill.handleCopyContent}
              onDownloadSkill={singleSkill.handleDownloadSkill}
              isDiagnosing={singleSkill.isDiagnosing}
              isOptimizing={singleSkill.isOptimizing}
              onRunDiagnosis={singleSkill.handleRunDiagnosis}
            />

            {/* Feedback message banner */}
            {feedbackMsg && (
              <div
                className={`px-5 py-2 text-xs flex items-center justify-between ${
                  feedbackMsg.type === 'success'
                    ? 'bg-emerald-950/60 text-emerald-300 border-b border-emerald-800/60'
                    : feedbackMsg.type === 'info'
                    ? 'bg-indigo-950/60 text-indigo-300 border-b border-indigo-800/60'
                    : 'bg-rose-950/60 text-rose-300 border-b border-rose-800/60'
                }`}
              >
                <span>{feedbackMsg.text}</span>
                <button onClick={() => setFeedbackMsg(null)} className="text-xs opacity-70 hover:opacity-100 cursor-pointer">
                  ✕
                </button>
              </div>
            )}

            {/* 3. Drawer Body (Single View) */}
            <DoctorSingleView
              lang={lang}
              allSkills={singleSkill.allSkills}
              activeSkill={singleSkill.activeSkill}
              fileInputRef={fileInputRef}
              isCopied={singleSkill.isCopied}
              onCopyContent={singleSkill.handleCopyContent}
              onDownloadSkill={singleSkill.handleDownloadSkill}
              isDiagnosing={singleSkill.isDiagnosing}
              report={singleSkill.report}
              showOptimizationView={singleSkill.showOptimizationView}
              optimizationResult={singleSkill.optimizationResult}
              isApplyingOptimization={singleSkill.isApplyingOptimization}
              onCloseOptimizationPreview={() => singleSkill.setShowOptimizationView(false)}
              onApplyOptimization={singleSkill.handleApplyOptimization}
              aiConfig={aiConfig}
              isOptimizing={singleSkill.isOptimizing}
              isRemedying={singleSkill.isRemedying}
              onTriggerOptimization={singleSkill.handleTriggerOptimization}
              onApplyRemedy={singleSkill.handleApplyRemedy}
              isTestingTriggers={singleSkill.isTestingTriggers}
              triggerBenchmarkResult={singleSkill.triggerBenchmarkResult}
              onRunTriggerBenchmark={singleSkill.handleRunTriggerBenchmark}
            />
          </>
        ) : (
          /* Library AI Panoramic Consultation View */
          <DoctorLibraryView
            lang={lang}
            allSkills={singleSkill.allSkills}
            aiConfig={aiConfig}
            isConsultingLibrary={libraryConsultation.isConsultingLibrary}
            onRequestLibraryConsultation={libraryConsultation.handleRequestLibraryConsultation}
            libraryStaticAudit={libraryConsultation.libraryStaticAudit}
            libraryReport={libraryConsultation.libraryReport}
            libraryCategoryFilter={libraryConsultation.libraryCategoryFilter}
            onSetCategoryFilter={libraryConsultation.setLibraryCategoryFilter}
          />
        )}
      </div>

      {/* Outside click overlay to close */}
      <div className="flex-1 cursor-pointer" onClick={onClose} title="点击收起" />

      {/* Diff Confirmation Modal before writing remedy or optimization */}
      {singleSkill.diffConfirmData && (
        <CommitConfirmModal
          isOpen={Boolean(singleSkill.diffConfirmData)}
          onClose={() => singleSkill.setDiffConfirmData(null)}
          diffPreview={singleSkill.diffConfirmData}
          aiConfig={aiConfig}
          lang={lang}
        />
      )}

      {/* Skill Library AI Consultation Pre-Dispatch Confirmation Modal */}
      {libraryConsultation.consultationConfirmState && (
        <DoctorConsultationModal
          lang={lang}
          consultationConfirmState={libraryConsultation.consultationConfirmState}
          onCancel={() => libraryConsultation.setConsultationConfirmState(null)}
          onConfirm={libraryConsultation.handleConfirmLibraryConsultation}
        />
      )}
    </div>
  );
};
