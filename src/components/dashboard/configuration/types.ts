import type { AutoOpenBuildOption } from "./CoachTab";

export type { AutoOpenBuildOption };

/** Every setting shown across the Configuration tabs / onboarding wizard. */
export interface ConfigurationSettingsProps {
  // General
  assistantToggle: boolean;
  onAssistantToggle: (checked: boolean) => void;
  proactiveCoachEnabled: boolean;
  onProactiveCoachToggle: (checked: boolean) => void;
  overlayEnabled: boolean;
  onOverlayToggle: (checked: boolean) => void;

  // Audio
  volume: number[];
  onVolumeChange: (values: number[]) => void;
  ttsSpeed: number[];
  onTtsSpeedChange: (values: number[]) => void;
  onTestVolume: () => void;
  ttsVoices: string[];
  selectedVoice: string;
  onVoiceChange: (voice: string) => void;
  outputDevices: string[];
  selectedOutputDevice: string;
  onOutputDeviceChange: (device: string) => void;

  // Assistant In-Game
  pushToTalkKey: string;
  isBindingKey: boolean;
  onBindKey: () => void;
  inputDevices: string[];
  selectedInputDevice: string;
  onInputDeviceChange: (device: string) => void;

  // Coach Proactif
  earlyGameTipsEnabled: boolean;
  onEarlyGameTipsToggle: (checked: boolean) => void;
  itemBuildTipsEnabled: boolean;
  onItemBuildTipsToggle: (checked: boolean) => void;
  autoOpenBuild: AutoOpenBuildOption;
  onAutoOpenBuildChange: (value: AutoOpenBuildOption) => void;

  // Overlay In-Game
  speakingAnimationEnabled: boolean;
  onSpeakingAnimationToggle: (checked: boolean) => void;
  listeningAnimationEnabled: boolean;
  onListeningAnimationToggle: (checked: boolean) => void;
  thinkingAnimationEnabled: boolean;
  onThinkingAnimationToggle: (checked: boolean) => void;
  liveTextualChatEnabled: boolean;
  onLiveTextualChatToggle: (checked: boolean) => void;
}
