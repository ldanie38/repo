import json5
import json
import psycopg2
from pathlib import Path


# --- Mapping from JSON keys to Postgres column names ---
GLOBAL_KEY_MAP = {
    "_id": "id",
    "userId": "user_id",
    "imageId": "image_id",
    "segmentId": "segment_id",
    "messageGroupId": "message_group_id"
}

# --- Connect to Postgres (update creds/port if needed) ---
conn = psycopg2.connect(
    dbname="imported_db",
    user="ctm_user",
    password="replace_with_strong_password",  # from your .env
    host="localhost",
    port=5433
)
cur = conn.cursor()

# --- Path to your seed data files ---
schema_path = Path("/Users/luadaniele/Downloads/db/schema")

for path in schema_path.glob("*.jsonc"):
    if path.stat().st_size == 0:
        print(f"Skipping {path.stem} — file is empty")
        continue

    table = path.stem
    print(f"\n=== Loading {table} ===")

    # Get actual columns + types from Postgres
    cur.execute("""
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = %s
    """, (table,))
    col_info = {name: (dtype, nullable) for name, dtype, nullable in cur.fetchall()}

    with open(path) as f:
        data = json5.load(f)

    if not data:
        print(f"Skipping {table} — no records found")
        continue
    if isinstance(data, dict):
        data = [data]

    cleaned = []
    for row in data:
        # Rename keys
        mapped = {GLOBAL_KEY_MAP.get(k, k): v for k, v in row.items()}

        # Drop/auto-null invalid ints
        if "id" in mapped and col_info.get("id", (None,))[0] == "integer":
            try:
                mapped["id"] = int(mapped["id"])
            except (ValueError, TypeError):
                mapped.pop("id", None)

        # Keep only columns that exist in the table
        filtered = {k: v for k, v in mapped.items() if k in col_info}
        cleaned.append(filtered)

    if not cleaned:
        print(f"Skipping {table} — nothing matched actual columns")
        continue

    cols = list
    

