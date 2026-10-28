$connStr = "Server=121.78.131.15;Database=peach;User Id=peach;Password=qhrtnddk2024!@;TrustServerCertificate=True;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()

$cmd = $conn.CreateCommand()
$cmd.CommandText = "SELECT * FROM dbo.TBL_BOARD_CONTENT WHERE content_id = 1"
$reader = $cmd.ExecuteReader()
if ($reader.Read()) {
    for ($i = 0; $i -lt $reader.FieldCount; $i++) {
        $name = $reader.GetName($i)
        $val = $reader.GetValue($i)
        Write-Host "$name : $val ($($val.GetType().Name))"
    }
}
$reader.Close()
$conn.Close()
