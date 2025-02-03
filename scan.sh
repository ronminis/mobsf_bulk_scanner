#!/bin/bash

# Configuration
SCAN_DIR="./mobile_apps"
MOBSF_HOST="$1"
MOBSF_API_KEY="$2"
DB_PATH="mobsf_scans.db"
LOG_FILE="mobsf_scans.log"
REPORTS_BASE_DIR="./mobsf_reports"

# Logging function
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

# Create batch and its directories
create_batch() {
    local batch_date=$(date '+%Y-%m')
    local query="INSERT INTO batches (batch_date) VALUES ('$batch_date') RETURNING id;"
    local batch_id=$(sqlite3 "$DB_PATH" "$query")
    
    # Create batch-specific directories
    local batch_dir="$REPORTS_BASE_DIR/batch_${batch_id}"
    mkdir -p "$batch_dir/reports"
    mkdir -p "$batch_dir/icons"
    
    echo "$batch_id:$batch_dir"
}

# Database error handling function
db_execute() {
    local query="$1"
    local error_output
    
    error_output=$(sqlite3 "$DB_PATH" "$query" 2>&1)
    if [ $? -ne 0 ]; then
        log "ERROR" "Database error: $error_output"
        return 1
    fi
    return 0
}

# Check prerequisites
check_prerequisites() {
    if ! command -v sqlite3 >/dev/null 2>&1; then
        log "ERROR" "sqlite3 is not installed"
        exit 1
    fi
    
    if ! command -v jq >/dev/null 2>&1; then
        log "ERROR" "jq is not installed"
        exit 1
    fi
    
    if [ ! -f "$DB_PATH" ]; then
        log "ERROR" "Database file not found: $DB_PATH"
        exit 1
    fi

    # Create base directory
    mkdir -p "$REPORTS_BASE_DIR"
}

# Save icon from MobSF
save_icon() {
    local scan_hash="$1"
    local app_name="$2"
    local batch_dir="$3"
    
    local icon_url="/${scan_hash}-icon.png"
    local icon_filename="${app_name// /_}_${scan_hash}_icon.png"
    local icon_path="$batch_dir/icons/$icon_filename"

    if curl -s -o "$icon_path" "$MOBSF_HOST$icon_url"; then
        echo "$icon_path"
    else
        log "ERROR" "Failed to download icon for $app_name"
        echo ""
    fi
}

# Process single app
process_app() {
    local file="$1"
    local batch_info="$2"
    local batch_id="${batch_info%%:*}"
    local batch_dir="${batch_info#*:}"
    
    log "INFO" "Starting scan for $file"
    
    # Upload file to MobSF
    local upload_resp
    upload_resp=$(curl -s -X POST -H "Authorization: $MOBSF_API_KEY" -F "file=@$file" "$MOBSF_HOST/api/v1/upload")
    if [ $? -ne 0 ]; then
        log "ERROR" "Failed to upload file: $file"
        return 1
    fi
    
    local scan_hash
    scan_hash=$(echo "$upload_resp" | jq -r '.hash')
    
    if [ -n "$scan_hash" ]; then
        log "INFO" "File uploaded successfully. Hash: $scan_hash"
        
        # Start scan
        local scan_resp
        scan_resp=$(curl -s -X POST -H "Authorization: $MOBSF_API_KEY" -d "hash=$scan_hash" "$MOBSF_HOST/api/v1/scan")
        
        # Get JSON report
        local json_report
        json_report=$(curl -s -X POST -H "Authorization: $MOBSF_API_KEY" -d "hash=$scan_hash" "$MOBSF_HOST/api/v1/report_json")
        
        # Extract needed information
        local app_name=$(echo "$json_report" | jq -r '.app_name')
        local bundle_id=$(echo "$json_report" | jq -r '.package_name')
        local version=$(echo "$json_report" | jq -r '.version_name')
        local platform=$(echo "$json_report" | jq -r '.platform')
        local security_score=$(echo "$json_report" | jq -r '.average_cvss')
        local high_findings=$(echo "$json_report" | jq -r '.security_issues.high // 0')
        local warning_findings=$(echo "$json_report" | jq -r '.security_issues.warning // 0')
        local info_findings=$(echo "$json_report" | jq -r '.security_issues.info // 0')
        local secure_findings=$(echo "$json_report" | jq -r '.security_issues.secure // 0')
        
        # Save icon
        local icon_path=$(save_icon "$scan_hash" "$app_name" "$batch_dir")
        
        # Generate PDF report
        local pdf_filename="${app_name// /_}_${scan_hash}.pdf"
        local pdf_path="$batch_dir/reports/$pdf_filename"
        curl -s -X POST -H "Authorization: $MOBSF_API_KEY" -d "hash=$scan_hash" -o "$pdf_path" "$MOBSF_HOST/api/v1/download_pdf"
        
        # Store in SQLite database
        local insert_query="INSERT INTO scans (
            batch_id, app_name, bundle_id, version, platform, 
            security_score, high_findings, warning_findings, 
            info_findings, secure_findings, icon_path, pdf_path
        ) VALUES (
            $batch_id, 
            '$(echo "$app_name" | sed "s/'/''/g")', 
            '$(echo "$bundle_id" | sed "s/'/''/g")', 
            '$(echo "$version" | sed "s/'/''/g")', 
            '$platform',
            $security_score, 
            $high_findings, 
            $warning_findings,
            $info_findings, 
            $secure_findings, 
            '$(echo "$icon_path" | sed "s/'/''/g")', 
            '$(echo "$pdf_path" | sed "s/'/''/g")'
        );"
        
        if ! db_execute "$insert_query"; then
            log "ERROR" "Failed to store scan results in database"
            return 1
        fi
        
        log "INFO" "Scan completed successfully for $file"
        return 0
    else
        log "ERROR" "Failed to get scan hash for $file"
        return 1
    fi
}

# Main execution
main() {
    log "INFO" "Starting scan process"
    check_prerequisites
    
    # Create new batch and get batch info
    local batch_info=$(create_batch)
    log "INFO" "Created new batch with ID: ${batch_info%%:*}"
    
    # Process files
    local scan_count=0
    local error_count=0
    
    for file in "$SCAN_DIR"/*.{ipa,apk}; do
        [ -e "$file" ] || continue
        
        if process_app "$file" "$batch_info"; then
            ((scan_count++))
        else
            ((error_count++))
        fi
    done
    
    log "INFO" "Scan process complete. Successful: $scan_count, Failed: $error_count"
}

# Run main function
main "$@"
