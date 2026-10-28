$path = "C:\Users\kimjs\.gemini\antigravity-ide\brain\ac73f95a-ac46-4a57-8a92-8e4a6d000e00\.system_generated\logs\transcript.jsonl"
Get-Content $path | Where-Object { $_ -match 'SmsRestController' -and ($_ -match '@PostMapping' -or $_ -match '@GetMapping' -or $_ -match '@RequestMapping') } | ForEach-Object {
    Write-Output "=== SMS MAPPINGS ==="
    Write-Output $_
}
