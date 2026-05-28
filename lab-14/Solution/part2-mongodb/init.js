db = db.getSiblingDB("shop_analytics");
db.orders.drop();

db.orders.insertMany([
  {
    order_id: 1001,
    order_date: ISODate("2024-01-15"),
    status: "paid",
    payment_method: "card",
    customer: { id: 1, name: "Александр Целенко", city: "Москва", email: "alex.tselenko@example.com" },
    items: [
      { product_id: 1, product_name: "Ноутбук", category: "Электроника", quantity: 1, unit_price: 75000 },
      { product_id: 2, product_name: "Мышь", category: "Электроника", quantity: 2, unit_price: 1500 }
    ]
  },
  {
    order_id: 1002,
    order_date: ISODate("2024-01-16"),
    status: "paid",
    payment_method: "cash",
    customer: { id: 2, name: "Петр Иванов", city: "Санкт-Петербург", email: "petr@example.com" },
    items: [
      { product_id: 5, product_name: "Книга SQL", category: "Книги", quantity: 1, unit_price: 2500 },
      { product_id: 8, product_name: "Ручка", category: "Канцелярия", quantity: 5, unit_price: 120 }
    ]
  },
  {
    order_id: 1003,
    order_date: ISODate("2024-01-17"),
    status: "shipped",
    payment_method: "card",
    customer: { id: 3, name: "Мария Сидорова", city: "Казань", email: "maria@example.com" },
    items: [
      { product_id: 3, product_name: "Клавиатура", category: "Электроника", quantity: 1, unit_price: 5000 },
      { product_id: 2, product_name: "Мышь", category: "Электроника", quantity: 3, unit_price: 1500 }
    ]
  },
  {
    order_id: 1004,
    order_date: ISODate("2024-01-18"),
    status: "paid",
    payment_method: "online",
    customer: { id: 4, name: "Иван Петров", city: "Москва", email: "ivan@example.com" },
    items: [
      { product_id: 6, product_name: "Книга Python", category: "Книги", quantity: 1, unit_price: 3500 },
      { product_id: 7, product_name: "Ежедневник", category: "Канцелярия", quantity: 2, unit_price: 700 }
    ]
  },
  {
    order_id: 1005,
    order_date: ISODate("2024-01-18"),
    status: "cancelled",
    payment_method: "cash",
    customer: { id: 5, name: "Елена Козлова", city: "Новосибирск", email: "elena@example.com" },
    items: [
      { product_id: 4, product_name: "Монитор", category: "Электроника", quantity: 1, unit_price: 25000 }
    ]
  },
  {
    order_id: 1006,
    order_date: ISODate("2024-01-19"),
    status: "paid",
    payment_method: "card",
    customer: { id: 6, name: "Дмитрий Соколов", city: "Екатеринбург", email: "dmitry@example.com" },
    items: [
      { product_id: 4, product_name: "Монитор", category: "Электроника", quantity: 1, unit_price: 25000 }
    ]
  },
  {
    order_id: 1007,
    order_date: ISODate("2024-02-02"),
    status: "shipped",
    payment_method: "online",
    customer: { id: 1, name: "Александр Целенко", city: "Москва", email: "alex.tselenko@example.com" },
    items: [
      { product_id: 1, product_name: "Ноутбук", category: "Электроника", quantity: 1, unit_price: 75000 },
      { product_id: 3, product_name: "Клавиатура", category: "Электроника", quantity: 1, unit_price: 5000 }
    ]
  },
  {
    order_id: 1008,
    order_date: ISODate("2024-02-05"),
    status: "paid",
    payment_method: "card",
    customer: { id: 3, name: "Мария Сидорова", city: "Казань", email: "maria@example.com" },
    items: [
      { product_id: 5, product_name: "Книга SQL", category: "Книги", quantity: 2, unit_price: 2500 },
      { product_id: 6, product_name: "Книга Python", category: "Книги", quantity: 1, unit_price: 3500 }
    ]
  }
]);

print("Inserted orders: " + db.orders.countDocuments());
