# scripts/db_test.py
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def main():
    host = os.getenv("POSTGRES_HOST", "db")
    port = os.getenv("POSTGRES_PORT", "5432")
    try:
        conn = psycopg2.connect(
            dbname=os.getenv("POSTGRES_DB"),
            user=os.getenv("POSTGRES_USER"),
            password=os.getenv("POSTGRES_PASSWORD"),
            host=host,
            port=port,
            connect_timeout=3
        )
        conn.close()
        print(f"✅ Connected to Postgres at {host}:{port}")
    except Exception as e:
        print(f"❌ Could not connect to Postgres — {e}")
        exit(1)

if __name__ == "__main__":
    main()

## a quick way to confirm that the credentials in your .env actually work and that the database is reachable.