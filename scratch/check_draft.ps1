$connStr = "Provider=SQLOLEDB;Data Source=121.78.131.15;Initial Catalog=peach;User ID=peach;Password=peach;"
$conn = New-Object -ComObject ADODB.Connection
$conn.Open($connStr)

Write-Host "=== Check BOARD Records ==="
$rs = $conn.Execute("SELECT content_id, category, title, is_draft, post_status, created_at FROM tbl_board ORDER BY content_id DESC")
while (!$rs.EOF) {
    $cid = $rs.Fields.Item("content_id").Value
    $cat = $rs.Fields.Item("category").Value
    $title = $rs.Fields.Item("title").Value
    $draft = $rs.Fields.Item("is_draft").Value
    $st = $rs.Fields.Item("post_status").Value
    Write-Host "$cid | $cat | $title | is_draft:$draft | status:$st"
    $rs.MoveNext()
}
$rs.Close()

Write-Host "=== Test Draft Count with '공지' ==="
$cmd = New-Object -ComObject ADODB.Command
$cmd.ActiveConnection = $conn
$cmd.CommandText = "USP_ADMIN_BOARD_DRAFT_COUNT"
$cmd.CommandType = 4
$p = $cmd.CreateParameter("@p_category", 202, 1, 30, "공지")
$cmd.Parameters.Append($p)
$rsCount = $cmd.Execute()
Write-Host "Count for 공지: " $rsCount.Fields.Item(0).Value
$rsCount.Close()

Write-Host "=== Test Draft Count with '공지사항' ==="
$cmd2 = New-Object -ComObject ADODB.Command
$cmd2.ActiveConnection = $conn
$cmd2.CommandText = "USP_ADMIN_BOARD_DRAFT_COUNT"
$cmd2.CommandType = 4
$p2 = $cmd2.CreateParameter("@p_category", 202, 1, 30, "공지사항")
$cmd2.Parameters.Append($p2)
$rsCount2 = $cmd2.Execute()
Write-Host "Count for 공지사항: " $rsCount2.Fields.Item(0).Value
$rsCount2.Close()

$conn.Close()
