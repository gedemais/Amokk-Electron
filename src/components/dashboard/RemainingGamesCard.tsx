import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Zap } from "lucide-react";

interface RemainingGamesCardProps {
  remainingGames: number;
  onUpgradeClick: () => void;
}

const RemainingGamesCard = ({ remainingGames, onUpgradeClick }: RemainingGamesCardProps) => {
  return (
    <Card className="border-border/50 bg-card/95 backdrop-blur">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-gradient-to-br from-primary to-accent">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">{remainingGames} Parties Coachées Restantes</h3>
              <p className="text-sm text-muted-foreground">Déverrouillez le coaching illimité avec un plan premium</p>
            </div>
          </div>
          <Button
            variant="gaming"
            size="lg"
            className="px-6"
            onClick={onUpgradeClick}
          >
            Améliorer le Plan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RemainingGamesCard;
