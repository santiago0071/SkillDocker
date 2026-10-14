import React from 'react';
import type { Language } from '../i18n/index.ts';
import type { DiagnosticReport } from '../types/index.ts';
import type {
  TriggerBenchmarkResult,
  TriggerTestCase,
  TriggerBenchmarkOptions,
  LibraryConsultationReport,
  LibraryConsultationSkillInput,
  LibraryConsultationPayloadEstimate,
  OptimizationOutput,
} from '../core/doctor/types.ts';

export type BuildEdition = 'community' | 'pro';

export type TriggerBenchmarkProvider = (
  targetSkillInput: { name: string; description: string; bodyMarkdown?: string } | string,
  allSkillsInput?: Array<{ name: string; description: string }>,
  optionsOrCallback?: TriggerBenchmarkOptions | ((prompt: string, sysPrompt?: string) => Promise<string>)
) => Promise<TriggerBenchmarkResult>;

export type LibraryConsultationProvider = (
  skills: LibraryConsultationSkillInput[],
  callAiProvider: (prompt: string, sysPrompt?: string) => Promise<string>
) => Promise<LibraryConsultationReport>;

export type OptimizeAiProvider = (
  skillName: string,
  rawContent: string,
  report: DiagnosticReport | null,
  callAiProvider?: (prompt: string, sysPrompt: string) => Promise<string>
) => Promise<OptimizationOutput>;

export type LibraryConsultationPayloadEstimator = (
  skills: LibraryConsultationSkillInput[]
) => LibraryConsultationPayloadEstimate;

export type ProGateStatus = 'unavailable' | 'loading' | 'locked' | 'unlocked';

export interface ProCapabilities {
  runTriggerBenchmark?: TriggerBenchmarkProvider;
  consultLibraryAi?: LibraryConsultationProvider;
  optimizeAi?: OptimizeAiProvider;
  estimateLibraryConsultationPayload?: LibraryConsultationPayloadEstimator;
  ProLicensePanel?: React.ComponentType<{ lang?: Language }>;
  DoctorTriggerBenchmark?: React.ComponentType<any>;
  DoctorConsultationModal?: React.ComponentType<any>;
  getGateStatus?: (feature: 'triggerBenchmark' | 'libraryConsultation' | 'aiOptimizer') => ProGateStatus;
  subscribeGateChange?: (listener: () => void) => () => void;
  openCheckout?: () => Promise<void>;
}

export class FeatureUnavailableError extends Error {
  readonly code = 'FEATURE_NOT_AVAILABLE';
  readonly isFeatureUnavailable = true;

  constructor(message: string = '此版本不包含该功能') {
    super(message);
    this.name = 'FeatureUnavailableError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function isFeatureUnavailableError(error: unknown): error is FeatureUnavailableError {
  if (error instanceof FeatureUnavailableError) {
    return true;
  }
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    return (
      err.isFeatureUnavailable === true ||
      err.code === 'FEATURE_NOT_AVAILABLE' ||
      err.name === 'FeatureUnavailableError'
    );
  }
  return false;
}

export class ProLicenseRequiredError extends Error {
  readonly code = 'PRO_LICENSE_REQUIRED';
  readonly isLicenseRequired = true;

  constructor(message: string = '需要 Pro 授权') {
    super(message);
    this.name = 'ProLicenseRequiredError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function isProLicenseRequiredError(error: unknown): error is ProLicenseRequiredError {
  if (error instanceof ProLicenseRequiredError) {
    return true;
  }
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    return (
      err.isLicenseRequired === true ||
      err.code === 'PRO_LICENSE_REQUIRED' ||
      err.name === 'ProLicenseRequiredError'
    );
  }
  return false;
}

export type {
  TriggerBenchmarkResult,
  TriggerTestCase,
  TriggerBenchmarkOptions,
  LibraryConsultationReport,
  LibraryConsultationSkillInput,
  LibraryConsultationPayloadEstimate,
  OptimizationOutput,
};

