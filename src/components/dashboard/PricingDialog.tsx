import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PlanCard from "./PlanCard";
import { useLanguage } from "@/context/LanguageContext";

interface PricingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPlan: (planId: number) => void;
  userPlanId: number;
}

const PricingDialog = ({ open, onOpenChange, onSelectPlan, userPlanId }: PricingDialogProps) => {
  const { t } = useLanguage();

  const plans = [
    {
      title: t('components.dashboard.PricingDialog.starter_title'),
      price: t('components.dashboard.PricingDialog.starter_price'),
      period: t('components.dashboard.PricingDialog.starter_period'),
      description: t('components.dashboard.PricingDialog.starter_desc'),
      features: t('components.dashboard.PricingDialog.starter_features'),
      planId: 3,
    },
    {
      title: t('components.dashboard.PricingDialog.tryhard_title'),
      price: t('components.dashboard.PricingDialog.tryhard_price'),
      period: t('components.dashboard.PricingDialog.tryhard_period'),
      description: t('components.dashboard.PricingDialog.tryhard_desc'),
      features: t('components.dashboard.PricingDialog.tryhard_features'),
      planId: 4,
    },
    {
      title: t('components.dashboard.PricingDialog.rush_title'),
      price: t('components.dashboard.PricingDialog.rush_price'),
      period: t('components.dashboard.PricingDialog.rush_period'),
      description: t('components.dashboard.PricingDialog.rush_desc'),
      features: t('components.dashboard.PricingDialog.rush_features'),
      planId: 5,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border/50 max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t('components.dashboard.PricingDialog.dialog_title')}
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            {t('components.dashboard.PricingDialog.dialog_desc')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
          {plans.map((plan) => (
            <PlanCard
              key={plan.planId}
              title={plan.title}
              price={plan.price}
              period={plan.period}
              description={plan.description}
              features={plan.features}
              onSelect={() => onSelectPlan(plan.planId)}
              isUpgrade={plan.planId > userPlanId}
              showButton={plan.planId > userPlanId}
              isCurrentPlan={plan.planId === userPlanId}
              planId={plan.planId}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PricingDialog;
