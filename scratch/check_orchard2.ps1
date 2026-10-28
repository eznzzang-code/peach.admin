$connStr = "Server=121.78.131.15;Database=peach;User Id=peach;Password=qhrtnddk2024!@;TrustServerCertificate=True;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()
$cmd = $conn.CreateCommand()
$cmd.CommandText = "SELECT TOP 5 * FROM dbo.TBL_ORCHARD ORDER BY 1 DESC"
$reader = $cmd.ExecuteReader()
while ($reader.Read()) {
    for ($i = 0; $i -lt $reader.FieldCount; $i++) {
        Write-Host "$($reader.GetName($i)) : $($reader.GetValue($i))"
    }
    Write-Host "---"
}
$reader.Close()
$conn.Close()
