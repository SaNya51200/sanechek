"""Refactored order utilities generated and reviewed during lab 16."""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Iterable


@dataclass(frozen=True)
class OrderItem:
    name: str
    price: Decimal
    quantity: int

    @classmethod
    def from_dict(cls, payload: dict) -> "OrderItem":
        return cls(
            name=str(payload["name"]),
            price=Decimal(str(payload["price"])),
            quantity=int(payload["qty"]),
        )

    @property
    def total(self) -> Decimal:
        return self.price * self.quantity


class OrderBasket:
    def __init__(self, items: Iterable[OrderItem] | None = None):
        self._items = list(items or [])

    @property
    def items(self) -> tuple[OrderItem, ...]:
        return tuple(self._items)

    def add_item(self, item: OrderItem) -> None:
        if item.quantity <= 0:
            raise ValueError("quantity must be positive")
        if item.price <= 0:
            raise ValueError("price must be positive")
        self._items.append(item)

    def total_amount(self) -> Decimal:
        return sum((item.total for item in self._items), Decimal("0"))

    def find_by_name(self, name: str) -> OrderItem | None:
        normalized = name.casefold()
        for item in self._items:
            if item.name.casefold() == normalized:
                return item
        return None


def basket_from_dicts(rows: Iterable[dict]) -> OrderBasket:
    basket = OrderBasket()
    for row in rows:
        basket.add_item(OrderItem.from_dict(row))
    return basket

