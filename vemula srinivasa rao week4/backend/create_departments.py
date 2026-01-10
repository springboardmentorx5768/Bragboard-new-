# create_departments.py
import requests

departments = [
    {"name": "Engineering", "description": "Software development team"},
    {"name": "Marketing", "description": "Marketing and sales team"},
    {"name": "HR", "description": "Human resources team"},
    {"name": "Finance", "description": "Finance and accounting team"}
]

for dept in departments:
    response = requests.post("http://localhost:8000/api/departments", json=dept)
    print(f"Created: {dept['name']}")