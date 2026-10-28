$connStr = "Server=121.78.131.15;Database=peach;User Id=peach;Password=qhrtnddk2024!@;TrustServerCertificate=True;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()

Write-Host "=== Check BOARD Records ==="
$cmd = $conn.CreateCommand()
$cmd.CommandText = "SELECT content_id, category, title, is_draft, post_status, created_at FROM tbl_board ORDER BY content_id DESC"
$reader = $cmd.ExecuteReader()
while ($reader.Read()) {
    $cid = $reader["content_id"]
    $cat = $reader["category"]
    $title = $reader["title"]
    $draft = $reader["is_draft"]
    $st = $reader["post_status"]
    Write-Host "$cid | $cat | $title | is_draft:$draft | status:$st"
}
$reader.Close()

Write-Host "=== Test USP_ADMIN_BOARD_DRAFT_COUNT ==="
$cmd2 = $conn.CreateCommand()
$cmd2.CommandType = [System.Data.CommandType]::StoredProcedure
$cmd2.CommandText = "USP_ADMIN_BOARD_DRAFT_COUNT"
$cmd2.Parameters.AddWithValue("@p_category", "공지") | Out-Null
$res = $cmd2.ExecuteScalar()
Write-Host "Count for 공지: $res"

$cmd3 = $conn.CreateCommand()
$cmd3.CommandType = [System.Data.CommandType]::StoredProcedure
$cmd3.CommandText = "USP_ADMIN_BOARD_DRAFT_COUNT"
$cmd3.Parameters.AddWithValue("@p_category", "공지사항") | Out-Null
$res3 = $cmd3.ExecuteScalar()
Write-Host "Count for 공지사항: $res3"

$cmd4 = $conn.CreateCommand()
$cmd4.CommandType = [System.Data.CommandType]::StoredProcedure
$cmd4.CommandText = "USP_ADMIN_BOARD_DRAFT_COUNT"
$cmd4.Parameters.AddWithValue("@p_category", [System.DBNull]::Value) | Out-Null
$res4 = $cmd4.ExecuteScalar()
Write-Host "Count for NULL: $res4"

$conn.Close()
