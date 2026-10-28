$c = New-Object System.Data.SqlClient.SqlConnection('Server=121.78.131.15;Database=peach;Uid=peach;Pwd=qhrtnddk2024!@;')
$c.Open()
$sql = @"
CREATE OR ALTER PROCEDURE dbo.USP_ADMIN_CALENDAR_IMAGE_ADD
    @p_calendar_id   INT,
    @p_channel_type  VARCHAR(10),
    @p_sort_order    INT = 1,
    @p_original_name NVARCHAR(260),
    @p_saved_name    NVARCHAR(260),
    @p_file_path     NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.TBL_CALENDAR_IMAGE (
        calendar_id, channel_type, sort_order, original_name, saved_name, file_path, created_at
    ) VALUES (
        @p_calendar_id, UPPER(@p_channel_type), @p_sort_order, @p_original_name, @p_saved_name, @p_file_path, GETDATE()
    );
END;
"@
$cmd = $c.CreateCommand()
$cmd.CommandText = $sql
$cmd.ExecuteNonQuery()

$sql2 = @"
CREATE OR ALTER PROCEDURE dbo.USP_ADMIN_CALENDAR_IMAGE_CLEAR
    @p_calendar_id  INT,
    @p_channel_type VARCHAR(10) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF @p_channel_type IS NULL OR @p_channel_type = ''
        DELETE FROM dbo.TBL_CALENDAR_IMAGE WHERE calendar_id = @p_calendar_id;
    ELSE
        DELETE FROM dbo.TBL_CALENDAR_IMAGE WHERE calendar_id = @p_calendar_id AND channel_type = @p_channel_type;
END;
"@
$cmd2 = $c.CreateCommand()
$cmd2.CommandText = $sql2
$cmd2.ExecuteNonQuery()

Write-Host "Created calendar image SPs successfully!"
$c.Close()
