import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Sparkles, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useMicTest } from "@/hooks/useMicTest";
import GeneralTab from "./configuration/GeneralTab";
import AudioTab from "./configuration/AudioTab";
import AssistantTab from "./configuration/AssistantTab";
import CoachTab from "./configuration/CoachTab";
import OverlayTab from "./configuration/OverlayTab";
import type { ConfigurationSettingsProps } from "./configuration/types";

interface OnboardingWizardProps extends ConfigurationSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// One entry per step after the welcome screen; reuses the exact same tab
// content as the Configuration dialog so the wizard and the regular
// settings screen never drift apart.
const STEP_KEYS = ["general", "audio", "assistant", "coach", "overlay"] as const;

const OnboardingWizard = (props: OnboardingWizardProps) => {
  const { open, onOpenChange, ...settings } = props;
  const { t } = useTranslation();
  const [step, setStep] = useState(0); // 0 = welcome, 1..5 = STEP_KEYS, 6 = done
  const totalSteps = STEP_KEYS.length + 2; // welcome + 5 tabs + done

  const { micTestActive, micLevel, startMicTest, stopMicTest } = useMicTest(
    open,
    settings.selectedInputDevice,
  );

  // Reset to the welcome step only once the dialog is (re)opened, never on
  // close: resetting synchronously in close() used to swap the "done"
  // screen back to the welcome content while the closing animation was
  // still playing, which looked like a second "Bienvenue" dialog popping up
  // right after finishing the wizard.
  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  const close = () => onOpenChange(false);

  const goNext = () => setStep((s) => Math.min(s + 1, totalSteps - 1));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const isWelcome = step === 0;
  const isDone = step === totalSteps - 1;
  const currentTabKey = !isWelcome && !isDone ? STEP_KEYS[step - 1] : null;

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="bg-card border-border/50 max-w-2xl max-h-[90vh] overflow-y-auto">
        {isWelcome && (
          <>
            <DialogHeader className="items-center text-center space-y-3">
              <div className="p-4 rounded-full bg-gradient-to-br from-primary via-accent to-primary shadow-lg shadow-accent/50">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <DialogTitle className="text-2xl">
                {t("components.dashboard.OnboardingWizard.welcome_title")}
              </DialogTitle>
              <DialogDescription>
                {t("components.dashboard.OnboardingWizard.welcome_desc")}
              </DialogDescription>
            </DialogHeader>
          </>
        )}

        {isDone && (
          <DialogHeader className="items-center text-center space-y-3">
            <div className="p-4 rounded-full bg-gradient-to-br from-primary via-accent to-primary shadow-lg shadow-accent/50">
              <Check className="h-8 w-8 text-white" />
            </div>
            <DialogTitle className="text-2xl">
              {t("components.dashboard.OnboardingWizard.done_title")}
            </DialogTitle>
            <DialogDescription className="space-y-1.5">
              <span className="block font-medium text-foreground">
                {t("components.dashboard.OnboardingWizard.done_ready_desc")}
              </span>
              <span className="block">
                {t("components.dashboard.OnboardingWizard.done_desc")}
              </span>
            </DialogDescription>
          </DialogHeader>
        )}

        {currentTabKey && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">
                {t(`components.dashboard.ConfigurationDialog.tab_${currentTabKey}`)}
              </DialogTitle>
            </DialogHeader>

            <div className="py-2">
              {currentTabKey === "general" && (
                <GeneralTab
                  assistantToggle={settings.assistantToggle}
                  onAssistantToggle={settings.onAssistantToggle}
                  proactiveCoachEnabled={settings.proactiveCoachEnabled}
                  onProactiveCoachToggle={settings.onProactiveCoachToggle}
                  overlayEnabled={settings.overlayEnabled}
                  onOverlayToggle={settings.onOverlayToggle}
                />
              )}
              {currentTabKey === "audio" && (
                <AudioTab
                  ttsVoices={settings.ttsVoices}
                  selectedVoice={settings.selectedVoice}
                  onVoiceChange={settings.onVoiceChange}
                  volume={settings.volume}
                  onVolumeChange={settings.onVolumeChange}
                  ttsSpeed={settings.ttsSpeed}
                  onTtsSpeedChange={settings.onTtsSpeedChange}
                  onTestVolume={settings.onTestVolume}
                  outputDevices={settings.outputDevices}
                  selectedOutputDevice={settings.selectedOutputDevice}
                  onOutputDeviceChange={settings.onOutputDeviceChange}
                />
              )}
              {currentTabKey === "assistant" && (
                <AssistantTab
                  pushToTalkKey={settings.pushToTalkKey}
                  isBindingKey={settings.isBindingKey}
                  onBindKey={settings.onBindKey}
                  inputDevices={settings.inputDevices}
                  selectedInputDevice={settings.selectedInputDevice}
                  onInputDeviceChange={settings.onInputDeviceChange}
                  micTestActive={micTestActive}
                  micLevel={micLevel}
                  onStartMicTest={startMicTest}
                  onStopMicTest={stopMicTest}
                />
              )}
              {currentTabKey === "coach" && (
                <CoachTab
                  earlyGameTipsEnabled={settings.earlyGameTipsEnabled}
                  onEarlyGameTipsToggle={settings.onEarlyGameTipsToggle}
                  itemBuildTipsEnabled={settings.itemBuildTipsEnabled}
                  onItemBuildTipsToggle={settings.onItemBuildTipsToggle}
                  autoOpenBuild={settings.autoOpenBuild}
                  onAutoOpenBuildChange={settings.onAutoOpenBuildChange}
                />
              )}
              {currentTabKey === "overlay" && (
                <OverlayTab
                  speakingAnimationEnabled={settings.speakingAnimationEnabled}
                  onSpeakingAnimationToggle={settings.onSpeakingAnimationToggle}
                  listeningAnimationEnabled={settings.listeningAnimationEnabled}
                  onListeningAnimationToggle={settings.onListeningAnimationToggle}
                  thinkingAnimationEnabled={settings.thinkingAnimationEnabled}
                  onThinkingAnimationToggle={settings.onThinkingAnimationToggle}
                  liveTextualChatEnabled={settings.liveTextualChatEnabled}
                  onLiveTextualChatToggle={settings.onLiveTextualChatToggle}
                />
              )}
            </div>
          </>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <div className="flex gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  i === step ? "bg-accent" : "bg-muted"
                }`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {!isWelcome && (
              <Button variant="outline" size="sm" onClick={goBack}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                {t("components.dashboard.OnboardingWizard.back_btn")}
              </Button>
            )}
            {!isDone ? (
              <Button size="sm" onClick={goNext} className="bg-accent hover:bg-accent/90">
                {isWelcome
                  ? t("components.dashboard.OnboardingWizard.start_btn")
                  : t("components.dashboard.OnboardingWizard.next_btn")}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button size="sm" onClick={close} className="bg-accent hover:bg-accent/90">
                {t("components.dashboard.OnboardingWizard.finish_btn")}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingWizard;
