import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";

export type AutoOpenBuildOption = "none" | "u.gg" | "lolalytics";

interface CoachTabProps {
  earlyGameTipsEnabled: boolean;
  onEarlyGameTipsToggle: (checked: boolean) => void;
  itemBuildTipsEnabled: boolean;
  onItemBuildTipsToggle: (checked: boolean) => void;
  autoOpenBuild: AutoOpenBuildOption;
  onAutoOpenBuildChange: (value: AutoOpenBuildOption) => void;
}

const CoachTab = ({
  earlyGameTipsEnabled,
  onEarlyGameTipsToggle,
  itemBuildTipsEnabled,
  onItemBuildTipsToggle,
  autoOpenBuild,
  onAutoOpenBuildChange,
}: CoachTabProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {t("components.dashboard.ConfigurationDialog.coach_feature_desc")}
      </p>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-semibold">
              {t("components.dashboard.ConfigurationDialog.coach_early_tips_title")}
            </h4>
            <p className="text-sm text-muted-foreground">
              {t("components.dashboard.ConfigurationDialog.coach_early_tips_desc")}
            </p>
          </div>
          <Switch
            checked={earlyGameTipsEnabled}
            onCheckedChange={onEarlyGameTipsToggle}
            className="data-[state=checked]:bg-accent ml-4"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-semibold">
              {t("components.dashboard.ConfigurationDialog.coach_item_tips_title")}
            </h4>
            <p className="text-sm text-muted-foreground">
              {t("components.dashboard.ConfigurationDialog.coach_item_tips_desc")}
            </p>
          </div>
          <Switch
            checked={itemBuildTipsEnabled}
            onCheckedChange={onItemBuildTipsToggle}
            className="data-[state=checked]:bg-accent ml-4"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-semibold">
              {t("components.dashboard.ConfigurationDialog.coach_auto_open_title")}
            </h4>
            <p className="text-sm text-muted-foreground">
              {t("components.dashboard.ConfigurationDialog.coach_auto_open_desc")}
            </p>
          </div>
          <Select
            value={autoOpenBuild}
            onValueChange={(value) => onAutoOpenBuildChange(value as AutoOpenBuildOption)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                {t("components.dashboard.ConfigurationDialog.coach_auto_open_none")}
              </SelectItem>
              <SelectItem value="u.gg">
                {t("components.dashboard.ConfigurationDialog.coach_auto_open_ugg")}
              </SelectItem>
              <SelectItem value="lolalytics">
                {t("components.dashboard.ConfigurationDialog.coach_auto_open_lolalytics")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default CoachTab;
