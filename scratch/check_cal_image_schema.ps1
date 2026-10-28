$c = New-Object System.Data.SqlClient.SqlConnection('Server=121.78.131.15;Database=peach;Uid=peach;Pwd=qhrtnddk2024!@;')
$c.Open()
$cmd = $c.CreateCommand()
$cmd.CommandText = "SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TBL_CALENDAR_IMAGE'"
$r = $cmd.ExecuteReader()
while ($r.Read()) {
    Write-Host "$($r['COLUMN_NAME']) | $($r['DATA_TYPE'])($($r['CHARACTER_MAXIMUM_LENGTH'])) | Nullable: $($r['IS_NULLABLE'])"
}
$r.Close()
$c.Close()
