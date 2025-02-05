#!/usr/bin/env python3

import os
import sys
import sqlite3
import requests
import datetime
import json
from requests_toolbelt.multipart.encoder import MultipartEncoder
from bs4 import BeautifulSoup

# Configuration
SCAN_DIR = "./mobile_apps"
MOBSF_HOST = sys.argv[1]
MOBSF_API_KEY = sys.argv[2]
USERNAME = sys.argv[3]
PASSWORD = sys.argv[4]
DB_PATH = "mobsf_scans.db"
LOG_FILE = "mobsf_scans.log"
REPORTS_BASE_DIR = "./mobsf_reports"

def login_to_mobsf(host, username, password):
    session = requests.Session()
    
    # Get the login page to retrieve the CSRF token
    login_page = session.get(f"{host}/login/")
    soup = BeautifulSoup(login_page.content, 'html.parser')
    csrf_token = soup.find('input', {'name': 'csrfmiddlewaretoken'})['value']
    
    # Prepare login data
    login_data = {
        'username': username,
        'password': password,
        'csrfmiddlewaretoken': csrf_token
    }
    
    # Perform login
    login_response = session.post(f"{host}/login/", data=login_data, headers={
        'Referer': f"{host}/login/",
    })
    
    if login_response.url.endswith('/login/'):
        raise Exception("Login failed. Please check your credentials.")
    
    return session

def log(level, message):
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] [{level}] {message}", flush=True)
    with open(LOG_FILE, "a") as f:
        f.write(f"[{timestamp}] [{level}] {message}\n")

def create_batch():
    batch_date = datetime.datetime.now().strftime("%Y-%m")
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("INSERT INTO batches (batch_date) VALUES (?)", (batch_date,))
    batch_id = c.lastrowid
    conn.commit()
    conn.close()

    batch_dir = os.path.join(REPORTS_BASE_DIR, f"batch_{batch_id}")
    os.makedirs(os.path.join(batch_dir, "reports"), exist_ok=True)
    os.makedirs(os.path.join(batch_dir, "icons"), exist_ok=True)

    return batch_id, batch_dir

def db_execute(query, values):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    try:
        c.execute(query, values)
        conn.commit()
    except sqlite3.Error as e:
        log("ERROR", f"Database error: {e}")
        return False
    finally:
        conn.close()
    return True

def save_icon(session, scan_hash, app_name, batch_dir):
    log("DEBUG", f"Saving icon for app: {app_name}, scan hash: {scan_hash}, batch dir: {batch_dir}")
    
    # Use the complete URL path
    icon_url = f"{MOBSF_HOST}/download/{scan_hash}-icon.png"
    icon_filename = f"{app_name.replace(' ', '_')}_{scan_hash}_icon.png"
    icon_path = os.path.join(batch_dir, "icons", icon_filename)

    try:
        # Log the full request details for debugging
        log("DEBUG", f"Requesting icon from URL: {icon_url}")
        log("DEBUG", f"Session cookies: {dict(session.cookies)}")
        log("DEBUG", f"Session headers: {dict(session.headers)}")

        # Make sure authorization header is present
        if "Authorization" not in session.headers:
            session.headers.update({"Authorization": MOBSF_API_KEY})

        # Make the request with session
        response = session.get(
            icon_url,
            allow_redirects=True,
            timeout=30
        )

        # Log response details
        log("DEBUG", f"Response status code: {response.status_code}")
        log("DEBUG", f"Response headers: {dict(response.headers)}")
        
        if response.status_code == 404:
            log("WARNING", f"Icon not found for {app_name}")
            return ""
            
        response.raise_for_status()
        
        # Check if we actually got an image
        content_type = response.headers.get('content-type', '')
        if not content_type.startswith('image/'):
            log("WARNING", f"Unexpected content type received: {content_type}")
            return ""

        # Save the icon
        with open(icon_path, "wb") as f:
            f.write(response.content)
        
        log("INFO", f"Icon successfully saved to: {icon_path}")
        return icon_path

    except requests.exceptions.RequestException as e:
        log("ERROR", f"Failed to download icon for {app_name}: {str(e)}")
        if hasattr(e.response, 'content'):
            log("DEBUG", f"Error response content: {e.response.content}")
        return ""
    except IOError as e:
        log("ERROR", f"Failed to save icon for {app_name}: {str(e)}")
        return ""

def process_app(file, batch_id, batch_dir, session):
    log("INFO", f"Starting scan for {file}")

    try:
        log("DEBUG", f"Initial session cookies: {dict(session.cookies)}")
        log("DEBUG", f"Initial session headers: {dict(session.headers)}")

        # Upload file to MobSF
        log("DEBUG", f"Uploading file: {file}")
        log("DEBUG", f"Upload URL: {MOBSF_HOST}/api/v1/upload")

        # Construct the multipart form-data request using requests-toolbelt
        m = MultipartEncoder(
            fields={
                "file": (os.path.basename(file), open(file, "rb"), "application/octet-stream")
            }
        )

        session.headers.update({"Authorization": MOBSF_API_KEY})

        upload_resp = session.post(
            f"{MOBSF_HOST}/api/v1/upload",
            data=m,
            headers={
                "Content-Type": m.content_type,
            },
            timeout=60  # Increase timeout to account for larger file uploads
        )
        log("DEBUG", f"Upload response status code: {upload_resp.status_code}")
        log("DEBUG", f"Upload response headers: {dict(upload_resp.headers)}")
        log("DEBUG", f"Upload response cookies: {dict(upload_resp.cookies)}")
        log("DEBUG", f"Session cookies after upload: {dict(session.cookies)}")
        log("DEBUG", f"Upload response content: {upload_resp.content}")
        upload_resp.raise_for_status()
        scan_hash = upload_resp.json()["hash"]

        # Start scan
        log("DEBUG", f"Starting scan for hash: {scan_hash}")
        log("DEBUG", f"Scan URL: {MOBSF_HOST}/api/v1/scan")
        scan_resp = session.post(f"{MOBSF_HOST}/api/v1/scan", data={"hash": scan_hash})
        log("DEBUG", f"Scan response status code: {scan_resp.status_code}")
        log("DEBUG", f"Scan response headers: {dict(scan_resp.headers)}")
        log("DEBUG", f"Scan response cookies: {dict(scan_resp.cookies)}")
        log("DEBUG", f"Session cookies after scan: {dict(session.cookies)}")
        scan_resp.raise_for_status()

        # Get AppSec Scorecard
        log("DEBUG", f"Getting AppSec Scorecard for hash: {scan_hash}")
        log("DEBUG", f"Scorecard URL: {MOBSF_HOST}/api/v1/scorecard")
        scorecard_resp = session.post(f"{MOBSF_HOST}/api/v1/scorecard", data={"hash": scan_hash})
        log("DEBUG", f"Scorecard response status code: {scorecard_resp.status_code}")
        log("DEBUG", f"Scorecard response headers: {dict(scorecard_resp.headers)}")
        log("DEBUG", f"Scorecard response cookies: {dict(scorecard_resp.cookies)}")
        log("DEBUG", f"Session cookies after scorecard: {dict(session.cookies)}")
        scorecard_resp.raise_for_status()
        scorecard_data = scorecard_resp.json()

        # Extract needed information
        app_name = scorecard_data.get('app_name', 'Unknown')
        bundle_id = scorecard_data.get('file_name', 'Unknown')  # Assuming package_name is available in scorecard_data

        if file.endswith(".apk"):
            platform = "Android"
        elif file.endswith(".ipa"):
            platform = "iOS"
        else:
            platform = "Unknown"

        version = scorecard_data.get('version_name', 'Unknown')
        security_score = scorecard_data.get('security_score', 0)

        # Count findings by category
        high_findings = len(scorecard_data.get('high', []))
        warning_findings = len(scorecard_data.get('warning', []))
        info_findings = len(scorecard_data.get('info', []))
        secure_findings = len(scorecard_data.get('secure', []))

        # Save the icon
        icon_path = save_icon(session, scan_hash, app_name, batch_dir)

        # Generate PDF report
        pdf_filename = f"{app_name.replace(' ', '_')}_{scan_hash}.pdf"
        pdf_path = os.path.join(batch_dir, "reports", pdf_filename)
        log("DEBUG", f"Downloading PDF report for hash: {scan_hash}")
        log("DEBUG", f"PDF report URL: {MOBSF_HOST}/api/v1/download_pdf")
        pdf_resp = session.post(f"{MOBSF_HOST}/api/v1/download_pdf", data={"hash": scan_hash})
        log("DEBUG", f"PDF report response status code: {pdf_resp.status_code}")
        log("DEBUG", f"PDF report response headers: {dict(pdf_resp.headers)}")
        log("DEBUG", f"PDF report response cookies: {dict(pdf_resp.cookies)}")
        log("DEBUG", f"Session cookies after PDF download: {dict(session.cookies)}")
        pdf_resp.raise_for_status()
        with open(pdf_path, "wb") as f:
            f.write(pdf_resp.content)

        # Store in SQLite database
        insert_query = """
        INSERT INTO scans (
            batch_id, app_name, bundle_id, version, platform,
            security_score, high_findings, warning_findings,
            info_findings, secure_findings, icon_path, pdf_path
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        values = (
            batch_id, app_name, bundle_id, version, platform,
            security_score, high_findings, warning_findings,
            info_findings, secure_findings, icon_path, pdf_path
        )
        if not db_execute(insert_query, values):
            return False

        log("INFO", f"Scan completed successfully for {file}")
        return True
    except requests.exceptions.RequestException as e:
        log("ERROR", f"Failed to process {file}: {e}")
        if hasattr(e, 'response'):
            log("DEBUG", f"Error response content: {e.response.content}")
            log("DEBUG", f"Error response headers: {dict(e.response.headers)}")
            log("DEBUG", f"Error response cookies: {dict(e.response.cookies)}")
        return False
    except sqlite3.Error as e:
        log("ERROR", f"Database error while processing {file}: {e}")
        return False
    except Exception as e:
        log("ERROR", f"Unexpected error while processing {file}: {e}")
        return False

def main():
    try:
        log("INFO", "Starting scan process")

        # Check prerequisites
        if len(sys.argv) != 5:
            log("ERROR", "Usage: python script.py <MOBSF_HOST> <MOBSF_API_KEY>")
            sys.exit(1)

        if not os.path.exists(DB_PATH):
            log("ERROR", f"Database file not found: {DB_PATH}")
            sys.exit(1)

        # Login to MobSF
        try:
            session = login_to_mobsf(MOBSF_HOST, USERNAME, PASSWORD)
            log("INFO", "Successfully logged in to MobSF")
        except Exception as e:
            log("ERROR", f"Failed to log in to MobSF: {e}")
            sys.exit(1)

        # Create new batch and get batch info
        batch_id, batch_dir = create_batch()
        log("INFO", f"Created new batch with ID: {batch_id}")

        # Process files
        scan_count = 0
        error_count = 0
        for file in os.listdir(SCAN_DIR):
            if file.endswith(".ipa") or file.endswith(".apk"):
                if process_app(os.path.join(SCAN_DIR, file), batch_id, batch_dir, session):  # Pass session here
                    scan_count += 1
                else:
                    error_count += 1

        log("INFO", f"Scan process complete. Successful: {scan_count}, Failed: {error_count}")

        # Exit with error if no apps were successfully scanned
        if scan_count == 0:
            log("ERROR", "No apps were successfully scanned")
            sys.exit(4)
        
        # Exit with error if there were any failed scans
        if error_count > 0:
            log("WARNING", f"{error_count} apps failed to scan")
            sys.exit(5)

        # Everything completed successfully
        sys.exit(0)

    except Exception as e:
        log("ERROR", f"Unexpected error in main: {e}")
        sys.exit(6)

if __name__ == "__main__":
    main()
