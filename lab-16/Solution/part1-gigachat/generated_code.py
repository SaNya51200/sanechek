"""Functions generated with GigaChat and corrected after verification."""


def is_prime(n: int) -> bool:
    """Return True when n is a prime number."""
    if n < 2:
        return False
    if n == 2:
        return True
    if n % 2 == 0:
        return False
    for divisor in range(3, int(n**0.5) + 1, 2):
        if n % divisor == 0:
            return False
    return True


def fibonacci(n: int) -> list[int]:
    """Return the first n Fibonacci numbers."""
    if n <= 0:
        return []
    sequence = [0, 1]
    while len(sequence) < n:
        sequence.append(sequence[-1] + sequence[-2])
    return sequence[:n]


def normalize_phone(phone: str) -> str:
    """Normalize a Russian phone number to +7XXXXXXXXXX."""
    digits = "".join(char for char in phone if char.isdigit())
    if len(digits) == 11 and digits[0] in {"7", "8"}:
        digits = digits[1:]
    if len(digits) != 10:
        raise ValueError("phone must contain 10 local digits or 11 digits with 7/8 prefix")
    return f"+7{digits}"

