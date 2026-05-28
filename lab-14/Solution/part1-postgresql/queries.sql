\echo '1. Revenue by category for paid and shipped orders'
SELECT
    p.category,
    SUM(oi.quantity * oi.unit_price) AS total_revenue,
    SUM(oi.quantity) AS total_quantity,
    COUNT(DISTINCT o.order_id) AS order_count
FROM orders o
JOIN order_items oi ON oi.order_id = o.order_id
JOIN products p ON p.product_id = oi.product_id
WHERE o.status IN ('paid', 'shipped')
GROUP BY p.category
ORDER BY total_revenue DESC;

\echo '2. Top customers by revenue'
SELECT
    c.full_name,
    c.city,
    COUNT(DISTINCT o.order_id) AS paid_orders,
    SUM(oi.quantity * oi.unit_price) AS total_spent
FROM customers c
JOIN orders o ON o.customer_id = c.customer_id
JOIN order_items oi ON oi.order_id = o.order_id
WHERE o.status IN ('paid', 'shipped')
GROUP BY c.customer_id, c.full_name, c.city
ORDER BY total_spent DESC
LIMIT 3;

\echo '3. Monthly revenue dynamics'
SELECT
    TO_CHAR(DATE_TRUNC('month', o.order_date), 'YYYY-MM') AS month,
    COUNT(DISTINCT o.order_id) AS order_count,
    SUM(oi.quantity * oi.unit_price) AS revenue
FROM orders o
JOIN order_items oi ON oi.order_id = o.order_id
WHERE o.status IN ('paid', 'shipped')
GROUP BY DATE_TRUNC('month', o.order_date)
ORDER BY month;

