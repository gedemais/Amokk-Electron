import { useState, useEffect, useRef } from "react";
import { useDebugPanel } from "@/hooks/useDebugPanel";
import { logger } from "@/utils/logger";
import * as api from "@/lib/api";
import { toggleVoiceSample } from "@/utils/voiceSamples";
import type { AutoOpenBuildOption } from "@/components/dashboard/configuration/CoachTab";

export const useDashboard = () => {
  const debug = useDebugPanel();
  const volumeDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const [isFirstLaunch, setIsFirstLaunch] = useState(false);
  const [amokkToggle, setAmokkToggle] = useState(false);
  const [assistantToggle, setAssistantToggle] = useState(false);
  const [pushToTalkKey, setPushToTalkKey] = useState("V");
  const [proactiveCoachEnabled, setProactiveCoachEnabled] = useState(true);
  const [remainingGames, setRemainingGames] = useState(42);
  const [language, setLanguage] = useState("fr");
  const [userPlanId, setUserPlanId] = useState(1);
  const [isBindingKey, setIsBindingKey] = useState(false);
  const [volume, setVolume] = useState([70]);
  const [ttsSpeed, setTtsSpeed] = useState([1.0]);
  const [ttsVoices, setTtsVoices] = useState<string[]>([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [inputDevices, setInputDevices] = useState<string[]>([]);
  const [selectedInputDevice, setSelectedInputDevice] = useState(""); // "" = system default
  const [outputDevices, setOutputDevices] = useState<string[]>([]);
  const [selectedOutputDevice, setSelectedOutputDevice] = useState(""); // "" = system default
  const [overlayEnabled, setOverlayEnabled] = useState(true);
  const [selectedVoiceId, setSelectedVoiceId] = useState("ash");
  const [pricingDialogOpen, setPricingDialogOpen] = useState(false);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [troubleshootOpen, setTroubleshootOpen] = useState(false);
  const [configurationDialogOpen, setConfigurationDialogOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  // Coach Proactif sub-settings
  const [earlyGameTipsEnabled, setEarlyGameTipsEnabled] = useState(true);
  const [itemBuildTipsEnabled, setItemBuildTipsEnabled] = useState(true);
  const [autoOpenBuild, setAutoOpenBuild] = useState<AutoOpenBuildOption>("none");

  // Overlay In-Game sub-settings
  const [speakingAnimationEnabled, setSpeakingAnimationEnabled] = useState(true);
  const [listeningAnimationEnabled, setListeningAnimationEnabled] = useState(true);
  const [thinkingAnimationEnabled, setThinkingAnimationEnabled] = useState(true);
  const [liveTextualChatEnabled, setLiveTextualChatEnabled] = useState(true);

  useEffect(() => {
    fetchLocalData();

    const interval_id = setInterval(() => {
      fetchLocalData();
    }, 10000);

    return () => clearInterval(interval_id);
  }, []);

  useEffect(() => {
    if (!progressDialogOpen && isFirstLaunch) {
      setOnboardingOpen(true);
    }
  }, [progressDialogOpen, isFirstLaunch]);

  useEffect(() => {
    const handle_before_unload = () => {
      clean_exit();
    };

    window.addEventListener('beforeunload', handle_before_unload);

    return () => {
      window.removeEventListener('beforeunload', handle_before_unload);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (volumeDebounceRef.current) {
        clearTimeout(volumeDebounceRef.current);
      }
    };
  }, []);

  const fetchLocalData = async () => {
    try {
      logger.api('GET', '/get_local_data');
      const data = await api.getLocalData();
      debug.log('GET_LOCAL_DATA', data);
      logger.apiResponse('/get_local_data', 200, data);

      if (data.remaining_games !== undefined) setRemainingGames(data.remaining_games);
      if (data.lang !== undefined) setLanguage(data.lang);
      if (data.plan_id !== undefined) setUserPlanId(data.plan_id);
      if (data.amokk_toggle !== undefined) setAmokkToggle(data.amokk_toggle);
      if (data.assistant_toggle !== undefined) setAssistantToggle(data.assistant_toggle);
      if (data.coach_toggle !== undefined) setProactiveCoachEnabled(data.coach_toggle);
      if (data.ptt_key !== undefined) setPushToTalkKey(data.ptt_key);
      if (data.tts_volume !== undefined) setVolume([data.tts_volume]);
      if (data.tts_speed !== undefined) setTtsSpeed([data.tts_speed]);
      if (data.tts_voices !== undefined) setTtsVoices(data.tts_voices);
      if (data.tts_voice_name !== undefined) setSelectedVoice(data.tts_voice_name);
      if (data.current_tts_voice_name !== undefined) setSelectedVoice(data.current_tts_voice_name ?? "");
      if (data.tts_voice !== undefined) setSelectedVoiceId(data.tts_voice);
      if (data.input_devices !== undefined) setInputDevices(data.input_devices);
      if (data.current_input_device_name !== undefined) setSelectedInputDevice(data.current_input_device_name ?? "");
      if (data.output_devices !== undefined) setOutputDevices(data.output_devices);
      if (data.current_output_device_name !== undefined) setSelectedOutputDevice(data.current_output_device_name ?? "");
      if (data.overlay_toggle !== undefined) setOverlayEnabled(data.overlay_toggle);
      if (data.coach_early_game_tips_toggle !== undefined) setEarlyGameTipsEnabled(data.coach_early_game_tips_toggle);
      if (data.coach_item_build_tips_toggle !== undefined) setItemBuildTipsEnabled(data.coach_item_build_tips_toggle);
      if (data.coach_auto_open_build !== undefined) setAutoOpenBuild(data.coach_auto_open_build);
      if (data.overlay_speaking_animation_toggle !== undefined) setSpeakingAnimationEnabled(data.overlay_speaking_animation_toggle);
      if (data.overlay_listening_animation_toggle !== undefined) setListeningAnimationEnabled(data.overlay_listening_animation_toggle);
      if (data.overlay_thinking_animation_toggle !== undefined) setThinkingAnimationEnabled(data.overlay_thinking_animation_toggle);
      if (data.overlay_live_chat_toggle !== undefined) setLiveTextualChatEnabled(data.overlay_live_chat_toggle);
      if (data.first_launch === true) {
        setIsFirstLaunch(true);
        setProgressDialogOpen(true);
      }
    } catch (error) {
      logger.error('GET_LOCAL_DATA failed', error);
      debug.log('GET_LOCAL_DATA_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const handleAmokkToggle = async (newState: boolean) => {
    try {
      logger.api('PUT', '/amokk_toggle', { active: newState });
      const data = await api.toggleAmokkCoach(newState);
      debug.log('AMOKK_TOGGLE', data);
      logger.apiResponse('/amokk_toggle', 200, data);
      setAmokkToggle(newState);
    } catch (error) {
      logger.error('AMOKK_TOGGLE failed', error);
      debug.log('AMOKK_TOGGLE_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const handleAssistantToggle = async (newState: boolean) => {
    try {
      logger.api('PUT', '/assistant_toggle', { active: newState });
      const data = await api.toggleAssistant(newState);
      debug.log('ASSISTANT_TOGGLE', data);
      logger.apiResponse('/assistant_toggle', 200, data);
      setAssistantToggle(newState);
    } catch (error) {
      logger.error('ASSISTANT_TOGGLE failed', error);
      debug.log('ASSISTANT_TOGGLE_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const handleVolumeChange = async (values: number[]) => {
    setVolume(values);
    await api.updateVolume(values[0]);
  };

  const handleTtsSpeedChange = async (values: number[]) => {
    setTtsSpeed(values);
    try {
      logger.api('PUT', '/update_tts_speed', { speed: values[0] });
      const data = await api.updateTtsSpeed(values[0]);
      debug.log('UPDATE_TTS_SPEED', data);
      logger.apiResponse('/update_tts_speed', 200, data);
    } catch (error) {
      logger.error('UPDATE_TTS_SPEED failed', error);
      debug.log('UPDATE_TTS_SPEED_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const handleVoiceChange = async (voiceName: string) => {
    setSelectedVoice(voiceName);
    try {
      logger.api('PUT', '/update_tts_voice', { voice_name: voiceName });
      const data = await api.updateTtsVoice(voiceName);
      debug.log('UPDATE_TTS_VOICE', data);
      logger.apiResponse('/update_tts_voice', 200, data);
      if (data.tts_voice !== undefined) setSelectedVoiceId(data.tts_voice);
      await fetchLocalData();
    } catch (error) {
      logger.error('UPDATE_TTS_VOICE failed', error);
      debug.log('UPDATE_TTS_VOICE_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const handleInputDeviceChange = async (deviceName: string) => {
    setSelectedInputDevice(deviceName);
    try {
      logger.api('PUT', '/update_input_device', { device_name: deviceName });
      const data = await api.updateInputDevice(deviceName);
      debug.log('UPDATE_INPUT_DEVICE', data);
      logger.apiResponse('/update_input_device', 200, data);
    } catch (error) {
      logger.error('UPDATE_INPUT_DEVICE failed', error);
      debug.log('UPDATE_INPUT_DEVICE_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const handleOverlayToggle = async (newState: boolean) => {
    setOverlayEnabled(newState);
    try {
      logger.api('PUT', '/overlay_toggle', { active: newState });
      const data = await api.toggleOverlay(newState);
      debug.log('OVERLAY_TOGGLE', data);
      logger.apiResponse('/overlay_toggle', 200, data);
    } catch (error) {
      logger.error('OVERLAY_TOGGLE failed', error);
      debug.log('OVERLAY_TOGGLE_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const handleOutputDeviceChange = async (deviceName: string) => {
    setSelectedOutputDevice(deviceName);
    try {
      logger.api('PUT', '/update_output_device', { device_name: deviceName });
      const data = await api.updateOutputDevice(deviceName);
      debug.log('UPDATE_OUTPUT_DEVICE', data);
      logger.apiResponse('/update_output_device', 200, data);
    } catch (error) {
      logger.error('UPDATE_OUTPUT_DEVICE failed', error);
      debug.log('UPDATE_OUTPUT_DEVICE_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const handleEarlyGameTipsToggle = async (newState: boolean) => {
    setEarlyGameTipsEnabled(newState);
    try {
      logger.api('PUT', '/coach_early_game_tips_toggle', { active: newState });
      const data = await api.toggleEarlyGameTips(newState);
      debug.log('COACH_EARLY_GAME_TIPS_TOGGLE', data);
      logger.apiResponse('/coach_early_game_tips_toggle', 200, data);
    } catch (error) {
      logger.error('COACH_EARLY_GAME_TIPS_TOGGLE failed', error);
      debug.log('COACH_EARLY_GAME_TIPS_TOGGLE_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const handleItemBuildTipsToggle = async (newState: boolean) => {
    setItemBuildTipsEnabled(newState);
    try {
      logger.api('PUT', '/coach_item_build_tips_toggle', { active: newState });
      const data = await api.toggleItemBuildTips(newState);
      debug.log('COACH_ITEM_BUILD_TIPS_TOGGLE', data);
      logger.apiResponse('/coach_item_build_tips_toggle', 200, data);
    } catch (error) {
      logger.error('COACH_ITEM_BUILD_TIPS_TOGGLE failed', error);
      debug.log('COACH_ITEM_BUILD_TIPS_TOGGLE_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const handleAutoOpenBuildChange = async (value: AutoOpenBuildOption) => {
    setAutoOpenBuild(value);
    try {
      logger.api('PUT', '/update_coach_auto_open_build', { value });
      const data = await api.updateCoachAutoOpenBuild(value);
      debug.log('UPDATE_COACH_AUTO_OPEN_BUILD', data);
      logger.apiResponse('/update_coach_auto_open_build', 200, data);
    } catch (error) {
      logger.error('UPDATE_COACH_AUTO_OPEN_BUILD failed', error);
      debug.log('UPDATE_COACH_AUTO_OPEN_BUILD_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const handleSpeakingAnimationToggle = async (newState: boolean) => {
    setSpeakingAnimationEnabled(newState);
    try {
      logger.api('PUT', '/overlay_speaking_animation_toggle', { active: newState });
      const data = await api.toggleSpeakingAnimation(newState);
      debug.log('OVERLAY_SPEAKING_ANIMATION_TOGGLE', data);
      logger.apiResponse('/overlay_speaking_animation_toggle', 200, data);
    } catch (error) {
      logger.error('OVERLAY_SPEAKING_ANIMATION_TOGGLE failed', error);
      debug.log('OVERLAY_SPEAKING_ANIMATION_TOGGLE_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const handleListeningAnimationToggle = async (newState: boolean) => {
    setListeningAnimationEnabled(newState);
    try {
      logger.api('PUT', '/overlay_listening_animation_toggle', { active: newState });
      const data = await api.toggleListeningAnimation(newState);
      debug.log('OVERLAY_LISTENING_ANIMATION_TOGGLE', data);
      logger.apiResponse('/overlay_listening_animation_toggle', 200, data);
    } catch (error) {
      logger.error('OVERLAY_LISTENING_ANIMATION_TOGGLE failed', error);
      debug.log('OVERLAY_LISTENING_ANIMATION_TOGGLE_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const handleThinkingAnimationToggle = async (newState: boolean) => {
    setThinkingAnimationEnabled(newState);
    try {
      logger.api('PUT', '/overlay_thinking_animation_toggle', { active: newState });
      const data = await api.toggleThinkingAnimation(newState);
      debug.log('OVERLAY_THINKING_ANIMATION_TOGGLE', data);
      logger.apiResponse('/overlay_thinking_animation_toggle', 200, data);
    } catch (error) {
      logger.error('OVERLAY_THINKING_ANIMATION_TOGGLE failed', error);
      debug.log('OVERLAY_THINKING_ANIMATION_TOGGLE_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const handleLiveTextualChatToggle = async (newState: boolean) => {
    setLiveTextualChatEnabled(newState);
    try {
      logger.api('PUT', '/overlay_live_chat_toggle', { active: newState });
      const data = await api.toggleLiveTextualChat(newState);
      debug.log('OVERLAY_LIVE_CHAT_TOGGLE', data);
      logger.apiResponse('/overlay_live_chat_toggle', 200, data);
    } catch (error) {
      logger.error('OVERLAY_LIVE_CHAT_TOGGLE failed', error);
      debug.log('OVERLAY_LIVE_CHAT_TOGGLE_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const handleBindKey = () => {
    setIsBindingKey(true);
    logger.info('Listening for key press...');
    debug.log('KEY_BINDING_STARTED', { message: 'Waiting for key press...' });

    let bindingTimeout: NodeJS.Timeout;

    const handleKeyDown = async (event: KeyboardEvent) => {
      event.preventDefault();
      clearTimeout(bindingTimeout);
      const newKey = event.key.toUpperCase();
      logger.debug('Key pressed', newKey);
      document.removeEventListener('keydown', handleKeyDown);
      setIsBindingKey(false);
      try {
        logger.api('PUT', '/update_ptt_key', { ptt_key: newKey });
        const data = await api.updatePttKey(newKey);
        debug.log('UPDATE_PTT_KEY', data);
        logger.apiResponse('/update_ptt_key', 200, data);
        setPushToTalkKey(newKey);
      } catch (error) {
        logger.error('UPDATE_PTT_KEY failed', error);
        debug.log('UPDATE_PTT_KEY_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    bindingTimeout = setTimeout(() => {
      document.removeEventListener('keydown', handleKeyDown);
      setIsBindingKey(false);
      debug.log('KEY_BINDING_TIMEOUT', { message: 'Key binding timeout - no key pressed' });
    }, 5000);
  };

  const selectPlan = async (planId: number) => {
    try {
      logger.api('POST', '/mock_select_plan', { plan_id: planId });
      const data = await api.selectPlan(planId);
      debug.log('MOCK_SELECT_PLAN', data);
      logger.apiResponse('/mock_select_plan', 200, data);
      setRemainingGames(data.remaining_games);
      setPricingDialogOpen(false);
    } catch (error) {
      logger.error('MOCK_SELECT_PLAN failed', error);
      debug.log('MOCK_SELECT_PLAN_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const toggleProactiveCoach = async (newState: boolean) => {
    try {
      logger.api('PUT', '/coach_toggle', { active: newState });
      const data = await api.toggleProactiveCoach(newState);
      debug.log('MOCK_PROACTIVE_COACH_TOGGLE', data);
      logger.apiResponse('/mock_proactive_coach_toggle', 200, data);
      setProactiveCoachEnabled(newState);
    } catch (error) {
      logger.error('MOCK_PROACTIVE_COACH_TOGGLE failed', error);
      debug.log('MOCK_PROACTIVE_COACH_TOGGLE_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const contactSupport = async () => {
    try {
      logger.api('POST', '/mock_contact_support');
      const data = await api.contactSupport();
      debug.log('MOCK_CONTACT_SUPPORT', data);
      logger.apiResponse('/mock_contact_support', 200, data);
    } catch (error) {
      logger.error('MOCK_CONTACT_SUPPORT failed', error);
      debug.log('MOCK_CONTACT_SUPPORT_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const clean_exit = () => {
    logger.api('POST', '/logout (beacon)');
    api.logout();
    debug.log('LOGOUT', { status: 'dispatched' });
  };

  const handleTestVolume = () => {
    // Prefer the voice name ("Homme"/"Femme"/"Male"/... in production) —
    // it is what maps to the bundled <lang>/male|female.mp3 samples.
    toggleVoiceSample(selectedVoice || selectedVoiceId, {
      volume: volume[0],
      speed: ttsSpeed[0],
      lang: language,
    });
  };

  return {
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
    refreshLocalData: fetchLocalData,
  };
};
