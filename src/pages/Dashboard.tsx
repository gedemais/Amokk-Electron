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
    userPlanId,
    isBindingKey,
    volume,
    ttsSpeed,
    ttsVoices,
    selectedVoice,
    pricingDialogOpen,
    setPricingDialogOpen,
    configurationDialogOpen,
    setConfigurationDialogOpen,
    progressDialogOpen,
    setProgressDialogOpen,
    troubleshootOpen,
    setTroubleshootOpen,
    handleAmokkToggle,
    handleAssistantToggle,
    handleVolumeChange,
    handleTtsSpeedChange,
    handleVoiceChange,
    handleBindKey,
    handleTestVolume,
    selectPlan,
    toggleProactiveCoach,
    contactSupport,
    refreshLocalData,
  } = useDashboard();

  return (
    <div className="min-h-screen p-6">
      <DashboardHeader onLanguageChanged={refreshLocalData} />

      <div className="max-w-4xl mx-auto space-y-6">
        <RemainingGamesCard
          remainingGames={remainingGames}
          onUpgradeClick={() => setPricingDialogOpen(true)}
        />

        <PricingDialog
          open={pricingDialogOpen}
          onOpenChange={setPricingDialogOpen}
          onSelectPlan={selectPlan}
          userPlanId={userPlanId}
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
            configurationDialogOpen={configurationDialogOpen}
            onConfigurationDialogOpenChange={setConfigurationDialogOpen}
            assistantToggle={assistantToggle}
            onAssistantToggle={handleAssistantToggle}
            pushToTalkKey={pushToTalkKey}
            isBindingKey={isBindingKey}
            onBindKey={handleBindKey}
            proactiveCoachEnabled={proactiveCoachEnabled}
            onProactiveCoachToggle={toggleProactiveCoach}
            volume={volume}
            onVolumeChange={handleVolumeChange}
            ttsSpeed={ttsSpeed}
            onTtsSpeedChange={handleTtsSpeedChange}
            onTestVolume={handleTestVolume}
            ttsVoices={ttsVoices}
            selectedVoice={selectedVoice}
            onVoiceChange={handleVoiceChange}
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
