import { useState, useEffect, useRef } from "react";
import { useDebugPanel } from "@/hooks/useDebugPanel";
import { logger } from "@/utils/logger";
import * as api from "@/lib/api";

export const useDashboard = () => {
  const debug = useDebugPanel();
  const volumeDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const [amokkToggle, setAmokkToggle] = useState(false);
  const [assistantToggle, setAssistantToggle] = useState(false);
  const [pushToTalkKey, setPushToTalkKey] = useState("V");
  const [proactiveCoachEnabled, setProactiveCoachEnabled] = useState(false);
  const [remainingGames, setRemainingGames] = useState(42);
  const [isBindingKey, setIsBindingKey] = useState(false);
  const [volume, setVolume] = useState([70]);
  const [pricingDialogOpen, setPricingDialogOpen] = useState(false);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [troubleshootOpen, setTroubleshootOpen] = useState(false);

  useEffect(() => {
    fetchLocalData();
  }, []);

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
      if (data.amokk_toggle !== undefined) setAmokkToggle(data.amokk_toggle);
      if (data.assistant_toggle !== undefined) setAssistantToggle(data.assistant_toggle);
      if (data.coach_toggle !== undefined) setProactiveCoachEnabled(data.coach_toggle);
      if (data.ptt_key !== undefined) setPushToTalkKey(data.ptt_key);
      if (data.tts_volume !== undefined) setVolume([data.tts_volume]);
      if (data.first_launch === true) setProgressDialogOpen(true);
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

  const handleVolumeChange = (values: number[]) => {
    setVolume(values);
    if (volumeDebounceRef.current) {
      clearTimeout(volumeDebounceRef.current);
    }
    volumeDebounceRef.current = setTimeout(async () => {
      try {
        const newVolume = values[0];
        logger.api('PUT', '/update_volume', { volume: newVolume });
        const data = await api.updateVolume(newVolume);
        debug.log('UPDATE_VOLUME', data);
        logger.apiResponse('/update_volume', 200, data);
        setVolume([newVolume]);
      } catch (error) {
        logger.error('UPDATE_VOLUME failed', error);
        debug.log('UPDATE_VOLUME_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }, 500);
  };
  
  const handleBindKey = () => {
    setIsBindingKey(true);
    logger.info('Listening for key press...');
    debug.log('KEY_BINDING_STARTED', { message: 'Waiting for key press...' });

    let bindingTimeout: NodeJS.Timeout;

    const handleKeyDown = async (event: KeyboardEvent) => {
      event.preventDefault();
      clearTimeout(bindingTimeout); // Clear the timeout
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
    const utterance = new SpeechSynthesisUtterance("Test du niveau de volume");
    utterance.volume = volume[0] / 100;
    window.speechSynthesis.speak(utterance);
  };

  return {
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
  };
};
