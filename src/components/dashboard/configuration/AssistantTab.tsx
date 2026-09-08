import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { Keyboard, AudioLines } from "lucide-react";
import { DEFAULT_DEVICE_SENTINEL } from "./constants";

interface AssistantTabProps {
  pushToTalkKey: string;
  isBindingKey: boolean;
  onBindKey: () => void;
  inputDevices: string[];
  selectedInputDevice: string; // "" = system default
  onInputDeviceChange: (device: string) => void;
  micTestActive: boolean;
  micLevel: number;
  onStartMicTest: () => void;
  onStopMicTest: () => void;
}

const AssistantTab = ({
  pushToTalkKey,
  isBindingKey,
  onBindKey,
  inputDevices,
  selectedInputDevice,
  onInputDeviceChange,
  micTestActive,
  micLevel,
  onStartMicTest,
  onStopMicTest,
}: AssistantTabProps) => {
  const { t } = useTranslation();

  const listedDevices =
    selectedInputDevice === "" || inputDevices.includes(selectedInputDevice)
      ? inputDevices
      : [selectedInputDevice, ...inputDevices];

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {t("components.dashboard.ConfigurationDialog.assistant_feature_desc")}
      </p>

      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h4 className="font-semibold">
              {t("components.dashboard.ConfigurationDialog.ptt_title")}
            </h4>
            <p className="text-sm text-muted-foreground">
              {t("components.dashboard.ConfigurationDialog.ptt_desc")} <br />
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
            onClick={micTestActive ? onStopMicTest : onStartMicTest}
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
    </div>
  );
};

export default AssistantTab;
