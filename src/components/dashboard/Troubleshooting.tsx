import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { HelpCircle, ChevronDown, CheckCircle } from "lucide-react";

interface TroubleshootingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContactSupport: () => void;
}

const Troubleshooting = ({ open, onOpenChange, onContactSupport }: TroubleshootingProps) => {
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
                  <h3 className="font-semibold text-lg">Un problème ?</h3>
                  <p className="text-sm text-muted-foreground">Trouvez des solutions aux problèmes courants</p>
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
                  Solutions Courantes
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                  <li>Assurez-vous que League of Legends est en cours d'exécution</li>
                  <li>Vérifiez les autorisations de votre microphone</li>
                  <li>Vérifiez que AMOKK est défini sur Actif</li>
                  <li>Redémarrez l'application si les problèmes persistent</li>
                </ul>
              </div>
              <Button
                variant="outline"
                className="w-full border-accent/50 hover:bg-accent/10"
                onClick={onContactSupport}
              >
                Nous Contacter
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};

export default Troubleshooting;
