import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { HelpCircle, ChevronDown, CheckCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface TroubleshootingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContactSupport: () => void;
}

const Troubleshooting = ({ open, onOpenChange, onContactSupport }: TroubleshootingProps) => {
  const { t } = useLanguage();

  return (
    <Card className="border-border/50 bg-card/95 backdrop-blur">
      <CardContent className="pt-6">
        <Collapsible open={open} onOpenChange={onOpenChange}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/20">
                  <HelpCircle className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{t('components.dashboard.Troubleshooting.title')}</h3>
                  <p className="text-sm text-muted-foreground">{t('components.dashboard.Troubleshooting.subtitle')}</p>
                </div>
              </div>
              <ChevronDown className={`h-5 w-5 transition-transform ${open ? 'rotate-180' : ''}`} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-3">
            <div className="p-4 rounded-lg bg-muted/30 space-y-3">
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-accent" />
                  {t('components.dashboard.Troubleshooting.solutions_title')}
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                  <li>{t('components.dashboard.Troubleshooting.solution_1')}</li>
                  <li>{t('components.dashboard.Troubleshooting.solution_2')}</li>
                  <li>{t('components.dashboard.Troubleshooting.solution_3')}</li>
                  <li>{t('components.dashboard.Troubleshooting.solution_4')}</li>
                </ul>
              </div>
              <Button
                variant="outline"
                className="w-full border-accent/50 hover:bg-accent/10"
                onClick={onContactSupport}
              >
                {t('components.dashboard.Troubleshooting.contact_btn')}
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};

export default Troubleshooting;
