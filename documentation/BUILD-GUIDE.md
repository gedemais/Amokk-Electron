# Guide de Compilation - AMOKK

## Objectif

Ce guide explique comment générer les exécutables Windows et Linux pour AMOKK à partir du code source.

## Prérequis

### Système d'exploitation
- Linux (pour compiler Linux AppImage) ou WSL2
- Windows (pour compiler Windows .exe) ou Wine sur Linux

### Dépendances globales
```bash
npm install -g electron-builder
```

### Installation des dépendances du projet
```bash
npm install
```

---

## Compilation Linux (AppImage)

### Étape 1: Construire l'application Electron

```bash
npm run build
```

### Étape 2: Générer l'AppImage

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd..
npm run dist:linux
```

Résultat:
- `release/AMOKK-1.0.0.AppImage` - Exécutable Linux portable
- `release/linux-unpacked/` - Dossier contenant les fichiers décompressés

### Étape 3: Tester l'AppImage

```bash
./release/AMOKK-1.0.0.AppImage
```

L'application lance et affiche l'interface de connexion.

---

## Compilation Windows

### Option 1: Build Complet (Frontend + Backend)

#### Étape 1: Préparer la compilation

```bash
npm run build
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd..
npm run dist:win
```

Résultat:
- `release/win-unpacked/` - Dossier avec tous les fichiers (DLL, exe, ressources, backend)
- `release/AMOKK-Installer.exe` - Installateur NSIS
- Taille: ~348 MB

### Option 2: Build Frontend-Only (Sans Backend Embarqué)

**Cas d'usage**: Backend déployé séparément sur un serveur

#### Étape 1: Configuration Backend

Modifier `.env` pour pointer vers le backend distant:
```env
VITE_BACKEND_HOST=api.amokk.fr
VITE_BACKEND_PORT=8000
```

#### Étape 2: Compilation Frontend-Only

```bash
npm run dist:win_front
```

**Note**: Cette commande ne compile PAS le backend. Seul le frontend React est packagé.

Résultat:
- `release-frontend/win-unpacked/` - Dossier frontend seul (sans backend)
- `release-frontend/AMOKK-Frontend-Installer.exe` - Installateur NSIS

#### Compiler avec Inno Setup

1. Installer Inno Setup depuis https://jrsoftware.org/isdl.php
2. Lancer "Inno Setup Compiler"
3. File > Open
4. Sélectionner `inno-setup.iss`
5. Build > Compile (ou Ctrl+F9)

Résultat:
- `AMOKK-Installer.exe` - Installateur à distribuer aux utilisateurs

---

## Variables d'environnement importantes

Le fichier `.env` contrôle les options de debug et logging:

```env
DEBUG=true              # Active les logs détaillés
LOG_LEVEL=debug         # Niveau de log (debug, info, warn, error)
LOG_TO_FILE=true        # Écrire les logs dans des fichiers
LOG_DIR=~/.amokk/logs   # Répertoire de destination des logs
```

Voir `.env.example` pour la liste complète des options.

---
