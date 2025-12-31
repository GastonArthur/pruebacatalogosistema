Param(
  [string]$FrontendEnvPath = ".env.local",
  [string]$BackendEnvPath = "server/.env"
)

Write-Host "Construyendo backend..." -ForegroundColor Cyan
Push-Location "server"
npm install
npm run build
Pop-Location

Write-Host "Construyendo frontend..." -ForegroundColor Cyan
npm install
npm run build

Write-Host "Despliegue listo. Ejecutar:"
Write-Host "  - Backend: cd server; npm run start"
Write-Host "  - Frontend: npm run start"

