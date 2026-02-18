import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PlanCard from "./PlanCard";
import { useTranslation } from "react-i18next";

interface PricingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPlan: (planId: number) => void;
  userPlanId: number;
}

const { t } = useTranslation();

const PricingDialog = ({
  open,
  onOpenChange,
  onSelectPlan,
  userPlanId,
}: PricingDialogProps) => {
  const plans = [
    {
      title: t("pages.PricingDialog.starter_title"),
      price: t("pages.PricingDialog.starter_price"),
      period: t("pages.PricingDialog.starter_period"),
      description: t("pages.PricingDialog.starter_desc"),
      features: [
        <>
          <span className="font-bold text-primary">10</span>{" "}
          {t("pages.PricingDialog.starter_features")}
        </>,
        t("pages.PricingDialog.starter_features2"),
      ],
      planId: 3,
    },
    {
      title: t("pages.PricingDialog.tryhard_title"),
      price: t("pages.PricingDialog.tryhard_price"),
      period: t("pages.PricingDialog.tryhard_period"),
      description: t("pages.PricingDialog.tryhard_desc"),
      features: [
        <>
          <span className="font-bold text-primary"> 50 </span>{" "}
          {t("pages.PricingDialog.tryhard_features")}
        </>,
        t("pages.PricingDialog.tryhard_features2"),
      ],
      planId: 4,
    },
    {
      title: t("pages.PricingDialog.rush_title"),
      price: t("pages.PricingDialog.rush_price"),
      period: t("pages.PricingDialog.rush_period"),
      description: t("pages.PricingDialog.rush_desc"),
      features: [
        <span className="font-bold text-primary">
          {t("pages.PricingDialog.rush_features")}
        </span>,
        t("pages.PricingDialog.rush_features2"),
      ],
      planId: 5,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border/50 max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Choisissez votre plan
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Débloquez tout le potentiel d'Amokk avec un plan premium
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
