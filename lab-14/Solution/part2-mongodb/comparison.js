db = db.getSiblingDB("shop_analytics");

print("MongoDB equivalent of PostgreSQL monthly revenue query");
db.orders.aggregate([
  { $match: { status: { $in: ["paid", "shipped"] } } },
  { $unwind: "$items" },
  {
    $group: {
      _id: { $dateToString: { format: "%Y-%m", date: "$order_date" } },
      order_count: { $addToSet: "$order_id" },
      revenue: { $sum: { $multiply: ["$items.quantity", "$items.unit_price"] } }
    }
  },
  { $project: { _id: 0, month: "$_id", order_count: { $size: "$order_count" }, revenue: 1 } },
  { $sort: { month: 1 } }
]).forEach(printjson);

print("Model note: MongoDB stores order items inside orders, so category revenue does not need a join.");

