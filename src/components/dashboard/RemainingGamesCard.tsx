import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Zap } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface RemainingGamesCardProps {
  remainingGames: number;
  onUpgradeClick: () => void;
}

const RemainingGamesCard = ({ remainingGames, onUpgradeClick }: RemainingGamesCardProps) => {
  const { t } = useLanguage();
  return (
    <Card className="border-border/50 bg-card/95 backdrop-blur">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-gradient-to-br from-primary to-accent">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">{remainingGames} {t('components.dashboard.RemainingGamesCard.games_remaining_suffix')}</h3>
              <p className="text-sm text-muted-foreground">{t('components.dashboard.RemainingGamesCard.games_remaining_desc')}</p>
            </div>
          </div>
          <Button
            variant="gaming"
            size="lg"
            className="px-6"
            onClick={onUpgradeClick}
          >
            {t('components.dashboard.RemainingGamesCard.upgrade_btn')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RemainingGamesCard;
