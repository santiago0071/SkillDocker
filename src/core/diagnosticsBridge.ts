import { isTauri, invoke } from '@tauri-apps/api/core';

export async function logFrontendError(message: string, stack?: string): Promise<void> {
  if (isTauri()) {
    try {
      await invoke('log_frontend_error', { message, stack });
    } catch (e) {
      console.warn('Failed to invoke log_frontend_error', e);
    }
  }
}

export async function openLogDirectory(): Promise<void> {
  if (isTauri()) {
    try {
      await invoke('open_log_directory');
    } catch (e) {
      console.warn('Failed to open log directory', e);
    }
  }
}

export async function exportDiagnosticPackage(): Promise<string | null> {
  if (isTauri()) {
    try {
      const result = await invoke<string | null>('export_diagnostic_package');
      return result;
    } catch (e) {
      console.warn('Failed to export diagnostic package', e);
      throw e;
    }
  }
  return null;
}
