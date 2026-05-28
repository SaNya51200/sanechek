# Заметки по запуску проекта

В папке `Solution/fullstack-app` находится подготовленный fullstack-проект (frontend на Next.js и backend на FastAPI), а также конфигурация для развертывания (Terraform и GitHub Actions).

Ниже приведены действия для локального тестирования сборки и проверки контейнеризации.

## Локальный запуск Backend и проверка Docker

1. Открыть терминал и перейти в папку backend:
   ```bash
   cd путь_к_папке/Solution/fullstack-app/backend
   ```
2. Создать виртуальное окружение и установить зависимости (для локальной разработки вне Docker):
   ```bash
   python -m venv venv
   # На Windows:
   venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. Собрать Docker-образ для проверки:
   ```bash
   docker build -t lab17-book-api .
   ```
4. Запустить контейнер в фоновом режиме на порту 18000:
   ```bash
   docker run -d --name lab17_book_api_test -p 18000:8000 lab17-book-api
   ```
5. Выполнить проверку healthcheck. Можно открыть в браузере `http://localhost:18000/health` или выполнить в терминале:
   ```powershell
   Invoke-RestMethod http://localhost:18000/health
   ```
6. Сделать скриншот терминала или окна браузера с успешным ответом.
7. Остановить и удалить тестовый контейнер:
   ```bash
   docker rm -f lab17_book_api_test
   ```

## Локальный запуск Frontend

1. Открыть новый терминал и перейти в папку frontend:
   ```bash
   cd путь_к_папке/Solution/fullstack-app/frontend
   ```
2. Установить зависимости:
   ```bash
   npm install
   ```
3. Выполнить сборку проекта для проверки отсутствия ошибок:
   ```bash
   npm run build
   ```
4. Сделать скриншот успешной локальной сборки.

## Дополнительно: Подтверждение CI/CD

В папке `.github/workflows/` лежат файлы конфигурации для GitHub Actions. Они готовы к работе в репозитории GitHub.
Чтобы продемонстрировать работающий CI/CD:
1. Загрузить проект в репозиторий GitHub.
2. Перейти на вкладку **Actions**.
3. Дождаться зеленого статуса выполнения пайплайнов (например, `PR Checks` или `Terraform Validation`).
4. Сделать скриншот вкладки Actions со списком успешных задач.
