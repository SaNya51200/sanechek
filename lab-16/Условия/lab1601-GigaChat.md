# **Лабораторная работа 16. Часть 1: Работа с ИИ-ассистентом GigaChat для генерации и анализа кода**

## **Тема:** Использование больших языковых моделей в разработке ПО: генерация кода, рефакторинг, тестирование и документация.

### **Цель работы:**
Получить практические навыки работы с отечественным ИИ-ассистентом GigaChat: генерация функций на Python по текстовому описанию, рефакторинг существующего кода, написание тестов и документации, критический анализ сгенерированного кода.

---

## **Задание: Использование GigaChat для автоматизации задач разработчика**

Вам необходимо зарегистрироваться в GigaChat API, освоить работу с библиотекой `gigachat` или `langchain-gigachat`, и выполнить серию задач по генерации, рефакторингу, тестированию и документированию кода с помощью ИИ.

### **1. Настройка проекта**

#### **1.1. Регистрация и получение доступа к GigaChat API**

```bash
# 1. Перейдите на сайт developers.sber.ru
# 2. Авторизуйтесь через Сбер ID или создайте новый аккаунт
# 3. В личном кабинете создайте новый проект
# 4. Нажмите "Сгенерировать новый Client Secret"
# 5. Скопируйте и сохраните полученные авторизационные данные (токен)
#    ВНИМАНИЕ: токен показывается только один раз!
```

#### **1.2. Установка сертификатов (для корректной работы API)**

```bash
# Установка корневого сертификата НУЦ Минцифры
curl -k "https://gu-st.ru/content/Other/doc/russian_trusted_root_ca.cer" -w "\n" >> $(python -m certifi)

# Альтернативный способ: отключение проверки сертификатов (только для разработки)
# Параметр verify_ssl_certs=False будет использован в коде
```

#### **1.3. Создание виртуального окружения и установка библиотек**

```bash
# Создание директории проекта
mkdir lab7_gigachat && cd lab7_gigachat

# Создание виртуального окружения
python3 -m venv venv
source venv/bin/activate

# Установка библиотек
pip install gigachat langchain-gigachat python-dotenv
```

#### **1.4. Настройка переменных окружения**

**Файл: `.env`**

```bash
# Авторизационные данные GigaChat (скопируйте из личного кабинета)
GIGACHAT_CREDENTIALS=ваш_ключ_авторизации

# Версия API (для физических лиц)
GIGACHAT_SCOPE=GIGACHAT_API_PERS

# Модель по умолчанию
GIGACHAT_MODEL=GigaChat-2

# Отключение проверки SSL (если возникают проблемы с сертификатами)
GIGACHAT_VERIFY_SSL_CERTS=False
```

### **2. Базовый код (70% предоставляется)**

**Файл: `gigachat_client.py`**

```python
"""
Клиент для работы с GigaChat API
Поддерживает генерацию кода, рефакторинг, создание тестов и документации
"""

import os
import json
from dotenv import load_dotenv
from gigachat import GigaChat
from typing import List, Dict, Optional

# Загрузка переменных окружения
load_dotenv()


class GigaChatAssistant:
    """Ассистент на основе GigaChat для задач разработки"""
    
    def __init__(self):
        self.credentials = os.getenv("GIGACHAT_CREDENTIALS")
        self.scope = os.getenv("GIGACHAT_SCOPE", "GIGACHAT_API_PERS")
        self.model = os.getenv("GIGACHAT_MODEL", "GigaChat-2")
        self.verify_ssl = os.getenv("GIGACHAT_VERIFY_SSL_CERTS", "False").lower() == "true"
        
        # TODO: Инициализация клиента GigaChat
        # Ваш код:
        self.client = GigaChat(
            credentials=self.credentials,
            scope=self.scope,
            model=self.model,
            verify_ssl_certs=self.verify_ssl
        )
    
    def generate_code(self, description: str, language: str = "python") -> str:
        """
        Генерация кода по текстовому описанию
        
        Args:
            description: Описание требуемой функции/класса
            language: Язык программирования
            
        Returns:
            Сгенерированный код
        """
        # TODO: Сформировать промпт и отправить запрос к GigaChat
        # Ваш код:
        prompt = f"""
        Ты — эксперт по разработке на {language}. Напиши код на {language} для следующей задачи:
        
        {description}
        
        Требования к коду:
        - Добавь аннотации типов (для Python)
        - Добавь docstring с описанием функции, параметров и возвращаемого значения
        - Используй понятные имена переменных
        - Добавь обработку ошибок
        
        Верни только код, без пояснений.
        """
        
        response = self.client.chat(prompt)
        code = response.choices[0].message.content
        
        # Очистка от markdown-разметки, если есть
        if code.startswith("```"):
            code = code.split("```")[1]
            if code.startswith(language):
                code = code[len(language):]
            code = code.strip()
        
        return code
    
    def refactor_code(self, code: str, requirements: str) -> str:
        """
        Рефакторинг существующего кода
        
        Args:
            code: Исходный код для рефакторинга
            requirements: Требования к рефакторингу
            
        Returns:
            Отрефакторенный код
        """
        # TODO: Сформировать промпт для рефакторинга
        # Ваш код:
        prompt = f"""
        Проведи рефакторинг следующего кода согласно требованиям.
        
        Исходный код:
        ```python
        {code}
        ```
        
        Требования к рефакторингу:
        {requirements}
        
        Дополнительные требования:
        - Сохрани исходную функциональность
        - Улучши читаемость кода
        - Добавь аннотации типов (если их нет)
        - Разбей на более мелкие функции (если необходимо)
        - Добавь обработку ошибок
        
        Верни только отрефакторенный код, без пояснений.
        """
        
        response = self.client.chat(prompt)
        refactored = response.choices[0].message.content
        
        # Очистка от markdown-разметки
        if refactored.startswith("```"):
            refactored = refactored.split("```")[1]
            if refactored.startswith("python"):
                refactored = refactored[6:]
            refactored = refactored.strip()
        
        return refactored
    
    def generate_tests(self, code: str, framework: str = "pytest") -> str:
        """
        Генерация тестов для кода
        
        Args:
            code: Исходный код
            framework: Тестовый фреймворк (pytest, unittest)
            
        Returns:
            Код с тестами
        """
        # TODO: Сформировать промпт для генерации тестов
        # Ваш код:
        prompt = f"""
        Напиши тесты для следующего кода, используя {framework}.
        
        Код для тестирования:
        ```python
        {code}
        ```
        
        Требования к тестам:
        - Протестируй все публичные функции
        - Включи позитивные и негативные сценарии
        - Проверь граничные случаи
        - Добавь понятные названия тестов
        
        Верни только код с тестами, без пояснений.
        """
        
        response = self.client.chat(prompt)
        tests = response.choices[0].message.content
        
        if tests.startswith("```"):
            tests = tests.split("```")[1]
            if tests.startswith(framework) or tests.startswith("python"):
                tests = tests.split("\n", 1)[1] if "\n" in tests else tests
            tests = tests.strip()
        
        return tests
    
    def generate_documentation(self, code: str, doc_type: str = "docstring") -> str:
        """
        Генерация документации для кода
        
        Args:
            code: Исходный код
            doc_type: Тип документации (docstring, readme, api)
            
        Returns:
            Сгенерированная документация
        """
        # TODO: Сформировать промпт для генерации документации
        # Ваш код:
        if doc_type == "docstring":
            prompt = f"""
            Добавь docstring для каждой функции в следующем коде.
            
            Код:
            ```python
            {code}
            ```
            
            Формат docstring (Google Style):
            def function(param1: type, param2: type) -> return_type:
                \"\"\"Краткое описание.
                
                Args:
                    param1: Описание параметра 1
                    param2: Описание параметра 2
                
                Returns:
                    Описание возвращаемого значения
                
                Raises:
                    ExceptionType: Когда возникает исключение
                \"\"\"
            
            Верни полный код с добавленными docstring.
            """
        else:
            prompt = f"""
            Создай README документацию для следующего кода.
            
            Код:
            ```python
            {code}
            ```
            
            Включи в документацию:
            - Описание назначения кода
            - Инструкцию по установке зависимостей
            - Примеры использования
            - Описание основных функций
            - Информацию об авторах (если есть)
            """
        
        response = self.client.chat(prompt)
        documentation = response.choices[0].message.content
        
        if doc_type == "docstring" and documentation.startswith("```"):
            documentation = documentation.split("```")[1]
            if documentation.startswith("python"):
                documentation = documentation[6:]
            documentation = documentation.strip()
        
        return documentation
    
    def analyze_code(self, code: str) -> Dict[str, List[str]]:
        """
        Анализ качества, читаемости и потенциальных уязвимостей
        
        Args:
            code: Исходный код для анализа
            
        Returns:
            Словарь с результатами анализа
        """
        # TODO: Сформировать промпт для анализа кода
        # Ваш код:
        prompt = f"""
        Проанализируй следующий код и верни результат в формате JSON.
        
        Код:
        ```python
        {code}
        ```
        
        Оцени следующие аспекты:
        1. quality_issues: проблемы качества кода (нарушения PEP8, длинные функции и т.д.)
        2. readability_issues: проблемы читаемости (плохие имена переменных, отсутствие комментариев)
        3. security_issues: потенциальные уязвимости (инъекции, небезопасные функции)
        4. performance_issues: проблемы производительности (неэффективные алгоритмы)
        5. suggestions: конкретные предложения по улучшению
        
        Формат ответа (JSON):
        {{
            "quality_issues": ["проблема 1", "проблема 2"],
            "readability_issues": ["проблема 1"],
            "security_issues": [],
            "performance_issues": ["проблема 1"],
            "suggestions": ["предложение 1", "предложение 2"]
        }}
        
        Верни только JSON, без пояснений.
        """
        
        response = self.client.chat(prompt)
        result = response.choices[0].message.content
        
        # Извлечение JSON из ответа
        if "```json" in result:
            result = result.split("```json")[1].split("```")[0]
        elif "```" in result:
            result = result.split("```")[1]
        
        try:
            return json.loads(result.strip())
        except json.JSONDecodeError:
            return {"error": ["Не удалось распарсить ответ"], "raw_response": result}
    
    def chat(self, message: str, system_prompt: Optional[str] = None) -> str:
        """
        Простой чат с GigaChat
        
        Args:
            message: Сообщение пользователя
            system_prompt: Системный промпт (опционально)
            
        Returns:
            Ответ ассистента
        """
        if system_prompt:
            full_prompt = f"{system_prompt}\n\nПользователь: {message}\nАссистент:"
        else:
            full_prompt = message
        
        response = self.client.chat(full_prompt)
        return response.choices[0].message.content


# Пример использования
if __name__ == "__main__":
    assistant = GigaChatAssistant()
    
    # Тестирование чата
    print("=== Тест чата ===")
    response = assistant.chat("Привет! Расскажи, что ты умеешь?")
    print(f"Ответ: {response}\n")
    
    # TODO: Добавьте остальные тесты
```

### **3. Задания для самостоятельного выполнения (30% дописать)**

#### **A. Регистрация и настройка доступа к GigaChat** (обязательно)

Выполните регистрацию и настройте окружение:

1. Зарегистрируйтесь на [developers.sber.ru](https://developers.sber.ru)
2. Создайте проект и получите авторизационные данные 
3. Сохраните токен в файл `.env`
4. Проверьте подключение, выполнив тестовый запрос

```python
# test_connection.py
from gigachat import GigaChat

with GigaChat(credentials="ваш_токен", verify_ssl_certs=False) as giga:
    response = giga.chat("Привет! Ты работаешь?")
    print(response.choices[0].message.content)
```

#### **B. Генерация функций на Python** (обязательно)

Используйте GigaChat для генерации следующих функций:

1. **Функция для проверки корректности email-адреса** (регулярное выражение + проверка домена)
2. **Функция для сортировки списка словарей по заданному ключу**
3. **Декоратор для измерения времени выполнения функции**

```python
# TODO: Заполните промпты для генерации
description_1 = "Напиши функцию validate_email(email: str) -> bool, которая проверяет корректность email-адреса..."
# Ваш код:

description_2 = "Напиши функцию sort_by_key(data: List[Dict], key: str, reverse: bool = False) -> List[Dict]..."

description_3 = "Напиши декоратор timer(func) для измерения времени выполнения функции..."

# Генерация кода
assistant = GigaChatAssistant()
code_1 = assistant.generate_code(description_1)
code_2 = assistant.generate_code(description_2)
code_3 = assistant.generate_code(description_3)

print(code_1)
print(code_2)
print(code_3)
```

#### **C. Рефакторинг "плохого" кода** (обязательно)

Возьмите следующий "плохой" код и выполните его рефакторинг через GigaChat:

```python
# bad_code.py
def f(x,y):
    # Сложение чисел
    z=x+y
    return z

def calc(a,b,c):
    # Какая-то сложная логика
    res1=a*b
    res2=res1+c
    res3=res2/2
    # TODO: Добавить обработку
    return res3

# Глобальная переменная
g=100

def process(lst):
    # Обработка списка
    res=[]
    for i in range(len(lst)):
        if lst[i]%2==0:
            res.append(lst[i]*2)
        else:
            res.append(lst[i]*3)
    return res

def get_user(id):
    # Получение пользователя (заглушка)
    if id==1:
        return "Alice"
    elif id==2:
        return "Bob"
    else:
        return None
```

```python
# TODO: Выполните рефакторинг
assistant = GigaChatAssistant()
bad_code = open("bad_code.py").read()

refactored = assistant.refactor_code(
    bad_code,
    requirements="""
    1. Переименуй функции и переменные в осмысленные имена
    2. Добавь аннотации типов
    3. Добавь docstring для каждой функции
    4. Замени глобальную переменную на константу
    5. Добавь обработку ошибок в get_user
    """
)

print("=== ОТРЕФАКТОРЕННЫЙ КОД ===")
print(refactored)
```

#### **D. Генерация тестов** (обязательно)

Сгенерируйте тесты для отрефакторенного кода с помощью GigaChat:

```python
# TODO: Сгенерируйте тесты для отрефакторенных функций
tests = assistant.generate_tests(refactored, framework="pytest")
print("=== СГЕНЕРИРОВАННЫЕ ТЕСТЫ ===")
print(tests)

# Сохраните тесты в файл
with open("test_refactored.py", "w") as f:
    f.write(tests)

# Запустите тесты (если pytest установлен)
# pytest test_refactored.py -v
```

#### **E. Анализ качества сгенерированного кода** (дополнительно)

Выполните анализ кода, сгенерированного GigaChat, и сравните его с человеческим кодом:

```python
# TODO: Проанализируйте сгенерированный код
code_to_analyze = code_1 + "\n\n" + code_2 + "\n\n" + code_3
analysis = assistant.analyze_code(code_to_analyze)

print("=== РЕЗУЛЬТАТЫ АНАЛИЗА ===")
for category, issues in analysis.items():
    print(f"\n{category.upper()}:")
    for issue in issues:
        print(f"  - {issue}")
```

#### **F. Генерация документации** (дополнительно)

Сгенерируйте документацию для одного из созданных модулей:

```python
# TODO: Сгенерируйте README для проекта
readme = assistant.generate_documentation(code_1 + code_2 + code_3, doc_type="readme")
print("=== СГЕНЕРИРОВАННАЯ ДОКУМЕНТАЦИЯ ===")
print(readme)

# Сохраните README
with open("README_generated.md", "w") as f:
    f.write(readme)
```

### **4. Запуск и проверка**

```bash
# Активация виртуального окружения
source venv/bin/activate

# Проверка подключения к GigaChat
python test_connection.py

# Запуск основного скрипта
python gigachat_client.py

# Запуск сгенерированных тестов
pytest test_refactored.py -v

# Проверка сгенерированного кода через pylint
pylint generated_code.py
```

### **5. Что должно быть в отчёте:**

1. **Исходный код:**
   - Полный код класса `GigaChatAssistant` с реализованными методами
   - Сгенерированные функции (email-валидация, сортировка, декоратор)
   - Отрефакторенный код (результат работы ИИ)
   - Сгенерированные тесты

2. **Скриншоты:**
   - Скриншот успешного подключения к GigaChat API
   - Результат выполнения сгенерированных тестов
   - Результат анализа кода (вывод в консоль)

3. **Ответы на вопросы:**
   - Какие типы задач лучше всего решает GigaChat? В каких задачах были получены наилучшие результаты?
   - Были ли ошибки в сгенерированном коде? Какие? Как вы их исправили?
   - В чём отличие между генерацией кода через ИИ и использованием шаблонов (snippets)?
   - Какие риски использования ИИ для генерации кода вы видите?
   - Какой код генерирует GigaChat по сравнению с ChatGPT/GPT-4? (если есть опыт сравнения)
   - Насколько полезны сгенерированные тесты? Какие сценарии были пропущены?

### **6. Критерии оценивания:**

#### **Обязательные требования (минимум для зачёта):**
- **Регистрация:** Получен и настроен доступ к GigaChat API
- **Генерация кода:** Успешно сгенерированы 3 функции по текстовому описанию
- **Рефакторинг:** Выполнен рефакторинг "плохого" кода с улучшением читаемости и добавлением типов
- **Тесты:** Сгенерированы и запущены тесты (минимум 5 тестовых случаев)

#### **Дополнительные критерии (для повышения оценки):**
- **Анализ:** Проведён анализ сгенерированного кода с выявлением проблем и предложениями
- **Документация:** Сгенерирована документация (README) для модуля
- **Сравнение:** Проведено сравнение качества кода от GigaChat и другого ИИ-ассистента
- **Качество промптов:** Продемонстрировано влияние различных промптов на результат генерации

#### **Неприемлемые ошибки:**
- Код сгенерирован, но не запускается (синтаксические ошибки)
- Отсутствует обработка ошибок при работе с API
- Сгенерированный код не соответствует техническому заданию

### **7. Полезные команды для Ubuntu:**

```bash
# Просмотр логов API (при использовании debug режима)
export GIGACHAT_DEBUG=1
python script.py

# Проверка установленных сертификатов
python -c "import certifi; print(certifi.where())"

# Проверка переменных окружения
python -c "from dotenv import load_dotenv; import os; load_dotenv(); print(os.getenv('GIGACHAT_CREDENTIALS')[:10] + '...')"

# Запуск с профилированием запросов
python -m cProfile gigachat_client.py

# Установка дополнительных инструментов анализа
pip install pylint black mypy pytest
```

### **8. Структура проекта:**

```
lab7_gigachat/
├── .env                        # Переменные окружения (токен)
├── gigachat_client.py          # Основной клиент GigaChat
├── test_connection.py          # Проверка подключения
├── bad_code.py                 # Исходный "плохой" код
├── refactored_code.py          # Отрефакторенный код (результат ИИ)
├── test_refactored.py          # Сгенерированные тесты
├── generated_code.py           # Сгенерированные функции
├── README_generated.md         # Сгенерированная документация
├── requirements.txt            # Зависимости проекта
└── report/
    ├── screenshots/            # Скриншоты выполнения
    ├── analysis.json           # Результаты анализа кода
    └── answers.md              # Ответы на вопросы
```

### **9. Советы по выполнению:**

1. **Настройка сертификатов:** Если возникают ошибки SSL, используйте параметр `verify_ssl_certs=False` (только для разработки) 

2. **Работа с промптами:** Качество генерации напрямую зависит от качества промпта. Чётко описывайте требования, указывайте язык, формат вывода.

3. **Очистка ответов:** GigaChat может возвращать код в markdown-блоках (```python ... ```). Обязательно очищайте ответ перед использованием.

4. **Обработка ошибок:** API может возвращать ошибки авторизации (401) или превышения лимитов. Добавьте повторные попытки (retries).

5. **Сравнение моделей:** В GigaChat доступны разные модели: `GigaChat-2` (Lite), `GigaChat-2-Pro`, `GigaChat-2-Max` . Экспериментируйте с ними.

6. **Потоковая генерация:** Для длинных ответов используйте потоковый режим (`streaming=True`), чтобы получать токены по мере генерации.

```python
# Пример потоковой генерации
from gigachat import GigaChat

with GigaChat(credentials="...", verify_ssl_certs=False) as giga:
    for chunk in giga.stream("Напиши код для сортировки списка"):
        print(chunk.choices[0].delta.content, end="", flush=True)
```

**Примечание:** В задании предоставлено ~70% кода (структура класса, шаблоны промптов, примеры использования). Ваша задача — реализовать методы генерации, рефакторинга, тестирования и анализа (помечены `TODO`), а также выполнить практические задания по генерации конкретных функций.
