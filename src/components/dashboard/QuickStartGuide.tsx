import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const QuickStartGuide = () => {
  const tutorialSteps = [
    { step: 'A', title: 'Configurez votre coach', description: 'Configurez vos préférences dans les paramètres' },
    { step: 'B', title: 'Activez AMOKK', description: 'Basculez l\'interrupteur ci-dessus pour activer le coaching' },
    { step: 'C', title: 'Lancez une partie', description: 'Commencez simplement à jouer - AMOKK sera là pendant vos parties' },
    { step: 'D', title: 'Contrôlez les conseils', description: 'Maintenez push-to-talk pendant 1 seconde pendant que AMOKK parle pour interrompre' }
  ];

  return (
    <Card className="border-border/50 bg-card/95 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-xl">Tutoriel de Démarrage Rapide</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {tutorialSteps.map((item, index) => (
          <div key={index} className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center font-bold">
              {item.step}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default QuickStartGuide;
