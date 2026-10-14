import { AiConfig, ModelProvider } from '../../core/aiClient.ts';
import { Language, translations } from '../../i18n/index.ts';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AiConfig;
  onSaveConfig: (newConfig: AiConfig) => void;
  lang?: Language;
}

export interface ProviderFormProps {
  localConfig: AiConfig;
  setLocalConfig: React.Dispatch<React.SetStateAction<AiConfig>>;
  keyringStatus: Record<string, boolean>;
  showKey: boolean;
  setShowKey: (show: boolean) => void;
  handleDeleteKey: (provider: ModelProvider) => Promise<void>;
  lang: Language;
  t: (typeof translations)[Language];
}
