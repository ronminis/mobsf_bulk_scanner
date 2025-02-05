import sqlite3
import random
import argparse
from datetime import datetime, timedelta

# App pool based on the provided data
APP_POOL = [
    ("Portal To Go", "com.webtech.mobileportal.apk", "5.5.10", "Android", 44, 5, 12, 2, 2, "./mobsf_reports/batch_2/icons/Portal_To_Go_022e9873db6afca2ca03a1a5ce4beeb2_icon.png", "./mobsf_reports/batch_2/reports/Portal_To_Go_022e9873db6afca2ca03a1a5ce4beeb2.pdf"),
    ("מסחר בשוק ההון", "10.2.ipa", "10.2", "iOS", 53, 1, 4, 4, 1, "./mobsf_reports/batch_2/icons/מסחר_בשוק_ההון_0b0e9a53c49e6f108bb40eb449421668_icon.png", "./mobsf_reports/batch_2/reports/מסחר_בשוק_ההון_0b0e9a53c49e6f108bb40eb449421668.pdf"),
    ("Open", "Open_3.3.0.ipa", "3.3.0", "iOS", 52, 1, 8, 3, 1, "./mobsf_reports/batch_2/icons/Open_f6a65cc53d696c999e14e7edd7bffb82_icon.png", "./mobsf_reports/batch_2/reports/Open_f6a65cc53d696c999e14e7edd7bffb82.pdf"),
    ("מסחר בשוק ההון", "com.ideomobile.hmarket.apk", "10.1", "Android", 43, 8, 20, 3, 3, "./mobsf_reports/batch_2/icons/מסחר_בשוק_ההון_ccf764f08aebd2a5748c6eef9153aa3a_icon.png", "./mobsf_reports/batch_2/reports/מסחר_בשוק_ההון_ccf764f08aebd2a5748c6eef9153aa3a.pdf"),
    ("bit", "com.bnhp.payments.paymentsapp.apk", "6.1", "Android", 52, 4, 25, 2, 4, "", "./mobsf_reports/batch_2/reports/bit_a001d8fff11146500c50e40d1b5f6dcd.pdf"),
    ("פועלים open", "com.bnhp.openapp.apk", "3.3.0", "Android", 48, 5, 15, 2, 3, "./mobsf_reports/batch_2/icons/פועלים_open_030337d8cb20cc8e6039eaf12b0e1a4f_icon.png", "./mobsf_reports/batch_2/reports/פועלים_open_030337d8cb20cc8e6039eaf12b0e1a4f.pdf"),
    ("Poalim Wonder", "com.hapoalim.loyalty.apk", "1.8.7", "Android", 52, 3, 18, 3, 3, "./mobsf_reports/batch_2/icons/Poalim_Wonder_11189e5ab7b22b2cf823af1b04dcfd75_icon.png", "./mobsf_reports/batch_2/reports/Poalim_Wonder_11189e5ab7b22b2cf823af1b04dcfd75.pdf"),
    ("MobilePortalBurger", "Portal_To_Go_6.9.2.ipa", "6.9.2", "iOS", 54, 1, 3, 2, 1, "./mobsf_reports/batch_2/icons/MobilePortalBurger_7605a3da8b22a562e3d3e74984090397_icon.png", "./mobsf_reports/batch_2/reports/MobilePortalBurger_7605a3da8b22a562e3d3e74984090397.pdf"),
    ("BHI Connect", "com.mfoundry.mb.android.mb_beb101266.apk", "6.0.0.3808", "Android", 52, 2, 14, 2, 2, "./mobsf_reports/batch_2/icons/BHI_Connect_60eb2f5bda987f4e5217a59b0d8ac58c_icon.png", "./mobsf_reports/batch_2/reports/BHI_Connect_60eb2f5bda987f4e5217a59b0d8ac58c.pdf"),
    ("פועלים PASS", "PASS_1.5.0.ipa", "1.5.0", "iOS", 53, 1, 4, 5, 1, "./mobsf_reports/batch_2/icons/פועלים_PASS_25659cd187bf47b18a602da069e1e8d3_icon.png", "./mobsf_reports/batch_2/reports/פועלים_PASS_25659cd187bf47b18a602da069e1e8d3.pdf")
]

def create_dummy_data(db_path, num_batches=5, scans_per_batch=5):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    current_date = datetime.now()

    for i in range(num_batches):
        batch_date = current_date - timedelta(days=i)
        cursor.execute("INSERT INTO batches (batch_date, created_at) VALUES (?, ?)",
                       (batch_date.strftime("%Y-%m"), batch_date.strftime("%Y-%m-%d %H:%M:%S")))
        new_batch_id = cursor.lastrowid

        # Create a copy of APP_POOL for this batch
        available_apps = APP_POOL.copy()
        
        for _ in range(min(scans_per_batch, len(available_apps))):
            app = random.choice(available_apps)
            available_apps.remove(app)  # Remove the app from available apps for this batch
            
            security_score = max(0, min(100, app[4] + random.randint(-5, 5)))
            high_findings = max(0, app[5] + random.randint(-2, 2))
            warning_findings = max(0, app[6] + random.randint(-3, 3))
            info_findings = max(0, app[7] + random.randint(-1, 1))
            secure_findings = max(0, app[8] + random.randint(-1, 1))

            cursor.execute("""
                INSERT INTO scans (batch_id, scan_date, app_name, bundle_id, version, platform,
                                   security_score, high_findings, warning_findings, info_findings,
                                   secure_findings, icon_path, pdf_path, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (new_batch_id, batch_date.strftime("%Y-%m-%d %H:%M:%S"), app[0], app[1], app[2], app[3],
                  security_score, high_findings, warning_findings, info_findings, secure_findings,
                  app[9], app[10], batch_date.strftime("%Y-%m-%d %H:%M:%S")))

    conn.commit()
    conn.close()

    print(f"Added {num_batches} new batches with up to {scans_per_batch} unique scans each.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate dummy data for MobSF database")
    parser.add_argument("db_path", help="Path to the SQLite database")
    parser.add_argument("--batches", type=int, default=5, help="Number of batches to create (default: 5)")
    parser.add_argument("--scans", type=int, default=8, help="Maximum number of scans per batch (default: 8)")
    
    args = parser.parse_args()

    create_dummy_data(args.db_path, args.batches, args.scans)
