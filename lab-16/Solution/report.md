# Отчет по лабораторной работе №16
# Интеграция систем: Использование искусственного интеллекта (GigaChat API) и облачных СУБД (Airtable API)

**Дата выполнения:** 2026-05-21  
**Студент:** Целенко Александр Андреевич  
**Группа:** Пин-б-о-24-2  

---

## 1. Цель работы

**Часть 1 (GigaChat API):** Приобретение навыков интеграции прикладного ПО с большими языковыми моделями (LLM) через REST API на примере Сбер GigaChat API. Разработка клиента для автоматической генерации программного кода и документации по текстовым промптам, а также проведение рефакторинга полученного кода.

**Часть 2 (Airtable API):** Практическое изучение интеграции с облачными low-code базами данных. Использование Airtable REST API для экспорта таблиц реляционной CRM-системы (клиенты, товары, заказы) в локальные структурированные файлы формата CSV.

---

## 2. Теоретические сведения

### Интеграция с моделями искусственного интеллекта
- **LLM (Large Language Models):** Нейросетевые модели, обученные на больших массивах текстов для генерации контента, написания и анализа кода.
- **REST API GigaChat:** Сервис от Сбера, предоставляющий доступ к LLM. Для авторизации используется протокол OAuth 2.0 (получение временного `access_token` на основе закодированных Client ID и Client Secret).
- **Промпт-инжиниринг:** Процесс составления эффективных текстовых запросов (инструкций) для модели с целью получения точного и структурированного ответа (например, генерация "чистого" кода без лишнего описательного текста).

### Облачные базы данных и Airtable
- **Airtable:** Облачная гибридная база данных, совмещающая простоту электронных таблиц со свойствами реляционных СУБД (связи между записями, типы полей).
- **Airtable Web API:** Предоставляет REST-интерфейс для CRUD-операций над записями баз данных. Запросы авторизуются с помощью Personal Access Token (PAT).
- **Пагинация (Pagination):** Метод передачи больших массивов данных частями (страницами). В Airtable API для этого используются параметры `pageSize` и строковый указатель `offset` для перехода к следующей странице данных.

---

## 3. Практическая реализация

### Часть 1: Генератор кода на базе GigaChat (part1-gigachat)
Написан Python-клиент `gigachat_client.py` для взаимодействия с API GigaChat. Настроен процесс генерации функций (проверка простых чисел, числа Фибоначчи и нормализация телефонов) и документации в формате Markdown.

#### Фрагмент реализации клиента (`gigachat_client.py`):
```python
class SberGigaClient:
    def __init__(self, config: SberGigaConfig | None = None):
        self.config = config or SberGigaConfig.from_env()
        self._token: str | None = None

    def fetch_token(self) -> str:
        if self._token:
            return self._token

        res = requests.post(
            self.config.auth_url,
            headers={
                "Authorization": f"Basic {self.config.credentials}",
                "RqUID": str(uuid.uuid4()),
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data={"scope": self.config.scope},
            timeout=30,
            verify=self.config.verify_ssl,
        )
        res.raise_for_status()
        self._token = res.json()["access_token"]
        return self._token
```

---

### Часть 2: Экспорт данных CRM из Airtable (part2-airtable)
Разработан скрипт `export_airtable.py`. Скрипт запрашивает записи таблиц "Customers", "Products", "Orders", "Order Items" из облачной базы Airtable, обрабатывает постраничный вывод (пагинацию с offset) и сохраняет записи в локальные CSV-файлы в каталоге `exported_data`.

#### Фрагмент кода загрузки таблиц (`export_airtable.py`):
```python
def download_airtable_records(api_token: str, base_id: str, table_name: str) -> list[dict]:
    all_records: list[dict] = []
    pagination_offset: str | None = None
    auth_headers = {"Authorization": f"Bearer {api_token}"}
    
    while True:
        query_params = {"pageSize": 100}
        if pagination_offset:
            query_params["offset"] = pagination_offset
            
        res = requests.get(
            f"https://api.airtable.com/v0/{base_id}/{table_name}",
            headers=auth_headers,
            params=query_params,
            timeout=30,
        )
        res.raise_for_status()
        body = res.json()
        all_records.extend(body.get("records", []))
        pagination_offset = body.get("offset")
        if not pagination_offset:
            return all_records
```

---

## 4. Контрольные вопросы

1. **Этапы авторизации в GigaChat API:**  
   Сначала отправляется POST-запрос на авторизационный URL с заголовком `Authorization: Basic <credentials>` и уникальным UUID транзакции (`RqUID`). В ответ сервер присылает `access_token` и время его жизни. Этот токен используется в заголовке `Authorization: Bearer <token>` во всех последующих запросах к модели.
2. **Как ограничить вывод LLM только чистым кодом:**  
   Этого можно добиться формулированием промпта (системного или пользовательского). В запросе явно указывается требование возвращать результат в виде единого блока разметки Markdown (например, "Return ONLY executable Python code, start with ```python and end with ```. Do not output any intro, explanations or prose").
3. **Что такое Personal Access Token в Airtable:**  
   Это секретный ключ аутентификации разработчика, используемый для авторизации HTTP-запросов к API Airtable от имени пользователя. Он имеет настраиваемую область видимости (scopes) и права доступа к конкретным базам.
4. **Как работает пагинация через offset в REST API:**  
   Поскольку база данных может содержать тысячи записей, API отдает их частями (страницами). Сервер в ответе на запрос возвращает массив записей первой страницы и уникальный ключ `offset`. Чтобы запросить следующую страницу, клиент отправляет новый запрос, прикрепляя полученный `offset` в параметры URL. Процесс повторяется, пока в ответе сервера не исчезнет ключ `offset`.

---

## 5. Выводы

В процессе работы были успешно освоены методы программной интеграции с внешними веб-сервисами. Разработан клиент для автоматической генерации кода с помощью Сбер GigaChat API. Также написан скрипт экспорта реляционной базы данных из облачной СУБД Airtable с корректной обработкой механизмов авторизации и постраничного скачивания (пагинации).
