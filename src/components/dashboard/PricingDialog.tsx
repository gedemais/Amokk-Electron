import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PlanCard from "./PlanCard";

interface PricingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPlan: (planId: number) => void;
  userPlanId: number;
}

const PricingDialog = ({ open, onOpenChange, onSelectPlan, userPlanId }: PricingDialogProps) => {
  const plans = [
    {
      title: "Starter",
      price: "5,99€",
      period: "/mois",
      description: "Idéal pour progresser tranquillement.",
      features: [
        <><span className="font-bold text-primary">10</span> games coachées / mois</>,
        "Coach proactif durant toute la game",
        "Assistant Vocal en cours de partie (Push-To-Talk)",
        "Support en moins de 24h",
      ],
      planId: 3,
    },
    {
      title: "Try-Hard",
      price: "24,99€",
      period: "/mois",
      description: "Tout ce qu'il faut pour grind et progresser rapidement !",
      features: [
        <><span className="font-bold text-primary">50</span> games coachées / mois</>,
        "Coach proactif durant toute la game",
        "Assistant Vocal en cours de partie (Push-To-Talk)",
        "Support en moins de 24h",
      ],
      planId: 4,
    },
    {
      title: "Rush",
      price: "89,99€",
      period: "/mois",
      description: "Pour ceux qui veulent profiter d'Amokk à chaque game !",
      features: [
        <span className="font-bold text-primary">ILLIMITÉ</span>,
        "Accès anticipé aux nouveautés",
        "Coach proactif durant toute la game",
        "Assistant Vocal en cours de partie (Push-To-Talk)",
        "Support en moins de 24h",
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
