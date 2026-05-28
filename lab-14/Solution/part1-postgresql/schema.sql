DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS customers;

CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    city VARCHAR(80) NOT NULL,
    email VARCHAR(160) NOT NULL UNIQUE,
    registered_at DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    product_name VARCHAR(120) NOT NULL,
    category VARCHAR(80) NOT NULL,
    price NUMERIC(12, 2) NOT NULL CHECK (price > 0)
);

CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(customer_id),
    order_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL CHECK (status IN ('created', 'paid', 'shipped', 'cancelled')),
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('card', 'cash', 'online'))
);

CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(product_id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price > 0)
);

INSERT INTO customers (full_name, city, email, registered_at) VALUES
('Александр Целенко', 'Москва', 'alex.tselenko@example.com', '2023-12-20'),
('Петр Иванов', 'Санкт-Петербург', 'petr@example.com', '2024-01-04'),
('Мария Сидорова', 'Казань', 'maria@example.com', '2024-01-08'),
('Иван Петров', 'Москва', 'ivan@example.com', '2024-01-11'),
('Елена Козлова', 'Новосибирск', 'elena@example.com', '2024-01-17'),
('Дмитрий Соколов', 'Екатеринбург', 'dmitry@example.com', '2024-01-19');

INSERT INTO products (product_name, category, price) VALUES
('Ноутбук', 'Электроника', 75000.00),
('Мышь', 'Электроника', 1500.00),
('Клавиатура', 'Электроника', 5000.00),
('Монитор', 'Электроника', 25000.00),
('Книга SQL', 'Книги', 2500.00),
('Книга Python', 'Книги', 3500.00),
('Ежедневник', 'Канцелярия', 700.00),
('Ручка', 'Канцелярия', 120.00);

INSERT INTO orders (customer_id, order_date, status, payment_method) VALUES
(1, '2024-01-15', 'paid', 'card'),
(2, '2024-01-16', 'paid', 'cash'),
(3, '2024-01-17', 'shipped', 'card'),
(4, '2024-01-18', 'paid', 'online'),
(5, '2024-01-18', 'cancelled', 'cash'),
(6, '2024-01-19', 'paid', 'card'),
(1, '2024-02-02', 'shipped', 'online'),
(3, '2024-02-05', 'paid', 'card'),
(4, '2024-02-06', 'created', 'online'),
(2, '2024-02-10', 'paid', 'cash');

INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
(1, 1, 1, 75000.00),
(1, 2, 2, 1500.00),
(2, 5, 1, 2500.00),
(2, 8, 5, 120.00),
(3, 3, 1, 5000.00),
(3, 2, 3, 1500.00),
(4, 6, 1, 3500.00),
(4, 7, 2, 700.00),
(5, 4, 1, 25000.00),
(6, 4, 1, 25000.00),
(7, 1, 1, 75000.00),
(7, 3, 1, 5000.00),
(8, 5, 2, 2500.00),
(8, 6, 1, 3500.00),
(9, 2, 1, 1500.00),
(10, 5, 1, 2500.00),
(10, 7, 4, 700.00);
