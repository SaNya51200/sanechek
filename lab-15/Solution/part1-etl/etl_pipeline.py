"""ETL pipeline for store analytics data processing."""

from __future__ import annotations

import logging
import sqlite3
from pathlib import Path

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent
LOG_DIR = BASE_DIR / "logs"
GRAPH_DIR = BASE_DIR / "report" / "graphs"
LOG_DIR.mkdir(exist_ok=True)
GRAPH_DIR.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] - %(message)s",
    handlers=[
        logging.FileHandler(LOG_DIR / "pipeline_run.log", encoding="utf-8", mode="w"),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger(__name__)


class StoreETLEngine:
    """Extract, Transform, Aggregate, Load and Visualize store sales data."""

    def __init__(self, input_csv: str | Path, output_db: str | Path = "store_analytics.db"):
        self.input_csv = Path(input_csv)
        self.output_db = Path(output_db)
        self.raw_df: pd.DataFrame | None = None
        self.cleaned_df: pd.DataFrame | None = None
        self.aggregated_df: pd.DataFrame | None = None

    def extract_csv_data(self) -> pd.DataFrame:
        logger.info("[ETL] Extraction stage initiated")
        if not self.input_csv.exists():
            raise FileNotFoundError(f"Input file not found: {self.input_csv}")

        self.raw_df = pd.read_csv(self.input_csv)
        if self.raw_df.empty:
            raise ValueError("The source CSV dataset is empty")

        logger.info("[ETL] Successfully loaded %s rows, %s columns", len(self.raw_df), len(self.raw_df.columns))
        return self.raw_df

    def clean_and_transform(self) -> pd.DataFrame:
        logger.info("[ETL] Transformation stage initiated")
        if self.raw_df is None:
            raise RuntimeError("Extraction must be run before transformation")

        df = self.raw_df.copy()
        row_count_before = len(df)
        df = df.drop_duplicates()
        logger.info("[ETL] Deduplication removed %s rows", row_count_before - len(df))

        # Валидация числовых значений
        num_fields = ["quantity", "price_per_unit"]
        for field in num_fields:
            df[field] = pd.to_numeric(df[field], errors="coerce")
            df[field] = df[field].fillna(df[field].median())

        # Заполнение текстовых пропусков
        str_fields = ["product_name", "category", "customer_name", "customer_city", "payment_method"]
        for field in str_fields:
            df[field] = df[field].fillna("NotSpecified").replace("", "NotSpecified")

        # Парсинг временных меток
        df["order_date"] = pd.to_datetime(df["order_date"], errors="coerce")
        df = df.dropna(subset=["order_date"])

        # Фильтрация некорректных значений
        df = df[(df["quantity"] > 0) & (df["price_per_unit"] > 0)]
        df["quantity"] = df["quantity"].astype(int)
        df["total_amount"] = df["quantity"] * df["price_per_unit"]
        df["month_year"] = df["order_date"].dt.to_period("M").astype(str)

        self.cleaned_df = df
        logger.info("[ETL] Remaining rows after validation/cleaning: %s", len(df))
        return df

    def aggregate_metrics(self) -> pd.DataFrame:
        logger.info("[ETL] Aggregation stage initiated")
        if self.cleaned_df is None:
            raise RuntimeError("Transformation must be run before aggregation")

        self.aggregated_df = (
            self.cleaned_df.groupby(["category", "month_year"], as_index=False)
            .agg(
                total_qty=("quantity", "sum"),
                total_revenue=("total_amount", "sum"),
                avg_unit_price=("price_per_unit", "mean"),
                distinct_orders=("order_id", "nunique"),
            )
            .sort_values(["month_year", "total_revenue"], ascending=[True, False])
        )
        logger.info("[ETL] Generated %s unique aggregation slices", len(self.aggregated_df))
        return self.aggregated_df

    def export_to_sqlite(self) -> None:
        logger.info("[ETL] Load stage initiated")
        if self.cleaned_df is None or self.aggregated_df is None:
            raise RuntimeError("Transformation and aggregation must run before loading")

        with sqlite3.connect(self.output_db) as conn:
            self.cleaned_df.to_sql("cleaned_orders", conn, if_exists="replace", index=False)
            self.aggregated_df.to_sql("aggregated_orders_report", conn, if_exists="replace", index=False)
        logger.info("[ETL] Saved processed data to SQLite DB: %s", self.output_db)

    def generate_report_charts(self) -> None:
        logger.info("[ETL] Visualization stage initiated")
        if self.cleaned_df is None or self.aggregated_df is None:
            raise RuntimeError("Transformation and aggregation must run before visualization")

        grouped_rev = (
            self.cleaned_df.groupby("category", as_index=False)["total_amount"]
            .sum()
            .sort_values("total_amount", ascending=False)
        )
        
        # Столбчатая диаграмма доходов по категориям
        plt.figure(figsize=(9, 5))
        plt.bar(grouped_rev["category"], grouped_rev["total_amount"], color="teal")
        plt.title("Выручка по категориям товаров")
        plt.xlabel("Категории")
        plt.ylabel("Доход")
        plt.tight_layout()
        plt.savefig(GRAPH_DIR / "revenue_by_category.png", dpi=140)
        plt.close()

        # Линейный график ежемесячной выручки
        monthly = self.cleaned_df.groupby("month_year", as_index=False)["total_amount"].sum()
        plt.figure(figsize=(9, 5))
        plt.plot(monthly["month_year"], monthly["total_amount"], marker="s", color="darkred")
        plt.title("Динамика доходов по месяцам")
        plt.xlabel("Месяц")
        plt.ylabel("Выручка")
        plt.tight_layout()
        plt.savefig(GRAPH_DIR / "monthly_revenue.png", dpi=140)
        plt.close()

        # Круговая диаграмма долей категорий
        plt.figure(figsize=(7, 7))
        plt.pie(grouped_rev["total_amount"], labels=grouped_rev["category"], autopct="%1.1f%%", startangle=90)
        plt.title("Долевое распределение категорий")
        plt.tight_layout()
        plt.savefig(GRAPH_DIR / "category_share.png", dpi=140)
        plt.close()
        logger.info("[ETL] Generated and saved analytical graphs to %s", GRAPH_DIR)

    def run(self) -> None:
        logger.info("=" * 60)
        logger.info("ETL PIPELINE LAUNCHED")
        logger.info("=" * 60)
        self.extract_csv_data()
        self.clean_and_transform()
        self.aggregate_metrics()
        self.export_to_sqlite()
        self.generate_report_charts()
        logger.info("ETL PIPELINE SUCCESSFULLY EXECUTED")


if __name__ == "__main__":
    engine = StoreETLEngine(
        input_csv=BASE_DIR / "data" / "sales.csv",
        output_db=BASE_DIR / "store_analytics.db"
    )
    engine.run()
