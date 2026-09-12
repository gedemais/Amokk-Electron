import { Switch } from "@/components/ui/switch";
import { useTranslation } from "react-i18next";

interface OverlayTabProps {
  speakingAnimationEnabled: boolean;
  onSpeakingAnimationToggle: (checked: boolean) => void;
  listeningAnimationEnabled: boolean;
  onListeningAnimationToggle: (checked: boolean) => void;
  thinkingAnimationEnabled: boolean;
  onThinkingAnimationToggle: (checked: boolean) => void;
  liveTextualChatEnabled: boolean;
  onLiveTextualChatToggle: (checked: boolean) => void;
}

const OverlayTab = ({
  speakingAnimationEnabled,
  onSpeakingAnimationToggle,
  listeningAnimationEnabled,
  onListeningAnimationToggle,
  thinkingAnimationEnabled,
  onThinkingAnimationToggle,
  liveTextualChatEnabled,
  onLiveTextualChatToggle,
}: OverlayTabProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {t("components.dashboard.ConfigurationDialog.overlay_feature_desc")}
      </p>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-semibold">
              {t("components.dashboard.ConfigurationDialog.overlay_speaking_anim_title")}
            </h4>
            <p className="text-sm text-muted-foreground">
              {t("components.dashboard.ConfigurationDialog.overlay_speaking_anim_desc")}
            </p>
          </div>
          <Switch
            checked={speakingAnimationEnabled}
            onCheckedChange={onSpeakingAnimationToggle}
            className="data-[state=checked]:bg-accent ml-4"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-semibold">
              {t("components.dashboard.ConfigurationDialog.overlay_listening_anim_title")}
            </h4>
            <p className="text-sm text-muted-foreground">
              {t("components.dashboard.ConfigurationDialog.overlay_listening_anim_desc")}
            </p>
          </div>
          <Switch
            checked={listeningAnimationEnabled}
            onCheckedChange={onListeningAnimationToggle}
            className="data-[state=checked]:bg-accent ml-4"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-semibold">
              {t("components.dashboard.ConfigurationDialog.overlay_thinking_anim_title")}
            </h4>
            <p className="text-sm text-muted-foreground">
              {t("components.dashboard.ConfigurationDialog.overlay_thinking_anim_desc")}
            </p>
          </div>
          <Switch
            checked={thinkingAnimationEnabled}
            onCheckedChange={onThinkingAnimationToggle}
            className="data-[state=checked]:bg-accent ml-4"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-semibold">
              {t("components.dashboard.ConfigurationDialog.overlay_live_chat_title")}
            </h4>
            <p className="text-sm text-muted-foreground">
              {t("components.dashboard.ConfigurationDialog.overlay_live_chat_desc")}
            </p>
          </div>
          <Switch
            checked={liveTextualChatEnabled}
            onCheckedChange={onLiveTextualChatToggle}
            className="data-[state=checked]:bg-accent ml-4"
          />
        </div>
      </div>
    </div>
  );
};

export default OverlayTab;
