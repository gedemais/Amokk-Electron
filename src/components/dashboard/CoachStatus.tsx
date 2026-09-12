import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "react-i18next";
import { Power } from "lucide-react";

interface CoachStatusProps {
  amokkToggle: boolean;
  userPlanId: number;
  onToggle: (checked: boolean) => void;
}

// plan_id 1 = "none" : sans plan, le coach ne peut pas fonctionner (aucune
// partie disponible). L'interrupteur est désactivé plutôt que de laisser
// l'utilisateur activer un coach qui restera muet.
const NEVER_SUBSCRIBED_PLAN_ID = 1;

const CoachStatus = ({ amokkToggle, userPlanId, onToggle }: CoachStatusProps) => {
  const { t } = useTranslation();
  const disabled = userPlanId === NEVER_SUBSCRIBED_PLAN_ID;
  const active = amokkToggle && !disabled;

  return (
    <Card className="border-border/50 bg-card/95 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-3">
          <Power
            className={`h-6 w-6 ${active ? "text-accent" : "text-muted-foreground"}`}
          />
          {t("components.dashboard.CoachStatus.title")}
        </CardTitle>
        <CardDescription>
          {disabled
            ? t("components.dashboard.CoachStatus.no_plan_desc")
            : amokkToggle
              ? t("components.dashboard.CoachStatus.active_desc")
              : t("components.dashboard.CoachStatus.inactive_desc")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={`flex items-center justify-between p-6 rounded-lg bg-muted/50 border border-border ${
            disabled ? "opacity-50" : ""
          }`}
        >
          <span className="text-lg font-semibold">
            {disabled
              ? t("components.dashboard.CoachStatus.status_no_plan")
              : amokkToggle
                ? t("components.dashboard.CoachStatus.status_active")
                : t("components.dashboard.CoachStatus.status_inactive")}
          </span>
          <Switch
            checked={active}
            disabled={disabled}
            onCheckedChange={onToggle}
            className="data-[state=checked]:bg-accent disabled:cursor-not-allowed"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default CoachStatus;
