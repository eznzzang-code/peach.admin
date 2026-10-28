$connStr = "Server=121.78.131.15;Database=peach;User Id=peach;Password=qhrtnddk2024!@;TrustServerCertificate=True;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()

$cmd = $conn.CreateCommand()
$cmd.CommandText = "SELECT content_id, category, CAST(category as varbinary(50)) as cat_hex, title, CAST(title as varbinary(100)) as title_hex, is_draft, is_deleted FROM dbo.TBL_BOARD_CONTENT WHERE content_id >= 4 ORDER BY content_id DESC"
$reader = $cmd.ExecuteReader()
while ($reader.Read()) {
    $cid = $reader["content_id"]
    $catHex = [System.BitConverter]::ToString($reader["cat_hex"])
    $titleHex = [System.BitConverter]::ToString($reader["title_hex"])
    $draft = $reader["is_draft"]
    Write-Host "ID: $cid | CatHex: $catHex | TitleHex: $titleHex | is_draft: $draft"
}
$reader.Close()
$conn.Close()
