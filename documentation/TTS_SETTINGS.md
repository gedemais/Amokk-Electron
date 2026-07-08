# TTS — Vitesse & samples de voix

## Vitesse TTS
- Slider dans le dialog Configuration, borné **0.75–2.0** (`ConfigurationDialog.tsx`).
- Autofill au démarrage depuis le champ `tts_speed` de `GET /get_local_data`.
- Chaque changement appelle `PUT /update_tts_speed { speed }` (voir `src/lib/api.ts`).
- Backend mock : validation 0.75–2.0, persisté dans `backend/state.json`.

## Samples de voix ("Tester la voix")
- MP3 dans `public/voice-samples/<lang>/<male|female>.mp3` (5 langues : fr, en, de, es, it).
- En prod le backend expose exactement 2 voix par langue, nommées par le genre localisé
  (fr: Homme/Femme, en: Male/Female, es: Hombre/Mujer, de: Mann/Frau, it: Uomo/Donna).
- Résolution (`src/utils/voiceSamples.ts`, insensible à la casse) : nom/id → genre via `VOICE_GENDERS`
  → `<lang>/<genre>.mp3` en priorité, puis candidats par voix, puis fallback CDN du même genre, puis fallback global.
  Le bouton "Tester la voix" passe le **nom** de la voix (`selectedVoice`), pas l'id.
- Volume et vitesse courants appliqués à la lecture (`playbackRate`) ; tous les MP3 sont générés à la même vitesse de base.
- Les noms de voix sont rafraîchis immédiatement après un changement de langue (callback `onLanguageChanged` → re-fetch de `/get_local_data`).
- Scripts : `tools/download_voice_samples.py` (Drive, partage "lien" requis) ou `tools/generate_voice_samples.py` (OpenAI). Deps : `tools/requirements.txt`.

## Focus fenêtre après login Google
- `electron/main.ts` : la fenêtre est minimisée à l'ouverture du navigateur, puis restaurée + focus (pulse always-on-top + `app.focus({steal: true})`) dès la réception du token depuis `api.amokk.fr` (avant le forward au backend local), ou en cas d'erreur/timeout.
- L'onglet navigateur ne reçoit sa page de résultat qu'une fois le token obtenu, et tente un `window.close()` 3 s plus tard (peut être bloqué par le navigateur selon la façon dont l'onglet a été ouvert).
