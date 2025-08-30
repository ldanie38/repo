import os
import socket
import psycopg2

DB_NAME = os.getenv("POSTGRES_DB")
DB_USER = os.getenv("POSTGRES_USER")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD")

# Detect environment: inside Docker or on host
def running_in_docker():
    return os.path.exists("/.dockerenv") or socket.gethostname().startswith("docker")

if running_in_docker():
    DB_HOST = os.getenv("POSTGRES_HOST", "db")      # Docker service name
    DB_PORT = os.getenv("POSTGRES_PORT", "5432")    # internal Docker port
else:
    DB_HOST = os.getenv("POSTGRES_HOST", "localhost")
    DB_PORT = os.getenv("POSTGRES_PORT", "5433")    # host-mapped port

def get_connection():
    return psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT
    )



## This snippet pulls PostgreSQL connection settings from environment variables and defines a helper function, 
# get_connection(), that returns a live psycopg2 connection to your database.

## docker compose exec web psql -h db -U ctm_user -d ctm_db -p 5432 -c '\dt' 

## replace 5433 with 5432 to test the cloud when is setup