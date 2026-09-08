import { useDashboard } from "@/hooks/useDashboard";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import RemainingGamesCard from "@/components/dashboard/RemainingGamesCard";
import PricingDialog from "@/components/dashboard/PricingDialog";
import ProgressDialog from "@/components/dashboard/ProgressDialog";
import CoachStatus from "@/components/dashboard/CoachStatus";
import ConfigurationDialog from "@/components/dashboard/ConfigurationDialog";
import OnboardingWizard from "@/components/dashboard/OnboardingWizard";
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
    inputDevices,
    selectedInputDevice,
    outputDevices,
    selectedOutputDevice,
    overlayEnabled,
    earlyGameTipsEnabled,
    itemBuildTipsEnabled,
    autoOpenBuild,
    speakingAnimationEnabled,
    listeningAnimationEnabled,
    thinkingAnimationEnabled,
    liveTextualChatEnabled,
    pricingDialogOpen,
    setPricingDialogOpen,
    configurationDialogOpen,
    setConfigurationDialogOpen,
    onboardingOpen,
    setOnboardingOpen,
    progressDialogOpen,
    setProgressDialogOpen,
    troubleshootOpen,
    setTroubleshootOpen,
    handleAmokkToggle,
    handleAssistantToggle,
    handleVolumeChange,
    handleTtsSpeedChange,
    handleVoiceChange,
    handleInputDeviceChange,
    handleOutputDeviceChange,
    handleOverlayToggle,
    handleEarlyGameTipsToggle,
    handleItemBuildTipsToggle,
    handleAutoOpenBuildChange,
    handleSpeakingAnimationToggle,
    handleListeningAnimationToggle,
    handleThinkingAnimationToggle,
    handleLiveTextualChatToggle,
    handleBindKey,
    handleTestVolume,
    selectPlan,
    toggleProactiveCoach,
    contactSupport,
    refreshLocalData,
  } = useDashboard();

  const configurationSettings = {
    assistantToggle,
    onAssistantToggle: handleAssistantToggle,
    proactiveCoachEnabled,
    onProactiveCoachToggle: toggleProactiveCoach,
    overlayEnabled,
    onOverlayToggle: handleOverlayToggle,
    volume,
    onVolumeChange: handleVolumeChange,
    ttsSpeed,
    onTtsSpeedChange: handleTtsSpeedChange,
    onTestVolume: handleTestVolume,
    ttsVoices,
    selectedVoice,
    onVoiceChange: handleVoiceChange,
    outputDevices,
    selectedOutputDevice,
    onOutputDeviceChange: handleOutputDeviceChange,
    pushToTalkKey,
    isBindingKey,
    onBindKey: handleBindKey,
    inputDevices,
    selectedInputDevice,
    onInputDeviceChange: handleInputDeviceChange,
    earlyGameTipsEnabled,
    onEarlyGameTipsToggle: handleEarlyGameTipsToggle,
    itemBuildTipsEnabled,
    onItemBuildTipsToggle: handleItemBuildTipsToggle,
    autoOpenBuild,
    onAutoOpenBuildChange: handleAutoOpenBuildChange,
    speakingAnimationEnabled,
    onSpeakingAnimationToggle: handleSpeakingAnimationToggle,
    listeningAnimationEnabled,
    onListeningAnimationToggle: handleListeningAnimationToggle,
    thinkingAnimationEnabled,
    onThinkingAnimationToggle: handleThinkingAnimationToggle,
    liveTextualChatEnabled,
    onLiveTextualChatToggle: handleLiveTextualChatToggle,
  };

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

        <OnboardingWizard
          open={onboardingOpen}
          onOpenChange={setOnboardingOpen}
          {...configurationSettings}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CoachStatus
            amokkToggle={amokkToggle}
            onToggle={handleAmokkToggle}
          />
          <ConfigurationDialog
            configurationDialogOpen={configurationDialogOpen}
            onConfigurationDialogOpenChange={setConfigurationDialogOpen}
            {...configurationSettings}
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
