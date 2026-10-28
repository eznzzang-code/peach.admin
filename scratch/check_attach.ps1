$connStr = "Server=121.78.131.15;Database=peach;User Id=peach;Password=qhrtnddk2024!@;TrustServerCertificate=True;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()

Write-Host "=== TBL_BOARD_ATTACH Records ==="
$cmd = $conn.CreateCommand()
$cmd.CommandText = "SELECT * FROM dbo.TBL_BOARD_ATTACH ORDER BY attach_id DESC"
$reader = $cmd.ExecuteReader()
while ($reader.Read()) {
    $aid = $reader["attach_id"]
    $cid = $reader["content_id"]
    $orig = $reader["original_name"]
    $path = $reader["file_path"]
    Write-Host "AttachID: $aid | ContentID: $cid | Orig: $orig | Path: $path"
}
$reader.Close()
$conn.Close()

Write-Host "`n=== Files in uploads/board ==="
if (Test-Path "c:\Workspace\peach.admin\uploads\board") {
    Get-ChildItem "c:\Workspace\peach.admin\uploads\board" | ForEach-Object {
        Write-Host "$($_.Name) ($($_.Length) bytes) - Created: $($_.CreationTime)"
    }
} else {
    Write-Host "Directory uploads/board does not exist"
}
