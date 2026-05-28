from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
from datetime import date

class Genre(str, Enum):
    FICTION = "fiction"
    NON_FICTION = "non-fiction"
    SCIENCE = "science"
    FANTASY = "fantasy"
    MYSTERY = "mystery"
    BIOGRAPHY = "biography"
    ADVENTURE = "adventure"

class BookInputSchema(BaseModel):
    title: str = Field(..., min_length=1, max_length=200, description="Название произведения")
    author: str = Field(..., min_length=1, max_length=100, description="ФИО автора")
    genre: Genre = Field(..., description="Жанровое направление")
    publication_year: int = Field(..., ge=1000, le=date.today().year, description="Год издания")
    pages: int = Field(..., gt=0, description="Объем страниц")
    isbn: str = Field(..., pattern=r'^\d{13}$', description="13-значный код ISBN")
    
    class Config:
        json_schema_extra = {
            "example": {
                "title": "Мастер и Маргарита",
                "author": "Михаил Булгаков",
                "genre": "fantasy",
                "publication_year": 1967,
                "pages": 480,
                "isbn": "9785170878426"
            }
        }

class BookUpdateSchema(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    author: Optional[str] = Field(None, min_length=1, max_length=100)
    genre: Optional[Genre] = None
    publication_year: Optional[int] = Field(None, ge=1000, le=date.today().year)
    pages: Optional[int] = Field(None, gt=0)
    isbn: Optional[str] = Field(None, pattern=r'^\d{13}$')

class BookResponseSchema(BookInputSchema):
    id: int
    available: bool = True
    
    class Config:
        from_attributes = True

class BookDetailedSchema(BookResponseSchema):
    borrowed_by: Optional[str] = None
    borrowed_date: Optional[date] = None
    return_date: Optional[date] = None

class BorrowBookRequest(BaseModel):
    borrower_name: str = Field(..., min_length=1, max_length=100, description="Имя читателя")
    return_days: int = Field(7, ge=1, le=30, description="Срок аренды в днях")
