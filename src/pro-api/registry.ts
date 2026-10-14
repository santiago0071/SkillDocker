import React, { useSyncExternalStore } from 'react';
import type { Language } from '../i18n/index.ts';
import type { DiagnosticReport } from '../types/index.ts';
import {
  FeatureUnavailableError,
  type BuildEdition,
  type ProCapabilities,
  type ProGateStatus,
  type TriggerBenchmarkResult,
  type TriggerBenchmarkOptions,
  type LibraryConsultationReport,
  type LibraryConsultationSkillInput,
  type LibraryConsultationPayloadEstimate,
  type OptimizationOutput,
} from './types.ts';

let registeredCapabilities: ProCapabilities = {};

export function getEdition(): BuildEdition {
  if (typeof process !== 'undefined' && process.env && process.env.SKILLDOCKER_EDITION === 'community') {
    return 'community';
  }
  return 'pro';
}

export function registerProCapabilities(capabilities: ProCapabilities): void {
  registeredCapabilities = {
    ...registeredCapabilities,
    ...capabilities,
  };
}

export function getProCapabilities(): ProCapabilities {
  return registeredCapabilities;
}

export function isProFeatureAvailable(feature: 'triggerBenchmark' | 'libraryConsultation' | 'aiOptimizer' | 'licensePanel'): boolean {
  switch (feature) {
    case 'triggerBenchmark':
      return typeof registeredCapabilities.runTriggerBenchmark === 'function';
    case 'libraryConsultation':
      return typeof registeredCapabilities.consultLibraryAi === 'function';
    case 'aiOptimizer':
      return typeof registeredCapabilities.optimizeAi === 'function';
    case 'licensePanel':
      return Boolean(registeredCapabilities.ProLicensePanel);
    default:
      return false;
  }
}

export async function executeTriggerBenchmark(
  targetSkillInput: { name: string; description: string; bodyMarkdown?: string } | string,
  allSkillsInput?: Array<{ name: string; description: string }>,
  optionsOrCallback?: TriggerBenchmarkOptions | ((prompt: string, sysPrompt?: string) => Promise<string>)
): Promise<TriggerBenchmarkResult> {
  if (typeof registeredCapabilities.runTriggerBenchmark === 'function') {
    return registeredCapabilities.runTriggerBenchmark(targetSkillInput, allSkillsInput, optionsOrCallback);
  }
  throw new FeatureUnavailableError('此版本不包含该功能');
}

export function executeEstimateLibraryConsultationPayload(
  skills: LibraryConsultationSkillInput[]
): LibraryConsultationPayloadEstimate {
  if (typeof registeredCapabilities.estimateLibraryConsultationPayload === 'function') {
    return registeredCapabilities.estimateLibraryConsultationPayload(skills);
  }
  throw new FeatureUnavailableError('此版本不包含该功能');
}

export async function executeLibraryConsultation(
  skills: LibraryConsultationSkillInput[],
  callAiProvider: (prompt: string, sysPrompt?: string) => Promise<string>
): Promise<LibraryConsultationReport> {
  if (typeof registeredCapabilities.consultLibraryAi === 'function') {
    return registeredCapabilities.consultLibraryAi(skills, callAiProvider);
  }
  throw new FeatureUnavailableError('此版本不包含该功能');
}

export async function executeAiOptimizer(
  skillName: string,
  rawContent: string,
  report: DiagnosticReport | null,
  callAiProvider?: (prompt: string, sysPrompt: string) => Promise<string>
): Promise<OptimizationOutput> {
  if (typeof registeredCapabilities.optimizeAi === 'function') {
    return registeredCapabilities.optimizeAi(skillName, rawContent, report, callAiProvider);
  }
  throw new FeatureUnavailableError('此版本不包含该功能');
}

export function getProLicensePanel(): React.ComponentType<{ lang?: Language }> | null {
  return registeredCapabilities.ProLicensePanel || null;
}

export function getDoctorTriggerBenchmark(): React.ComponentType<any> | null {
  return registeredCapabilities.DoctorTriggerBenchmark || null;
}

export function getDoctorConsultationModal(): React.ComponentType<any> | null {
  return registeredCapabilities.DoctorConsultationModal || null;
}

export function getProGateStatus(
  feature: 'triggerBenchmark' | 'libraryConsultation' | 'aiOptimizer'
): ProGateStatus {
  if (!isProFeatureAvailable(feature)) {
    return 'unavailable';
  }
  if (typeof registeredCapabilities.getGateStatus === 'function') {
    return registeredCapabilities.getGateStatus(feature);
  }
  return 'locked';
}

export function subscribeProGateChange(listener: () => void): () => void {
  if (typeof registeredCapabilities.subscribeGateChange === 'function') {
    return registeredCapabilities.subscribeGateChange(listener);
  }
  return () => {};
}

export function useProGateStatus(
  feature: 'triggerBenchmark' | 'libraryConsultation' | 'aiOptimizer'
): ProGateStatus {
  return useSyncExternalStore(
    subscribeProGateChange,
    () => getProGateStatus(feature)
  );
}

export async function openProCheckout(): Promise<void> {
  if (typeof registeredCapabilities.openCheckout === 'function') {
    return registeredCapabilities.openCheckout();
  }
}

export function openLicenseSettings(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('skilldock:open-settings'));
  }
}

