# AMOKK - AI Voice Coach for League of Legends

Application desktop cross-platform (Windows/Linux) développée avec Electron, React, et FastAPI.

## Documentation

- **[BUILD-GUIDE.md](documentation/BUILD-GUIDE.md)** - Guide de compilation complet
- **[FRONTEND_ONLY_BUILD.md](FRONTEND_ONLY_BUILD.md)** - Build frontend-only (architecture client-serveur)
- **[INSTALLER-GUIDE.md](documentation/INSTALLER-GUIDE.md)** - Guide d'installation
- **[SESSION_SUMMARY.md](documentation/SESSION_SUMMARY.md)** - Résumé des sessions

## Quick Start

### Build Complet (Frontend + Backend embarqué)

```bash
npm install
npm run dist:win        # Windows
npm run dist:linux      # Linux
```

### Build Frontend-Only (Backend séparé)

```bash
# Configurer l'URL du backend dans .env
echo "VITE_BACKEND_HOST=api.amokk.fr" > .env
echo "VITE_BACKEND_PORT=8000" >> .env

# Build frontend seul
npm run dist:win_front
```

## Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement Vite |
| `npm run build` | Build frontend React |
| `npm run electron` | Lancer en mode développement |
| `npm run dist:win` | Build Windows complet (frontend + backend) |
| `npm run dist:win_front` | Build Windows frontend-only |
| `npm run dist:linux` | Build Linux complet (AppImage) |

## Architecture

### Build Complet
```
┌────────────────────────────────┐
│      AMOKK.exe (348 MB)        │
│  ┌──────────┐  ┌────────────┐  │
│  │ Frontend │  │  Backend   │  │
│  │  React   │←→│  FastAPI   │  │
│  └──────────┘  └────────────┘  │
└────────────────────────────────┘
```

### Frontend-Only
```
┌─────────────────┐         ┌──────────────┐
│ Frontend (328MB)│  HTTP   │   Backend    │
│  AMOKK-Frontend │────────→│   FastAPI    │
│      .exe       │         │  (Serveur)   │
└─────────────────┘         └──────────────┘
```

## Technologies

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + Shadcn/UI
- **Desktop**: Electron 28
- **Backend**: Python 3 + FastAPI + Uvicorn
- **Build**: electron-builder + PyInstaller

## Installation rapide

Voir les scripts dans `install/`:
- `install-windows.sh` - Build complet pour Windows
- `install_winfront.sh` - Build frontend-only pour Windows
- `install-linux.sh` - Build pour Linux

## Configuration

Copier `.env.example` vers `.env` et ajuster les variables:

```env
# Backend API (pour frontend-only)
VITE_BACKEND_HOST=127.0.0.1
VITE_BACKEND_PORT=8000

# Logging
LOG_LEVEL=debug
LOG_FILE=true
```

---

Pour plus de détails, consultez la documentation dans `documentation/`.
