$connStr = "Server=121.78.131.15;Database=peach;User Id=peach;Password=qhrtnddk2024!@;TrustServerCertificate=True;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()

Write-Host "=== Check TBL_BOARD_CONTENT Records ==="
$cmd = $conn.CreateCommand()
$cmd.CommandText = "SELECT content_id, category, title, is_draft, is_deleted, post_status, created_at FROM dbo.TBL_BOARD_CONTENT ORDER BY content_id DESC"
$reader = $cmd.ExecuteReader()
while ($reader.Read()) {
    $cid = $reader["content_id"]
    $cat = $reader["category"]
    $title = $reader["title"]
    $draft = $reader["is_draft"]
    $del = $reader["is_deleted"]
    $st = $reader["post_status"]
    Write-Host "$cid | $cat | $title | is_draft:$draft | is_deleted:$del | status:$st"
}
$reader.Close()

$conn.Close()
