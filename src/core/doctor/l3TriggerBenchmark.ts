import { executeTriggerBenchmark, type TriggerBenchmarkResult } from '../../pro-api/index.ts';
import type { TriggerBenchmarkOptions } from './types.ts';

export async function runTriggerBenchmark(
  targetSkillInput: any,
  allSkillsInput?: any[],
  optionsOrCallback?: TriggerBenchmarkOptions | ((prompt: string, sysPrompt?: string) => Promise<string>)
): Promise<TriggerBenchmarkResult> {
  return executeTriggerBenchmark(targetSkillInput, allSkillsInput, optionsOrCallback);
}
