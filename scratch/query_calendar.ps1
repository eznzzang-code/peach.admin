$c = New-Object System.Data.SqlClient.SqlConnection('Server=121.78.131.15;Database=peach;Uid=peach;Pwd=qhrtnddk2024!@;')
$c.Open()
$cmd = $c.CreateCommand()
$cmd.CommandText = 'SELECT * FROM dbo.TBL_CALENDAR_CONTENT; SELECT * FROM dbo.TBL_CALENDAR_IMAGE;'
$r = $cmd.ExecuteReader()
Write-Host "=== TBL_CALENDAR_CONTENT ==="
while ($r.Read()) {
    $row = 0..($r.FieldCount - 1) | ForEach-Object { $r.GetName($_) + ": " + $r[$_] }
    Write-Host ($row -join " | ")
}
if ($r.NextResult()) {
    Write-Host "`n=== TBL_CALENDAR_IMAGE ==="
    while ($r.Read()) {
        $row = 0..($r.FieldCount - 1) | ForEach-Object { $r.GetName($_) + ": " + $r[$_] }
        Write-Host ($row -join " | ")
    }
}
$c.Close()
