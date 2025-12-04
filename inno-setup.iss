[Setup]
AppId={{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}
AppName=AMOKK
AppVersion=1.0.0
AppPublisher=AMOKK
DefaultDirName={localappdata}\AMOKK
DefaultGroupName=AMOKK
OutputBaseFilename=AMOKK-Installer
OutputDir=.
ArchitecturesInstallIn64BitMode=x64
Compression=lzma
SolidCompression=yes
PrivilegesRequired=lowest
WizardStyle=modern
AllowNoIcons=yes

[Files]
Source: "release\win-unpacked\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{userdesktop}\AMOKK"; Filename: "{app}\AMOKK.exe"
Name: "{group}\AMOKK"; Filename: "{app}\AMOKK.exe"
Name: "{group}\Uninstall AMOKK"; Filename: "{uninstallexe}"

[Run]
Filename: "{app}\AMOKK.exe"; Description: "Launch AMOKK"; Flags: nowait skipifsilent postinstall
