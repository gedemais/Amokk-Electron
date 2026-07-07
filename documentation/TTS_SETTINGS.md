# TTS — Vitesse & samples de voix

## Vitesse TTS
- Slider dans le dialog Configuration, borné **0.75–2.0** (`ConfigurationDialog.tsx`).
- Autofill au démarrage depuis le champ `tts_speed` de `GET /get_local_data`.
- Chaque changement appelle `PUT /update_tts_speed { speed }` (voir `src/lib/api.ts`).
- Backend mock : validation 0.75–2.0, persisté dans `backend/state.json`.

## Samples de voix ("Tester le volume")
- MP3 dans `public/voice-samples/<lang>/<male|female>.mp3` (5 langues : fr, en, de, es, it).
- Résolution (`src/utils/voiceSamples.ts`) : `<lang>/<voiceId>.mp3` → `<lang>/<genre>.mp3` → fallback CDN.
  Genre déduit de la voix via `VOICE_GENDERS` (`ash` = male, autres = female) — à compléter si nouvelles voix.
- Volume et vitesse courants appliqués à la lecture (`playbackRate`) ; tous les MP3 sont générés à la même vitesse de base.
- Les noms de voix sont rafraîchis immédiatement après un changement de langue (callback `onLanguageChanged` → re-fetch de `/get_local_data`).
- Scripts : `tools/download_voice_samples.py` (Drive, partage "lien" requis) ou `tools/generate_voice_samples.py` (OpenAI). Deps : `tools/requirements.txt`.

## Focus fenêtre après login Google
- `electron/main.ts` : la fenêtre est minimisée à l'ouverture du navigateur, puis restaurée + focus (pulse always-on-top + `app.focus({steal: true})`) à la réception du token, ou en cas d'erreur/timeout.
