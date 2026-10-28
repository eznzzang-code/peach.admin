$connStr = "Server=121.78.131.15;Database=master;Uid=peach;Pwd=qhrtnddk2024!@;"
try {
    $conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
    $conn.Open()
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = "SELECT name FROM sys.databases"
    $adapter = New-Object System.Data.SqlClient.SqlDataAdapter($cmd)
    $dt = New-Object System.Data.DataTable
    $adapter.Fill($dt) | Out-Null
    Write-Output "=== Databases ==="
    $dt | Format-Table -AutoSize
    $conn.Close()
} catch {
    Write-Output "Error: $($_.Exception.Message)"
}
