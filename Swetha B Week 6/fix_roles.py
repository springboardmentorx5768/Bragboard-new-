import sqlite3

def fix_roles():
    conn = sqlite3.connect('backend/bragboard.db')
    cursor = conn.cursor()
    
    print("--- Current Roles ---")
    cursor.execute("SELECT DISTINCT role FROM users")
    roles = cursor.fetchall()
    print(roles)
    
    print("\n--- Fixing Roles ---")
    # Update any 'Employee', 'String', null, etc to 'employee'
    cursor.execute("UPDATE users SET role = 'employee' WHERE role IS NOT 'admin'")
    print(f"Updated {cursor.rowcount} rows to 'employee'.")
    
    conn.commit()
    
    print("\n--- New Roles ---")
    cursor.execute("SELECT DISTINCT role FROM users")
    print(cursor.fetchall())
    
    conn.close()

if __name__ == "__main__":
    fix_roles()
