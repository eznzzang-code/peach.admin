$connStr = "Provider=SQLOLEDB;Data Source=121.78.131.15;Initial Catalog=peach;User ID=peach;Password=qhrtnddk2024!@;"
$conn = New-Object -ComObject ADODB.Connection
$conn.Open($connStr)

$cmd = New-Object -ComObject ADODB.Command
$cmd.ActiveConnection = $conn
$cmd.CommandText = "USP_ADMIN_BOARD_GET"
$cmd.CommandType = 4
$cmd.Parameters.Append($cmd.CreateParameter("@p_content_id", 3, 1, 4, 1))

Write-Host "Test 1: rs.Open cmd with CursorLocation=3"
try {
    $rs = New-Object -ComObject ADODB.Recordset
    $rs.CursorLocation = 3
    $rs.Open($cmd, [System.Type]::Missing, 1, 1)
    Write-Host "Record 1 EOF: $($rs.EOF)"
    $rsNext = $rs.NextRecordset()
    Write-Host "rsNext is null? $($rsNext -eq $null)"
    if ($rsNext -ne $null) {
        Write-Host "rsNext EOF: $($rsNext.EOF)"
    }
} catch {
    Write-Host "Error in Test 1: $_"
}

Write-Host "Test 2: cmd.Execute"
try {
    $rs2 = $cmd.Execute()
    Write-Host "Record 1 EOF: $($rs2.EOF)"
    $rs2Next = $rs2.NextRecordset()
    Write-Host "rs2Next is null? $($rs2Next -eq $null)"
    if ($rs2Next -ne $null) {
        Write-Host "rs2Next EOF: $($rs2Next.EOF)"
    }
} catch {
    Write-Host "Error in Test 2: $_"
}

$conn.Close()
