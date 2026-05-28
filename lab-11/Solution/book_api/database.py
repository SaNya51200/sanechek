from typing import Dict
from models import BookResponseSchema

# Хранилище книг и аренды в оперативной памяти
BOOKS_STORE: Dict[int, dict] = {}
BORROWS_STORE: Dict[int, dict] = {}
_book_id_generator = 1

def get_next_book_id() -> int:
    """Генерация следующего инкрементного идентификатора для книги"""
    global _book_id_generator
    uid = _book_id_generator
    _book_id_generator += 1
    return uid

def build_book_response(book_id: int, raw_data: dict) -> BookResponseSchema:
    """Маппинг словаря данных в Pydantic схему ответа"""
    return BookResponseSchema(
        id=book_id,
        title=raw_data["title"],
        author=raw_data["author"],
        genre=raw_data["genre"],
        publication_year=raw_data["publication_year"],
        pages=raw_data["pages"],
        isbn=raw_data["isbn"],
        available=raw_data.get("available", True)
    )
