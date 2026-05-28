db = db.getSiblingDB("shop_analytics");

db.orders.createIndex({ status: 1, order_date: 1 });
db.orders.createIndex({ "customer.id": 1 });
db.orders.createIndex({ "items.category": 1 });
db.orders.createIndex({ order_id: 1 }, { unique: true });

print("Indexes");
db.orders.getIndexes().forEach(printjson);

print("Explain for paid orders by date");
printjson(db.orders.find({ status: "paid" }).sort({ order_date: 1 }).explain("executionStats"));

