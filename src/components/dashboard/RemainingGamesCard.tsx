import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
<<<<<<< HEAD
=======

<<<<<<< HEAD
>>>>>>> a737ae188031d6fb74d2082cae8ef73ee98c4a10

=======
>>>>>>> 3203364b8a7e77af599ec3f12c374c4b49451832
interface RemainingGamesCardProps {
  remainingGames: number;
  onUpgradeClick: () => void;
}

const RemainingGamesCard = ({
  remainingGames,
  onUpgradeClick,
}: RemainingGamesCardProps) => {
  const { t } = useTranslation();
  return (
    <Card className="border-border/50 bg-card/95 backdrop-blur">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-gradient-to-br from-primary to-accent">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">
                {remainingGames}{" "}
                {t(
                  "components.dashboard.RemainingGamesCard.games_remaining_suffix",
                )}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t(
                  "components.dashboard.RemainingGamesCard.games_remaining_desc",
                )}
              </p>
            </div>
          </div>
          <Button
            variant="gaming"
            size="lg"
            className="px-6"
            onClick={onUpgradeClick}
          >
            {t("components.dashboard.RemainingGamesCard.upgrade_btn")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RemainingGamesCard;
