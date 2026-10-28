$connStr = "Server=121.78.131.15;Database=peach;User Id=peach;Password=qhrtnddk2024!@;TrustServerCertificate=True;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()
$cmd = $conn.CreateCommand()
$cmd.CommandText = "SELECT content_id, category, title, CAST(title AS varbinary(100)) as title_hex, CAST(category as varbinary(50)) as cat_hex, body_html FROM dbo.TBL_BOARD_CONTENT WHERE content_id = 1"
$reader = $cmd.ExecuteReader()
if ($reader.Read()) {
    $title = $reader["title"]
    $titleHex = [System.BitConverter]::ToString($reader["title_hex"])
    $cat = $reader["category"]
    $catHex = [System.BitConverter]::ToString($reader["cat_hex"])
    Write-Host "Title: $title"
    Write-Host "TitleHex: $titleHex"
    Write-Host "Category: $cat"
    Write-Host "CatHex: $catHex"
    Write-Host "Body: $($reader['body_html'])"
}
$reader.Close()
$conn.Close()
