#!/bin/bash
SCAN_DIR="./mobile_apps"
MOBSF_HOST="$1"
MOBSF_API_KEY="$2"
mkdir -p "./mobsf_reports"

for file in "$SCAN_DIR"/*.{ipa,apk}; do
    [ -e "$file" ] || continue
    echo "Scanning $file"

    upload_resp=$(curl -X POST -H "Authorization: $MOBSF_API_KEY" -F "file=@$file" "$MOBSF_HOST/api/v1/upload")
    scan_hash=$(echo "$upload_resp" | jq -r '.hash')

    if [ -n "$scan_hash" ]; then
        curl -X POST -H "Authorization: $MOBSF_API_KEY" -d "hash=$scan_hash" "$MOBSF_HOST/api/v1/scan"

        scan_status=""
        while [ "$scan_status" != "Saving to Database" ]; do
            sleep 5
            scan_logs=$(curl -X POST -H "Authorization: $MOBSF_API_KEY" -d "hash=$scan_hash" "$MOBSF_HOST/api/v1/scan_logs")
            scan_status=$(echo "$scan_logs" | jq -r '.logs[-1].status')
        done

        curl -X POST -H "Authorization: $MOBSF_API_KEY" -d "hash=$scan_hash" "$MOBSF_HOST/api/v1/download_pdf" -o "./mobsf_reports/$(basename "$file")_report.pdf"
        echo "Scan completed for $file"
    else
        echo "Failed to upload $file"
    fi

    sleep 5
done

echo "Bulk scanning complete."
