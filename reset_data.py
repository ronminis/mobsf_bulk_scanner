import os
import sqlite3
import shutil

# Configuration
DB_PATH = "mobsf_scans.db"
REPORTS_BASE_DIR = "mobsf_reports"

def clear_database():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Clear all tables
    cursor.execute("DELETE FROM scans")
    cursor.execute("DELETE FROM batches")
    
    conn.commit()
    conn.close()
    print("Database cleared.")

def remove_batch_folders():
    for item in os.listdir(REPORTS_BASE_DIR):
        item_path = os.path.join(REPORTS_BASE_DIR, item)
        if os.path.isdir(item_path) and item.startswith("batch_"):
            shutil.rmtree(item_path)
            print(f"Removed folder: {item}")

def main():
    print("Warning: This script will clear all data from the database and remove all batch folders.")
    confirmation = input("Are you sure you want to proceed? (yes/no): ")
    
    if confirmation.lower() != "yes":
        print("Operation cancelled.")
        return
    
    clear_database()
    remove_batch_folders()
    print("Clean-up completed successfully.")

if __name__ == "__main__":
    main()
