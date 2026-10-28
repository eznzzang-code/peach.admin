Add-Type -AssemblyName System.IO.Compression.FileSystem

$file = Get-ChildItem -Path . -Filter "*.pptx" | Select-Object -First 1
Write-Output "Found file: $($file.FullName)"
$zip = [System.IO.Compression.ZipFile]::OpenRead($file.FullName)

$slideEntries = $zip.Entries | Where-Object { $_.FullName -like "ppt/slides/slide*.xml" }
$slideEntries = $slideEntries | Sort-Object { [int]($_.Name -replace '\D') }

$result = [System.Text.StringBuilder]::new()

foreach ($entry in $slideEntries) {
    $stream = $entry.Open()
    $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::UTF8)
    $xmlContent = $reader.ReadToEnd()
    $reader.Close()
    $stream.Close()

    [xml]$xml = $xmlContent
    $ns = @{ a = "http://schemas.openxmlformats.org/drawingml/2006/main" }
    
    $nodes = Select-Xml -Xml $xml -XPath "//a:t" -Namespace $ns
    $texts = $nodes | ForEach-Object { $_.Node.InnerText.Trim() } | Where-Object { $_ -ne "" }
    
    $slideNum = $entry.Name -replace '\D'
    [void]$result.AppendLine("=== Slide $slideNum ===")
    foreach ($t in $texts) {
        [void]$result.AppendLine($t)
    }
    [void]$result.AppendLine("")
}

$zip.Dispose()

[System.IO.File]::WriteAllText("$PWD\pptx_slides_text.txt", $result.ToString(), [System.Text.Encoding]::UTF8)
Write-Output "Extracted $($slideEntries.Count) slides to pptx_slides_text.txt"
