import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { Mic, Volume2, Gauge, Speaker } from "lucide-react";
import { DEFAULT_DEVICE_SENTINEL, TTS_SPEED_MIN, TTS_SPEED_MAX, TTS_SPEED_STEP } from "./constants";

interface AudioTabProps {
  ttsVoices: string[];
  selectedVoice: string;
  onVoiceChange: (voice: string) => void;
  volume: number[];
  onVolumeChange: (values: number[]) => void;
  ttsSpeed: number[];
  onTtsSpeedChange: (values: number[]) => void;
  onTestVolume: () => void;
  outputDevices: string[];
  selectedOutputDevice: string; // "" = system default
  onOutputDeviceChange: (device: string) => void;
}

const AudioTab = ({
  ttsVoices,
  selectedVoice,
  onVoiceChange,
  volume,
  onVolumeChange,
  ttsSpeed,
  onTtsSpeedChange,
  onTestVolume,
  outputDevices,
  selectedOutputDevice,
  onOutputDeviceChange,
}: AudioTabProps) => {
  const { t } = useTranslation();

  const listedOutputDevices =
    selectedOutputDevice === "" || outputDevices.includes(selectedOutputDevice)
      ? outputDevices
      : [selectedOutputDevice, ...outputDevices];

  return (
    <div className="space-y-6">
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
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-semibold flex items-center gap-2">
              <Speaker className="h-4 w-4" />
              {t("components.dashboard.ConfigurationDialog.output_device_title")}
            </h4>
            <p className="text-sm text-muted-foreground">
              {t("components.dashboard.ConfigurationDialog.output_device_desc")}
            </p>
          </div>
          <Select
            value={selectedOutputDevice === "" ? DEFAULT_DEVICE_SENTINEL : selectedOutputDevice}
            onValueChange={(value) =>
              onOutputDeviceChange(value === DEFAULT_DEVICE_SENTINEL ? "" : value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={DEFAULT_DEVICE_SENTINEL}>
                {t("components.dashboard.ConfigurationDialog.output_device_default")}
              </SelectItem>
              {listedOutputDevices.map((device) => (
                <SelectItem key={device} value={device}>
                  {device}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

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
            <span className="text-sm font-medium min-w-[3ch]">{volume[0]}</span>
          </div>
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
            <span className="text-sm font-medium min-w-[5ch]">{ttsSpeed[0].toFixed(2)}x</span>
          </div>
        </div>
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
  );
};

export default AudioTab;
