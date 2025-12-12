import { useDashboard } from "@/hooks/useDashboard";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RemainingGamesCard from "@/components/dashboard/RemainingGamesCard";
import PricingDialog from "@/components/dashboard/PricingDialog";
import ProgressDialog from "@/components/dashboard/ProgressDialog";
import CoachStatus from "@/components/dashboard/CoachStatus";
import ConfigurationDialog from "@/components/dashboard/ConfigurationDialog";
import QuickStartGuide from "@/components/dashboard/QuickStartGuide";
import Troubleshooting from "@/components/dashboard/Troubleshooting";

const Dashboard = () => {
  const {
    amokkToggle,
    assistantToggle,
    pushToTalkKey,
    proactiveCoachEnabled,
    remainingGames,
    isBindingKey,
    volume,
    pricingDialogOpen,
    setPricingDialogOpen,
    progressDialogOpen,
    setProgressDialogOpen,
    troubleshootOpen,
    setTroubleshootOpen,
    handleAmokkToggle,
    handleAssistantToggle,
    handleVolumeChange,
    handleBindKey,
    handleTestVolume,
    selectPlan,
    toggleProactiveCoach,
    contactSupport,
  } = useDashboard();

  return (
    <div className="min-h-screen p-6">
      <DashboardHeader />

      <div className="max-w-4xl mx-auto space-y-6">
        <RemainingGamesCard
          remainingGames={remainingGames}
          onUpgradeClick={() => setPricingDialogOpen(true)}
        />

        <PricingDialog
          open={pricingDialogOpen}
          onOpenChange={setPricingDialogOpen}
          onSelectPlan={selectPlan}
        />

        <ProgressDialog
            open={progressDialogOpen}
            onOpenChange={setProgressDialogOpen}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CoachStatus
            amokkToggle={amokkToggle}
            onToggle={handleAmokkToggle}
          />
          <ConfigurationDialog
            assistantToggle={assistantToggle}
            onAssistantToggle={handleAssistantToggle}
            pushToTalkKey={pushToTalkKey}
            isBindingKey={isBindingKey}
            onBindKey={handleBindKey}
            proactiveCoachEnabled={proactiveCoachEnabled}
            onProactiveCoachToggle={toggleProactiveCoach}
            volume={volume}
            onVolumeChange={handleVolumeChange}
            onTestVolume={handleTestVolume}
          />
        </div>

        <QuickStartGuide />

        <Troubleshooting
          open={troubleshootOpen}
          onOpenChange={setTroubleshootOpen}
          onContactSupport={contactSupport}
        />
      </div>
    </div>
  );
};

export default Dashboard;
