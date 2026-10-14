import React from 'react';
import { Language } from '../../i18n/index.ts';

export type GuideTab = 'concept' | 'playbook' | 'faq';

export interface RookieGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: Language;
}

export interface ConceptCard {
  badge: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  colorClass: string;
  comparisons?: Array<{
    tag: string;
    tagColor: string;
    points: string[];
  }>;
  steps?: Array<{
    num: string;
    title: string;
    desc: string;
  }>;
  takeaway: string;
}

export interface PlaybookItem {
  id: string;
  title: string;
  tag: string;
  tagClass: string;
  desc: string;
  steps: Array<{
    step: string;
    action: string;
  }>;
  tip: string;
}

export interface FaqItem {
  q: string;
  a: string;
}
