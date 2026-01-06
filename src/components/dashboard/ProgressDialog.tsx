import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Rocket, Brain, Swords, Target, Zap } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface ProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProgressDialog = ({ open, onOpenChange }: ProgressDialogProps) => {
    const { t } = useLanguage();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:border-accent/50 transition-all hover:shadow-lg hover:shadow-accent/20 border-border/50 bg-card/95 backdrop-blur overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="pt-6 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-full bg-gradient-to-br from-primary via-accent to-primary animate-pulse">
                      <Sparkles className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        {t('components.dashboard.ProgressDialog.card_title')}
                      </h3>
                      <p className="text-sm text-muted-foreground">{t('components.dashboard.ProgressDialog.card_desc')}</p>
                    </div>
                  </div>
                  <Rocket className="h-6 w-6 text-accent group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="bg-gradient-to-br from-card via-card to-card/95 border-accent/30 max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
            <DialogHeader className="relative space-y-4 pb-4">
              <div className="flex items-center justify-center">
                <div className="p-4 rounded-full bg-gradient-to-br from-primary via-accent to-primary animate-pulse shadow-lg shadow-accent/50">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
              </div>
              <DialogTitle className="text-4xl font-bold text-center bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                {t('components.dashboard.ProgressDialog.dialog_title')}
              </DialogTitle>
              <DialogDescription className="text-center text-base">
                {t('components.dashboard.ProgressDialog.dialog_desc')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-8 py-6 relative">
              <div className="space-y-4 text-center px-4">
                <h4 className="text-2xl font-bold text-foreground">{t('components.dashboard.ProgressDialog.why_title')}</h4>
                <p className="text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                  {t('components.dashboard.ProgressDialog.why_text')}
                </p>
              </div>

              <div className="space-y-5">
                <h4 className="text-2xl font-bold text-center text-foreground">{t('components.dashboard.ProgressDialog.what_title')}</h4>
                <div className="grid gap-5">
                  <div className="flex gap-4 p-6 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 shadow-lg hover:shadow-primary/20 transition-all hover:scale-[1.02]">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg flex-shrink-0">
                      <Brain className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h5 className="text-lg font-bold text-foreground mb-2">{t('components.dashboard.ProgressDialog.feature1_title')}</h5>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {t('components.dashboard.ProgressDialog.feature1_desc')}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-6 rounded-2xl bg-gradient-to-br from-accent/20 via-accent/10 to-transparent border border-accent/30 shadow-lg hover:shadow-accent/20 transition-all hover:scale-[1.02]">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-accent to-primary shadow-lg flex-shrink-0">
                      <Swords className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h5 className="text-lg font-bold text-foreground mb-2">{t('components.dashboard.ProgressDialog.feature2_title')}</h5>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {t('components.dashboard.ProgressDialog.feature2_desc')}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-6 rounded-2xl bg-gradient-to-br from-primary/20 via-accent/10 to-transparent border border-primary/30 shadow-lg hover:shadow-primary/20 transition-all hover:scale-[1.02]">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg flex-shrink-0">
                      <Target className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h5 className="text-lg font-bold text-foreground mb-2">{t('components.dashboard.ProgressDialog.feature3_title')}</h5>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {t('components.dashboard.ProgressDialog.feature3_desc')}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-6 rounded-2xl bg-gradient-to-br from-accent/20 via-primary/10 to-transparent border border-accent/30 shadow-lg hover:shadow-accent/20 transition-all hover:scale-[1.02]">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-accent to-primary shadow-lg flex-shrink-0">
                      <Zap className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h5 className="text-lg font-bold text-foreground mb-2">{t('components.dashboard.ProgressDialog.feature4_title')}</h5>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {t('components.dashboard.ProgressDialog.feature4_desc')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden p-8 rounded-2xl bg-gradient-to-br from-primary via-accent to-primary shadow-2xl">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30" />
                <div className="relative flex items-center justify-center gap-3">
                  <Rocket className="h-8 w-8 text-white animate-bounce" />
                  <p className="text-lg text-center font-bold text-white whitespace-pre-line">
                    {t('components.dashboard.ProgressDialog.cta_text')}
                  </p>
                  <Sparkles className="h-8 w-8 text-white animate-pulse" />
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
    )
}

export default ProgressDialog;
