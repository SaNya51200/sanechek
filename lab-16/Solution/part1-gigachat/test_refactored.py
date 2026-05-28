from decimal import Decimal

import pytest

from generated_code import fibonacci, is_prime, normalize_phone
from refactored_code import OrderBasket, OrderItem, basket_from_dicts


def test_basket_total_and_search():
    basket = basket_from_dicts(
        [
            {"name": "Notebook", "price": "75000", "qty": 1},
            {"name": "Mouse", "price": "1500", "qty": 2},
        ]
    )

    assert basket.total_amount() == Decimal("78000")
    assert basket.find_by_name("mouse") == OrderItem("Mouse", Decimal("1500"), 2)
    assert basket.find_by_name("keyboard") is None


def test_basket_rejects_invalid_item():
    basket = OrderBasket()

    with pytest.raises(ValueError):
        basket.add_item(OrderItem("Broken", Decimal("10"), 0))


def test_generated_functions():
    assert is_prime(2)
    assert is_prime(97)
    assert not is_prime(1)
    assert not is_prime(100)
    assert fibonacci(7) == [0, 1, 1, 2, 3, 5, 8]
    assert normalize_phone("8 (999) 123-45-67") == "+79991234567"

