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
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Settings, Keyboard, Volume2 } from "lucide-react";

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
  onTestVolume: () => void;
}

const { t } = useTranslation();
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
  onTestVolume,
}: ConfigurationDialogProps) => {
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
                  {t("pages.ConfigurationDialog.card_title")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("pages.ConfigurationDialog.card_desc")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {t("pages.ConfigurationDialog.dialog_title")}
          </DialogTitle>
          <DialogDescription>
            {t("pages.ConfigurationDialog.dialog_desc")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4
                  className={`font-semibold transition-colors ${assistantToggle ? "text-accent" : "text-foreground"}`}
                >
                  {t("pages.ConfigurationDialog.assistant_title")}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {t("pages.ConfigurationDialog.assistant_desc")}
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
                  {t("pages.ConfigurationDialog.ptt_title")}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {t("pages.ConfigurationDialog.ptt_desc")} <br />
                  {t("pages.ConfigurationDialog.ptt_desc2")}
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
                  ? t("pages.ConfigurationDialog.ptt_btn_binding")
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
                  {t("pages.ConfigurationDialog.proactive_title")}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {t("pages.ConfigurationDialog.proactive_desc")}
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
            <div className="flex flex-col gap-4">
              <div className="flex-1">
                <h4 className="font-semibold">
                  {t("pages.ConfigurationDialog.volume_title")}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {t("pages.ConfigurationDialog.volume_desc")}
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
                {t("pages.ConfigurationDialog.test_volume_btn")}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConfigurationDialog;
