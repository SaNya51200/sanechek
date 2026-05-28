from fastapi import APIRouter, HTTPException, Depends, Query, status
from typing import List, Optional
from datetime import date, timedelta
from collections import Counter

from models import BookInputSchema, BookResponseSchema, BookUpdateSchema, BorrowBookRequest, BookDetailedSchema, Genre
from database import BOOKS_STORE, BORROWS_STORE, get_next_book_id, build_book_response

router = APIRouter()

@router.get("/books", response_model=List[BookResponseSchema])
async def get_all_books(
    genre: Optional[Genre] = Query(None, description="Фильтр по жанровому направлению"),
    author: Optional[str] = Query(None, description="Фильтр по имени автора (поиск подстроки)"),
    available_only: bool = Query(False, description="Выводить только свободные книги"),
    skip: int = Query(0, ge=0, description="Пагинация: смещение"),
    limit: int = Query(100, ge=1, le=1000, description="Пагинация: лимит")
):
    """
    Получение списка книг с применением фильтрации и пагинации.
    """
    matches = []
    
    for book_id, info in BOOKS_STORE.items():
        if genre and info["genre"] != genre:
            continue
        if author and author.lower() not in info["author"].lower():
            continue
        if available_only and not info.get("available", True):
            continue
            
        matches.append(build_book_response(book_id, info))
        
    return matches[skip : skip + limit]

@router.get("/books/{book_id}", response_model=BookDetailedSchema)
async def get_single_book(book_id: int):
    """
    Получение детальной информации по книге с историей аренды.
    """
    if book_id not in BOOKS_STORE:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Книга с указанным ID не найдена")
        
    data = BOOKS_STORE[book_id]
    response = BookDetailedSchema(
        id=book_id,
        title=data["title"],
        author=data["author"],
        genre=data["genre"],
        publication_year=data["publication_year"],
        pages=data["pages"],
        isbn=data["isbn"],
        available=data.get("available", True)
    )
    
    if not response.available and book_id in BORROWS_STORE:
        borrow = BORROWS_STORE[book_id]
        response.borrowed_by = borrow["borrower_name"]
        response.borrowed_date = borrow["borrowed_date"]
        response.return_date = borrow["return_date"]
        
    return response

@router.post("/books", response_model=BookResponseSchema, status_code=status.HTTP_201_CREATED)
async def create_book_record(book: BookInputSchema):
    """
    Добавление новой записи о книге в коллекцию. Проверяет уникальность ISBN.
    """
    for entry in BOOKS_STORE.values():
        if entry["isbn"] == book.isbn:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, 
                detail="Книга с аналогичным ISBN уже зарегистрирована"
            )
            
    new_id = get_next_book_id()
    BOOKS_STORE[new_id] = {
        "title": book.title,
        "author": book.author,
        "genre": book.genre,
        "publication_year": book.publication_year,
        "pages": book.pages,
        "isbn": book.isbn,
        "available": True
    }
    
    return build_book_response(new_id, BOOKS_STORE[new_id])

@router.put("/books/{book_id}", response_model=BookResponseSchema)
async def update_book_record(book_id: int, book_update: BookUpdateSchema):
    """
    Частичное или полное обновление данных книги по ID.
    """
    if book_id not in BOOKS_STORE:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Книга не найдена")
        
    current = BOOKS_STORE[book_id]
    updates = book_update.model_dump(exclude_unset=True)
    
    if "isbn" in updates and updates["isbn"] != current["isbn"]:
        for other_id, other_book in BOOKS_STORE.items():
            if other_id != book_id and other_book["isbn"] == updates["isbn"]:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="ISBN уже занят другой книгой"
                )
                
    current.update(updates)
    BOOKS_STORE[book_id] = current
    
    return build_book_response(book_id, BOOKS_STORE[book_id])

@router.delete("/books/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_book_record(book_id: int):
    """
    Удаление записи о книге из базы. Книги в аренде удалять нельзя.
    """
    if book_id not in BOOKS_STORE:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Книга не найдена")
        
    if not BOOKS_STORE[book_id].get("available", True):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Невозможно удалить книгу, находящуюся на руках у читателя"
        )
        
    del BOOKS_STORE[book_id]
    BORROWS_STORE.pop(book_id, None)
    return None

@router.post("/books/{book_id}/borrow", response_model=BookDetailedSchema)
async def borrow_book_record(book_id: int, req: BorrowBookRequest):
    """
    Регистрация выдачи книги читателю на определенный срок.
    """
    if book_id not in BOOKS_STORE:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Книга не найдена")
        
    if not BOOKS_STORE[book_id].get("available", True):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Книга уже выдана другому читателю"
        )
        
    BOOKS_STORE[book_id]["available"] = False
    
    today = date.today()
    expected_date = today + timedelta(days=req.return_days)
    
    BORROWS_STORE[book_id] = {
        "borrower_name": req.borrower_name,
        "borrowed_date": today,
        "return_date": expected_date
    }
    
    return await get_single_book(book_id)

@router.post("/books/{book_id}/return", response_model=BookResponseSchema)
async def return_book_record(book_id: int):
    """
    Регистрация возврата книги в библиотеку.
    """
    if book_id not in BOOKS_STORE:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Книга не найдена")
        
    if BOOKS_STORE[book_id].get("available", True):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Данная книга уже находится в библиотеке"
        )
        
    BOOKS_STORE[book_id]["available"] = True
    BORROWS_STORE.pop(book_id, None)
    
    return build_book_response(book_id, BOOKS_STORE[book_id])

@router.get("/stats")
async def get_library_stats():
    """
    Расчет и сбор статистики по текущему наполнению библиотеки.
    """
    total = len(BOOKS_STORE)
    avail = sum(1 for b in BOOKS_STORE.values() if b.get("available", True))
    borrowed = total - avail
    
    genres = Counter(b["genre"] for b in BOOKS_STORE.values())
    authors = Counter(b["author"] for b in BOOKS_STORE.values())
    top_author = authors.most_common(1)[0][0] if authors else None
    
    return {
        "total_books": total,
        "available_books": avail,
        "borrowed_books": borrowed,
        "books_by_genre": dict(genres),
        "most_prolific_author": top_author
    }
