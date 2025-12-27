import sqlite3

conn = sqlite3.connect('bragboard.db')
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
print('Tables:', [t[0] for t in tables])

for table_name in [t[0] for t in tables]:
    cursor.execute(f"PRAGMA table_info({table_name})")
    columns = cursor.fetchall()
    print(f"\n{table_name} columns:")
    for col in columns:
        print(f"  {col[1]} ({col[2]})")

conn.close()