# **Лабораторная работа 17. Часть 2: Настройка CI/CD пайплайна**

## **Тема:** Автоматизация сборки, тестирования и деплоя с использованием GitHub Actions и Infrastructure as Code

### **Цель работы:**
Получить практические навыки настройки CI/CD пайплайнов: автоматическое тестирование и сборка приложений при каждом push в репозиторий, автоматический деплой на Vercel и в Yandex Cloud, знакомство с Terraform для описания инфраструктуры как код.

---

## **Задание: Создание полноценного CI/CD пайплайна**

Используя приложения из Части 1 (Next.js портфолио и FastAPI библиотека), необходимо настроить GitHub Actions workflow, который автоматически:
1. Запускает тесты при создании Pull Request
2. Собирает и деплоит фронтенд на Vercel при push в main
3. Собирает Docker образ бэкенда и публикует его в Yandex Container Registry
4. Обновляет запущенный контейнер в Cloud Run

### **1. Подготовка репозитория**

#### **1.1. Структура монорепозитория (рекомендуемый подход)**

```bash
# Создание единого репозитория для всего проекта
mkdir fullstack-app
cd fullstack-app

# Копирование фронтенда из ЛР 10.2
cp -r ../portfolio-site ./frontend

# Копирование бэкенда из ЛР 11.1
cp -r ../book-api ./backend

# Инициализация Git
git init
git add .
git commit -m "Initial commit: fullstack application"

# Создание репозитория на GitHub
gh repo create fullstack-app --public --source=. --remote=origin --push

# Или через веб-интерфейс GitHub
```

#### **1.2. Создание секретов в GitHub**

Перед настройкой CI/CD необходимо добавить секреты в GitHub:

```bash
# Перейдите в репозиторий на GitHub → Settings → Secrets and variables → Actions
# Добавьте следующие секреты:

# Для Vercel:
# VERCEL_TOKEN - токен доступа (получить: vercel.com/account/tokens)
# VERCEL_ORG_ID - ID организации (vercel.com/account)
# VERCEL_PROJECT_ID - ID проекта (из настроек проекта)

# Для Yandex Cloud:
# YC_SA_KEY_JSON - содержимое файла key.json из Части 1
# YC_REGISTRY_ID - ID реестра Container Registry
# YC_CONTAINER_NAME - имя контейнера в Cloud Run
# YC_FOLDER_ID - ID каталога Yandex Cloud

# Для базы данных:
# DB_URL - строка подключения к PostgreSQL (yc managed-postgresql cluster get ...)
```

**Файл: `.github/workflows/deploy.yml`**

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  workflow_dispatch:  # Ручной запуск

env:
  NODE_VERSION: '20'
  PYTHON_VERSION: '3.11'

jobs:
  # ==================== JOB 1: ТЕСТИРОВАНИЕ ФРОНТЕНДА ====================
  test-frontend:
    name: Test Frontend (Next.js)
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci
      
      - name: Run linting
        working-directory: ./frontend
        run: npm run lint
      
      - name: Run TypeScript type check
        working-directory: ./frontend
        run: npx tsc --noEmit
      
      - name: Run tests (if exist)
        working-directory: ./frontend
        run: npm test -- --passWithNoTests
      
      - name: Build application
        working-directory: ./frontend
        run: npm run build

  # ==================== JOB 2: ТЕСТИРОВАНИЕ БЭКЕНДА ====================
  test-backend:
    name: Test Backend (FastAPI)
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: testuser
          POSTGRES_PASSWORD: testpass
          POSTGRES_DB: testdb
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}
          cache: 'pip'
          cache-dependency-path: backend/requirements.txt
      
      - name: Install dependencies
        working-directory: ./backend
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt
          pip install pytest pytest-cov httpx
      
      - name: Run tests with coverage
        working-directory: ./backend
        env:
          DATABASE_URL: postgresql://testuser:testpass@localhost:5432/testdb
        run: |
          pytest --cov=. --cov-report=xml --cov-report=term
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./backend/coverage.xml
          flags: backend
          name: backend-coverage
      
      - name: Run security scan (Bandit)
        working-directory: ./backend
        run: |
          pip install bandit
          bandit -r . -f json -o bandit-report.json || true
      
      - name: Upload Bandit report
        uses: actions/upload-artifact@v4
        with:
          name: bandit-report
          path: ./backend/bandit-report.json

  # ==================== JOB 3: ДЕПЛОЙ ФРОНТЕНДА НА VERCEL ====================
  deploy-frontend:
    name: Deploy Frontend to Vercel
    runs-on: ubuntu-latest
    needs: [test-frontend]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      
      - name: Install Vercel CLI
        run: npm install --global vercel@latest
      
      - name: Deploy to Vercel (Production)
        working-directory: ./frontend
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
        run: |
          vercel pull --yes --environment=production --token=$VERCEL_TOKEN
          vercel build --prod --token=$VERCEL_TOKEN
          vercel deploy --prebuilt --prod --token=$VERCEL_TOKEN
      
      - name: Notify deployment success
        run: |
          echo "✅ Frontend deployed to Vercel successfully!"

  # ==================== JOB 4: СБОРКА И ПУБЛИКАЦИЯ DOCKER ОБРАЗА ====================
  build-and-push-backend:
    name: Build and Push Backend Docker Image
    runs-on: ubuntu-latest
    needs: [test-backend]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Log in to Yandex Cloud Container Registry
        uses: docker/login-action@v3
        with:
          registry: cr.yandex
          username: json_key
          password: ${{ secrets.YC_SA_KEY_JSON }}
      
      - name: Extract metadata for Docker
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: cr.yandex/${{ secrets.YC_REGISTRY_ID }}/book-api
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=sha,format=short
            type=raw,value=latest,enable={{is_default_branch}}
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
      
      - name: Output image tags
        run: |
          echo "Images pushed: ${{ steps.meta.outputs.tags }}"
          echo "📦 Backend image published to Yandex Container Registry"

  # ==================== JOB 5: ДЕПЛОЙ БЭКЕНДА В CLOUD RUN ====================
  deploy-backend:
    name: Deploy Backend to Yandex Cloud Run
    runs-on: ubuntu-latest
    needs: [build-and-push-backend]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Install Yandex Cloud CLI
        run: |
          curl -sSL https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash
          echo "$HOME/yandex-cloud/bin" >> $GITHUB_PATH
      
      - name: Authenticate to Yandex Cloud
        env:
          YC_SA_KEY_JSON: ${{ secrets.YC_SA_KEY_JSON }}
        run: |
          echo "$YC_SA_KEY_JSON" > key.json
          yc config set service-account-key key.json
          yc config set folder-id ${{ secrets.YC_FOLDER_ID }}
          yc config set format json
      
      - name: Deploy container to Cloud Run
        run: |
          yc serverless container revision deploy \
            --container-name ${{ secrets.YC_CONTAINER_NAME }} \
            --image cr.yandex/${{ secrets.YC_REGISTRY_ID }}/book-api:latest \
            --cores 1 \
            --memory 512MB \
            --execution-timeout 30s \
            --concurrency 10 \
            --environment \
              DATABASE_URL="${{ secrets.DB_URL }}",\
              CORS_ORIGINS="${{ secrets.CORS_ORIGINS }}"
      
      - name: Get container URL
        run: |
          CONTAINER_URL=$(yc serverless container get ${{ secrets.YC_CONTAINER_NAME }} --format json | jq -r '.status.url')
          echo "✅ Backend deployed at: $CONTAINER_URL"
      
      - name: Health check
        run: |
          CONTAINER_URL=$(yc serverless container get ${{ secrets.YC_CONTAINER_NAME }} --format json | jq -r '.status.url')
          curl -f $CONTAINER_URL/health || exit 1

  # ==================== JOB 6: УВЕДОМЛЕНИЕ О СТАТУСЕ ====================
  notify:
    name: Send Deployment Notification
    runs-on: ubuntu-latest
    needs: [deploy-frontend, deploy-backend]
    if: always() && github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    steps:
      - name: Check status
        id: status
        run: |
          if [ "${{ needs.deploy-frontend.result }}" == "success" ] && [ "${{ needs.deploy-backend.result }}" == "success" ]; then
            echo "status=success" >> $GITHUB_OUTPUT
            echo "message=✅ All services deployed successfully!" >> $GITHUB_OUTPUT
          else
            echo "status=failure" >> $GITHUB_OUTPUT
            echo "message=❌ Deployment failed. Check GitHub Actions logs." >> $GITHUB_OUTPUT
          fi
      
      - name: Send Telegram notification (optional)
        if: secrets.TELEGRAM_BOT_TOKEN != ''
        uses: appleboy/telegram-action@master
        with:
          to: ${{ secrets.TELEGRAM_CHAT_ID }}
          token: ${{ secrets.TELEGRAM_BOT_TOKEN }}
          message: |
            🚀 Deployment Status
            
            Repository: ${{ github.repository }}
            Branch: ${{ github.ref_name }}
            Commit: ${{ github.sha }}
            Author: ${{ github.actor }}
            
            ${{ steps.status.outputs.message }}
            
            See: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
```

### **2. Инфраструктура как код с Terraform**

#### **2.1. Создание конфигурации Terraform**

**Файл: `infrastructure/terraform/main.tf`**

```hcl
terraform {
  required_version = ">= 1.0"
  
  required_providers {
    yandex = {
      source  = "yandex-cloud/yandex"
      version = "~> 0.100"
    }
  }
  
  backend "s3" {
    # Опционально: настройка бэкенда для хранения состояния в S3
    # bucket = "tfstate-bucket"
    # key    = "fullstack-app/terraform.tfstate"
    # region = "ru-central1"
  }
}

provider "yandex" {
  cloud_id  = var.cloud_id
  folder_id = var.folder_id
  zone      = var.zone
}

# ==================== СОЗДАНИЕ SERVICE ACCOUNT ====================
resource "yandex_iam_service_account" "book_api_sa" {
  name        = "book-api-sa-tf"
  description = "Service account for Book API (managed by Terraform)"
}

resource "yandex_resourcemanager_folder_iam_member" "sa_editor" {
  folder_id = var.folder_id
  role      = "editor"
  member    = "serviceAccount:${yandex_iam_service_account.book_api_sa.id}"
}

resource "yandex_iam_service_account_static_access_key" "sa_static_key" {
  service_account_id = yandex_iam_service_account.book_api_sa.id
  description        = "Static access key for CI/CD"
}

# ==================== CONTAINER REGISTRY ====================
resource "yandex_container_registry" "book_api_registry" {
  name      = "book-api-registry"
  folder_id = var.folder_id
}

# ==================== MANAGED POSTGRESQL ====================
resource "yandex_mdb_postgresql_cluster" "book_db" {
  name        = "book-db-cluster"
  environment = "PRODUCTION"
  network_id  = var.network_id
  
  config {
    version = 15
    resources {
      resource_preset_id = "s2.micro"
      disk_type_id      = "network-ssd"
      disk_size         = 10
    }
    
    postgresql_config = {
      max_connections = 100
      shared_buffers  = 256
    }
  }
  
  host {
    zone      = var.zone
    name      = "book-db-host"
    subnet_id = var.subnet_id
    assign_public_ip = false
  }
  
  database {
    name = var.db_name
    owner = var.db_user
  }
  
  user {
    name     = var.db_user
    password = var.db_password
    permission {
      database_name = var.db_name
    }
  }
}

# ==================== SERVERLESS CONTAINER ====================
resource "yandex_serverless_container" "book_api" {
  name               = "book-api-container"
  memory             = 512
  execution_timeout  = "30s"
  concurrency        = 10
  service_account_id = yandex_iam_service_account.book_api_sa.id
  
  secrets {
    id = yandex_iam_service_account_static_access_key.sa_static_key.secret_key
    version_id = "latest"
    key = "YC_SA_KEY"
    environment_variable = "YC_SA_KEY"
  }
  
  # Сначала создадим ресурс без ревизии, ревизия будет создана отдельно
  # Или можно добавить инициализационную ревизию
}

# ==================== ВЫХОДНЫЕ ДАННЫЕ ====================
output "service_account_id" {
  value = yandex_iam_service_account.book_api_sa.id
  sensitive = false
}

output "container_registry_id" {
  value = yandex_container_registry.book_api_registry.id
}

output "database_host" {
  value = yandex_mdb_postgresql_cluster.book_db.host[0].fqdn
  sensitive = true
}

output "container_url" {
  value = yandex_serverless_container.book_api.url
}
```

**Файл: `infrastructure/terraform/variables.tf`**

```hcl
variable "cloud_id" {
  description = "Yandex Cloud ID"
  type        = string
  sensitive   = true
}

variable "folder_id" {
  description = "Yandex Cloud Folder ID"
  type        = string
  sensitive   = true
}

variable "zone" {
  description = "Availability zone"
  type        = string
  default     = "ru-central1-a"
}

variable "network_id" {
  description = "Network ID"
  type        = string
}

variable "subnet_id" {
  description = "Subnet ID"
  type        = string
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "bookdb"
}

variable "db_user" {
  description = "Database user"
  type        = string
  default     = "bookuser"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}
```

**Файл: `infrastructure/terraform/terraform.tfvars.example`**

```hcl
cloud_id   = "ваш_cloud_id"
folder_id  = "ваш_folder_id"
network_id = "ваш_network_id"
subnet_id  = "ваш_subnet_id"
db_password = "SecurePassword123"
```

#### **2.2. GitHub Actions workflow для Terraform**

**Файл: `.github/workflows/terraform.yml`**

```yaml
name: Infrastructure as Code (Terraform)

on:
  push:
    paths:
      - 'infrastructure/terraform/**'
    branches: [ main ]
  pull_request:
    paths:
      - 'infrastructure/terraform/**'
    branches: [ main ]
  workflow_dispatch:

env:
  TF_VERSION: '1.6.0'

jobs:
  terraform-validate:
    name: Validate Terraform
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: ${{ env.TF_VERSION }}
      
      - name: Terraform Format
        working-directory: ./infrastructure/terraform
        run: terraform fmt -check
      
      - name: Terraform Init
        working-directory: ./infrastructure/terraform
        run: terraform init
      
      - name: Terraform Validate
        working-directory: ./infrastructure/terraform
        run: terraform validate

  terraform-plan:
    name: Plan Infrastructure Changes
    runs-on: ubuntu-latest
    needs: terraform-validate
    if: github.event_name == 'pull_request'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: ${{ env.TF_VERSION }}
      
      - name: Configure Yandex Cloud CLI
        env:
          YC_SA_KEY_JSON: ${{ secrets.YC_SA_KEY_JSON }}
        run: |
          echo "$YC_SA_KEY_JSON" > key.json
          yc config set service-account-key key.json
      
      - name: Terraform Init
        working-directory: ./infrastructure/terraform
        run: terraform init
      
      - name: Terraform Plan
        working-directory: ./infrastructure/terraform
        env:
          TF_VAR_cloud_id: ${{ secrets.YC_CLOUD_ID }}
          TF_VAR_folder_id: ${{ secrets.YC_FOLDER_ID }}
          TF_VAR_network_id: ${{ secrets.YC_NETWORK_ID }}
          TF_VAR_subnet_id: ${{ secrets.YC_SUBNET_ID }}
          TF_VAR_db_password: ${{ secrets.DB_PASSWORD }}
        run: terraform plan -out=tfplan
      
      - name: Upload plan artifact
        uses: actions/upload-artifact@v4
        with:
          name: tfplan
          path: ./infrastructure/terraform/tfplan

  terraform-apply:
    name: Apply Infrastructure Changes
    runs-on: ubuntu-latest
    needs: terraform-validate
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: ${{ env.TF_VERSION }}
      
      - name: Configure Yandex Cloud CLI
        env:
          YC_SA_KEY_JSON: ${{ secrets.YC_SA_KEY_JSON }}
        run: |
          echo "$YC_SA_KEY_JSON" > key.json
          yc config set service-account-key key.json
      
      - name: Terraform Init
        working-directory: ./infrastructure/terraform
        run: terraform init
      
      - name: Terraform Apply
        working-directory: ./infrastructure/terraform
        env:
          TF_VAR_cloud_id: ${{ secrets.YC_CLOUD_ID }}
          TF_VAR_folder_id: ${{ secrets.YC_FOLDER_ID }}
          TF_VAR_network_id: ${{ secrets.YC_NETWORK_ID }}
          TF_VAR_subnet_id: ${{ secrets.YC_SUBNET_ID }}
          TF_VAR_db_password: ${{ secrets.DB_PASSWORD }}
        run: terraform apply -auto-approve
      
      - name: Output infrastructure info
        working-directory: ./infrastructure/terraform
        run: |
          echo "## 📦 Infrastructure Deployed" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "| Resource | Value |" >> $GITHUB_STEP_SUMMARY
          echo "|----------|-------|" >> $GITHUB_STEP_SUMMARY
          echo "| Container Registry | $(terraform output -raw container_registry_id)" >> $GITHUB_STEP_SUMMARY
          echo "| Database Host | $(terraform output -raw database_host)" >> $GITHUB_STEP_SUMMARY
          echo "| Container URL | $(terraform output -raw container_url)" >> $GITHUB_STEP_SUMMARY
```

### **3. Настройка GitHub Actions Workflow для Pull Request**

**Файл: `.github/workflows/pr-checks.yml`**

```yaml
name: Pull Request Checks

on:
  pull_request:
    branches: [ main, develop ]
    types: [opened, synchronize, reopened, ready_for_review]

jobs:
  quality-checks:
    name: Quality Gates
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      # Frontend quality checks
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Frontend lint & type check
        working-directory: ./frontend
        run: |
          npm ci
          npm run lint
          npx tsc --noEmit
      
      # Backend quality checks
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      
      - name: Backend lint & type check
        working-directory: ./backend
        run: |
          pip install ruff mypy
          ruff check .
          mypy . --ignore-missing-imports
      
      # Security scan
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload Trivy results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
      
      # PR comment with results
      - name: Find PR comment
        uses: peter-evans/find-comment@v2
        id: fc
        with:
          issue-number: ${{ github.event.pull_request.number }}
          comment-author: 'github-actions[bot]'
          body-includes: 'Quality Checks Report'
      
      - name: Create or update PR comment
        uses: peter-evans/create-or-update-comment@v3
        with:
          comment-id: ${{ steps.fc.outputs.comment-id }}
          issue-number: ${{ github.event.pull_request.number }}
          body: |
            ## 🔍 Quality Checks Report
            
            ✅ **Frontend**: Lint passed, TypeScript check passed
            ✅ **Backend**: Ruff passed, MyPy passed  
            ✅ **Security**: Trivy scan completed
            
            ### Next Steps:
            - [ ] Review code changes
            - [ ] Approve PR to trigger deployment
          edit-mode: replace
```

### **4. Скрипты для локальной отладки**

**Файл: `scripts/test-locally.sh`**

```bash
#!/bin/bash
# Скрипт для локального тестирования CI/CD пайплайна

set -e

echo "🔧 Testing CI/CD pipeline locally..."

# Тестирование фронтенда
echo "📦 Testing frontend..."
cd frontend
npm ci
npm run lint
npm run build
cd ..

# Тестирование бэкенда
echo "🐍 Testing backend..."
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install pytest pytest-cov
pytest --cov=. --cov-report=term
deactivate
cd ..

# Тестирование Docker сборки
echo "🐳 Testing Docker build..."
docker build -t book-api:test ./backend
docker run --rm book-api:test python -c "import main; print('✅ Import successful')"

echo "✅ All local tests passed!"
```

**Файл: `scripts/deploy-manual.sh`**

```bash
#!/bin/bash
# Скрипт для ручного деплоя (запасной вариант)

set -e

echo "🚀 Manual deployment started..."

# Деплой фронтенда
echo "📱 Deploying frontend to Vercel..."
cd frontend
vercel --prod
cd ..

# Сборка и публикация бэкенда
echo "📦 Building and pushing backend..."
cd backend
docker build -t book-api:latest .
REGISTRY_ID=$(yc container registry get book-api-registry --format json | jq -r '.id')
docker tag book-api:latest cr.yandex/$REGISTRY_ID/book-api:latest
docker push cr.yandex/$REGISTRY_ID/book-api:latest
cd ..

# Деплой в Cloud Run
echo "☁️ Deploying to Cloud Run..."
yc serverless container revision deploy \
  --container-name book-api-container \
  --image cr.yandex/$REGISTRY_ID/book-api:latest \
  --cores 1 \
  --memory 512MB

echo "✅ Manual deployment completed!"
```

### **5. Запуск и проверка**

```bash
# Добавление прав на выполнение скриптов
chmod +x scripts/*.sh

# Локальное тестирование
./scripts/test-locally.sh

# Push изменений в GitHub
git add .
git commit -m "Add CI/CD pipeline and Terraform configs"
git push origin main

# Проверка статуса workflow
# Перейдите на GitHub → Actions → Просмотрите выполнение

# Ручной деплой (если автоматический не сработал)
./scripts/deploy-manual.sh
```

### **6. Что должно быть в отчёте:**

1. **Исходный код:**
   - Полный файл `.github/workflows/deploy.yml`
   - Конфигурация Terraform (`main.tf`, `variables.tf`)
   - Файлы `pr-checks.yml` и скрипты для локального тестирования

2. **Скриншоты:**
   - Успешное выполнение GitHub Actions workflow (все зелёные галочки)
   - Результаты проверки PR (комментарий с отчётом)
   - Terraform plan в CI (скриншот вывода)
   - Уведомление о деплое (Telegram или GitHub)

3. **Ответы на вопросы:**
   - Какие преимущества даёт использование GitHub Actions перед ручным деплоем?
   - Что такое Infrastructure as Code и почему это важно?
   - Как работает кэширование зависимостей в CI и зачем оно нужно?
   - Какие меры безопасности вы применили для защиты секретов в CI?
   - В чём разница между CI и CD? Где проходит граница в вашем пайплайне?

### **7. Критерии оценивания:**

#### **Обязательные требования (минимум для зачёта):**
- **Workflow настроен:** GitHub Actions запускается при push и PR
- **Тесты проходят:** Автоматический запуск тестов фронтенда и бэкенда
- **Деплой фронтенда:** Автоматический деплой на Vercel при push в main
- **Деплой бэкенда:** Автоматическая сборка и публикация Docker образа
- **Статус проверки:** PR блокируется при падении тестов

#### **Дополнительные критерии (для повышения оценки):**
- **Terraform:** Инфраструктура описана как код и применяется через CI
- **Безопасность:** Добавлены сканеры уязвимостей (Trivy, Bandit)
- **Уведомления:** Настроены уведомления о статусе деплоя
- **Мониторинг:** В workflow добавлены шаги проверки health после деплоя
- **Документация:** Подробное README о CI/CD пайплайне

#### **Неприемлемые ошибки:**
- Секреты захардкожены в коде (не через GitHub Secrets)
- Workflow падает с ошибками при любых изменениях
- Отсутствует проверка статуса PR (можно влить сломанный код)
- Деплой происходит даже при падении тестов

### **8. Полезные команды для Ubuntu:**

```bash
# Локальный запуск GitHub Actions (act)
curl -s https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash
act -l  # список всех jobs
act push  # запуск workflow локально

# Просмотр логов workflow через GitHub CLI
gh run list
gh run view <run-id> --log

# Валидация Terraform конфигурации
cd infrastructure/terraform
terraform fmt -check
terraform validate

# Проверка синтаксиса GitHub Actions
npx @github/actions-validator .github/workflows/deploy.yml
```

### **9. Структура итогового проекта:**

```
fullstack-app/
├── .github/
│   └── workflows/
│       ├── deploy.yml          # Основной CI/CD пайплайн
│       ├── pr-checks.yml       # Проверки для Pull Request
│       └── terraform.yml       # Infrastructure as Code
├── frontend/                   # Next.js приложение (ЛР 10.2)
│   ├── app/
│   ├── package.json
│   └── ...
├── backend/                    # FastAPI приложение (ЛР 11.1)
│   ├── main.py
│   ├── models.py
│   ├── routers.py
│   ├── Dockerfile
│   └── requirements.txt
├── infrastructure/
│   └── terraform/
│       ├── main.tf
│       ├── variables.tf
│       └── terraform.tfvars.example
├── scripts/
│   ├── test-locally.sh
│   └── deploy-manual.sh
├── .env.example
├── .gitignore
└── README.md
```

### **10. Советы по выполнению:**

1. **Начните с малого:** Сначала настройте workflow только для тестов, затем добавляйте деплой.

2. **Используйте GitHub Secrets UI:** Никогда не храните пароли и токены в коде.

3. **Тестируйте локально с act:** Это быстрее, чем пушить в GitHub для проверки.

4. **Следите за лимитами GitHub Actions:** Бесплатный тариф даёт 2000 минут в месяц.

5. **Разделяйте окружения:** Настройте отдельные workflow для staging и production.

6. **Документируйте workflow:** Добавьте комментарии в YAML файлы для объяснения каждого шага.

**Примечание:** В задании предоставлено ~70% кода workflow и Terraform конфигураций. Ваша задача — адаптировать их под ваши приложения, добавить недостающие секреты в GitHub и проверить работу пайплайна.

---

## **Итоговое сравнение (Часть 1 vs Часть 2 ЛР 8):**

| Характеристика | Ручной деплой (Часть 1) | CI/CD пайплайн (Часть 2) |
|----------------|-------------------------|--------------------------|
| **Время деплоя** | 15-30 минут вручную | 2-5 минут автоматически |
| **Человеческий фактор** | Высокий риск ошибок | Минимальный |
| **Воспроизводимость** | Зависит от оператора | 100% идентичен |
| **Откат изменений** | Сложный, вручную | Простой (git revert) |
| **Тестирование** | Забывают выполнить | Автоматическое |
| **Безопасность** | Секреты могут попасть в логи | Секреты защищены |


### **11. Дополнительные материалы для отчёта**

#### **11.1. Шаблон README.md для репозитория**

**Файл: `README.md`**

```markdown
# Fullstack Application with CI/CD

## 🏗️ Архитектура проекта

```
┌─────────────────────────────────────────────────────────────────┐
│                      GitHub Repository                           │
│  ┌──────────────────┐    ┌──────────────────────────────────┐   │
│  │  Frontend        │    │  Backend                         │   │
│  │  (Next.js)       │    │  (FastAPI)                       │   │
│  └────────┬─────────┘    └───────────────┬──────────────────┘   │
└───────────┼──────────────────────────────┼──────────────────────┘
            │                              │
            ▼                              ▼
┌───────────────────────┐    ┌────────────────────────────────────┐
│     Vercel            │    │        Yandex Cloud                 │
│  (Static Hosting)     │    │  ┌──────────────────────────────┐   │
│  https://portfolio.   │    │  │  Container Registry          │   │
│       vercel.app      │    │  │  (Docker Image)              │   │
│                       │    │  └────────────┬─────────────────┘   │
│  + Custom Domain      │    │               ▼                      │
│  + Auto-SSL           │    │  ┌──────────────────────────────┐   │
└───────────────────────┘    │  │  Cloud Run                   │   │
                             │  │  (Running Container)         │   │
                             │  └────────────┬─────────────────┘   │
                             │               ▼                      │
                             │  ┌──────────────────────────────┐   │
                             │  │  Managed PostgreSQL          │   │
                             │  └──────────────────────────────┘   │
                             └────────────────────────────────────┘
```

## 🔄 CI/CD Pipeline

| Этап | Действие | Инструменты |
|------|----------|-------------|
| 1 | Линтинг и проверка типов | ESLint, TypeScript, Ruff, MyPy |
| 2 | Запуск тестов | Jest, pytest |
| 3 | Сканирование безопасности | Bandit, Trivy |
| 4 | Сборка фронтенда | Next.js build |
| 5 | Деплой фронтенда | Vercel CLI |
| 6 | Сборка Docker образа | Docker Buildx |
| 7 | Публикация образа | Yandex CR |
| 8 | Деплой бэкенда | Yandex Cloud Run |
| 9 | Health check | curl |
| 10 | Уведомление | Telegram |

## 🚀 Быстрый старт

### Локальная разработка

```bash
# Клонирование репозитория
git clone https://github.com/your-username/fullstack-app.git
cd fullstack-app

# Запуск фронтенда
cd frontend
npm install
npm run dev

# Запуск бэкенда (в другом терминале)
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Ручной деплой

```bash
# Деплой фронтенда
cd frontend
vercel --prod

# Деплой бэкенда
./scripts/deploy-manual.sh
```

## 📊 Мониторинг

- **Логи:** `yc logging read --group-name book-api-logs`
- **Метрики:** Yandex Monitoring Dashboard
- **Статус деплоя:** GitHub Actions → https://github.com/your-username/fullstack-app/actions

## 🔐 Переменные окружения

Создайте файл `.env` в корне проекта:

```env
# Frontend
NEXT_PUBLIC_API_URL=https://your-container-url.cloud.yandex.net

# Backend
DATABASE_URL=postgresql://user:password@host:5432/db
CORS_ORIGINS=https://portfolio.vercel.app
```

## 📝 Лицензия

MIT
```

#### **11.2. Тесты для CI/CD (дополнительное задание)**

**Файл: `backend/tests/test_api.py`**

```python
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

class TestBookAPI:
    """Тесты для API книг"""
    
    def test_health_check(self):
        """Проверка health endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
    
    def test_create_book(self):
        """Создание новой книги"""
        book_data = {
            "title": "Test Book",
            "author": "Test Author",
            "genre": "fiction",
            "publication_year": 2024,
            "pages": 100,
            "isbn": "9781234567890"
        }
        response = client.post("/api/v1/books", json=book_data)
        assert response.status_code == 201
        assert response.json()["title"] == book_data["title"]
    
    def test_get_books(self):
        """Получение списка книг"""
        response = client.get("/api/v1/books")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_get_nonexistent_book(self):
        """Получение несуществующей книги"""
        response = client.get("/api/v1/books/99999")
        assert response.status_code == 404
    
    def test_borrow_book(self):
        """Заимствование книги"""
        # Сначала создадим книгу
        book_data = {
            "title": "Borrow Test Book",
            "author": "Test Author",
            "genre": "fiction",
            "publication_year": 2024,
            "pages": 100,
            "isbn": "9781234567899"
        }
        create_response = client.post("/api/v1/books", json=book_data)
        book_id = create_response.json()["id"]
        
        # Теперь возьмём её
        borrow_data = {"borrower_name": "Test User", "return_days": 7}
        response = client.post(f"/api/v1/books/{book_id}/borrow", json=borrow_data)
        assert response.status_code == 200
        assert response.json()["available"] is False
```

**Файл: `frontend/__tests__/Home.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import HomePage from '../app/page';

describe('HomePage', () => {
  it('renders welcome message', () => {
    render(<HomePage />);
    expect(screen.getByText(/Добро пожаловать/)).toBeInTheDocument();
  });
  
  it('displays technology cards', () => {
    render(<HomePage />);
    expect(screen.getByText('Next.js')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
  });
});
```

#### **11.3. Настройка защиты ветки (Branch Protection)**

**Инструкция по настройке защиты ветки main в GitHub:**

```bash
# Через веб-интерфейс GitHub:
# 1. Перейдите в репозиторий → Settings → Branches
# 2. Нажмите "Add branch protection rule"
# 3. Настройте следующие параметры:

Branch name pattern: main

☑ Require a pull request before merging
  ☑ Require approvals: 1
  ☑ Dismiss stale pull request approvals when new commits are pushed

☑ Require status checks to pass before merging
  ☑ Require branches to be up to date
  ☑ Status checks:
     - test-frontend
     - test-backend
     - terraform-validate

☑ Require conversation resolution before merging

☑ Include administrators

☑ Allow force pushes: ❌ (отключено)

☑ Allow deletions: ❌ (отключено)
```

#### **11.4. Настройка Telegram бота для уведомлений**

```python
# scripts/telegram_notify.py
import os
import requests
import sys

def send_telegram_message(message: str):
    """Отправка уведомления в Telegram"""
    bot_token = os.environ.get("TELEGRAM_BOT_TOKEN")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID")
    
    if not bot_token or not chat_id:
        print("Telegram credentials not set")
        return
    
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": message,
        "parse_mode": "HTML"
    }
    
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        print("Notification sent successfully")
    except Exception as e:
        print(f"Failed to send notification: {e}")

if __name__ == "__main__":
    status = sys.argv[1] if len(sys.argv) > 1 else "unknown"
    repo = os.environ.get("GITHUB_REPOSITORY", "unknown")
    run_id = os.environ.get("GITHUB_RUN_ID", "unknown")
    
    if status == "success":
        message = f"""
✅ <b>Deployment Successful!</b>

Repository: {repo}
Run ID: {run_id}
Time: {__import__('datetime').datetime.now()}

🌐 Frontend: https://portfolio-site.vercel.app
🔧 Backend: https://your-container.cloud.yandex.net
        """
    else:
        message = f"""
❌ <b>Deployment Failed!</b>

Repository: {repo}
Run ID: {run_id}
Time: {__import__('datetime').datetime.now()}

Check logs: https://github.com/{repo}/actions/runs/{run_id}
        """
    
    send_telegram_message(message)
```

### **12. Полный пример успешного выполнения**

#### **12.1. Ожидаемый вывод GitHub Actions**

```
CI/CD Pipeline / Test Frontend (push) - ✅ Success

Run npm run lint
  > next lint
  ✔ No ESLint warnings or errors

Run npx tsc --noEmit
  ✔ TypeScript check passed

Run npm test
  PASS __tests__/Home.test.tsx
  ✓ renders welcome message (25 ms)
  ✓ displays technology cards (18 ms)

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total

---
CI/CD Pipeline / Test Backend (push) - ✅ Success

Run pytest --cov=. --cov-report=term
  ========================= test session starts =========================
  test_api.py::TestBookAPI::test_health_check PASSED                [ 25%]
  test_api.py::TestBookAPI::test_create_book PASSED                 [ 50%]
  test_api.py::TestBookAPI::test_get_books PASSED                   [ 75%]
  test_api.py::TestBookAPI::test_get_nonexistent_book PASSED        [100%]
  
  Name                     Stmts   Miss  Cover
  --------------------------------------------
  main.py                     45      0   100%
  models.py                   28      0   100%
  routers.py                  67      2    97%
  database.py                 12      0   100%
  --------------------------------------------
  TOTAL                      152      2    99%

---
CI/CD Pipeline / Deploy Frontend to Vercel (push) - ✅ Success

Run vercel deploy --prebuilt --prod
  ✅ Production deployment completed
  🔗 https://portfolio-site-xxx.vercel.app

---
CI/CD Pipeline / Build and Push Backend Docker Image (push) - ✅ Success

Run docker/build-push-action@v5
  📦 Building image: cr.yandex/xxx/book-api:latest
  ✅ Image built successfully
  📤 Pushed to Yandex Container Registry

---
CI/CD Pipeline / Deploy Backend to Yandex Cloud Run (push) - ✅ Success

Run yc serverless container revision deploy
  ✅ Revision deployed: book-api-container-r123
  🌐 Container URL: https://book-api-container.cloud.yandex.net

---
CI/CD Pipeline / Send Deployment Notification (push) - ✅ Success

Run python scripts/telegram_notify.py success
  ✅ Notification sent to Telegram

🎉 All jobs completed successfully!
```

### **13. Устранение типичных проблем**

| Проблема | Решение |
|----------|---------|
| **Docker build fails** | Проверьте Dockerfile и .dockerignore. Убедитесь, что все файлы скопированы. |
| **Tests timeout** | Увеличьте таймаут в GitHub Actions: `timeout-minutes: 10` |
| **Vercel deployment fails** | Проверьте токен и ID проекта в секретах. Выполните `vercel link` локально. |
| **Yandex Cloud authentication fails** | Проверьте формат ключа JSON. Должен быть без лишних пробелов. |
| **Database connection refused** | Проверьте, что база данных создана и доступна из Cloud Run. |
| **CORS errors** | Убедитесь, что CORS_ORIGINS содержит точный URL фронтенда. |
| **Cache issues** | Используйте `cache-from: type=gha` для Docker Buildx. |

### **14. Финальная проверочная таблица**

Перед сдачей лабораторной работы убедитесь, что:

- [ ] GitHub Actions workflow запускается при push в main
- [ ] Все тесты проходят успешно (зелёные галочки)
- [ ] Фронтенд автоматически обновляется на Vercel
- [ ] Бэкенд автоматически обновляется в Cloud Run
- [ ] Terraform plan корректно отображает изменения
- [ ] Защита ветки main настроена (PR required)
- [ ] Секреты добавлены в GitHub Secrets
- [ ] Health check после деплоя проходит успешно
- [ ] Уведомления работают (опционально)
- [ ] README.md заполнен и актуален

### **15. Что дополнительно можно добавить в отчёт:**

1. **График времени выполнения workflow** (можно экспортировать из GitHub Actions)

2. **Сравнение стоимости** ручного деплоя vs CI/CD (время разработчика)

3. **Диаграмма последовательности** CI/CD пайплайна (sequence diagram)

4. **Скриншоты всех этапов workflow** с пояснениями

5. **Пример PR с автоматическими проверками** (скриншот комментария)

6. **Terraform граф зависимостей** (`terraform graph | dot -Tpng > graph.png`)

---

## **Итоговое сравнение подходов к деплою**

| Характеристика | Ручной деплой (Часть 1) | CI/CD пайплайн (Часть 2) |
|----------------|-------------------------|--------------------------|
| **Время деплоя** | 15-30 минут вручную | 2-5 минут автоматически |
| **Человеческий фактор** | Высокий риск ошибок | Минимальный |
| **Воспроизводимость** | Зависит от оператора | 100% идентичен |
| **Откат изменений** | Сложный, вручную | Простой (`git revert`) |
| **Тестирование** | Забывают выполнить | Автоматическое |
| **Безопасность** | Секреты могут попасть в логи | Секреты защищены |
| **Инфраструктура как код** | Нет | Да (Terraform) |
| **Уведомления** | Ручные | Автоматические |
| **Масштабирование** | Трудоёмко | Просто (изменить код) |
| **Документация процессов** | Отсутствует | В коде workflow |
