FROM python:3.12-slim AS builder

WORKDIR /app
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

FROM python:3.12-slim

ENV PATH=/root/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1
WORKDIR /app

COPY --from=builder /root/.local /root/.local
COPY . .

EXPOSE 8080
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"]
