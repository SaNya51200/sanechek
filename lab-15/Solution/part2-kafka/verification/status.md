# Kafka verification

Planned command:

```powershell
docker compose up -d
python consumer.py
python producer.py
python windowed_consumer.py
```

Actual local environment status on 2026-04-26:

- `docker compose up -d` started Zookeeper, Kafka, and Kafka UI.
- `python producer.py` sent 15 orders to topic `orders`.
- `consumer.py` processed 15 messages with total revenue `526000.0`.
- `windowed_consumer.py` saved one verification window with 15 orders and revenue `526000.0`.
- Outputs were saved to:
  - `kafka_producer_output.txt`
  - `kafka_consumer_output.txt`
  - `kafka_windowed_output.txt`
  - `../data/orders_processed.json`
  - `../data/windowed_stats.json`

