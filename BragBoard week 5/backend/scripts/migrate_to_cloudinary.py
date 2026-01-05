import sys
import os

# Add parent directory to path so we can import app modules
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy.orm import Session
from app import models, database
from app.utils import storage

def migrate_images():
    print("Starting migration to Cloudinary...")
    
    # Ensure we are in Cloudinary mode for upload, even if env var is not set explicitly to 'cloudinary'
    # we can force it or just rely on storage.get_storage_type() which checks for keys.
    # But usually we run this script with the intention to upload.
    # Let's check keys.
    if storage.get_storage_type() != "cloudinary":
        print("Error: Cloudinary credentials not found or STORAGE_TYPE is explicitly 'local'.")
        print("Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in your environment.")
        return

    db = database.SessionLocal()
    
    try:
        # Migrate User Profile Pictures
        users = db.query(models.User).filter(models.User.profile_picture != None).all()
        print(f"Checking {len(users)} users for local profile pictures...")
        
        for user in users:
            pic = user.profile_picture
            if pic and pic.startswith("/uploads/"):
                # It's a local path.
                # Convert to absolute file path.
                # stored as: /uploads/profile_pics/filename
                # we are in backend/scripts/..
                # backend/uploads/...
                
                # relative_path = pic.lstrip("/")
                # file_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", relative_path))
                
                # Simpler: The backend root is parent of scripts.
                # uploads is in backend root.
                
                relative_path = pic.lstrip("/") # uploads/profile_pics/...
                backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                file_path = os.path.join(backend_root, relative_path)
                
                if os.path.exists(file_path):
                    print(f"Uploading {file_path}...")
                    try:
                        new_url = storage.upload_local_file(file_path, folder="profile_pics")
                        if new_url and "http" in new_url:
                            user.profile_picture = new_url
                            print(f" -> Uploaded: {new_url}")
                        else:
                            print(" -> Upload returned non-http path, skipping DB update.")
                    except Exception as e:
                        print(f" -> Failed: {e}")
                else:
                    print(f" -> File not found: {file_path}")
        
        db.commit()
        
        # Migrate Shoutout Media
        media_items = db.query(models.ShoutOutMedia).all()
        print(f"Checking {len(media_items)} media items...")
        
        for item in media_items:
            path = item.file_path
            # Check if local. Shoutouts saved as "uploads/..." (no leading slash sometimes, or yes?)
            # In shoutouts.py before my change: file_path = f"uploads/{unique_filename}"
            # So likely "uploads/..." without leading slash.
            
            # Helper to check if it looks like a url
            if path and not path.startswith("http"):
                # It is local
                # normalize path to locate it
                
                # if starts with /, remove it for joining
                rel = path.lstrip("/")
                backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                file_path = os.path.join(backend_root, rel)
                
                if os.path.exists(file_path):
                    print(f"Uploading {file_path}...")
                    try:
                        new_url = storage.upload_local_file(file_path, folder="shoutouts")
                        item.file_path = new_url
                        print(f" -> Uploaded: {new_url}")
                    except Exception as e:
                        print(f" -> Failed: {e}")
                else:
                    print(f" -> File not found: {file_path}")

        db.commit()
        print("Migration complete.")
        
    finally:
        db.close()

if __name__ == "__main__":
    migrate_images()
