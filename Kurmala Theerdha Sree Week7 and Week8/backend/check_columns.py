#!/usr/bin/env python3
"""Check report reason field type"""

from app.database import engine
from sqlalchemy import inspect

inspector = inspect(engine)
columns = inspector.get_columns('reports')
print('Reports table columns:')
for col in columns:
    col_name = col['name']
    col_type = col['type']
    col_nullable = col['nullable']
    print(f'  - {col_name}: {col_type} (nullable={col_nullable})')
