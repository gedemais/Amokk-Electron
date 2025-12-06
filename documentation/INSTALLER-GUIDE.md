# Guide d'installation - Création de l'installateur AMOKK

## Objectif

Créer un fichier d'installation unique (AMOKK-Installer.exe) que les utilisateurs téléchargent et exécutent pour installer l'application AMOKK.

## Prérequis

- Inno Setup version 6.0 ou supérieure (gratuit)
- Téléchargement: https://jrsoftware.org/isdl.php
- Installation requise sur une machine Windows

## Préparation des fichiers

### Build Complet (Frontend + Backend)

Avant de créer l'installateur, vérifier que la structure du projet est correcte:

```
AMOKK/
├── inno-setup.iss
├── release/
│   └── win-unpacked/
│       ├── AMOKK.exe
│       ├── ffmpeg.dll
│       ├── libEGL.dll
│       ├── libGLESv2.dll
│       ├── resources/
│       │   ├── backend/dist/AMOKK-Backend.exe
│       │   └── dist/ (frontend build)
│       └── (tous les autres fichiers nécessaires)
├── assets/
│   └── icon.ico
```

Le répertoire `release/win-unpacked/` doit contenir la totalité des fichiers compilés, y compris toutes les dépendances DLL et les ressources.

### Build Frontend-Only (Sans Backend)

Pour un build frontend-only, la structure est différente:

```
AMOKK/
├── inno-setup-frontend.iss
├── release-frontend/
│   └── win-unpacked/
│       ├── AMOKK-Frontend.exe
│       ├── ffmpeg.dll
│       ├── libEGL.dll
│       ├── libGLESv2.dll
│       ├── resources/
│       │   └── dist/ (frontend build uniquement, PAS de backend)
│       └── (tous les autres fichiers nécessaires)
├── assets/
│   └── icon.ico
```

**Important**: Le backend n'est PAS inclus dans le build frontend-only. L'application se connectera à un backend distant configuré via `.env`.

## Procédure de création de l'installateur

### Option 1: Installateur Complet (avec backend)

#### Étape 1: Ouvrir le fichier de configuration Inno Setup

1. Lancer Inno Setup Compiler
2. Accéder à File > Open
3. Sélectionner le fichier `inno-setup.iss`

#### Étape 2: Compiler l'installateur

1. Accéder au menu Build > Compile
2. Ou utiliser le raccourci clavier Ctrl+F9

À l'issue de la compilation, un fichier `AMOKK-Installer.exe` sera créé dans le répertoire du projet.

### Option 2: Installateur Frontend-Only (sans backend)

#### Script automatique

Le plus simple est d'utiliser le script automatique:

```bash
./install/install_winfront.sh /mnt/c/Users/YourUser/Downloads
```

Ce script génère automatiquement `inno-setup-frontend.iss` adapté au build frontend-only.

#### Compilation manuelle

Si vous préférez compiler manuellement:

1. Lancer Inno Setup Compiler
2. Accéder à File > Open
3. Sélectionner le fichier `inno-setup-frontend.iss`
4. Build > Compile (Ctrl+F9)

Résultat: `AMOKK-Frontend-Installer.exe`

**Note**: L'application frontend-only requiert un backend accessible à l'URL configurée dans `.env`.

## Processus d'installation utilisateur

Lorsque l'utilisateur exécute l'installateur:

1. L'assistant d'installation s'affiche
2. Les fichiers sont copiés dans C:\Users\[UTILISATEUR]\AppData\Local\AMOKK\
3. Des raccourcis sont créés sur le Bureau et dans le menu Démarrage
4. L'application AMOKK est lancée automatiquement à la fin de l'installation

## Distribution

### Mise en ligne de l'installateur

Une fois l'installateur créé, le placer sur un serveur web pour que les utilisateurs puissent le télécharger.

Exemple:
```
https://exemple.com/downloads/AMOKK-Installer.exe
```

### Pour l'utilisateur

Le processus est simple:
1. Télécharger AMOKK-Installer.exe
2. Exécuter le fichier (double-clic)
3. Suivre les instructions de l'assistant
4. AMOKK se lance automatiquement

## Personnalisation du script d'installation

Le fichier `inno-setup.iss` peut être modifié pour adapter l'installation:

### Modifier le nom de l'application

```ini
AppName=Nom_Application
AppVersion=1.0.0
```

### Modifier le répertoire d'installation par défaut

```ini
DefaultDirName={localappdata}\Nom_Dossier
```

### Ajouter une icône personnalisée

Placer une icône au format .ico dans le répertoire assets et modifier:

```ini
SetupIconFile=assets\mon-icone.ico
UninstallIconFile=assets\mon-icone.ico
```

## Dépannage

### Erreur: répertoire win-unpacked introuvable

Vérifier que le répertoire `release/win-unpacked/` existe et contient tous les fichiers compilés. Vérifier également les chemins spécifiés dans le fichier de configuration Inno Setup.

### L'installateur s'exécute sans installer les fichiers

S'assurer que le fichier `AMOKK.exe` existe bien dans `release/win-unpacked/`. Recompiler l'installateur après vérification des fichiers.

### Les raccourcis ne sont pas créés

Désinstaller l'application via le Panneau de Configuration > Programmes et fonctionnalités, puis réinstaller en utilisant le nouvel installateur.

## Références

Documentation complète d'Inno Setup: https://jrsoftware.org/ishelp/

Pour les problèmes courants, consulter la documentation officielle ou les forums de support d'Inno Setup.
