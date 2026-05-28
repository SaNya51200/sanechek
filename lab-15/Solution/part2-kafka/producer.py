"""Kafka producer that generates store order events."""

from __future__ import annotations

import json
import logging
import random
import time
import uuid
from datetime import datetime

from kafka import KafkaProducer

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] - %(message)s")
logger = logging.getLogger(__name__)


class StoreEventProducer:
    def __init__(self, bootstrap_servers: str = "localhost:9092", topic: str = "orders"):
        self.bootstrap_servers = bootstrap_servers
        self.topic = topic
        self.producer: KafkaProducer | None = None

    def connect(self) -> None:
        self.producer = KafkaProducer(
            bootstrap_servers=self.bootstrap_servers,
            value_serializer=lambda val: json.dumps(val, ensure_ascii=False).encode("utf-8"),
            key_serializer=lambda k: k.encode("utf-8") if k else None,
        )
        logger.info("Kafka Connection established at %s", self.bootstrap_servers)

    def create_mock_order_event(self) -> dict:
        catalog = [
            {"product_id": 101, "name": "Ноутбук", "price": 75000, "category": "Электроника"},
            {"product_id": 102, "name": "Мышь", "price": 1500, "category": "Электроника"},
            {"product_id": 103, "name": "Книга SQL", "price": 2500, "category": "Книги"},
            {"product_id": 104, "name": "Клавиатура", "price": 5000, "category": "Электроника"},
            {"product_id": 105, "name": "Монитор", "price": 25000, "category": "Электроника"},
            {"product_id": 106, "name": "Книга Python", "price": 3500, "category": "Книги"},
        ]
        customers = [
            {"id": 1, "name": "Александр Целенко", "city": "Москва"},
            {"id": 2, "name": "Петр Иванов", "city": "Санкт-Петербург"},
            {"id": 3, "name": "Мария Сидорова", "city": "Казань"},
            {"id": 4, "name": "Иван Петров", "city": "Москва"},
            {"id": 5, "name": "Елена Козлова", "city": "Новосибирск"},
        ]
        prod = random.choice(catalog)
        cust = random.choice(customers)
        qty = random.randint(1, 3)
        return {
            "order_id": str(uuid.uuid4())[:8],
            "timestamp": datetime.now().isoformat(),
            "customer": cust,
            "items": [
                {
                    "product_id": prod["product_id"],
                    "product_name": prod["name"],
                    "category": prod["category"],
                    "quantity": qty,
                    "unit_price": prod["price"],
                    "total_price": qty * prod["price"],
                }
            ],
            "total_amount": qty * prod["price"],
            "payment_method": random.choice(["card", "cash", "online"]),
        }

    def publish_order_event(self, order: dict):
        if self.producer is None:
            raise RuntimeError("Must call connect() before publishing events")
        partition_key = str(order["customer"]["id"])
        future = self.producer.send(self.topic, key=partition_key, value=order)
        meta = future.get(timeout=10)
        logger.info("[PRODUCER] Order %s published to Partition %s at Offset %s", order["order_id"], meta.partition, meta.offset)
        return future

    def run(self, interval_seconds: float = 1.0, max_orders: int = 15) -> None:
        self.connect()
        for _ in range(max_orders):
            self.publish_order_event(self.create_mock_order_event())
            time.sleep(interval_seconds)
        assert self.producer is not None
        self.producer.flush()
        self.producer.close()
        logger.info("[PRODUCER] Execution complete. All order events successfully published.")


if __name__ == "__main__":
    StoreEventProducer().run()
