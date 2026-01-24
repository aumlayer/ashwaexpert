FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src ./src
COPY alembic.ini .
COPY migrations ./migrations

EXPOSE 8000

CMD ["sh", "-c", "alembic -c alembic.ini upgrade head && python src/main.py"]
