import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";

const QuickStartGuide = () => {
  const { t } = useLanguage();

  const tutorialSteps = [
    { step: 'A', title: t('components.dashboard.QuickStartGuide.step_a_title'), description: t('components.dashboard.QuickStartGuide.step_a_desc') },
    { step: 'B', title: t('components.dashboard.QuickStartGuide.step_b_title'), description: t('components.dashboard.QuickStartGuide.step_b_desc') },
    { step: 'C', title: t('components.dashboard.QuickStartGuide.step_c_title'), description: t('components.dashboard.QuickStartGuide.step_c_desc') },
    { step: 'D', title: t('components.dashboard.QuickStartGuide.step_d_title'), description: t('components.dashboard.QuickStartGuide.step_d_desc') }
  ];

  return (
    <Card className="border-border/50 bg-card/95 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-xl">{t('components.dashboard.QuickStartGuide.title')}</CardTitle>
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
