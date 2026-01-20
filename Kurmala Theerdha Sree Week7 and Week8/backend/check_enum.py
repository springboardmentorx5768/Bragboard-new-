#!/usr/bin/env python3
"""Check PostgreSQL enum values for report reason"""

from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    # Check the enum type definition
    query = """
    SELECT enumlabel
    FROM pg_enum
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'reportreason')
    ORDER BY enumsortorder
    """
    result = conn.execute(text(query))
    
    enum_values = [row[0] for row in result.fetchall()]
    print('Valid report reason enum values:')
    for val in enum_values:
        print(f'  - {val}')
