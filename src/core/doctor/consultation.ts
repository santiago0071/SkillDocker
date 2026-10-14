import {
  executeLibraryConsultation,
  executeEstimateLibraryConsultationPayload,
  type LibraryConsultationReport,
} from '../../pro-api/index.ts';
import type {
  LibraryConsultationSkillInput,
  LibraryConsultationPayloadEstimate,
} from './types.ts';

export function estimateLibraryConsultationPayload(
  skills: LibraryConsultationSkillInput[]
): LibraryConsultationPayloadEstimate {
  return executeEstimateLibraryConsultationPayload(skills);
}

export async function consultLibraryAi(
  skills: LibraryConsultationSkillInput[],
  callAiProvider: (prompt: string, sysPrompt?: string) => Promise<string>
): Promise<LibraryConsultationReport> {
  return executeLibraryConsultation(skills, callAiProvider);
}
