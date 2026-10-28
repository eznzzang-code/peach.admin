$c = New-Object System.Data.SqlClient.SqlConnection('Server=121.78.131.15;Database=peach;Uid=peach;Pwd=qhrtnddk2024!@;')
$c.Open()
$cmd = $c.CreateCommand()
$cmd.CommandText = 'sp_helptext USP_ADMIN_CALENDAR_GET'
$r = $cmd.ExecuteReader()
while ($r.Read()) { Write-Host -NoNewline $r[0] }
$r.Close()
$c.Close()
