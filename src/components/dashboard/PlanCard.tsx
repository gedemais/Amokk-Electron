import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { url } from "inspector/promises";
import { Check } from "lucide-react";


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
  link: string;
}

const PlanCard = ({ title, price, period, description, features, onSelect, isUpgrade, showButton = true, isCurrentPlan, planId, link }: PlanCardProps) => {
  const handle_select = () => {
    const links = {
      3: 'https://amokkcoaching.lemonsqueezy.com/checkout/buy/812bef86-3ada-4a98-9fe8-05518f3cec4e', // Starter LemonSqueezy link
      4: 'https://amokkcoaching.lemonsqueezy.com/checkout/buy/6155b329-917a-41f3-a77d-fdb17a72cac7', // Try-Hard LemonSqueezy link
      5: 'https://amokkcoaching.lemonsqueezy.com/checkout/buy/fd35a47d-f594-4c39-ae32-34aac151d923', // Rush LemonSqueezy link
    }

    const plans_names = {
      3: 'starter',
      4: 'try_hard',
      5: 'rush',
    }

    const userEmail = localStorage.getItem("user_email");

    const url = new URL(links[planId]);

    if (userEmail) {
      url.searchParams.set("checkout[custom][email]", userEmail);
    }

    url.searchParams.set("checkout[custom][plan_name]", plans_names[planId]);

    window.open(url.toString(), '_blank', 'noopener,noreferrer');
  };
  return (
    <Card className="border-border/50 hover:border-primary/50 transition-all cursor-pointer group relative overflow-hidden">
      {/* Upgrade badge */}
      {isUpgrade && (
        <div className="absolute top-0 right-0 bg-gradient-to-br from-primary to-primary text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
          UPGRADE
        </div>
      )}

      {/* Current plan badge */}
      {isCurrentPlan && (
        <div className="absolute top-0 left-0 bg-green-500 text-white text-xs font-bold px-4 py-1 rounded-br-lg z-20">
          PLAN ACTUEL
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
              Sans Engagement
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
              Commencer
            </Button>
          )}
        </div>
      </CardContent>
    </Card>

  );
};

export default PlanCard;
