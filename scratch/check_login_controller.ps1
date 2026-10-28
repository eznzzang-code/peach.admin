$path = "C:\Users\kimjs\.gemini\antigravity-ide\brain\ac73f95a-ac46-4a57-8a92-8e4a6d000e00\.system_generated\logs\transcript.jsonl"
Get-Content $path | Where-Object { $_ -match 'LoginController.java' } | ForEach-Object {
    Write-Output "=== LoginController ==="
    Write-Output $_
}
