$env:NODE_ENV = "development"

Write-Host "Compiling Electron main process..."
npm run tsc
if (-not $?) { Write-Error "TypeScript compilation failed."; exit 1 }

Write-Host "Starting Vite dev server in background..."
$vite = Start-Process -FilePath "powershell.exe" -ArgumentList "-NoProfile", "-Command", "Set-Location '$PSScriptRoot'; npm run dev" -PassThru -NoNewWindow

Write-Host "Waiting for Vite to be ready..."
Start-Sleep -Seconds 8

Write-Host "Launching Electron..."
try {
    npx electron .
} finally {
    Write-Host "Stopping Vite..."
    Stop-Process -Id $vite.Id -Force -ErrorAction SilentlyContinue
}
