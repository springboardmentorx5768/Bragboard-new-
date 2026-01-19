# Create test_import.py
@'
# test_import.py
import sys
print("Python path:", sys.path)
print("\nTrying to import Base...")
try:
    from database import Base
    print("✅ SUCCESS: Base imported from database")
except ImportError as e:
    print(f"❌ ERROR importing Base: {e}")

print("\nTrying to import from models...")
try:
    from models import User
    print("✅ SUCCESS: User imported from models")
except ImportError as e:
    print(f"❌ ERROR importing User: {e}")
'@ | Out-File test_import.py -Encoding UTF8
