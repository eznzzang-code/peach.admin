$files = Get-ChildItem -Path "js" -Recurse -Filter "*.js"

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    
    # Replace .html links with .asp (excluding external or app preview links)
    $patterns = @(
        'contents-create\.html',
        'contents-list\.html',
        'contents-edit\.html',
        'orchard-content\.html',
        'monthly-content-form\.html',
        'cultivation-content\.html',
        'videos-list\.html',
        'videos-detail\.html',
        'permissions\.html',
        'permissions-edit\.html',
        'home-content-preview\.html'
    )
    
    $changed = $false
    foreach ($p in $patterns) {
        $dest = $p -replace '\\\.html', '.asp'
        if ($content -match $p) {
            $content = $content -replace $p, $dest
            $changed = $true
        }
    }
    
    if ($changed) {
        [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
        Write-Output "Updated: $($file.Name)"
    }
}
