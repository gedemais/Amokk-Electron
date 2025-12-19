import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Power } from "lucide-react";

interface CoachStatusProps {
  amokkToggle: boolean;
  onToggle: (checked: boolean) => void;
}

const CoachStatus = ({ amokkToggle, onToggle }: CoachStatusProps) => {
  return (
    <Card className="border-border/50 bg-card/95 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-3">
          <Power className={`h-6 w-6 ${amokkToggle ? 'text-accent' : 'text-muted-foreground'}`} />
          Statut du Coach
        </CardTitle>
        <CardDescription>
          {amokkToggle ? 'AMOKK est actif et prêt à vous coacher' : 'Activez AMOKK pour commencer le coaching'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between p-6 rounded-lg bg-muted/50 border border-border">
          <span className="text-lg font-semibold">
            {amokkToggle ? 'Actif' : 'Inactif'}
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
