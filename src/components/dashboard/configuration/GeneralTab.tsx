import { Switch } from "@/components/ui/switch";
import { useTranslation } from "react-i18next";

interface GeneralTabProps {
  assistantToggle: boolean;
  onAssistantToggle: (checked: boolean) => void;
  proactiveCoachEnabled: boolean;
  onProactiveCoachToggle: (checked: boolean) => void;
  overlayEnabled: boolean;
  onOverlayToggle: (checked: boolean) => void;
}

const GeneralTab = ({
  assistantToggle,
  onAssistantToggle,
  proactiveCoachEnabled,
  onProactiveCoachToggle,
  overlayEnabled,
  onOverlayToggle,
}: GeneralTabProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
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
            <h4
              className={`font-semibold transition-colors ${overlayEnabled ? "text-accent" : "text-foreground"}`}
            >
              {t("components.dashboard.ConfigurationDialog.overlay_title")}
            </h4>
            <p className="text-sm text-muted-foreground">
              {t("components.dashboard.ConfigurationDialog.overlay_desc")}
            </p>
          </div>
          <Switch
            checked={overlayEnabled}
            onCheckedChange={onOverlayToggle}
            className="data-[state=checked]:bg-accent ml-4"
          />
        </div>
      </div>
    </div>
  );
};

export default GeneralTab;
