$ErrorActionPreference = "Stop"

if (-not $env:YC_REGISTRY_ID) { throw "YC_REGISTRY_ID is required" }
if (-not $env:YC_CONTAINER_NAME) { throw "YC_CONTAINER_NAME is required" }
if (-not $env:YC_FOLDER_ID) { throw "YC_FOLDER_ID is required" }

Push-Location frontend
npm install
npm run build
npx vercel --prod
Pop-Location

Push-Location backend
$image = "cr.yandex/$env:YC_REGISTRY_ID/book-api:manual"
docker build -t $image .
docker push $image
yc serverless container revision deploy `
  --container-name $env:YC_CONTAINER_NAME `
  --folder-id $env:YC_FOLDER_ID `
  --image $image `
  --environment "DATABASE_URL=$env:DATABASE_URL,ALLOWED_ORIGINS=$env:ALLOWED_ORIGINS,ENVIRONMENT=production"
Pop-Location

