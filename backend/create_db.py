import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Define connection parameters
user = "postgres"
password = "shruti098"
host = "localhost"
port = "5432"
dbname = "bragboard"

def create_database():
    try:
        # Connect to the default 'postgres' database
        con = psycopg2.connect(dbname='postgres', user=user, host=host, password=password, port=port)
        con.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        
        cur = con.cursor()
        
        # Check if database exists
        cur.execute(f"SELECT 1 FROM pg_catalog.pg_database WHERE datname = '{dbname}'")
        exists = cur.fetchone()
        
        if not exists:
            print(f"Creating database {dbname}...")
            cur.execute(f"CREATE DATABASE {dbname}")
            print(f"Database {dbname} created successfully.")
        else:
            print(f"Database {dbname} already exists.")
            
        cur.close()
        con.close()
        
    except Exception as e:
        print(f"Error creating database: {e}")

if __name__ == "__main__":
    create_database()
