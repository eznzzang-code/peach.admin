$connStr = "Server=121.78.131.15;Database=peach;Uid=peach;Pwd=qhrtnddk2024!@;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()

# 1. peach DB의 TBL_OPERATOR 내용 조회
$cmd = $conn.CreateCommand()
$cmd.CommandText = "SELECT * FROM dbo.TBL_OPERATOR"
$adapter = New-Object System.Data.SqlClient.SqlDataAdapter($cmd)
$dt = New-Object System.Data.DataTable
$adapter.Fill($dt) | Out-Null
Write-Output "=== dbo.TBL_OPERATOR in [peach] ==="
$dt | Format-Table -AutoSize

# 2. selfhelp DB에 접근 가능한지 확인
try {
    $cmd.CommandText = "SELECT TABLE_NAME FROM selfhelp.INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE '%ADMIN%' OR TABLE_NAME LIKE '%USER%' OR TABLE_NAME LIKE '%MEMBER%' OR TABLE_NAME LIKE '%STAFF%'"
    $dtSelf = New-Object System.Data.DataTable
    $adapter.Fill($dtSelf) | Out-Null
    Write-Output "=== Matching Tables in [selfhelp] ==="
    $dtSelf | Format-Table -AutoSize
} catch {
    Write-Output "selfhelp check error: $($_.Exception.Message)"
}

# 3. peachadmin 아이디가 어느 DB/테이블에 있는지 검색
$dbs = @("peach", "selfhelp", "tongselfhelp")
foreach ($db in $dbs) {
    try {
        $cmd.CommandText = "SELECT COUNT(*) FROM $db.sys.tables"
        $cnt = $cmd.ExecuteScalar()
        Write-Output "DB [$db] table count: $cnt"
    } catch {
        Write-Output "DB [$db] access failed: $($_.Exception.Message)"
    }
}

$conn.Close()
