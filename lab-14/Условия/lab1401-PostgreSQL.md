# **Лабораторная работа 14. Часть 1: Реляционные базы данных на примере PostgreSQL**

## **Тема:** Реляционные базы данных: создание схемы, написание SQL-запросов, индексы и анализ выполнения.

### **Цель работы:**
Получить практические навыки работы с реляционной СУБД PostgreSQL: проектирование схемы, написание сложных запросов (JOIN, GROUP BY, подзапросы, CTE), создание индексов и анализ производительности запросов.

---

## **Задание: Разработка аналитических запросов для интернет-магазина**

Вам необходимо создать базу данных для интернет-магазина с таблицами `users`, `products`, `orders` и `order_items`. Затем написать серию SQL-запросов для получения отчётов и оптимизировать их с помощью индексов.

### **1. Настройка проекта**

Установите PostgreSQL и создайте базу данных.

```bash
# Обновление списка пакетов
sudo apt update

# Установка PostgreSQL и клиента
sudo apt install postgresql postgresql-contrib

# Проверка статуса службы
sudo systemctl status postgresql

# Переключение на пользователя postgres
sudo -i -u postgres

# Создание базы данных и пользователя (замените your_dbname и your_user)
createdb lab5_shop
psql -c "CREATE USER your_user WITH PASSWORD 'your_password';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE lab5_shop TO your_user;"

# Подключение к базе
psql -d lab5_shop -U your_user
```

Альтернативно, используйте облачную версию **Supabase** (бесплатный тариф):
1. Зарегистрируйтесь на [supabase.com](https://supabase.com)
2. Создайте новый проект
3. Используйте встроенный SQL Editor для выполнения запросов

### **2. Базовый код (70% предоставляется)**

**Файл: `schema.sql`**

```sql
-- Создание таблиц
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    stock_quantity INTEGER DEFAULT 0
);

CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending'
);

CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(order_id),
    product_id INTEGER REFERENCES products(product_id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL
);

-- Вставка тестовых данных (пример)
INSERT INTO users (email, full_name) VALUES
    ('alice@example.com', 'Alice Smith'),
    ('bob@example.com', 'Bob Johnson');

INSERT INTO products (name, category, price, stock_quantity) VALUES
    ('Ноутбук', 'Электроника', 75000.00, 10),
    ('Мышь', 'Электроника', 1500.00, 50),
    ('Книга SQL', 'Книги', 2500.00, 30);

-- TODO: Добавьте 2-3 заказа и позиции заказов самостоятельно (см. задание A)
```

**Файл: `queries.sql` (шаблоны запросов)**

```sql
-- 1. Получение всех заказов пользователя с итоговой суммой
-- TODO: Вам нужно дописать запрос с JOIN и агрегацией

-- 2. Отчёт по категориям: количество проданных товаров и выручка
-- TODO: GROUP BY + JOIN

-- 3. Топ-3 пользователей по сумме заказов (с использованием CTE)
-- TODO: WITH ... AS ... + ORDER BY + LIMIT

-- 4. Анализ плана выполнения (будет работать после создания индексов)
EXPLAIN ANALYZE
SELECT * FROM order_items WHERE order_id = 1;
```

### **3. Задания для самостоятельного выполнения (30% дописать)**

#### **A. Заполнение тестовыми данными** (обязательно)

Добавьте минимум **2 заказа** (один для Alice, один для Bob) и **3-4 позиции заказов** так, чтобы можно было проверить агрегатные функции.

```sql
-- Вставка заказов
INSERT INTO orders (user_id, status) VALUES
    (1, 'completed'),   -- заказ Alice
    (2, 'completed');   -- заказ Bob

-- TODO: Вставьте order_items (свяжите заказы с продуктами)
-- Подсказка: используйте product_id и реальные цены из products
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
    (1, 1, 1, 75000.00),  -- Ноутбук в заказе Alice
    -- ... добавьте ещё 2-3 записи
```

#### **B. Написание трёх аналитических запросов** (обязательно)

Реализуйте запросы, помеченные `TODO` в `queries.sql`:

1. **Запрос 1:** Для каждого заказа выведите:
   - `order_id`, `full_name` пользователя, `order_date`, `status`
   - сумму заказа (вычисляемую как `SUM(quantity * unit_price)`)
   - Отсортируйте по убыванию суммы.

```sql
-- Ваш код:
SELECT 
    o.order_id,
    u.full_name,
    o.order_date,
    o.status,
    SUM(oi.quantity * oi.unit_price) AS total_amount
FROM orders o
JOIN users u ON o.user_id = u.user_id
JOIN order_items oi ON o.order_id = oi.order_id
GROUP BY o.order_id, u.full_name, o.order_date, o.status
ORDER BY total_amount DESC;
```

2. **Запрос 2:** По категориям товаров выведите:
   - `category`
   - общее количество проданных единиц (`SUM(quantity)`)
   - общую выручку (`SUM(quantity * unit_price)`)
   - отфильтруйте только категории с выручкой > 10000 руб.

```sql
-- Ваш код:
SELECT 
    p.category,
    SUM(oi.quantity) AS total_sold,
    SUM(oi.quantity * oi.unit_price) AS total_revenue
FROM order_items oi
JOIN products p ON oi.product_id = p.product_id
GROUP BY p.category
HAVING SUM(oi.quantity * oi.unit_price) > 10000;
```

3. **Запрос 3 (с CTE):** Найдите топ-3 пользователей по сумме заказов.

```sql
-- Ваш код:
WITH user_totals AS (
    SELECT 
        u.user_id,
        u.full_name,
        SUM(oi.quantity * oi.unit_price) AS total_spent
    FROM users u
    JOIN orders o ON u.user_id = o.user_id
    JOIN order_items oi ON o.order_id = oi.order_id
    GROUP BY u.user_id, u.full_name
)
SELECT * FROM user_totals
ORDER BY total_spent DESC
LIMIT 3;
```

#### **C. Оптимизация с индексами** (дополнительно)

Создайте индекс для ускорения запроса поиска заказов по `order_id` в таблице `order_items`. Сравните план выполнения до и после.

```sql
-- Создание индекса
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- Проверка плана (выполните после создания данных)
EXPLAIN ANALYZE SELECT * FROM order_items WHERE order_id = 1;
```

### **4. Запуск и проверка**

```bash
# Подключение к базе
psql -d lab5_shop -U your_user

# Выполнение схемы и данных
\i schema.sql

# Выполнение запросов
\i queries.sql

# Проверка созданных индексов
\di
```

### **5. Что должно быть в отчёте:**

1. **Исходный код:**
   - Полный текст `schema.sql` с вашими вставками данных
   - Три итоговых запроса (Запросы 1, 2, 3)

2. **Скриншоты:**
   - Результат выполнения Запроса 1 (все заказы с суммами)
   - Результат выполнения Запроса 2 (выручка по категориям)
   - Результат `EXPLAIN ANALYZE` до и после создания индекса

3. **Ответы на вопросы:**
   - В чём разница между `WHERE` и `HAVING` в агрегатных запросах?
   - Зачем в запросе с `GROUP BY` нужно перечислять все неагрегированные столбцы?
   - Как изменится результат `EXPLAIN ANALYZE` после добавления индекса? Что означает `Seq Scan` и `Index Scan`?

### **6. Критерии оценивания:**

#### **Обязательные требования (минимум для зачёта):**
- **Корректность схемы:** Таблицы созданы, внешние ключи работают, тестовые данные вставлены (не менее 2 заказов и 3 позиций)
- **Запрос 1:** Правильно использует `JOIN`, `SUM` и `GROUP BY`, выводит сумму заказа
- **Запрос 2:** Корректно применяет `HAVING` для фильтрации по агрегированному значению

#### **Дополнительные критерии (для повышения оценки):**
- **Запрос 3 (CTE):** Реализован с использованием `WITH` и работает корректно
- **Индексы:** Создан индекс, предоставлен анализ `EXPLAIN ANALYZE` с пояснением

#### **Неприемлемые ошибки:**
- Отсутствие первичных/внешних ключей в схеме
- Использование `WHERE` вместо `HAVING` при фильтрации агрегатов
- Синтаксические ошибки, приводящие к падению запросов

### **7. Полезные команды для Ubuntu:**

```bash
# Подключение к базе
psql -d lab5_shop -U your_user

# Список всех таблиц
\dt

# Описание таблицы
\d users

# Выход из psql
\q

# Сброс базы (если ошиблись)
sudo -u postgres psql -c "DROP DATABASE lab5_shop;"
```

### **8. Структура проекта:**

```
lab5_postgresql/
├── schema.sql           # Создание таблиц + вставка данных
├── queries.sql          # Три аналитических запроса
├── index_analysis.sql   # Создание индекса и EXPLAIN ANALYZE
└── report/              # Скриншоты и ответы на вопросы
```

### **9. Советы по выполнению:**

1. **Начинайте с малого:** Сначала вставьте по 1 заказу и 2 позициям, убедитесь, что запросы работают, затем добавляйте больше данных.
2. **Используйте `EXPLAIN` без `ANALYZE`** для просмотра плана без реального выполнения на больших данных.
3. **Проверяйте типы данных:** `price` и `unit_price` должны быть числовыми, иначе агрегация не сработает.

**Примечание:** В задании предоставлено ~70% кода (схема, примеры вставок, шаблоны запросов). Ваша задача — понять логику работы и дописать недостающие ~30% (вставку данных, три аналитических запроса).
