"""Additional Kafka consumer that aggregates orders in rolling time windows."""

from __future__ import annotations

import json
import logging
from collections import defaultdict
from datetime import datetime, timedelta
from pathlib import Path

from kafka import KafkaConsumer

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] - %(message)s")
logger = logging.getLogger(__name__)


class TimeWindowedSalesConsumer:
    def __init__(
        self,
        bootstrap_servers: str = "localhost:9092",
        topic: str = "orders",
        window_size_seconds: int = 30,
        group_id: str = "tselenko_window_group",
    ):
        self.bootstrap_servers = bootstrap_servers
        self.topic = topic
        self.window_size_seconds = window_size_seconds
        self.group_id = group_id
        self.consumer: KafkaConsumer | None = None
        self.window_snapshots: list[dict] = []

    def initialize_connection(self) -> None:
        self.consumer = KafkaConsumer(
            self.topic,
            bootstrap_servers=self.bootstrap_servers,
            group_id=self.group_id,
            auto_offset_reset="earliest",
            enable_auto_commit=True,
            consumer_timeout_ms=10000,
            value_deserializer=lambda v: json.loads(v.decode("utf-8")),
        )
        logger.info("[WINDOWED] Initialized Kafka consumer on topic %s", self.topic)

    def run(self, max_messages: int | None = 15) -> None:
        self.initialize_connection()
        assert self.consumer is not None
        window_started_at = datetime.now()
        active_window_metrics = {"orders_count": 0, "revenue_sum": 0.0, "items_by_category": defaultdict(int)}
        messages_processed = 0

        try:
            for message in self.consumer:
                order = message.value
                current_time = datetime.now()
                if current_time - window_started_at >= timedelta(seconds=self.window_size_seconds):
                    self.window_snapshots.append(self._capture_window_state(window_started_at, current_time, active_window_metrics))
                    window_started_at = current_time
                    active_window_metrics = {"orders_count": 0, "revenue_sum": 0.0, "items_by_category": defaultdict(int)}

                active_window_metrics["orders_count"] += 1
                active_window_metrics["revenue_sum"] += float(order["total_amount"])
                for item in order["items"]:
                    active_window_metrics["items_by_category"][item["category"]] += item["quantity"]

                messages_processed += 1
                if max_messages is not None and messages_processed >= max_messages:
                    break
        finally:
            self.window_snapshots.append(self._capture_window_state(window_started_at, datetime.now(), active_window_metrics))
            self.consumer.close()
            output_file = DATA_DIR / "windowed_sales_analytics.json"
            output_file.write_text(
                json.dumps(self.window_snapshots, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
            logger.info("[WINDOWED] Successfully saved %s aggregation windows to %s", len(self.window_snapshots), output_file)

    @staticmethod
    def _capture_window_state(start_time: datetime, end_time: datetime, metrics: dict) -> dict:
        return {
            "window_opened": start_time.isoformat(),
            "window_closed": end_time.isoformat(),
            "orders_processed": metrics["orders_count"],
            "revenue_accumulated": metrics["revenue_sum"],
            "categories_sales": dict(metrics["items_by_category"]),
        }


if __name__ == "__main__":
    TimeWindowedSalesConsumer().run()
