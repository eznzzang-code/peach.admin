$connStr = "Server=121.78.131.15;Database=peach;Uid=peach;Pwd=qhrtnddk2024!@;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()

Write-Output "=== Recent TBL_BOARD_CONTENT ==="
$cmd = $conn.CreateCommand()
$cmd.CommandText = "SELECT TOP 5 content_id, category, title, is_draft, updated_at FROM dbo.TBL_BOARD_CONTENT ORDER BY content_id DESC"
$adapter = New-Object System.Data.SqlClient.SqlDataAdapter($cmd)
$dtBoard = New-Object System.Data.DataTable
$adapter.Fill($dtBoard) | Out-Null
$dtBoard | Format-Table -AutoSize

Write-Output "=== TBL_BOARD_ATTACH count ==="
$cmd.CommandText = "SELECT COUNT(*) FROM dbo.TBL_BOARD_ATTACH"
Write-Output $cmd.ExecuteScalar()

$conn.Close()
