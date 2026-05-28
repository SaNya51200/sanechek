# Fullstack Application with CI/CD

Проект объединяет Next.js фронтенд из лабораторной 10.2 и FastAPI backend из лабораторной 11.1.

## Локальный запуск

```powershell
cd frontend
npm install
npm run build
```

```powershell
cd backend
python -m pip install -r requirements.txt
uvicorn main:app --reload
```

## Деплой

- Frontend: Vercel, переменная `NEXT_PUBLIC_API_URL`.
- Backend: Docker image в Yandex Container Registry и запуск в Serverless Containers.
- Infrastructure: Terraform конфигурация в `infrastructure/terraform`.
- CI/CD: GitHub Actions workflows в `.github/workflows`.

Секреты хранятся только в `.env` локально и в GitHub Actions Secrets.

