$c = New-Object System.Data.SqlClient.SqlConnection('Server=121.78.131.15;Database=peach;Uid=peach;Pwd=qhrtnddk2024!@;')
$c.Open()
$cmd = $c.CreateCommand()
$cmd.CommandText = 'SELECT * FROM dbo.TBL_VIDEO_CONTENT'
$r = $cmd.ExecuteReader()
while ($r.Read()) {
    $cols = 0..($r.FieldCount - 1) | ForEach-Object { $r.GetName($_) + ": " + $r[$_] }
    Write-Host ($cols -join " | ")
}
$c.Close()
