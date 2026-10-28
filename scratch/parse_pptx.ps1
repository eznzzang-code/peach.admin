Add-Type -AssemblyName System.IO.Compression.FileSystem

$file = Get-Item "C:\Workspace\peach.admin\*20261026.pptx"
Write-Host "Found file: $($file.FullName)"

$zip = [System.IO.Compression.ZipFile]::OpenRead($file.FullName)

foreach ($entry in $zip.Entries) {
    if ($entry.FullName -like "ppt/slides/slide*.xml") {
        $stream = $entry.Open()
        $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::UTF8)
        $text = $reader.ReadToEnd()
        $reader.Close()
        $stream.Close()

        $matches = [regex]::Matches($text, '<a:t>(.*?)</a:t>')
        $slideText = ($matches | ForEach-Object { $_.Groups[1].Value }) -join " "

        if ($slideText -match "과원" -or $slideText -match "재배" -or $slideText -match "월별") {
            Write-Host "=== $($entry.FullName) ==="
            Write-Host $slideText
            Write-Host "----------------------------------------"
        }
    }
}

$zip.Dispose()
