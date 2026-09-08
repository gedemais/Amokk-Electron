import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Settings } from "lucide-react";
import { useMicTest } from "@/hooks/useMicTest";
import GeneralTab from "./configuration/GeneralTab";
import AudioTab from "./configuration/AudioTab";
import AssistantTab from "./configuration/AssistantTab";
import CoachTab from "./configuration/CoachTab";
import OverlayTab from "./configuration/OverlayTab";
import type { ConfigurationSettingsProps } from "./configuration/types";

interface ConfigurationDialogProps extends ConfigurationSettingsProps {
  configurationDialogOpen: boolean;
  onConfigurationDialogOpenChange: (open: boolean) => void;
}

const ConfigurationDialog = ({
  configurationDialogOpen,
  onConfigurationDialogOpenChange,
  assistantToggle,
  onAssistantToggle,
  pushToTalkKey,
  isBindingKey,
  onBindKey,
  proactiveCoachEnabled,
  onProactiveCoachToggle,
  volume,
  onVolumeChange,
  ttsSpeed,
  onTtsSpeedChange,
  onTestVolume,
  ttsVoices,
  selectedVoice,
  onVoiceChange,
  outputDevices,
  selectedOutputDevice,
  onOutputDeviceChange,
  inputDevices,
  selectedInputDevice,
  onInputDeviceChange,
  overlayEnabled,
  onOverlayToggle,
  earlyGameTipsEnabled,
  onEarlyGameTipsToggle,
  itemBuildTipsEnabled,
  onItemBuildTipsToggle,
  autoOpenBuild,
  onAutoOpenBuildChange,
  speakingAnimationEnabled,
  onSpeakingAnimationToggle,
  listeningAnimationEnabled,
  onListeningAnimationToggle,
  thinkingAnimationEnabled,
  onThinkingAnimationToggle,
  liveTextualChatEnabled,
  onLiveTextualChatToggle,
}: ConfigurationDialogProps) => {
  const { t } = useTranslation();
  const { micTestActive, micLevel, startMicTest, stopMicTest } = useMicTest(
    configurationDialogOpen,
    selectedInputDevice,
  );

  return (
    <Dialog open={configurationDialogOpen} onOpenChange={onConfigurationDialogOpenChange}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:border-accent/50 transition-colors border-border/50 bg-card/95 backdrop-blur h-full">
          <CardContent className="pt-6 h-full flex items-center">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/20">
                <Settings className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  {t("components.dashboard.ConfigurationDialog.card_title")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("components.dashboard.ConfigurationDialog.card_desc")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="bg-card border-border/50 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {t("components.dashboard.ConfigurationDialog.dialog_title")}
          </DialogTitle>
          <DialogDescription>
            {t("components.dashboard.ConfigurationDialog.dialog_desc")}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="py-2">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">
              {t("components.dashboard.ConfigurationDialog.tab_general")}
            </TabsTrigger>
            <TabsTrigger value="audio">
              {t("components.dashboard.ConfigurationDialog.tab_audio")}
            </TabsTrigger>
            <TabsTrigger value="assistant">
              {t("components.dashboard.ConfigurationDialog.tab_assistant")}
            </TabsTrigger>
            <TabsTrigger value="coach">
              {t("components.dashboard.ConfigurationDialog.tab_coach")}
            </TabsTrigger>
            <TabsTrigger value="overlay">
              {t("components.dashboard.ConfigurationDialog.tab_overlay")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="py-4">
            <GeneralTab
              assistantToggle={assistantToggle}
              onAssistantToggle={onAssistantToggle}
              proactiveCoachEnabled={proactiveCoachEnabled}
              onProactiveCoachToggle={onProactiveCoachToggle}
              overlayEnabled={overlayEnabled}
              onOverlayToggle={onOverlayToggle}
            />
          </TabsContent>

          <TabsContent value="audio" className="py-4">
            <AudioTab
              ttsVoices={ttsVoices}
              selectedVoice={selectedVoice}
              onVoiceChange={onVoiceChange}
              volume={volume}
              onVolumeChange={onVolumeChange}
              ttsSpeed={ttsSpeed}
              onTtsSpeedChange={onTtsSpeedChange}
              onTestVolume={onTestVolume}
              outputDevices={outputDevices}
              selectedOutputDevice={selectedOutputDevice}
              onOutputDeviceChange={onOutputDeviceChange}
            />
          </TabsContent>

          <TabsContent value="assistant" className="py-4">
            <AssistantTab
              pushToTalkKey={pushToTalkKey}
              isBindingKey={isBindingKey}
              onBindKey={onBindKey}
              inputDevices={inputDevices}
              selectedInputDevice={selectedInputDevice}
              onInputDeviceChange={onInputDeviceChange}
              micTestActive={micTestActive}
              micLevel={micLevel}
              onStartMicTest={startMicTest}
              onStopMicTest={stopMicTest}
            />
          </TabsContent>

          <TabsContent value="coach" className="py-4">
            <CoachTab
              earlyGameTipsEnabled={earlyGameTipsEnabled}
              onEarlyGameTipsToggle={onEarlyGameTipsToggle}
              itemBuildTipsEnabled={itemBuildTipsEnabled}
              onItemBuildTipsToggle={onItemBuildTipsToggle}
              autoOpenBuild={autoOpenBuild}
              onAutoOpenBuildChange={onAutoOpenBuildChange}
            />
          </TabsContent>

          <TabsContent value="overlay" className="py-4">
            <OverlayTab
              speakingAnimationEnabled={speakingAnimationEnabled}
              onSpeakingAnimationToggle={onSpeakingAnimationToggle}
              listeningAnimationEnabled={listeningAnimationEnabled}
              onListeningAnimationToggle={onListeningAnimationToggle}
              thinkingAnimationEnabled={thinkingAnimationEnabled}
              onThinkingAnimationToggle={onThinkingAnimationToggle}
              liveTextualChatEnabled={liveTextualChatEnabled}
              onLiveTextualChatToggle={onLiveTextualChatToggle}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ConfigurationDialog;
