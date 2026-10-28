$connStr = "Server=121.78.131.15;Database=peach;User Id=peach;Password=qhrtnddk2024!@;TrustServerCertificate=True;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()

Write-Host "=== Columns of TBL_BOARD_CONTENT ==="
$cmd = $conn.CreateCommand()
$cmd.CommandText = "SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TBL_BOARD_CONTENT'"
$reader = $cmd.ExecuteReader()
while ($reader.Read()) {
    Write-Host ($reader["COLUMN_NAME"] + " (" + $reader["DATA_TYPE"] + ")")
}
$reader.Close()

Write-Host "=== Top 10 Records of TBL_BOARD_CONTENT ==="
$cmd2 = $conn.CreateCommand()
$cmd2.CommandText = "SELECT TOP 10 * FROM dbo.TBL_BOARD_CONTENT ORDER BY content_id DESC"
$reader2 = $cmd2.ExecuteReader()
while ($reader2.Read()) {
    Write-Host ("ID: " + $reader2["content_id"] + " | Cat: [" + $reader2["category"] + "] | Title: [" + $reader2["title"] + "] | is_draft: [" + $reader2["is_draft"] + "] | is_deleted: [" + $reader2["is_deleted"] + "]")
}
$reader2.Close()

$conn.Close()
