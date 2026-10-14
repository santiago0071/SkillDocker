import React from 'react';
import { getDoctorConsultationModal } from '../../pro-api/index.ts';
import { Language } from '../../i18n/index.ts';
import { ConsultationConfirmState } from './doctorModalTypes.ts';

export interface DoctorConsultationModalProps {
  lang: Language;
  consultationConfirmState: ConsultationConfirmState;
  onCancel: () => void;
  onConfirm: () => void;
}

export const DoctorConsultationModal: React.FC<DoctorConsultationModalProps> = (props) => {
  const ProModal = getDoctorConsultationModal();
  if (ProModal) {
    return <ProModal {...props} />;
  }
  return null;
};
