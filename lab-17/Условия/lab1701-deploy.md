# **Лабораторная работа 17. Часть 1: Деплой веб-приложения в облаке**

## **Тема:** Развертывание фронтенда и бэкенда на облачных платформах

### **Цель работы:**
Получить практические навыки развертывания веб-приложений в облаке: деплой статического сайта на Vercel, контейнеризация бэкенд-API с Docker, публикация в Yandex Container Registry и запуск в облачной среде с подключением к управляемой базе данных PostgreSQL.

---

## **Задание: Развертывание полноценного веб-приложения в облаке**

Используя готовые приложения из предыдущих лабораторных работ (Next.js портфолио из ЛР 10.2 и FastAPI библиотека из ЛР 11.1), необходимо развернуть их в облачной инфраструктуре. Фронтенд будет хоститься на Vercel, бэкенд — в Yandex Cloud.

### **1. Подготовка к работе**

#### **1.1. Необходимые аккаунты**

```bash
# Зарегистрируйтесь на следующих платформах:
# 1. GitHub (если ещё нет) - https://github.com
# 2. Vercel (через GitHub) - https://vercel.com
# 3. Yandex Cloud (потребуется банковская карта, даётся начальный грант 4000₽)
#    - https://cloud.yandex.ru
# 4. Docker Hub (опционально) - https://hub.docker.com
```

#### **1.2. Установка необходимых инструментов**

```bash
# Установка Docker
sudo apt update
sudo apt install docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
# Выйдите и зайдите заново или выполните: newgrp docker

# Установка Yandex Cloud CLI
curl https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash
source ~/.bashrc

# Проверка установки
yc version

# Установка Terraform (для части 2) (есть зеркало Yandex, т.к. блокируеться разработчиком)
wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor | sudo tee /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install terraform

# Установка GitHub CLI (опционально)
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update && sudo apt install gh
```

### **2. Деплой фронтенда на Vercel**

#### **2.1. Подготовка Next.js приложения**

```bash
# Клонируйте или создайте репозиторий с вашим Next.js приложением из ЛР 10.2
# Убедитесь, что структура проекта правильная:

cd portfolio-site

# Проверьте файл package.json (должен быть скрипт "build")
cat package.json | grep build

# Проверьте, что приложение собирается локально
npm run build

# Инициализируйте Git репозиторий (если ещё нет)
git init
git add .
git commit -m "Initial commit: Next.js portfolio"

# Создайте репозиторий на GitHub
gh repo create portfolio-site --public --source=. --remote=origin --push

# Или через веб-интерфейс GitHub, затем:
# git remote add origin https://github.com/ваш-username/portfolio-site.git
# git push -u origin main
```

#### **2.2. Деплой на Vercel через GitHub**

```bash
# Способ 1: Через веб-интерфейс Vercel
# 1. Войдите на vercel.com
# 2. Нажмите "Add New" → "Project"
# 3. Импортируйте репозиторий portfolio-site
# 4. Настройки:
#    - Framework Preset: Next.js
#    - Build Command: npm run build
#    - Output Directory: .next
# 5. Нажмите "Deploy"

# Способ 2: Через Vercel CLI
npm install -g vercel
vercel login
vercel --prod

# После деплоя вы получите URL вида:
# https://portfolio-site-xxx.vercel.app
```

#### **2.3. Настройка кастомного домена и SSL (дополнительно)**

```bash
# Если у вас есть домен, добавьте его в Vercel:
# 1. В проекте перейдите в Settings → Domains
# 2. Добавьте домен (например, portfolio.вашдомен.ru)
# 3. Настройте DNS-записи у регистратора:
#    - Type: A → Value: 76.76.21.21
#    - Type: CNAME → Value: cname.vercel-dns.com
# 4. SSL сертификат будет выдан автоматически (Let's Encrypt)
```

#### **2.4. Проверка работоспособности**

```bash
# Проверьте, что все страницы доступны:
curl -I https://portfolio-site-xxx.vercel.app/
curl -I https://portfolio-site-xxx.vercel.app/about
curl -I https://portfolio-site-xxx.vercel.app/blog

# В случае успеха должны получить статус 200 OK
```

### **3. Контейнеризация бэкенд API**

#### **3.1. Подготовка FastAPI приложения для контейнеризации**

```bash
# Скопируйте ваш проект из ЛР 11.1
cp -r ../book_api ./book-api
cd book-api

# Создайте файл requirements.txt (если ещё нет)
cat > requirements.txt << 'EOF'
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.4.2
psycopg2-binary==2.9.9
python-dotenv==1.0.0
sqlalchemy==2.0.23
alembic==1.12.1
EOF

# Создайте .env файл для локального тестирования
cat > .env << 'EOF'
DATABASE_URL=postgresql://user:password@localhost:5432/bookdb
POSTGRES_USER=bookuser
POSTGRES_PASSWORD=bookpass
POSTGRES_DB=bookdb
EOF
```

#### **3.2. Создание Dockerfile**

**Файл: `Dockerfile`**

```dockerfile
# Многостадийная сборка для оптимизации размера образа
FROM python:3.11-slim as builder

WORKDIR /app

# Установка системных зависимостей
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Копирование и установка Python зависимостей
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Финальный образ
FROM python:3.11-slim

WORKDIR /app

# Копирование зависимостей из builder
COPY --from=builder /root/.local /root/.local
COPY --from=builder /app /app

# Копирование исходного кода
COPY . .

# Обновление PATH для пользовательских установок
ENV PATH=/root/.local/bin:$PATH

# Настройка переменных окружения
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Открытие порта
EXPOSE 8000

# Команда для запуска приложения
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Файл: `.dockerignore`**

```
venv/
__pycache__/
*.pyc
.git/
.env
*.log
.pytest_cache/
.coverage
htmlcov/
.DS_Store
*.md
```

#### **3.3. Адаптация кода для работы с PostgreSQL**

**Файл: `config.py` (новый файл)**

```python
import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost:5432/bookdb")
    POSTGRES_USER = os.getenv("POSTGRES_USER", "bookuser")
    POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "bookpass")
    POSTGRES_DB = os.getenv("POSTGRES_DB", "bookdb")
    POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
    POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")

settings = Settings()
```

**Файл: `database.py` (новый файл для SQLAlchemy)**

```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import settings

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

**Модификация `main.py` для работы с БД**

```python
# Добавьте в начало файла
from database import engine, Base
from fastapi.middleware.cors import CORSMiddleware

# Добавьте после создания app
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "https://portfolio-site.vercel.app").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# При запуске создаём таблицы
@app.on_event("startup")
async def startup():
    Base.metadata.create_all(bind=engine)
    print("Database tables created")
```

#### **3.4. Локальная сборка и тестирование Docker образа**

```bash
# Сборка образа
docker build -t book-api:latest .

# Проверка списка образов
docker images | grep book-api

# Локальный запуск контейнера
docker run -d \
  --name book-api \
  -p 8000:8000 \
  -e DATABASE_URL="postgresql://user:pass@host.docker.internal:5432/bookdb" \
  book-api:latest

# Проверка, что контейнер работает
docker ps

# Тестирование API
curl http://localhost:8000/health
curl http://localhost:8000/docs

# Остановка контейнера
docker stop book-api
docker rm book-api
```

### **4. Деплой в Yandex Cloud**

#### **4.1. Настройка Yandex Cloud**

```bash
# Аутентификация в Yandex Cloud
yc init

# Следуйте инструкциям:
# 1. Выберите каталог (folder)
# 2. Выберите зону доступности (например, ru-central1-a)
# 3. Подтвердите создание профиля

# Создание сервисного аккаунта для CI/CD
yc iam service-account create \
  --name book-api-sa \
  --description "Service account for book API deployment"

# Получение ID сервисного аккаунта
SA_ID=$(yc iam service-account get book-api-sa --format json | jq -r '.id')

# Назначение ролей
yc resource-manager folder add-access-binding \
  --name default \
  --role editor \
  --subject serviceAccount:$SA_ID

# Создание статического ключа доступа
yc iam access-key create \
  --service-account-name book-api-sa \
  --format json > key.json
```

#### **4.2. Создание Container Registry**

```bash
# Создание реестра
yc container registry create --name book-api-registry

# Получение ID реестра
REGISTRY_ID=$(yc container registry get book-api-registry --format json | jq -r '.id')

# Аутентификация Docker в Yandex Cloud
yc container registry configure-docker

# Тег образа для Yandex Cloud
docker tag book-api:latest cr.yandex/$REGISTRY_ID/book-api:latest

# Публикация образа
docker push cr.yandex/$REGISTRY_ID/book-api:latest
```

#### **4.3. Создание Managed PostgreSQL**

```bash
# Создание кластера PostgreSQL
yc managed-postgresql cluster create \
  --name book-db-cluster \
  --environment production \
  --network-name default \
  --zone ru-central1-a \
  --resource-preset s2.micro \
  --disk-size 10 \
  --disk-type network-ssd \
  --postgresql-version 15 \
  --user name=bookuser,password=SecurePassword123 \
  --database name=bookdb

# Ожидание создания кластера (несколько минут)
yc managed-postgresql cluster list

# Получение хоста для подключения
DB_HOST=$(yc managed-postgresql cluster get book-db-cluster --format json | jq -r '.hosts[0].name')

echo "Database host: $DB_HOST"
```

#### **4.4. Развертывание контейнера в Yandex Cloud Run**

```bash
# Создание сервиса в Cloud Run
yc serverless container create \
  --name book-api-container \
  --folder-id $(yc config get folder-id)

# Деплой контейнера
yc serverless container revision deploy \
  --container-name book-api-container \
  --image cr.yandex/$REGISTRY_ID/book-api:latest \
  --cores 1 \
  --memory 512MB \
  --execution-timeout 30s \
  --concurrency 10 \
  --environment \
    DATABASE_URL="postgresql://bookuser:SecurePassword123@$DB_HOST:5432/bookdb",\
    CORS_ORIGINS="https://portfolio-site.vercel.app"

# Получение публичного URL
CONTAINER_URL=$(yc serverless container get book-api-container --format json | jq -r '.status.url')

echo "Container URL: $CONTAINER_URL"

# Проверка работоспособности
curl $CONTAINER_URL/health
```

### **5. Интеграция фронтенда с бэкендом**

#### **5.1. Настройка переменных окружения в Next.js**

**Файл: `.env.production` (в корне проекта portfolio-site)**

```bash
# API URL для production
NEXT_PUBLIC_API_URL=https://your-container-url.cloud.yandex.net
```

**Модификация кода в Next.js для использования API**

```tsx
// app/blog/page.tsx - пример получения данных из API
async function getBooks() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/books`);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}
```

#### **5.2. Передеплой фронтенда с новыми настройками**

```bash
cd portfolio-site

# Добавление переменной окружения в Vercel
vercel env add NEXT_PUBLIC_API_URL production

# Введите значение: https://your-container-url.cloud.yandex.net

# Передеплой
vercel --prod
```

### **6. Настройка мониторинга**

#### **6.1. Настройка логирования в Yandex Cloud**

```bash
# Создание группы логов
yc logging group create \
  --name book-api-logs \
  --retention-period 7d

# Подключение логов к контейнеру
yc serverless container revision deploy \
  --container-name book-api-container \
  --image cr.yandex/$REGISTRY_ID/book-api:latest \
  --cores 1 \
  --memory 512MB \
  --service-account-id $SA_ID \
  --log-group-name book-api-logs

# Просмотр логов
yc logging read --group-name book-api-logs --since 1h
```

#### **6.2. Настройка метрик в Grafana (опционально)**

```bash
# Создание дашборда в Yandex Monitoring
# Через веб-интерфейс Yandex Cloud:
# 1. Перейдите в раздел "Monitoring"
# 2. Создайте дашборд
# 3. Добавьте виджеты для:
#    - Количество запросов к API
#    - Время ответа
#    - Использование CPU/памяти контейнера
```

### **7. Что должно быть в отчёте:**

1. **Исходный код:**
   - Dockerfile и .dockerignore
   - Файлы конфигурации (config.py, database.py)
   - Модифицированный main.py с подключением к БД

2. **Скриншоты:**
   - Успешный деплой фронтенда на Vercel (страница проектов)
   - Docker образ в Yandex Container Registry
   - Работающий контейнер в Cloud Run (логи или статус)
   - Managed PostgreSQL кластер в Yandex Cloud
   - Проверка работы API через curl (GET /books)
   - Интегрированное приложение (фронтенд запрашивает данные из бэкенда)

3. **Ответы на вопросы:**
   - Какие преимущества даёт многостадийная сборка в Dockerfile?
   - Почему для фронтенда выбран Vercel, а для бэкенда Yandex Cloud?
   - Как решается проблема CORS при обращении фронтенда к API в разных доменах?
   - Какие переменные окружения необходимо хранить в секрете, а какие могут быть публичными?
   - Что такое "холодный старт" в Cloud Run и как он влияет на производительность?

### **8. Критерии оценивания:**

#### **Обязательные требования (минимум для зачёта):**
- **Vercel:** Фронтенд развёрнут и доступен по публичной ссылке
- **Docker:** Создан рабочий Dockerfile, образ собран и протестирован локально
- **Container Registry:** Образ успешно опубликован в Yandex Container Registry
- **Cloud Run:** Контейнер запущен и отвечает на запросы (/health)
- **PostgreSQL:** Managed база данных создана и доступна из контейнера

#### **Дополнительные критерии (для повышения оценки):**
- **Интеграция:** Фронтенд успешно получает данные из API (CORS настроен)
- **Мониторинг:** Настроены логирование и базовые метрики
- **Кастомный домен:** Подключён свой домен и настроен SSL
- **CI/CD (подготовка):** Подготовлены файлы для GitHub Actions (будут использованы в части 2)

#### **Неприемлемые ошибки:**
- Контейнер не запускается из-за ошибок в Dockerfile
- Отсутствует обработка переменных окружения (жёстко зашитые пароли)
- База данных недоступна из контейнера (проблемы сети)
- API возвращает CORS ошибки при запросах с фронтенда

### **9. Полезные команды для Ubuntu:**

```bash
# Просмотр логов контейнера в Cloud Run
yc serverless container logs book-api-container --tail

# Проверка статуса базы данных
yc managed-postgresql cluster get book-db-cluster

# Подключение к БД из контейнера (отладка)
docker run -it --rm cr.yandex/$REGISTRY_ID/book-api:latest /bin/bash

# Очистка ресурсов (важно! чтобы не тратить грант)
yc serverless container delete book-api-container
yc managed-postgresql cluster delete book-db-cluster
yc container registry delete book-api-registry

# Просмотр затрат в Yandex Cloud
yc billing account get <account-id>
```

### **10. Структура итогового проекта:**

```
fullstack-app/
├── frontend/ (portfolio-site)
│   ├── app/
│   ├── .env.production
│   ├── package.json
│   └── vercel.json
├── backend/ (book-api)
│   ├── main.py
│   ├── models.py
│   ├── routers.py
│   ├── config.py
│   ├── database.py
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── requirements.txt
│   └── .env
├── infrastructure/
│   ├── terraform/ (будет в части 2)
│   └── github-actions/ (будет в части 2)
└── README.md
```

### **11. Советы по выполнению:**

1. **Используйте бесплатные гранты:** Yandex Cloud даёт 4000₽ на первый месяц — этого достаточно для выполнения работы.

2. **Тестируйте локально перед деплоем:** Убедитесь, что контейнер работает с локальной PostgreSQL.

3. **Настройте CORS правильно:** В production укажите точный URL фронтенда вместо `"*"`.

4. **Следите за лимитами:** Cloud Run имеет ограничения по времени выполнения (60 секунд по умолчанию).

5. **Сохраните скриншоты:** Yandex Cloud может удалить ресурсы после окончания гранта — зафиксируйте результаты работы.

**Примечание:** В задании предоставлено ~70% кода и инструкций. Ваша задача — адаптировать ваши приложения из ЛР 10.2 и 11.1, настроить подключение к облачной PostgreSQL, выполнить деплой и проверить интеграцию.
