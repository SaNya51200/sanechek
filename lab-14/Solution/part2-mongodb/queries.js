db = db.getSiblingDB("shop_analytics");

print("1. Create order");
db.orders.insertOne({
  order_id: 1009,
  order_date: ISODate("2024-02-06"),
  status: "created",
  payment_method: "online",
  customer: { id: 4, name: "Иван Петров", city: "Москва", email: "ivan@example.com" },
  items: [
    { product_id: 2, product_name: "Мышь", category: "Электроника", quantity: 1, unit_price: 1500 }
  ]
});

print("2. Read recent orders");
const recentOrders = db.orders
  .find({}, { _id: 0, order_id: 1, status: 1, "customer.name": 1, order_date: 1 })
  .sort({ order_date: -1 })
  .limit(5);
recentOrders.forEach(printjson);

print("3. Update order status");
db.orders.updateOne({ order_id: 1009 }, { $set: { status: "paid" } });
printjson(db.orders.findOne({ order_id: 1009 }, { _id: 0 }));

print("4. Delete cancelled orders");
db.orders.deleteMany({ status: "cancelled" });
print("Orders after delete: " + db.orders.countDocuments());

print("5. Revenue by category");
db.orders.aggregate([
  { $match: { status: { $in: ["paid", "shipped"] } } },
  { $unwind: "$items" },
  {
    $group: {
      _id: "$items.category",
      total_revenue: { $sum: { $multiply: ["$items.quantity", "$items.unit_price"] } },
      total_quantity: { $sum: "$items.quantity" },
      order_count: { $addToSet: "$order_id" }
    }
  },
  { $project: { category: "$_id", _id: 0, total_revenue: 1, total_quantity: 1, order_count: { $size: "$order_count" } } },
  { $sort: { total_revenue: -1 } }
]).forEach(printjson);

print("6. Top customers");
db.orders.aggregate([
  { $match: { status: { $in: ["paid", "shipped"] } } },
  { $unwind: "$items" },
  {
    $group: {
      _id: "$customer.id",
      name: { $first: "$customer.name" },
      city: { $first: "$customer.city" },
      total_spent: { $sum: { $multiply: ["$items.quantity", "$items.unit_price"] } },
      orders: { $addToSet: "$order_id" }
    }
  },
  { $project: { _id: 0, name: 1, city: 1, total_spent: 1, paid_orders: { $size: "$orders" } } },
  { $sort: { total_spent: -1 } },
  { $limit: 3 }
]).forEach(printjson);
