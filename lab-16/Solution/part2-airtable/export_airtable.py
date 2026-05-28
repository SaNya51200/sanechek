"""Export Airtable CRM tables to CSV format using REST API."""

from __future__ import annotations

import csv
import os
from pathlib import Path

import requests
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
EXPORT_DIR = BASE_DIR / "exported_data"
CRM_TABLES = ["Customers", "Products", "Orders", "Order Items"]


def get_env_credentials() -> tuple[str, str]:
    load_dotenv(BASE_DIR / ".env")
    api_token = os.getenv("AIRTABLE_TOKEN", "").strip()
    base_id = os.getenv("AIRTABLE_BASE_ID", "").strip()
    if not api_token or not base_id:
        raise RuntimeError("Missing AIRTABLE_TOKEN or AIRTABLE_BASE_ID configuration in environment.")
    return api_token, base_id


def download_airtable_records(api_token: str, base_id: str, table_name: str) -> list[dict]:
    all_records: list[dict] = []
    pagination_offset: str | None = None
    auth_headers = {"Authorization": f"Bearer {api_token}"}
    
    while True:
        query_params = {"pageSize": 100}
        if pagination_offset:
            query_params["offset"] = pagination_offset
            
        res = requests.get(
            f"https://api.airtable.com/v0/{base_id}/{table_name}",
            headers=auth_headers,
            params=query_params,
            timeout=30,
        )
        res.raise_for_status()
        body = res.json()
        all_records.extend(body.get("records", []))
        pagination_offset = body.get("offset")
        if not pagination_offset:
            return all_records


def save_records_to_csv(table_name: str, records_list: list[dict]) -> Path:
    EXPORT_DIR.mkdir(exist_ok=True)
    field_keys = sorted({k for r in records_list for k in r.get("fields", {}).keys()})
    output_path = EXPORT_DIR / f"{table_name.replace(' ', '_').lower()}_exported.csv"
    
    with output_path.open("w", encoding="utf-8", newline="") as csv_file:
        csv_writer = csv.DictWriter(csv_file, fieldnames=["airtable_id", *field_keys])
        csv_writer.writeheader()
        for r in records_list:
            row_data = {"airtable_id": r["id"], **r.get("fields", {})}
            csv_writer.writerow(row_data)
            
    return output_path


def main() -> None:
    api_token, base_id = get_env_credentials()
    for t_name in CRM_TABLES:
        downloaded = download_airtable_records(api_token, base_id, t_name)
        csv_path = save_records_to_csv(t_name, downloaded)
        print(f"[EXPORT] Table '{t_name}': saved {len(downloaded)} records to {csv_path}")


if __name__ == "__main__":
    main()
