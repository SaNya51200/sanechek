"""Kafka consumer that aggregates order event statistics."""

from __future__ import annotations

import json
import logging
from collections import defaultdict
from datetime import datetime
from pathlib import Path

from kafka import KafkaConsumer

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] - %(message)s")
logger = logging.getLogger(__name__)


class SalesAnalyticsConsumer:
    def __init__(self, bootstrap_servers: str = "localhost:9092", topic: str = "orders", group_id: str = "tselenko_analytics_group"):
        self.bootstrap_servers = bootstrap_servers
        self.topic = topic
        self.group_id = group_id
        self.consumer: KafkaConsumer | None = None
        self.metrics = {
            "total_orders_count": 0,
            "accumulated_revenue": 0.0,
            "orders_distribution_category": defaultdict(int),
            "orders_distribution_city": defaultdict(int),
            "recent_orders_history": [],
            "pipeline_start_time": datetime.now().isoformat(),
        }

    def initialize_consumer(self) -> None:
        self.consumer = KafkaConsumer(
            self.topic,
            bootstrap_servers=self.bootstrap_servers,
            group_id=self.group_id,
            auto_offset_reset="earliest",
            enable_auto_commit=True,
            consumer_timeout_ms=10000,
            value_deserializer=lambda v: json.loads(v.decode("utf-8")),
            key_deserializer=lambda k: k.decode("utf-8") if k else None,
        )
        logger.info("Subscribed to Kafka topic: %s", self.topic)

    def process_order_event(self, order: dict) -> None:
        self.metrics["total_orders_count"] += 1
        self.metrics["accumulated_revenue"] += float(order["total_amount"])
        for item in order["items"]:
            self.metrics["orders_distribution_category"][item["category"]] += 1
        self.metrics["orders_distribution_city"][order["customer"]["city"]] += 1
        self.metrics["recent_orders_history"].append(
            {
                "order_id": order["order_id"],
                "customer_name": order["customer"]["name"],
                "amount": order["total_amount"],
                "received_at": order["timestamp"],
            }
        )
        self.metrics["recent_orders_history"] = self.metrics["recent_orders_history"][-10:]

    def build_printable_metrics(self) -> dict:
        return {
            **self.metrics,
            "orders_distribution_category": dict(self.metrics["orders_distribution_category"]),
            "orders_distribution_city": dict(self.metrics["orders_distribution_city"]),
        }

    def persist_analytics_report(self) -> None:
        report_file = DATA_DIR / "processed_orders_stats.json"
        report_file.write_text(
            json.dumps(self.build_printable_metrics(), ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        logger.info("[CONSUMER] Persisted metrics report to %s", report_file)

    def run(self, max_messages: int | None = None) -> None:
        self.initialize_consumer()
        assert self.consumer is not None
        processed_count = 0
        try:
            for message in self.consumer:
                self.process_order_event(message.value)
                processed_count += 1
                logger.info("[CONSUMER] Event processed. Order ID: %s", message.value["order_id"])
                if max_messages is not None and processed_count >= max_messages:
                    break
        finally:
            self.consumer.close()
            self.persist_analytics_report()
            logger.info("[CONSUMER] Analytics processing summary: %s", self.build_printable_metrics())


if __name__ == "__main__":
    SalesAnalyticsConsumer().run(max_messages=15)
