$connString = "Server=121.78.131.15;Database=peach;Uid=peach;Pwd=qhrtnddk2024!@;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connString)
$conn.Open()

Write-Output "--- USP_ADMIN_BOARD_ATTACH_ADD ---"
$cmd1 = $conn.CreateCommand()
$cmd1.CommandText = "sp_helptext USP_ADMIN_BOARD_ATTACH_ADD"
$r1 = $cmd1.ExecuteReader()
while ($r1.Read()) { Write-Host -NoNewline $r1[0] }
$r1.Close()

Write-Output "`n--- USP_ADMIN_BOARD_GET ---"
$cmd2 = $conn.CreateCommand()
$cmd2.CommandText = "sp_helptext USP_ADMIN_BOARD_GET"
$r2 = $cmd2.ExecuteReader()
while ($r2.Read()) { Write-Host -NoNewline $r2[0] }
$r2.Close()

Write-Output "`n--- TBL_BOARD_ATTACH contents ---"
$cmd3 = $conn.CreateCommand()
$cmd3.CommandText = "SELECT * FROM dbo.TBL_BOARD_ATTACH"
$r3 = $cmd3.ExecuteReader()
while ($r3.Read()) {
    Write-Host "$($r3['attach_id']) | content: $($r3['content_id']) | $($r3['original_name']) | $($r3['file_path'])"
}
$r3.Close()

$conn.Close()
