$connStr = "Server=121.78.131.15;Database=master;Uid=peach;Pwd=qhrtnddk2024!@;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
try {
    $conn.Open()
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = "SELECT name FROM sys.databases WHERE database_id > 4 ORDER BY name"
    $adapter = New-Object System.Data.SqlClient.SqlDataAdapter($cmd)
    $dt = New-Object System.Data.DataTable
    $adapter.Fill($dt) | Out-Null
    Write-Output "=== Accessible Databases ==="
    $dt | Format-Table -AutoSize
} catch {
    Write-Output "master access failed: $($_.Exception.Message)"
} finally {
    if ($conn.State -eq 1) { $conn.Close() }
}

# peach DB 내부의 모든 테이블 목록 확인
$connStrPeach = "Server=121.78.131.15;Database=peach;Uid=peach;Pwd=qhrtnddk2024!@;"
$connPeach = New-Object System.Data.SqlClient.SqlConnection($connStrPeach)
try {
    $connPeach.Open()
    $cmdPeach = $connPeach.CreateCommand()
    $cmdPeach.CommandText = "SELECT TABLE_SCHEMA, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES ORDER BY TABLE_NAME"
    $adapterPeach = New-Object System.Data.SqlClient.SqlDataAdapter($cmdPeach)
    $dtPeach = New-Object System.Data.DataTable
    $adapterPeach.Fill($dtPeach) | Out-Null
    Write-Output "=== Tables in [peach] DB ==="
    $dtPeach | Format-Table -AutoSize
} catch {
    Write-Output "peach DB access failed: $($_.Exception.Message)"
} finally {
    if ($connPeach.State -eq 1) { $connPeach.Close() }
}
