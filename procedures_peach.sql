-- ==============================================================
-- 복숭아자조금 관리자 (peach.admin) 저장 프로시저 (Stored Procedures)
-- 대상 DB: peach
-- 기획서: 복숭아자조금_PC관리자_화면기획서_개발전달용_20261023 기준
-- ==============================================================

USE [peach];
GO

-- ==============================================================
-- 1. 운영자 / 로그인 / 권한 프로시저
-- ==============================================================

-- [1-1] 관리자 로그인 인증
IF OBJECT_ID('dbo.USP_ADMIN_LOGIN', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_LOGIN;
GO
CREATE PROCEDURE dbo.USP_ADMIN_LOGIN
    @p_account    VARCHAR(50),
    @p_password   VARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        operator_id,
        operator_name,
        operator_account,
        status,
        perm_notice_write, perm_notice_post,
        perm_video_write, perm_video_post,
        perm_cal_write, perm_cal_post,
        perm_orchard_write, perm_orchard_post
    FROM dbo.TBL_OPERATOR
    WHERE operator_account = @p_account
      AND operator_password = @p_password
      AND status = 'ACTIVE';
END;
GO

-- [1-2] 운영자 목록 및 권한 조회 (Slide 34)
IF OBJECT_ID('dbo.USP_ADMIN_OPERATOR_LIST', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_OPERATOR_LIST;
GO
CREATE PROCEDURE dbo.USP_ADMIN_OPERATOR_LIST
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        operator_id,
        operator_name,
        operator_account,
        status,
        perm_notice_write, perm_notice_post,
        perm_video_write, perm_video_post,
        perm_cal_write, perm_cal_post,
        perm_orchard_write, perm_orchard_post,
        updated_at
    FROM dbo.TBL_OPERATOR
    ORDER BY operator_name ASC;
END;
GO

-- [1-3] 운영자 상세 조회 (Slide 35)
IF OBJECT_ID('dbo.USP_ADMIN_OPERATOR_GET', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_OPERATOR_GET;
GO
CREATE PROCEDURE dbo.USP_ADMIN_OPERATOR_GET
    @p_operator_id VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        operator_id,
        operator_name,
        operator_account,
        status,
        perm_notice_write, perm_notice_post,
        perm_video_write, perm_video_post,
        perm_cal_write, perm_cal_post,
        perm_orchard_write, perm_orchard_post,
        updated_at
    FROM dbo.TBL_OPERATOR
    WHERE operator_id = @p_operator_id;
END;
GO

-- [1-4] 운영자 권한 수정 (Slide 35~36)
IF OBJECT_ID('dbo.USP_ADMIN_OPERATOR_SAVE', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_OPERATOR_SAVE;
GO
CREATE PROCEDURE dbo.USP_ADMIN_OPERATOR_SAVE
    @p_operator_id        VARCHAR(50),
    @p_status             VARCHAR(10),
    @p_notice_write       CHAR(1),
    @p_notice_post        CHAR(1),
    @p_video_write        CHAR(1),
    @p_video_post         CHAR(1),
    @p_cal_write          CHAR(1),
    @p_cal_post           CHAR(1),
    @p_orchard_write      CHAR(1),
    @p_orchard_post       CHAR(1)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.TBL_OPERATOR
    SET status             = @p_status,
        perm_notice_write  = @p_notice_write,
        perm_notice_post   = @p_notice_post,
        perm_video_write   = @p_video_write,
        perm_video_post    = @p_video_post,
        perm_cal_write     = @p_cal_write,
        perm_cal_post      = @p_cal_post,
        perm_orchard_write = @p_orchard_write,
        perm_orchard_post  = @p_orchard_post,
        updated_at         = GETDATE()
    WHERE operator_id      = @p_operator_id;
END;
GO


-- ==============================================================
-- 2. 홈 대시보드 원스톱 프로시저 (Slide 1~2)
-- ==============================================================

IF OBJECT_ID('dbo.USP_ADMIN_HOME_DATA', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_HOME_DATA;
GO
CREATE PROCEDURE dbo.USP_ADMIN_HOME_DATA
    @p_year   INT,
    @p_month  INT
AS
BEGIN
    SET NOCOUNT ON;

    -- 1) 이달의 과원관리 (1건)
    SELECT TOP 1 
        orchard_id, target_year, target_month, title, thumbnail_path, visibility, channel_web, channel_app, updated_at
    FROM dbo.TBL_ORCHARD_CONTENT
    WHERE target_year = @p_year AND target_month = @p_month AND is_deleted = 'N';

    -- 2) 상시 재배력 (현재 연도 1건)
    SELECT TOP 1 
        calendar_id, target_year, title, thumbnail_path, visibility, channel_web, channel_app, updated_at
    FROM dbo.TBL_CALENDAR_CONTENT
    WHERE target_year = @p_year AND is_deleted = 'N';

    -- 3) 교육영상 (홈 메인 선정 우선 최대 3건)
    SELECT TOP 3 
        video_id, youtube_id, source_url, display_title, original_title, category,
        thumbnail_url, is_home_web, is_home_app, visibility, period_start, period_end, updated_at
    FROM dbo.TBL_VIDEO_CONTENT
    WHERE is_deleted = 'N' AND visibility = 'public'
    ORDER BY 
        CASE WHEN is_home_web = 'Y' OR is_home_app = 'Y' THEN 0 ELSE 1 END ASC,
        updated_at DESC;

    -- 4) 최근 수정한 게시글 (공지/복숭아정보/재배자료 최신 3건)
    SELECT TOP 3 
        content_id, category, title, visibility, is_draft,
        period_start, period_end, author_name, updated_at,
        -- 상태 계산 컬럼
        CASE 
            WHEN is_draft = 'Y' THEN '임시저장'
            WHEN visibility = 'private' THEN '비공개'
            WHEN period_start > GETDATE() THEN '게시예정'
            WHEN period_end IS NOT NULL AND period_end < CONVERT(VARCHAR(10), GETDATE(), 120) THEN '게시종료'
            ELSE '게시중'
        END AS post_status
    FROM dbo.TBL_BOARD_CONTENT
    WHERE is_deleted = 'N'
    ORDER BY updated_at DESC, content_id DESC;
END;
GO


-- ==============================================================
-- 3. 게시글 관리 프로시저 (Slide 3~16)
-- ==============================================================

-- [3-1] 임시저장 건수 조회 (Slide 7)
IF OBJECT_ID('dbo.USP_ADMIN_BOARD_DRAFT_COUNT', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_BOARD_DRAFT_COUNT;
GO
CREATE PROCEDURE dbo.USP_ADMIN_BOARD_DRAFT_COUNT
    @p_category NVARCHAR(30)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT COUNT(*) AS draft_count
    FROM dbo.TBL_BOARD_CONTENT
    WHERE category = @p_category
      AND is_draft = 'Y'
      AND is_deleted = 'N';
END;
GO

-- [3-2] 게시글 목록 조회 (페이징, 기간검색, 상태, 키워드, 상단고정 정렬) (Slide 3~8)
IF OBJECT_ID('dbo.USP_ADMIN_BOARD_LIST', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_BOARD_LIST;
GO
CREATE PROCEDURE dbo.USP_ADMIN_BOARD_LIST
    @p_category     NVARCHAR(30),          -- '공지', '복숭아정보', '재배자료'
    @p_is_draft     CHAR(1) = 'N',         -- 'Y': 임시저장 목록 모드, 'N': 일반 목록
    @p_period_type  VARCHAR(20) = 'all',   -- 'all', '1', '3', '6', 'custom'
    @p_period_start VARCHAR(10) = NULL,    -- YYYY-MM-DD
    @p_period_end   VARCHAR(10) = NULL,    -- YYYY-MM-DD
    @p_status       VARCHAR(20) = NULL,    -- '게시예정', '게시중', '게시종료', '비공개'
    @p_field        VARCHAR(20) = 'titleBody', -- 'titleBody', 'title', 'author'
    @p_keyword      NVARCHAR(100) = NULL,
    @p_page         INT = 1,
    @p_page_size    INT = 10
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @v_now_date VARCHAR(10) = CONVERT(VARCHAR(10), GETDATE(), 120);

    -- 날짜 계산
    IF @p_period_type = '1'
        SET @p_period_start = CONVERT(VARCHAR(10), DATEADD(MONTH, -1, GETDATE()), 120);
    ELSE IF @p_period_type = '3'
        SET @p_period_start = CONVERT(VARCHAR(10), DATEADD(MONTH, -3, GETDATE()), 120);
    ELSE IF @p_period_type = '6'
        SET @p_period_start = CONVERT(VARCHAR(10), DATEADD(MONTH, -6, GETDATE()), 120);

    ;WITH CTE_BOARD AS (
        SELECT 
            content_id, category, title, body_html,
            visibility, is_draft, is_pinned,
            channel_web, channel_app,
            period_start, period_end, has_end_date,
            is_urgent, urgent_start, urgent_end,
            author_id, author_name, updated_at,
            -- 상태 실시간 계산 (Slide 4)
            CASE 
                WHEN is_draft = 'Y' THEN '임시저장'
                WHEN visibility = 'private' THEN '비공개'
                WHEN period_start > GETDATE() THEN '게시예정'
                WHEN period_end IS NOT NULL AND period_end < @v_now_date THEN '게시종료'
                ELSE '게시중'
            END AS post_status
        FROM dbo.TBL_BOARD_CONTENT
        WHERE category = @p_category
          AND is_deleted = 'N'
          AND is_draft = @p_is_draft
          -- 기간 조건 (수정일 기준)
          AND (@p_period_start IS NULL OR updated_at >= CAST(@p_period_start AS DATETIME))
          AND (@p_period_end IS NULL OR updated_at < DATEADD(DAY, 1, CAST(@p_period_end AS DATETIME)))
          -- 키워드 검색
          AND (
              @p_keyword IS NULL OR @p_keyword = ''
              OR (@p_field = 'titleBody' AND (title LIKE '%' + @p_keyword + '%' OR body_html LIKE '%' + @p_keyword + '%'))
              OR (@p_field = 'title' AND title LIKE '%' + @p_keyword + '%')
              OR (@p_field = 'author' AND author_name LIKE '%' + @p_keyword + '%')
          )
    )
    SELECT 
        content_id, category, title,
        visibility, is_draft, is_pinned,
        channel_web, channel_app,
        period_start, period_end, has_end_date,
        is_urgent, post_status,
        author_name, updated_at,
        COUNT(*) OVER() AS total_count
    FROM CTE_BOARD
    WHERE (@p_status IS NULL OR @p_status = '' OR post_status = @p_status)
    ORDER BY 
        -- 공지사항 상단고정(게시중인 것만 우선 노출 - Slide 3)
        CASE WHEN category = '공지' AND is_pinned = 'Y' AND post_status = '게시중' THEN 0 ELSE 1 END ASC,
        updated_at DESC, content_id DESC
    OFFSET (@p_page - 1) * @p_page_size ROWS
    FETCH NEXT @p_page_size ROWS ONLY;
END;
GO

-- [3-3] 게시글 상세 단건 조회 (Slide 15)
IF OBJECT_ID('dbo.USP_ADMIN_BOARD_GET', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_BOARD_GET;
GO
CREATE PROCEDURE dbo.USP_ADMIN_BOARD_GET
    @p_content_id INT
AS
BEGIN
    SET NOCOUNT ON;

    -- 1) 게시글 본문 정보
    SELECT 
        content_id, category, title, body_html,
        visibility, is_draft, is_pinned,
        channel_web, channel_app,
        period_start, period_end, has_end_date,
        is_urgent, urgent_start, urgent_end, urgent_order,
        related_type, related_target_id,
        author_id, author_name, created_at, updated_at
    FROM dbo.TBL_BOARD_CONTENT
    WHERE content_id = @p_content_id AND is_deleted = 'N';

    -- 2) 첨부파일 목록
    SELECT 
        attach_id, content_id, original_name, saved_name, file_path, file_size, download_cnt
    FROM dbo.TBL_BOARD_ATTACH
    WHERE content_id = @p_content_id
    ORDER BY attach_id ASC;
END;
GO

-- [3-4] 게시글 등록 및 수정 (Slide 9~14)
IF OBJECT_ID('dbo.USP_ADMIN_BOARD_SAVE', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_BOARD_SAVE;
GO
CREATE PROCEDURE dbo.USP_ADMIN_BOARD_SAVE
    @p_content_id         INT = 0,               -- 0: 신규등록, 그 외: 수정
    @p_category           NVARCHAR(30),
    @p_title              NVARCHAR(200),
    @p_body_html          NVARCHAR(MAX),
    @p_visibility         VARCHAR(10),           -- 'public', 'private'
    @p_is_draft           CHAR(1),               -- 'Y', 'N'
    @p_is_pinned          CHAR(1),               -- 'Y', 'N'
    @p_channel_web        CHAR(1),
    @p_channel_app        CHAR(1),
    @p_period_start       DATETIME,
    @p_period_end         DATETIME = NULL,
    @p_has_end_date       CHAR(1) = 'Y',
    @p_is_urgent          CHAR(1) = 'N',
    @p_urgent_start       DATETIME = NULL,
    @p_urgent_end         DATETIME = NULL,
    @p_related_type       VARCHAR(30) = NULL,
    @p_related_target_id  VARCHAR(100) = NULL,
    @p_author_id          VARCHAR(50),
    @p_author_name        NVARCHAR(50),
    @r_new_id             INT OUTPUT             -- 생성/수정된 content_id 반환
AS
BEGIN
    SET NOCOUNT ON;

    IF @p_content_id <= 0
    BEGIN
        -- 신규 등록
        INSERT INTO dbo.TBL_BOARD_CONTENT (
            category, title, body_html, visibility, is_draft, is_pinned,
            channel_web, channel_app, period_start, period_end, has_end_date,
            is_urgent, urgent_start, urgent_end,
            related_type, related_target_id, author_id, author_name,
            created_at, updated_at
        ) VALUES (
            @p_category, @p_title, @p_body_html, @p_visibility, @p_is_draft, @p_is_pinned,
            @p_channel_web, @p_channel_app, @p_period_start, @p_period_end, @p_has_end_date,
            @p_is_urgent, @p_urgent_start, @p_urgent_end,
            @p_related_type, @p_related_target_id, @p_author_id, @p_author_name,
            GETDATE(), GETDATE()
        );
        SET @r_new_id = SCOPE_IDENTITY();
    END
    ELSE
    BEGIN
        -- 수정
        UPDATE dbo.TBL_BOARD_CONTENT
        SET title              = @p_title,
            body_html          = @p_body_html,
            visibility         = @p_visibility,
            is_draft           = @p_is_draft,
            is_pinned          = @p_is_pinned,
            channel_web        = @p_channel_web,
            channel_app        = @p_channel_app,
            period_start       = @p_period_start,
            period_end         = @p_period_end,
            has_end_date       = @p_has_end_date,
            is_urgent          = @p_is_urgent,
            urgent_start       = @p_urgent_start,
            urgent_end         = @p_urgent_end,
            related_type       = @p_related_type,
            related_target_id  = @p_related_target_id,
            author_id          = @p_author_id,
            author_name        = @p_author_name,
            updated_at         = GETDATE()
        WHERE content_id       = @p_content_id;

        SET @r_new_id = @p_content_id;
    END;
END;
GO

-- [3-5] 게시글 삭제 (논리 삭제) (Slide 8)
IF OBJECT_ID('dbo.USP_ADMIN_BOARD_DELETE', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_BOARD_DELETE;
GO
CREATE PROCEDURE dbo.USP_ADMIN_BOARD_DELETE
    @p_content_ids NVARCHAR(MAX)    -- 쉼표로 구분된 ID 목록 (예: "1,2,3")
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.TBL_BOARD_CONTENT
    SET is_deleted = 'Y',
        updated_at = GETDATE()
    WHERE content_id IN (
        SELECT CAST(value AS INT) FROM STRING_SPLIT(@p_content_ids, ',')
    );
END;
GO

-- [3-6] 첨부파일 추가 (Slide 13)
IF OBJECT_ID('dbo.USP_ADMIN_BOARD_ATTACH_ADD', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_BOARD_ATTACH_ADD;
GO
CREATE PROCEDURE dbo.USP_ADMIN_BOARD_ATTACH_ADD
    @p_content_id    INT,
    @p_original_name NVARCHAR(260),
    @p_saved_name    NVARCHAR(260),
    @p_file_path     NVARCHAR(500),
    @p_file_size     BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.TBL_BOARD_ATTACH (
        content_id, original_name, saved_name, file_path, file_size, created_at
    ) VALUES (
        @p_content_id, @p_original_name, @p_saved_name, @p_file_path, @p_file_size, GETDATE()
    );
END;
GO

-- [3-7] 첨부파일 삭제
IF OBJECT_ID('dbo.USP_ADMIN_BOARD_ATTACH_DEL', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_BOARD_ATTACH_DEL;
GO
CREATE PROCEDURE dbo.USP_ADMIN_BOARD_ATTACH_DEL
    @p_attach_id INT
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM dbo.TBL_BOARD_ATTACH WHERE attach_id = @p_attach_id;
END;
GO


-- ==============================================================
-- 4. 월별 과원관리 프로시저 (Slide 17~23)
-- ==============================================================

-- [4-1] 연도별 1~12월 목록 조회 (Slide 17~18)
IF OBJECT_ID('dbo.USP_ADMIN_ORCHARD_LIST', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_ORCHARD_LIST;
GO
CREATE PROCEDURE dbo.USP_ADMIN_ORCHARD_LIST
    @p_year INT
AS
BEGIN
    SET NOCOUNT ON;

    -- 1부터 12월까지 가상 테이블을 생성하여 등록 여부 매핑
    ;WITH Months AS (
        SELECT 1 AS month_num UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
        UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8
        UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12
    )
    SELECT 
        m.month_num AS target_month,
        o.orchard_id,
        ISNULL(o.target_year, @p_year) AS target_year,
        o.title,
        o.thumbnail_path,
        ISNULL(o.visibility, 'private') AS visibility,
        ISNULL(o.channel_web, 'N') AS channel_web,
        ISNULL(o.channel_app, 'N') AS channel_app,
        CASE WHEN o.orchard_id IS NOT NULL THEN 'REGISTERED' ELSE 'EMPTY' END AS status,
        o.updated_at
    FROM Months m
    LEFT JOIN dbo.TBL_ORCHARD_CONTENT o 
        ON o.target_month = m.month_num 
       AND o.target_year = @p_year 
       AND o.is_deleted = 'N'
    ORDER BY m.month_num ASC;
END;
GO

-- [4-2] 월별 과원관리 상세 및 이미지 목록 조회 (Slide 19~21)
IF OBJECT_ID('dbo.USP_ADMIN_ORCHARD_GET', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_ORCHARD_GET;
GO
CREATE PROCEDURE dbo.USP_ADMIN_ORCHARD_GET
    @p_year  INT,
    @p_month INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @v_orchard_id INT = 0;

    -- 대상 ID 변수 할당
    SELECT TOP 1 @v_orchard_id = orchard_id
    FROM dbo.TBL_ORCHARD_CONTENT
    WHERE target_year = @p_year AND target_month = @p_month AND is_deleted = 'N';

    -- 1) 기본 정보 조회
    SELECT TOP 1
        orchard_id, target_year, target_month, title, thumbnail_path,
        visibility, channel_web, channel_app, updated_at
    FROM dbo.TBL_ORCHARD_CONTENT
    WHERE orchard_id = @v_orchard_id;

    -- 2) Web/App 채널별 이미지 목록 조회 (순서대로)
    SELECT 
        image_id, orchard_id, channel_type, sort_order, original_name, saved_name, file_path
    FROM dbo.TBL_ORCHARD_IMAGE
    WHERE orchard_id = @v_orchard_id
    ORDER BY channel_type ASC, sort_order ASC;
END;
GO

-- [4-3] 월별 과원관리 기본정보 저장 (등록 / 수정) (Slide 19, 22)
IF OBJECT_ID('dbo.USP_ADMIN_ORCHARD_SAVE', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_ORCHARD_SAVE;
GO
CREATE PROCEDURE dbo.USP_ADMIN_ORCHARD_SAVE
    @p_year           INT,
    @p_month          INT,
    @p_title          NVARCHAR(200),
    @p_thumbnail_path NVARCHAR(500) = NULL,
    @p_visibility     VARCHAR(10)   = 'public',
    @p_channel_web    CHAR(1)       = 'Y',
    @p_channel_app    CHAR(1)       = 'Y',
    @p_author_id      VARCHAR(50)   = NULL,
    @r_orchard_id     INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @v_existing_id INT;
    SELECT @v_existing_id = orchard_id 
    FROM dbo.TBL_ORCHARD_CONTENT 
    WHERE target_year = @p_year AND target_month = @p_month;

    IF @v_existing_id IS NULL
    BEGIN
        INSERT INTO dbo.TBL_ORCHARD_CONTENT (
            target_year, target_month, title, thumbnail_path, visibility,
            channel_web, channel_app, author_id, is_deleted, created_at, updated_at
        ) VALUES (
            @p_year, @p_month, @p_title, @p_thumbnail_path, @p_visibility,
            @p_channel_web, @p_channel_app, @p_author_id, 'N', GETDATE(), GETDATE()
        );
        SET @r_orchard_id = SCOPE_IDENTITY();
    END
    ELSE
    BEGIN
        UPDATE dbo.TBL_ORCHARD_CONTENT
        SET title          = @p_title,
            thumbnail_path = ISNULL(@p_thumbnail_path, thumbnail_path),
            visibility     = @p_visibility,
            channel_web    = @p_channel_web,
            channel_app    = @p_channel_app,
            author_id      = ISNULL(@p_author_id, author_id),
            is_deleted     = 'N',
            updated_at     = GETDATE()
        WHERE orchard_id   = @v_existing_id;

        SET @r_orchard_id = @v_existing_id;
    END;
END;
GO

-- [4-4] 월별 과원관리 삭제 (Slide 23)
IF OBJECT_ID('dbo.USP_ADMIN_ORCHARD_DELETE', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_ORCHARD_DELETE;
GO
CREATE PROCEDURE dbo.USP_ADMIN_ORCHARD_DELETE
    @p_year  INT,
    @p_month INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.TBL_ORCHARD_CONTENT
    SET is_deleted = 'Y',
        updated_at = GETDATE()
    WHERE target_year = @p_year AND target_month = @p_month;
END;
GO

-- [4-5] 월별 과원관리 본문 이미지 일괄 삭제
IF OBJECT_ID('dbo.USP_ADMIN_ORCHARD_IMAGE_CLEAR', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_ORCHARD_IMAGE_CLEAR;
GO
CREATE PROCEDURE dbo.USP_ADMIN_ORCHARD_IMAGE_CLEAR
    @p_orchard_id   INT,
    @p_channel_type VARCHAR(10) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF @p_channel_type IS NULL OR @p_channel_type = ''
        DELETE FROM dbo.TBL_ORCHARD_IMAGE WHERE orchard_id = @p_orchard_id;
    ELSE
        DELETE FROM dbo.TBL_ORCHARD_IMAGE WHERE orchard_id = @p_orchard_id AND channel_type = @p_channel_type;
END;
GO

-- [4-6] 월별 과원관리 본문 이미지 추가
IF OBJECT_ID('dbo.USP_ADMIN_ORCHARD_IMAGE_ADD', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_ORCHARD_IMAGE_ADD;
GO
CREATE PROCEDURE dbo.USP_ADMIN_ORCHARD_IMAGE_ADD
    @p_orchard_id    INT,
    @p_channel_type  VARCHAR(10),
    @p_sort_order    INT = 1,
    @p_original_name NVARCHAR(260),
    @p_saved_name    NVARCHAR(260),
    @p_file_path     NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.TBL_ORCHARD_IMAGE (
        orchard_id, channel_type, sort_order, original_name, saved_name, file_path, created_at
    ) VALUES (
        @p_orchard_id, UPPER(@p_channel_type), @p_sort_order, @p_original_name, @p_saved_name, @p_file_path, GETDATE()
    );
END;
GO


-- ==============================================================
-- 5. 상시 재배력 프로시저 (Slide 24~26)
-- ==============================================================

-- [5-1] 상시 재배력 조회
IF OBJECT_ID('dbo.USP_ADMIN_CALENDAR_GET', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_CALENDAR_GET;
GO
CREATE PROCEDURE dbo.USP_ADMIN_CALENDAR_GET
    @p_year INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @v_calendar_id INT = 0;

    -- 대상 ID 변수 할당
    SELECT TOP 1 @v_calendar_id = calendar_id
    FROM dbo.TBL_CALENDAR_CONTENT
    WHERE target_year = @p_year AND is_deleted = 'N';

    -- 1) 기본 정보 조회
    SELECT TOP 1
        calendar_id, target_year, title, thumbnail_path, visibility,
        channel_web, channel_app, updated_at
    FROM dbo.TBL_CALENDAR_CONTENT
    WHERE calendar_id = @v_calendar_id;

    -- 채널별 이미지 목록
    SELECT 
        image_id, calendar_id, channel_type, sort_order, original_name, saved_name, file_path
    FROM dbo.TBL_CALENDAR_IMAGE
    WHERE calendar_id = @v_calendar_id
    ORDER BY channel_type ASC, sort_order ASC;
END;
GO

-- [5-2] 상시 재배력 저장
IF OBJECT_ID('dbo.USP_ADMIN_CALENDAR_SAVE', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_CALENDAR_SAVE;
GO
CREATE PROCEDURE dbo.USP_ADMIN_CALENDAR_SAVE
    @p_year           INT,
    @p_title          NVARCHAR(200),
    @p_thumbnail_path NVARCHAR(500) = NULL,
    @p_visibility     VARCHAR(10)   = 'public',
    @p_channel_web    CHAR(1)       = 'Y',
    @p_channel_app    CHAR(1)       = 'Y',
    @p_author_id      VARCHAR(50)   = NULL,
    @r_calendar_id    INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @v_existing_id INT;
    SELECT TOP 1 @v_existing_id = calendar_id 
    FROM dbo.TBL_CALENDAR_CONTENT 
    WHERE target_year = @p_year;

    IF @v_existing_id IS NULL
    BEGIN
        INSERT INTO dbo.TBL_CALENDAR_CONTENT (
            target_year, title, thumbnail_path, visibility,
            channel_web, channel_app, author_id, is_deleted, created_at, updated_at
        ) VALUES (
            @p_year, @p_title, @p_thumbnail_path, @p_visibility,
            @p_channel_web, @p_channel_app, @p_author_id, 'N', GETDATE(), GETDATE()
        );
        SET @r_calendar_id = SCOPE_IDENTITY();
    END
    ELSE
    BEGIN
        UPDATE dbo.TBL_CALENDAR_CONTENT
        SET title          = @p_title,
            thumbnail_path = ISNULL(@p_thumbnail_path, thumbnail_path),
            visibility     = @p_visibility,
            channel_web    = @p_channel_web,
            channel_app    = @p_channel_app,
            author_id      = ISNULL(@p_author_id, author_id),
            is_deleted     = 'N',
            updated_at     = GETDATE()
        WHERE calendar_id  = @v_existing_id;

        SET @r_calendar_id = @v_existing_id;
    END;
END;
GO


-- ==============================================================
-- 6. 교육영상 관리 프로시저 (Slide 28~33)
-- ==============================================================

-- [6-1] 교육영상 목록 조회 (Slide 28)
IF OBJECT_ID('dbo.USP_ADMIN_VIDEO_LIST', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_VIDEO_LIST;
GO
CREATE PROCEDURE dbo.USP_ADMIN_VIDEO_LIST
    @p_category    NVARCHAR(50) = NULL,    -- 재배기술 / 생육단계
    @p_keyword     NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        video_id, youtube_id, source_url, display_title, original_title, category,
        thumbnail_url, duration_text, is_playable,
        visibility, channel_web, channel_app,
        is_home_web, is_home_app,
        period_start, period_end, has_end_date,
        updated_at
    FROM dbo.TBL_VIDEO_CONTENT
    WHERE is_deleted = 'N'
      AND (@p_category IS NULL OR @p_category = '' OR category = @p_category)
      AND (@p_keyword IS NULL OR @p_keyword = '' OR display_title LIKE '%' + @p_keyword + '%' OR original_title LIKE '%' + @p_keyword + '%')
    ORDER BY 
        -- 홈 노출 중인 영상을 우선 정렬 (Slide 28)
        CASE WHEN is_home_web = 'Y' OR is_home_app = 'Y' THEN 0 ELSE 1 END ASC,
        updated_at DESC, video_id DESC;
END;
GO

-- [6-2] 교육영상 단건 상세 조회 (Slide 29~30)
IF OBJECT_ID('dbo.USP_ADMIN_VIDEO_GET', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_VIDEO_GET;
GO
CREATE PROCEDURE dbo.USP_ADMIN_VIDEO_GET
    @p_video_id INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        video_id, youtube_id, source_url, display_title, original_title, category,
        description, thumbnail_url, duration_text, is_playable,
        visibility, channel_web, channel_app,
        is_home_web, is_home_app,
        period_start, period_end, has_end_date,
        attach_name, attach_path, updated_at
    FROM dbo.TBL_VIDEO_CONTENT
    WHERE video_id = @p_video_id AND is_deleted = 'N';
END;
GO

-- [6-3] 교육영상 저장 (Slide 29~31: App 대표 영상 1건 유지 트랜잭션 보장!)
IF OBJECT_ID('dbo.USP_ADMIN_VIDEO_SAVE', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_VIDEO_SAVE;
GO
CREATE PROCEDURE dbo.USP_ADMIN_VIDEO_SAVE
    @p_video_id       INT,
    @p_display_title  NVARCHAR(200),
    @p_category       NVARCHAR(50),
    @p_description    NVARCHAR(MAX) = NULL,
    @p_visibility     VARCHAR(10),
    @p_channel_web    CHAR(1),
    @p_channel_app    CHAR(1),
    @p_is_home_web    CHAR(1),
    @p_is_home_app    CHAR(1),
    @p_period_start   DATETIME,
    @p_period_end     DATETIME = NULL,
    @p_has_end_date   CHAR(1) = 'Y',
    @p_attach_name    NVARCHAR(260) = NULL,
    @p_attach_path    NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRANSACTION;

    -- App 메인 선정 영상은 단 1개만 허용되므로, 현재 영상이 App 메인으로 선정되면 기존 다른 영상들의 App 선정을 해제함 (Slide 31)
    IF @p_is_home_app = 'Y'
    BEGIN
        UPDATE dbo.TBL_VIDEO_CONTENT
        SET is_home_app = 'N',
            updated_at  = GETDATE()
        WHERE video_id <> @p_video_id
          AND is_home_app = 'Y';
    END;

    UPDATE dbo.TBL_VIDEO_CONTENT
    SET display_title = @p_display_title,
        category      = @p_category,
        description   = @p_description,
        visibility    = @p_visibility,
        channel_web   = @p_channel_web,
        channel_app   = @p_channel_app,
        is_home_web   = @p_is_home_web,
        is_home_app   = @p_is_home_app,
        period_start  = @p_period_start,
        period_end    = @p_period_end,
        has_end_date  = @p_has_end_date,
        attach_name   = ISNULL(@p_attach_name, attach_name),
        attach_path   = ISNULL(@p_attach_path, attach_path),
        updated_at    = GETDATE()
    WHERE video_id    = @p_video_id;

    COMMIT TRANSACTION;
END;
GO

-- [6-4] 교육영상 삭제 (Slide 33)
IF OBJECT_ID('dbo.USP_ADMIN_VIDEO_DELETE', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_VIDEO_DELETE;
GO
CREATE PROCEDURE dbo.USP_ADMIN_VIDEO_DELETE
    @p_video_id INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.TBL_VIDEO_CONTENT
    SET is_deleted  = 'Y',
        is_home_web = 'N',
        is_home_app = 'N',
        updated_at  = GETDATE()
    WHERE video_id  = @p_video_id;
END;
GO
