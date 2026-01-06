import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";


interface PlanCardProps {
  title: string;
  price: string;
  period: string;
  description: string;
  features: (string | JSX.Element)[];
  onSelect: () => void;
  isUpgrade?: boolean;
  showButton?: boolean;
  isCurrentPlan?: boolean;
  planId: number;
}

const PlanCard = ({ title, price, period, description, features, onSelect, isUpgrade, showButton = true, isCurrentPlan, planId }: PlanCardProps) => {
  const { t } = useLanguage();
  const handle_select = () => {
    window.electronAPI.openExternal("https://amokk.fr/#pricing");
  };
  return (
    <Card className="border-border/50 hover:border-primary/50 transition-all cursor-pointer group relative overflow-hidden">
      {/* Upgrade badge */}
      {isUpgrade && (
        <div className="absolute top-0 right-0 bg-gradient-to-br from-primary to-primary text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
          {t('components.dashboard.PlanCard.upgrade_badge')}
        </div>
      )}

      {/* Current plan badge */}
      {isCurrentPlan && (
        <div className="absolute top-0 left-0 bg-green-500 text-white text-xs font-bold px-4 py-1 rounded-br-lg z-20">
          {t('components.dashboard.PlanCard.current_plan_badge')}
        </div>
      )}

      {/* Overlay on hover / current */}
      <div
        className={`
          absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent transition-opacity 
          ${isCurrentPlan ? "opacity-30" : "opacity-0 group-hover:opacity-100"}
          pointer-events-none
        `}
      />

      <CardContent className="pt-8 pb-8 relative z-10">
        <div className="text-center space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-foreground mb-2">{title}</h3>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold">{price}</span>
              <span className="text-muted-foreground">{period}</span>
            </div>
            <p className="text-xl font-bold text-muted-foreground mt-2">
              {t('components.dashboard.PlanCard.no_commitment')}
            </p>
            <p className="text-sm text-muted-foreground mt-3">{description}</p>
          </div>

          <div className="space-y-3 text-left">
            {features.map((feature, index) => (
              <div key={index} className="flex gap-3 items-start">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>

          {showButton && (
            <Button className="w-full" variant="outline" onClick={handle_select}>
              {t('components.dashboard.PlanCard.start_btn')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>

  );
};

export default PlanCard;
