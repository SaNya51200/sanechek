$ErrorActionPreference = "Stop"

Write-Host "Testing frontend build"
Push-Location frontend
npm install
npm run build
Pop-Location

Write-Host "Testing backend Python compilation"
Push-Location backend
python -m pip install -r requirements.txt
python -m compileall .
docker build -t lab17-book-api .
Pop-Location

Write-Host "Local verification finished"

