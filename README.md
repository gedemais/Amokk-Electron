npm install
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..
npm run dist:linux
npm run dist:win

Pour lancer le .AppImage (executable standalone):

chmod +x release/AMOKK-1.0.0.AppImage
./release/AMOKK-1.0.0.AppImage

Ou installer le .deb (package Debian):

sudo dpkg -i release/amokk_1.0.0_amd64.deb
amokk