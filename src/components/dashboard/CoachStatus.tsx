import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Power } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface CoachStatusProps {
  amokkToggle: boolean;
  onToggle: (checked: boolean) => void;
}

const CoachStatus = ({ amokkToggle, onToggle }: CoachStatusProps) => {
  const { t } = useLanguage();

  return (
    <Card className="border-border/50 bg-card/95 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-3">
          <Power className={`h-6 w-6 ${amokkToggle ? 'text-accent' : 'text-muted-foreground'}`} />
          {t('components.dashboard.CoachStatus.title')}
        </CardTitle>
        <CardDescription>
          {amokkToggle ? t('components.dashboard.CoachStatus.active_desc') : t('components.dashboard.CoachStatus.inactive_desc')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between p-6 rounded-lg bg-muted/50 border border-border">
          <span className="text-lg font-semibold">
            {amokkToggle ? t('components.dashboard.CoachStatus.status_active') : t('components.dashboard.CoachStatus.status_inactive')}
          </span>
          <Switch
            checked={amokkToggle}
            onCheckedChange={onToggle}
            className="data-[state=checked]:bg-accent"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default CoachStatus;
