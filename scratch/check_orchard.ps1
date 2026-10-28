$connStr = "Server=121.78.131.15;Database=peach;User Id=peach;Password=qhrtnddk2024!@;TrustServerCertificate=True;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()
$cmd = $conn.CreateCommand()
$cmd.CommandText = "SELECT TOP 5 content_id, orchard_year, orchard_month, title, CAST(title AS varbinary(100)) as title_hex FROM dbo.TBL_ORCHARD_CONTENT ORDER BY content_id DESC"
$reader = $cmd.ExecuteReader()
while ($reader.Read()) {
    Write-Host "ID: $($reader['content_id']) | Year: $($reader['orchard_year']) | Month: $($reader['orchard_month']) | Title: $($reader['title']) | TitleHex: $([System.BitConverter]::ToString($reader['title_hex']))"
}
$reader.Close()
$conn.Close()
