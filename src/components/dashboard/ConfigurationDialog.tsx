import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Settings, Keyboard, Volume2, Mic, AudioLines, Gauge } from "lucide-react";
import * as api from "@/lib/api";

const TTS_SPEED_MIN = 0.75;
const TTS_SPEED_MAX = 2.0;
const TTS_SPEED_STEP = 0.05;

// Radix SelectItem forbids value="" — this sentinel stands for the system
// default device; the backend only ever sees "".
const DEFAULT_DEVICE_SENTINEL = "__default__";
const MIC_LEVEL_POLL_MS = 100;

interface ConfigurationDialogProps {
  configurationDialogOpen: boolean;
  onConfigurationDialogOpenChange: (open: boolean) => void;
  assistantToggle: boolean;
  onAssistantToggle: (checked: boolean) => void;
  pushToTalkKey: string;
  isBindingKey: boolean;
  onBindKey: () => void;
  proactiveCoachEnabled: boolean;
  onProactiveCoachToggle: (checked: boolean) => void;
  volume: number[];
  onVolumeChange: (values: number[]) => void;
  ttsSpeed: number[];
  onTtsSpeedChange: (values: number[]) => void;
  onTestVolume: () => void;
  ttsVoices: string[];
  selectedVoice: string;
  onVoiceChange: (voice: string) => void;
  inputDevices: string[];
  selectedInputDevice: string; // "" = system default
  onInputDeviceChange: (device: string) => void;
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
  inputDevices,
  selectedInputDevice,
  onInputDeviceChange,
}: ConfigurationDialogProps) => {
  const { t } = useTranslation();

  // ------- Discord-like mic test: poll the backend level while active -------
  const [micTestActive, setMicTestActive] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const micPollRef = useRef<NodeJS.Timeout | null>(null);

  const stopMicTest = useCallback(() => {
    if (micPollRef.current) {
      clearInterval(micPollRef.current);
      micPollRef.current = null;
    }
    setMicTestActive(false);
    setMicLevel(0);
    // Best-effort: the backend watchdog closes the stream anyway when the
    // polling stops (killed renderer, backend restart...).
    api.stopMicTest().catch(() => {});
  }, []);

  const startMicTest = async () => {
    try {
      const data = await api.startMicTest(selectedInputDevice);
      // apiRequest never throws on 4xx/5xx: gate on the payload instead.
      if (data?.active !== true) return;
      setMicTestActive(true);
      micPollRef.current = setInterval(async () => {
        try {
          const level = await api.getMicLevel();
          if (level?.active !== true) {
            stopMicTest(); // watchdog fired or device unplugged mid-test
            return;
          }
          setMicLevel(level.level ?? 0);
        } catch {
          stopMicTest(); // backend unreachable
        }
      }, MIC_LEVEL_POLL_MS);
    } catch {
      // backend down: leave the test idle
    }
  };

  // Stop when the dialog closes, and on unmount.
  useEffect(() => {
    if (!configurationDialogOpen && micTestActive) stopMicTest();
  }, [configurationDialogOpen, micTestActive, stopMicTest]);
  useEffect(() => () => stopMicTest(), [stopMicTest]);

  // Switching device mid-test: the backend restarts its stream in place.
  useEffect(() => {
    if (micTestActive) {
      api.startMicTest(selectedInputDevice).catch(() => stopMicTest());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedInputDevice]);

  // Unplugged-but-persisted device: keep it visible instead of a blank trigger.
  const listedDevices =
    selectedInputDevice === "" || inputDevices.includes(selectedInputDevice)
      ? inputDevices
      : [selectedInputDevice, ...inputDevices];

  return (
    <Dialog
      open={configurationDialogOpen}
      onOpenChange={onConfigurationDialogOpenChange}
    >
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
      <DialogContent className="bg-card border-border/50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {t("components.dashboard.ConfigurationDialog.dialog_title")}
          </DialogTitle>
          <DialogDescription>
            {t("components.dashboard.ConfigurationDialog.dialog_desc")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4
                  className={`font-semibold transition-colors ${assistantToggle ? "text-accent" : "text-foreground"}`}
                >
                  {t("components.dashboard.ConfigurationDialog.assistant_title")}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {t("components.dashboard.ConfigurationDialog.assistant_desc")}
                </p>
              </div>
              <Switch
                checked={assistantToggle}
                onCheckedChange={onAssistantToggle}
                className="data-[state=checked]:bg-accent ml-4"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="font-semibold">
                  {t("components.dashboard.ConfigurationDialog.ptt_title")}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {t("components.dashboard.ConfigurationDialog.ptt_desc")}{" "}
                  <br />
                  {t("components.dashboard.ConfigurationDialog.ptt_desc2")}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onBindKey}
                className="border-accent/50 hover:bg-accent/10 min-w-[100px]"
              >
                <Keyboard className="h-4 w-4 mr-2" />
                {isBindingKey
                  ? t("components.dashboard.ConfigurationDialog.ptt_btn_binding")
                  : pushToTalkKey}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4
                  className={`font-semibold transition-colors ${proactiveCoachEnabled ? "text-accent" : "text-foreground"}`}
                >
                  {t("components.dashboard.ConfigurationDialog.proactive_title")}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {t("components.dashboard.ConfigurationDialog.proactive_desc")}
                </p>
              </div>
              <Switch
                checked={proactiveCoachEnabled}
                onCheckedChange={onProactiveCoachToggle}
                className="data-[state=checked]:bg-accent ml-4"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-semibold flex items-center gap-2">
                  <AudioLines className="h-4 w-4" />
                  {t("components.dashboard.ConfigurationDialog.mic_title")}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {t("components.dashboard.ConfigurationDialog.mic_desc")}
                </p>
              </div>
              <Select
                value={selectedInputDevice === "" ? DEFAULT_DEVICE_SENTINEL : selectedInputDevice}
                onValueChange={(value) =>
                  onInputDeviceChange(value === DEFAULT_DEVICE_SENTINEL ? "" : value)
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={DEFAULT_DEVICE_SENTINEL}>
                    {t("components.dashboard.ConfigurationDialog.mic_device_default")}
                  </SelectItem>
                  {listedDevices.map((device) => (
                    <SelectItem key={device} value={device}>
                      {device}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={micTestActive ? stopMicTest : startMicTest}
                className="border-accent/50 hover:bg-accent/10"
              >
                <AudioLines className="h-4 w-4 mr-2" />
                {micTestActive
                  ? t("components.dashboard.ConfigurationDialog.mic_test_stop_btn")
                  : t("components.dashboard.ConfigurationDialog.mic_test_btn")}
              </Button>
              <Progress value={micLevel * 100} className="flex-1" />
            </div>
          </div>

          {ttsVoices.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Mic className="h-4 w-4" />
                    {t("components.dashboard.ConfigurationDialog.voice_title")}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {t("components.dashboard.ConfigurationDialog.voice_desc")}
                  </p>
                </div>
                <Select value={selectedVoice || undefined} onValueChange={onVoiceChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ttsVoices.map((voice) => (
                      <SelectItem key={voice} value={voice}>
                        {voice}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex flex-col gap-4">
              <div className="flex-1">
                <h4 className="font-semibold">
                  {t("components.dashboard.ConfigurationDialog.volume_title")}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {t("components.dashboard.ConfigurationDialog.volume_desc")}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Volume2 className="h-4 w-4 text-muted-foreground" />
                <Slider
                  value={volume}
                  onValueChange={onVolumeChange}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm font-medium min-w-[3ch]">
                  {volume[0]}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onTestVolume}
                className="border-accent/50 hover:bg-accent/10"
              >
                <Volume2 className="h-4 w-4 mr-2" />
                {t("components.dashboard.ConfigurationDialog.test_volume_btn")}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col gap-4">
              <div className="flex-1">
                <h4 className="font-semibold">
                  {t("components.dashboard.ConfigurationDialog.speed_title")}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {t("components.dashboard.ConfigurationDialog.speed_desc")}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Gauge className="h-4 w-4 text-muted-foreground" />
                <Slider
                  value={ttsSpeed}
                  onValueChange={onTtsSpeedChange}
                  min={TTS_SPEED_MIN}
                  max={TTS_SPEED_MAX}
                  step={TTS_SPEED_STEP}
                  className="flex-1"
                />
                <span className="text-sm font-medium min-w-[5ch]">
                  {ttsSpeed[0].toFixed(2)}x
                </span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConfigurationDialog;
