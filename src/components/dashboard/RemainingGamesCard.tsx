import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";

interface RemainingGamesCardProps {
  remainingGames: number;
  userPlanId: number;
  planWatchPending: boolean;
  onUpgradeClick: () => void;
}

// plan_id 1 = "none" : l'utilisateur n'a JAMAIS pris de plan. Un compteur à 0
// ne lui dit pas quoi faire. Un abonné à court de parties (plan >= 2) garde le
// compteur habituel : "0 parties restantes" a du sens pour lui.
const NEVER_SUBSCRIBED_PLAN_ID = 1;

const RemainingGamesCard = ({
  remainingGames,
  userPlanId,
  planWatchPending,
  onUpgradeClick,
}: RemainingGamesCardProps) => {
  const { t } = useTranslation();

  // Surveillance post-checkout en cours : LemonSqueezy confirme le plan puis
  // crédite les parties via deux webhooks distincts. Tant que les deux ne sont
  // pas arrivés, l'état du compte est transitoire — on l'annonce plutôt que
  // d'afficher "aucune game" ou "0 partie restante".
  if (planWatchPending) {
    return (
      <Card className="border-border/50 bg-card/95 backdrop-blur">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-gradient-to-br from-primary to-accent">
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">
                {t("components.dashboard.RemainingGamesCard.waiting_payment")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("components.dashboard.RemainingGamesCard.waiting_payment_desc")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (userPlanId === NEVER_SUBSCRIBED_PLAN_ID) {
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
                  {t("components.dashboard.RemainingGamesCard.no_plan_title")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("components.dashboard.RemainingGamesCard.no_plan_desc")}
                </p>
              </div>
            </div>
            <Button
              variant="gaming"
              size="lg"
              className="px-6"
              onClick={onUpgradeClick}
            >
              {t("components.dashboard.RemainingGamesCard.no_plan_btn")}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

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
