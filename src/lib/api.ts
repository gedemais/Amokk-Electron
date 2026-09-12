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
// Surveillance du profil après ouverture du checkout : le backend interroge
// /get_profile toutes les 10s (10min max) et s'arrête dès qu'un achat est vu.
export const startPlanWatch = () => apiRequest('POST', '/start_plan_watch');
export const toggleProactiveCoach = (active: boolean) => apiRequest('PUT', '/coach_toggle', { active });
export const updateTtsVoice = (voice_name: string) => apiRequest('PUT', '/update_tts_voice', { voice_name });
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
