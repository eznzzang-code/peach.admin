$dbs = @("selfhelp", "tongselfhelp", "peach")
foreach ($db in $dbs) {
    $connStr = "Server=121.78.131.15;Database=$db;Uid=peach;Pwd=qhrtnddk2024!@;"
    try {
        $conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
        $conn.Open()
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = "SELECT ROUTINE_NAME, ROUTINE_DEFINITION FROM INFORMATION_SCHEMA.ROUTINES WHERE ROUTINE_NAME LIKE '%up_get_empid%' OR ROUTINE_NAME LIKE '%empid%'"
        $adapter = New-Object System.Data.SqlClient.SqlDataAdapter($cmd)
        $dt = New-Object System.Data.DataTable
        $adapter.Fill($dt) | Out-Null
        if ($dt.Rows.Count -gt 0) {
            Write-Output "=== Found in [$db] ==="
            foreach ($row in $dt.Rows) {
                Write-Output "Procedure: $($row['ROUTINE_NAME'])"
                Write-Output "$($row['ROUTINE_DEFINITION'])"
            }
        } else {
            Write-Output "No match in [$db]"
        }
        $conn.Close()
    } catch {
        Write-Output "Error in [$db]: $($_.Exception.Message)"
    }
}
