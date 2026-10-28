$connString = "Server=121.78.131.15;Database=peach;Uid=peach;Pwd=qhrtnddk2024!@;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connString)
$conn.Open()

Write-Output "=== ALL TABLES IN DB ==="
$cmd = $conn.CreateCommand()
$cmd.CommandText = "SELECT TABLE_SCHEMA, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME"
$reader = $cmd.ExecuteReader()
while ($reader.Read()) {
    Write-Host "$($reader['TABLE_SCHEMA']).$($reader['TABLE_NAME'])"
}
$reader.Close()

Write-Output "`n=== ALL STORED PROCEDURES ==="
$cmd2 = $conn.CreateCommand()
$cmd2.CommandText = "SELECT ROUTINE_NAME FROM INFORMATION_SCHEMA.ROUTINES WHERE ROUTINE_TYPE = 'PROCEDURE' ORDER BY ROUTINE_NAME"
$reader2 = $cmd2.ExecuteReader()
while ($reader2.Read()) {
    Write-Host "$($reader2['ROUTINE_NAME'])"
}
$reader2.Close()

$conn.Close()
