const BACKEND_HOST = import.meta.env.VITE_BACKEND_HOST || '127.0.0.1';
const BACKEND_PORT = import.meta.env.VITE_BACKEND_PORT || '8000';
const BACKEND_URL = `http://${BACKEND_HOST}:${BACKEND_PORT}`;

const apiRequest = async (method: string, endpoint: string, body?: any) => {
    const url = `${BACKEND_URL}${endpoint}`;
    const options: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json' },
    };
    if (body) {
        options.body = JSON.stringify(body);
    }
    const response = await fetch(url, options);
    return response.json();
}

export const getLocalData = () => apiRequest('GET', '/get_local_data');
export const toggleAmokkCoach = (active: boolean) => apiRequest('PUT', '/amokk_toggle', { active });
export const toggleAssistant = (active: boolean) => apiRequest('PUT', '/assistant_toggle', { active });
export const updateVolume = (volume: number) => apiRequest('PUT', '/update_volume', { volume });
export const updateTtsSpeed = (speed: number) => apiRequest('PUT', '/update_tts_speed', { speed });
export const updateLanguage = (lang: string) => apiRequest('PUT', '/update_language', { lang });
export const updatePttKey = (ptt_key: string) => apiRequest('PUT', '/update_ptt_key', { ptt_key });
export const selectPlan = (plan_id: number) => apiRequest('POST', '/mock_select_plan', { plan_id });
export const toggleProactiveCoach = (active: boolean) => apiRequest('PUT', '/coach_toggle', { active });
export const updateTtsVoice = (voice_name: string) => apiRequest('PUT', '/update_tts_voice', { voice_name });
export const updateInputDevice = (device_name: string) => apiRequest('PUT', '/update_input_device', { device_name });
export const updateOutputDevice = (device_name: string) => apiRequest('PUT', '/update_output_device', { device_name });
export const toggleEarlyGameTips = (active: boolean) => apiRequest('PUT', '/coach_early_game_tips_toggle', { active });
export const toggleItemBuildTips = (active: boolean) => apiRequest('PUT', '/coach_item_build_tips_toggle', { active });
export const updateCoachAutoOpenBuild = (value: string) => apiRequest('PUT', '/update_coach_auto_open_build', { value });
export const toggleSpeakingAnimation = (active: boolean) => apiRequest('PUT', '/overlay_speaking_animation_toggle', { active });
export const toggleListeningAnimation = (active: boolean) => apiRequest('PUT', '/overlay_listening_animation_toggle', { active });
export const toggleThinkingAnimation = (active: boolean) => apiRequest('PUT', '/overlay_thinking_animation_toggle', { active });
export const toggleLiveTextualChat = (active: boolean) => apiRequest('PUT', '/overlay_live_chat_toggle', { active });
export const startMicTest = (device_name: string = "") => apiRequest('POST', '/start_mic_test', { device_name });
export const stopMicTest = () => apiRequest('POST', '/stop_mic_test');
export const getMicLevel = () => apiRequest('GET', '/get_mic_level');
export const getOverlayState = () => apiRequest('GET', '/get_overlay_state');
export const getOverlayChat = () => apiRequest('GET', '/get_overlay_chat');
export const toggleOverlay = (active: boolean) => apiRequest('PUT', '/overlay_toggle', { active });
export const contactSupport = () => {
    window.location.href = 'mailto:contact@amokk.fr';
};
export const logout = () => {
    const url = `${BACKEND_URL}/logout`;
    if (navigator.sendBeacon) {
        navigator.sendBeacon(url);
    } else {
        // Fallback for older browsers
        apiRequest('POST', '/logout');
    }
};
