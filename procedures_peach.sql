-- ==============================================================
-- 복숭아자조금 관리자 (peach.admin) 저장 프로시저 (Stored Procedures)
-- 대상 DB: peach
-- 모든 파라미터 우측 주석, 쿼리 상단/컬럼 우측 주석 및 MS_Description 확장 속성 포함
-- ==============================================================

USE [peach];
GO

-- ==============================================================
-- [1] 로그인 검증 (USP_ADMIN_LOGIN)
-- ==============================================================
IF OBJECT_ID('dbo.USP_ADMIN_LOGIN', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_LOGIN;
GO
CREATE PROCEDURE dbo.USP_ADMIN_LOGIN
    @p_account    VARCHAR(50),   -- 로그인 계정 아이디 (또는 운영자 식별키)
    @p_password   VARCHAR(200)   -- 입력 비밀번호 평문 (SHA-256 단방향 해시 비교)
AS
BEGIN
    -- ==========================================================
    -- 프로시저명 : dbo.USP_ADMIN_LOGIN
    -- 설      명 : 관리자 로그인 시 아이디와 SHA-256 해시 비밀번호 및 계정 활성 상태(ACTIVE)를 검증하고 권한 정보를 반환합니다.
    -- ==========================================================
    SET NOCOUNT ON;

    -- 활성 상태(ACTIVE)인 운영자 계정 및 메뉴별 작성/게시 권한 조회
    SELECT 
        operator_id,        -- 운영자 고유 식별키 (PK)
        operator_name,      -- 운영자 성명
        operator_account,   -- 로그인 계정 아이디
        status,             -- 계정 상태 ('ACTIVE': 사용, 'INACTIVE': 미사용)
        perm_notice_write,  -- 공지/게시글 작성 권한 ('Y'/'N')
        perm_notice_post,   -- 공지/게시글 게시 권한 ('Y'/'N')
        perm_video_write,   -- 교육영상 작성 권한 ('Y'/'N')
        perm_video_post,    -- 교육영상 게시 권한 ('Y'/'N')
        perm_cal_write,     -- 상시재배력 작성 권한 ('Y'/'N')
        perm_cal_post,      -- 상시재배력 게시 권한 ('Y'/'N')
        perm_orchard_write, -- 월별과원관리 작성 권한 ('Y'/'N')
        perm_orchard_post   -- 월별과원관리 게시 권한 ('Y'/'N')
    FROM dbo.TBL_OPERATOR
    WHERE (operator_account = @p_account OR operator_id = @p_account)
      AND LOWER(operator_password) = LOWER(CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', CAST(@p_password AS VARCHAR(200))), 2))
      AND status = 'ACTIVE';
END;
GO

-- ==============================================================
-- [2] 운영자 및 권한 목록 조회 (USP_ADMIN_OPERATOR_LIST)
-- ==============================================================
IF OBJECT_ID('dbo.USP_ADMIN_OPERATOR_LIST', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_OPERATOR_LIST;
GO
CREATE PROCEDURE dbo.USP_ADMIN_OPERATOR_LIST
AS
BEGIN
    -- ==========================================================
    -- 프로시저명 : dbo.USP_ADMIN_OPERATOR_LIST
    -- 설      명 : 등록된 전체 운영자 계정 목록과 업무별 작성/게시 권한을 이름순으로 조회합니다.
    -- ==========================================================
    SET NOCOUNT ON;

    -- 전체 운영자 목록 및 권한 정보 조회 (이름 오름차순)
    SELECT 
        operator_id,        -- 운영자 고유 식별키 (PK)
        operator_name,      -- 운영자 성명
        operator_account,   -- 로그인 계정 아이디
        status,             -- 계정 상태 ('ACTIVE': 사용, 'INACTIVE': 미사용)
        perm_notice_write,  -- 공지/게시글 작성 권한 ('Y'/'N')
        perm_notice_post,   -- 공지/게시글 게시 권한 ('Y'/'N')
        perm_video_write,   -- 교육영상 작성 권한 ('Y'/'N')
        perm_video_post,    -- 교육영상 게시 권한 ('Y'/'N')
        perm_cal_write,     -- 상시재배력 작성 권한 ('Y'/'N')
        perm_cal_post,      -- 상시재배력 게시 권한 ('Y'/'N')
        perm_orchard_write, -- 월별과원관리 작성 권한 ('Y'/'N')
        perm_orchard_post,  -- 월별과원관리 게시 권한 ('Y'/'N')
        updated_at          -- 최종 수정 일시
    FROM dbo.TBL_OPERATOR
    ORDER BY operator_name ASC;
END;
GO

-- ==============================================================
-- [3] 운영자 상세 조회 (USP_ADMIN_OPERATOR_GET)
-- ==============================================================
IF OBJECT_ID('dbo.USP_ADMIN_OPERATOR_GET', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_OPERATOR_GET;
GO
CREATE PROCEDURE dbo.USP_ADMIN_OPERATOR_GET
    @p_operator_id VARCHAR(50)   -- 조회할 운영자 고유 식별키 (operator_id)
AS
BEGIN
    -- ==========================================================
    -- 프로시저명 : dbo.USP_ADMIN_OPERATOR_GET
    -- 설      명 : 특정 운영자(@p_operator_id)의 상세 정보 및 업무별 권한 설정을 단건 조회합니다.
    -- ==========================================================
    SET NOCOUNT ON;

    -- 특정 운영자 상세 정보 및 권한 조회
    SELECT 
        operator_id,        -- 운영자 고유 식별키 (PK)
        operator_name,      -- 운영자 성명
        operator_account,   -- 로그인 계정 아이디
        status,             -- 계정 상태 ('ACTIVE': 사용, 'INACTIVE': 미사용)
        perm_notice_write,  -- 공지/게시글 작성 권한 ('Y'/'N')
        perm_notice_post,   -- 공지/게시글 게시 권한 ('Y'/'N')
        perm_video_write,   -- 교육영상 작성 권한 ('Y'/'N')
        perm_video_post,    -- 교육영상 게시 권한 ('Y'/'N')
        perm_cal_write,     -- 상시재배력 작성 권한 ('Y'/'N')
        perm_cal_post,      -- 상시재배력 게시 권한 ('Y'/'N')
        perm_orchard_write, -- 월별과원관리 작성 권한 ('Y'/'N')
        perm_orchard_post,  -- 월별과원관리 게시 권한 ('Y'/'N')
        updated_at          -- 최종 수정 일시
    FROM dbo.TBL_OPERATOR
    WHERE operator_id = @p_operator_id;
END;
GO

-- ==============================================================
-- [4] 운영자 권한 및 상태 저장 (USP_ADMIN_OPERATOR_SAVE)
-- ==============================================================
IF OBJECT_ID('dbo.USP_ADMIN_OPERATOR_SAVE', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_OPERATOR_SAVE;
GO
CREATE PROCEDURE dbo.USP_ADMIN_OPERATOR_SAVE
    @p_operator_id        VARCHAR(50),  -- 수정 대상 운영자 고유 식별키 (PK)
    @p_status             VARCHAR(10),  -- 계정 상태 ('ACTIVE': 사용, 'INACTIVE': 미사용)
    @p_notice_write       CHAR(1),      -- 공지/게시글 작성 권한 ('Y'/'N')
    @p_notice_post        CHAR(1),      -- 공지/게시글 게시 권한 ('Y'/'N')
    @p_video_write        CHAR(1),      -- 교육영상 작성 권한 ('Y'/'N')
    @p_video_post         CHAR(1),      -- 교육영상 게시 권한 ('Y'/'N')
    @p_cal_write          CHAR(1),      -- 상시재배력 작성 권한 ('Y'/'N')
    @p_cal_post           CHAR(1),      -- 상시재배력 게시 권한 ('Y'/'N')
    @p_orchard_write      CHAR(1),      -- 월별과원관리 작성 권한 ('Y'/'N')
    @p_orchard_post       CHAR(1)       -- 월별과원관리 게시 권한 ('Y'/'N')
AS
BEGIN
    -- ==========================================================
    -- 프로시저명 : dbo.USP_ADMIN_OPERATOR_SAVE
    -- 설      명 : 특정 운영자의 계정 활성 상태와 업무별 작성/게시 권한을 업데이트합니다.
    -- ==========================================================
    SET NOCOUNT ON;

    -- 운영자 상태 및 업무별 권한 정보 갱신
    UPDATE dbo.TBL_OPERATOR
    SET status             = @p_status,        -- 계정 상태
        perm_notice_write  = @p_notice_write,  -- 공지/게시글 작성 권한
        perm_notice_post   = @p_notice_post,   -- 공지/게시글 게시 권한
        perm_video_write   = @p_video_write,   -- 교육영상 작성 권한
        perm_video_post    = @p_video_post,    -- 교육영상 게시 권한
        perm_cal_write     = @p_cal_write,     -- 상시재배력 작성 권한
        perm_cal_post      = @p_cal_post,      -- 상시재배력 게시 권한
        perm_orchard_write = @p_orchard_write, -- 월별과원관리 작성 권한
        perm_orchard_post  = @p_orchard_post,  -- 월별과원관리 게시 권한
        updated_at         = GETDATE()         -- 최종 수정 일시
    WHERE operator_id      = @p_operator_id;
END;
GO

-- ==============================================================
-- [5] 홈 대시보드 데이터 통합 조회 (USP_ADMIN_HOME_DATA)
-- ==============================================================
IF OBJECT_ID('dbo.USP_ADMIN_HOME_DATA', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_HOME_DATA;
GO
CREATE PROCEDURE dbo.USP_ADMIN_HOME_DATA
    @p_year   INT,   -- 기준 연도 (예: 2026)
    @p_month  INT    -- 기준 월 (1 ~ 12)
AS
BEGIN
    -- ==========================================================
    -- 프로시저명 : dbo.USP_ADMIN_HOME_DATA
    -- 설      명 : 관리자 홈(대시보드)에 표시할 4개 영역(이달의 과원관리, 상시 재배력, 교육영상, 최근 수정 게시글) 데이터를 조회합니다.
    -- ==========================================================
    SET NOCOUNT ON;

    -- [ResultSet 1] 이달의 과원관리 단건 조회 (기준 연도/월)
    SELECT TOP 1 
        orchard_id,     -- 과원관리 고유 번호 (PK)
        target_year,    -- 대상 연도
        target_month,   -- 대상 월 (1~12)
        title,          -- 과원관리 제목
        thumbnail_path, -- 대표 썸네일 이미지 경로
        visibility,     -- 공개 상태 ('public'/'private')
        channel_web,    -- 웹 노출 여부 ('Y'/'N')
        channel_app,    -- 앱 노출 여부 ('Y'/'N')
        updated_at      -- 최종 수정 일시
    FROM dbo.TBL_ORCHARD_CONTENT
    WHERE target_year = @p_year AND target_month = @p_month AND is_deleted = 'N';

    -- [ResultSet 2] 상시 재배력 단건 조회 (기준 연도)
    SELECT TOP 1 
        calendar_id,    -- 재배력 고유 번호 (PK)
        target_year,    -- 기준 연도
        title,          -- 재배력 제목
        thumbnail_path, -- 대표 썸네일 이미지 경로
        visibility,     -- 공개 상태 ('public'/'private')
        channel_web,    -- 웹 노출 여부 ('Y'/'N')
        channel_app,    -- 앱 노출 여부 ('Y'/'N')
        updated_at      -- 최종 수정 일시
    FROM dbo.TBL_CALENDAR_CONTENT
    WHERE target_year = @p_year AND is_deleted = 'N';

    -- [ResultSet 3] 교육영상 조회 (홈 메인 선정 영상 우선, 최대 3건)
    SELECT TOP 3 
        video_id,       -- 교육영상 고유 번호 (PK)
        youtube_id,     -- 유튜브 비디오 ID (11자리)
        source_url,     -- 원본 유튜브 URL
        display_title,  -- 화면 표시 제목
        original_title, -- 유튜브 원본 제목
        category,       -- 영상 분류 ('재배기술'/'생육단계'/'미분류')
        thumbnail_url,  -- 유튜브 썸네일 이미지 URL
        is_home_web,    -- 웹 홈 메인 노출 선정 여부 ('Y'/'N')
        is_home_app,    -- 앱 홈 메인 노출 선정 여부 ('Y'/'N')
        visibility,     -- 공개 상태 ('public'/'private')
        period_start,   -- 게시 시작일
        period_end,     -- 게시 종료일
        updated_at      -- 최종 수정 일시
    FROM dbo.TBL_VIDEO_CONTENT
    WHERE is_deleted = 'N' AND visibility = 'public'
    ORDER BY 
        CASE WHEN is_home_web = 'Y' OR is_home_app = 'Y' THEN 0 ELSE 1 END ASC,
        updated_at DESC;

    -- [ResultSet 4] 최근 수정한 게시글 조회 (공지/복숭아정보/재배자료 최신 3건)
    SELECT TOP 3 
        content_id,     -- 게시글 고유 번호 (PK)
        category,       -- 게시판 분류 ('공지'/'복숭아정보'/'재배자료')
        title,          -- 게시글 제목
        visibility,     -- 공개 설정 ('public'/'private')
        is_draft,       -- 임시저장 여부 ('Y'/'N')
        period_start,   -- 게시 시작일
        period_end,     -- 게시 종료일
        author_name,    -- 작성자 이름
        updated_at,     -- 최종 수정 일시
        -- 게시 상태 실시간 계산 컬럼
        CASE 
            WHEN is_draft = 'Y' THEN N'임시저장'
            WHEN visibility = 'private' THEN N'비공개'
            WHEN period_start > GETDATE() THEN N'게시예정'
            WHEN period_end IS NOT NULL AND period_end < CONVERT(VARCHAR(10), GETDATE(), 120) THEN N'게시종료'
            ELSE N'게시중'
        END AS post_status -- 계산된 게시 상태 ('임시저장'/'비공개'/'게시예정'/'게시종료'/'게시중')
    FROM dbo.TBL_BOARD_CONTENT
    WHERE is_deleted = 'N'
    ORDER BY updated_at DESC, content_id DESC;
END;
GO

-- ==============================================================
-- [6] 게시글 카테고리별 임시저장 건수 조회 (USP_ADMIN_BOARD_DRAFT_COUNT)
-- ==============================================================
IF OBJECT_ID('dbo.USP_ADMIN_BOARD_DRAFT_COUNT', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_BOARD_DRAFT_COUNT;
GO
CREATE PROCEDURE dbo.USP_ADMIN_BOARD_DRAFT_COUNT
    @p_category NVARCHAR(30)   -- 게시판 분류 ('공지', '언론보도', '업장홍보', '복숭아와 건강', '복숭아관련 소식', '복숭아 홍보', '재배자료')
AS
BEGIN
    -- ==========================================================
    -- 프로시저명 : dbo.USP_ADMIN_BOARD_DRAFT_COUNT
    -- 설      명 : 특정 게시판 분류(@p_category)의 삭제되지 않은 임시저장(is_draft='Y') 게시글 건수를 조회합니다.
    -- ==========================================================
    SET NOCOUNT ON;

    -- 해당 카테고리의 임시저장 게시글 수 집계
    SELECT 
        COUNT(*) AS draft_count -- 임시저장 게시글 건수
    FROM dbo.TBL_BOARD_CONTENT
    WHERE ((@p_category = N'공지' AND category IN (N'공지', N'공지사항'))
       OR (@p_category IN (N'복숭아와 건강', N'복숭아정보') AND category IN (N'복숭아와 건강', N'복숭아정보'))
       OR category = @p_category)
      AND is_draft = 'Y'
      AND is_deleted = 'N';
END;
GO

-- ==============================================================
-- [7] 게시글 목록 조회 (검색/필터/페이징) (USP_ADMIN_BOARD_LIST)
-- ==============================================================
IF OBJECT_ID('dbo.USP_ADMIN_BOARD_LIST', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_BOARD_LIST;
GO
CREATE PROCEDURE dbo.USP_ADMIN_BOARD_LIST
    @p_category     NVARCHAR(30)   = NULL,      -- 게시판 분류 ('공지', '언론보도', '업장홍보', '복숭아와 건강', '복숭아관련 소식', '복숭아 홍보', '재배자료' / NULL: 전체)
    @p_is_draft     CHAR(1)        = 'N',       -- 임시저장 여부 ('Y': 임시저장 목록, 'N': 일반 목록)
    @p_period_type  VARCHAR(20)    = 'all',     -- 기간 필터 유형 ('all': 전체, '1': 1개월, '3': 3개월, '6': 6개월, 'custom': 직접입력)
    @p_period_start VARCHAR(10)    = NULL,      -- 검색 시작일 (YYYY-MM-DD)
    @p_period_end   VARCHAR(10)    = NULL,      -- 검색 종료일 (YYYY-MM-DD)
    @p_status       VARCHAR(20)    = NULL,      -- 게시 상태 필터 ('게시예정', '게시중', '게시종료', '비공개')
    @p_field        VARCHAR(20)    = 'titleBody', -- 검색 대상 필드 ('titleBody': 제목+내용, 'title': 제목, 'author': 작성자)
    @p_keyword      NVARCHAR(100)  = NULL,      -- 검색 키워드
    @p_page         INT            = 1,         -- 현재 페이지 번호 (1부터 시작)
    @p_page_size    INT            = 10         -- 페이지당 출력 행 수
AS
BEGIN
    -- ==========================================================
    -- 프로시저명 : dbo.USP_ADMIN_BOARD_LIST
    -- 설      명 : 게시판 분류별 게시글(또는 임시저장글) 목록을 기간, 상태, 키워드 조건으로 필터링하여 페이징 조회합니다.
    -- ==========================================================
    SET NOCOUNT ON;

    DECLARE @v_now_date VARCHAR(10) = CONVERT(VARCHAR(10), GETDATE(), 120);

    -- 빠른 기간 선택(1/3/6개월) 시 시작일 자동 계산
    IF @p_period_type = '1'
        SET @p_period_start = CONVERT(VARCHAR(10), DATEADD(MONTH, -1, GETDATE()), 120);
    ELSE IF @p_period_type = '3'
        SET @p_period_start = CONVERT(VARCHAR(10), DATEADD(MONTH, -3, GETDATE()), 120);
    ELSE IF @p_period_type = '6'
        SET @p_period_start = CONVERT(VARCHAR(10), DATEADD(MONTH, -6, GETDATE()), 120);

    -- 게시글 필터링 및 상태 계산 CTE
    ;WITH CTE_BOARD AS (
        SELECT 
            content_id,   -- 게시글 고유 번호 (PK)
            category,     -- 게시판 분류
            title,        -- 제목
            body_html,    -- 본문 HTML
            visibility,   -- 공개 여부 ('public'/'private')
            is_draft,     -- 임시저장 여부 ('Y'/'N')
            is_pinned,    -- 상단고정 여부 ('Y'/'N')
            channel_web,  -- 웹 노출 여부 ('Y'/'N')
            channel_app,  -- 앱 노출 여부 ('Y'/'N')
            period_start, -- 게시 시작일
            period_end,   -- 게시 종료일
            has_end_date, -- 종료일 지정 여부 ('Y'/'N')
            is_urgent,    -- 긴급 공지 여부 ('Y'/'N')
            urgent_start, -- 긴급 노출 시작일
            urgent_end,   -- 긴급 노출 종료일
            author_id,    -- 작성자 ID
            author_name,  -- 작성자 이름
            updated_at,   -- 최종 수정 일시
            -- 게시 상태 실시간 계산
            CASE 
                WHEN is_draft = 'Y' THEN N'임시저장'
                WHEN visibility = 'private' THEN N'비공개'
                WHEN period_start > GETDATE() THEN N'게시예정'
                WHEN period_end IS NOT NULL AND period_end < @v_now_date THEN N'게시종료'
                ELSE N'게시중'
            END AS post_status -- 계산된 게시 상태
        FROM dbo.TBL_BOARD_CONTENT
        WHERE (@p_category IS NULL OR @p_category = N''
           OR (@p_category = N'공지' AND category IN (N'공지', N'공지사항'))
           OR (@p_category IN (N'복숭아와 건강', N'복숭아정보') AND category IN (N'복숭아와 건강', N'복숭아정보'))
           OR category = @p_category)
          AND is_deleted = 'N'
          AND is_draft = @p_is_draft
          -- 기간 조건 (최종 수정일 기준)
          AND (@p_period_start IS NULL OR updated_at >= CAST(@p_period_start AS DATETIME))
          AND (@p_period_end IS NULL OR updated_at < DATEADD(DAY, 1, CAST(@p_period_end AS DATETIME)))
          -- 키워드 검색 조건
          AND (
              @p_keyword IS NULL OR @p_keyword = ''
              OR (@p_field = 'titleBody' AND (title LIKE '%' + @p_keyword + '%' OR body_html LIKE '%' + @p_keyword + '%'))
              OR (@p_field = 'title' AND title LIKE '%' + @p_keyword + '%')
              OR (@p_field = 'author' AND author_name LIKE '%' + @p_keyword + '%')
          )
    )
    -- 상태 필터 적용 및 상단고정 우선 정렬 후 페이징 반환
    SELECT 
        content_id,                  -- 게시글 고유 번호 (PK)
        category,                    -- 게시판 분류
        title,                       -- 제목
        visibility,                  -- 공개 여부
        is_draft,                    -- 임시저장 여부
        is_pinned,                   -- 상단고정 여부
        channel_web,                 -- 웹 노출 여부
        channel_app,                 -- 앱 노출 여부
        period_start,                -- 게시 시작일
        period_end,                  -- 게시 종료일
        has_end_date,                -- 종료일 지정 여부
        is_urgent,                   -- 긴급 공지 여부
        post_status,                 -- 실시간 게시 상태
        author_name,                 -- 작성자 이름
        updated_at,                  -- 최종 수정 일시
        COUNT(*) OVER() AS total_count -- 검색 조건 일치 전체 건수
    FROM CTE_BOARD
    WHERE (@p_status IS NULL OR @p_status = '' OR post_status = @p_status)
    ORDER BY 
        -- 공지사항 중 상단고정이며 현재 '게시중'인 항목 최상단 정렬
        CASE WHEN category = N'공지' AND is_pinned = 'Y' AND post_status = N'게시중' THEN 0 ELSE 1 END ASC,
        updated_at DESC, content_id DESC
    OFFSET (@p_page - 1) * @p_page_size ROWS
    FETCH NEXT @p_page_size ROWS ONLY;
END;
GO

-- ==============================================================
-- [8] 게시글 상세 조회 (본문 + 첨부파일) (USP_ADMIN_BOARD_GET)
-- ==============================================================
IF OBJECT_ID('dbo.USP_ADMIN_BOARD_GET', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_BOARD_GET;
GO
CREATE PROCEDURE dbo.USP_ADMIN_BOARD_GET
    @p_content_id INT   -- 조회할 게시글 고유 번호 (content_id)
AS
BEGIN
    -- ==========================================================
    -- 프로시저명 : dbo.USP_ADMIN_BOARD_GET
    -- 설      명 : 게시글 단건 본문 상세 정보와 해당 게시글에 등록된 첨부파일 목록을 조회합니다.
    -- ==========================================================
    SET NOCOUNT ON;

    -- [ResultSet 1] 게시글 본문 상세 정보 조회
    SELECT 
        content_id,        -- 게시글 고유 번호 (PK)
        category,          -- 게시판 분류 ('공지'/'언론보도'/'업장홍보'/'복숭아정보'/'재배자료')
        title,             -- 게시글 제목
        body_html,         -- 게시글 본문 (HTML)
        visibility,        -- 공개 여부 ('public'/'private')
        is_draft,          -- 임시저장 여부 ('Y'/'N')
        is_pinned,         -- 상단고정 여부 ('Y'/'N')
        channel_web,       -- 웹 채널 노출 여부 ('Y'/'N')
        channel_app,       -- 앱 채널 노출 여부 ('Y'/'N')
        period_start,      -- 게시 시작일
        period_end,        -- 게시 종료일
        has_end_date,      -- 게시 종료일 지정 여부 ('Y'/'N')
        is_urgent,         -- 긴급 노출 사용 여부 ('Y'/'N')
        urgent_start,      -- 긴급 노출 시작일
        urgent_end,        -- 긴급 노출 종료일
        urgent_order,      -- 긴급 노출 정렬 순서
        related_type,      -- 연결 자료 유형 ('calendar'/'orchard'/'video'/'post')
        related_target_id, -- 연결 자료 대상 식별값
        author_id,         -- 작성자 ID
        author_name,       -- 작성자 이름
        created_at,        -- 최초 등록 일시
        updated_at         -- 최종 수정 일시
    FROM dbo.TBL_BOARD_CONTENT
    WHERE content_id = @p_content_id AND is_deleted = 'N';

    -- [ResultSet 2] 게시글 첨부파일 목록 조회
    SELECT 
        attach_id,     -- 첨부파일 고유 번호 (PK)
        content_id,    -- 소속 게시글 고유 번호 (FK)
        original_name, -- 업로드 원본 파일명
        saved_name,    -- 서버 저장 파일명
        file_path,     -- 서버 파일 상대 경로
        file_size,     -- 파일 크기 (Byte)
        download_cnt   -- 다운로드 횟수
    FROM dbo.TBL_BOARD_ATTACH
    WHERE content_id = @p_content_id
    ORDER BY attach_id ASC;
END;
GO

-- ==============================================================
-- [9] 게시글 등록 및 수정 (USP_ADMIN_BOARD_SAVE)
-- ==============================================================
IF OBJECT_ID('dbo.USP_ADMIN_BOARD_SAVE', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_BOARD_SAVE;
GO
CREATE PROCEDURE dbo.USP_ADMIN_BOARD_SAVE
    @p_content_id         INT            = 0,    -- 게시글 고유 번호 (0 이하: 신규 등록, 양수: 기존 글 수정)
    @p_category           NVARCHAR(30),          -- 게시판 분류 ('공지', '언론보도', '업장홍보', '복숭아와 건강', '복숭아관련 소식', '복숭아 홍보', '재배자료')
    @p_title              NVARCHAR(200),         -- 게시글 제목
    @p_body_html          NVARCHAR(MAX),         -- 게시글 본문 내용 (HTML)
    @p_visibility         VARCHAR(10),           -- 공개 여부 ('public': 공개, 'private': 비공개)
    @p_is_draft           CHAR(1),               -- 임시저장 여부 ('Y': 임시저장, 'N': 정식저장)
    @p_is_pinned          CHAR(1),               -- 공지사항 상단고정 여부 ('Y'/'N')
    @p_channel_web        CHAR(1),               -- 웹 채널 노출 여부 ('Y'/'N')
    @p_channel_app        CHAR(1),               -- 앱 채널 노출 여부 ('Y'/'N')
    @p_period_start       DATETIME,              -- 게시 시작일
    @p_period_end         DATETIME       = NULL, -- 게시 종료일 (종료일 없음일 경우 NULL)
    @p_has_end_date       CHAR(1)        = 'Y',  -- 게시 종료일 사용 여부 ('Y'/'N')
    @p_is_urgent          CHAR(1)        = 'N',  -- 긴급 공지 사용 여부 ('Y'/'N')
    @p_urgent_start       DATETIME       = NULL, -- 긴급 노출 시작일
    @p_urgent_end         DATETIME       = NULL, -- 긴급 노출 종료일
    @p_related_type       VARCHAR(30)    = NULL, -- 연결 자료 유형 ('calendar'/'orchard'/'video'/'post')
    @p_related_target_id  VARCHAR(100)   = NULL, -- 연결 자료 대상 식별값
    @p_author_id          VARCHAR(50),           -- 작성/수정 운영자 ID
    @p_author_name        NVARCHAR(50),          -- 작성/수정 운영자 이름
    @r_new_id             INT OUTPUT             -- 저장 완료된 게시글 고유 번호(content_id) 반환
AS
BEGIN
    -- ==========================================================
    -- 프로시저명 : dbo.USP_ADMIN_BOARD_SAVE
    -- 설      명 : 게시글(공지/언론보도/업장홍보/복숭아정보/재배자료)을 신규 등록하거나 기존 게시글을 수정하고 content_id를 반환합니다.
    -- ==========================================================
    SET NOCOUNT ON;

    IF @p_content_id <= 0
    BEGIN
        -- 신규 게시글 등록 (INSERT)
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
        -- 기존 게시글 정보 수정 (UPDATE)
        UPDATE dbo.TBL_BOARD_CONTENT
        SET category           = @p_category,          -- 게시판 분류
            title              = @p_title,             -- 게시글 제목
            body_html          = @p_body_html,         -- 게시글 본문 HTML
            visibility         = @p_visibility,        -- 공개 여부
            is_draft           = @p_is_draft,          -- 임시저장 여부
            is_pinned          = @p_is_pinned,         -- 상단고정 여부
            channel_web        = @p_channel_web,       -- 웹 채널 노출 여부
            channel_app        = @p_channel_app,       -- 앱 채널 노출 여부
            period_start       = @p_period_start,      -- 게시 시작일
            period_end         = @p_period_end,        -- 게시 종료일
            has_end_date       = @p_has_end_date,      -- 종료일 사용 여부
            is_urgent          = @p_is_urgent,         -- 긴급 공지 여부
            urgent_start       = @p_urgent_start,      -- 긴급 시작일
            urgent_end         = @p_urgent_end,        -- 긴급 종료일
            related_type       = @p_related_type,      -- 연결 자료 유형
            related_target_id  = @p_related_target_id, -- 연결 자료 대상 ID
            author_id          = @p_author_id,         -- 수정자 ID
            author_name        = @p_author_name,       -- 수정자 이름
            updated_at         = GETDATE()             -- 최종 수정 일시
        WHERE content_id       = @p_content_id;

        SET @r_new_id = @p_content_id;
    END;
END;
GO

-- ==============================================================
-- [10] 게시글 소프트 삭제 (다건/단건) (USP_ADMIN_BOARD_DELETE)
-- ==============================================================
IF OBJECT_ID('dbo.USP_ADMIN_BOARD_DELETE', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_BOARD_DELETE;
GO
CREATE PROCEDURE dbo.USP_ADMIN_BOARD_DELETE
    @p_content_ids NVARCHAR(MAX)    -- 쉼표(,)로 구분된 삭제 대상 게시글 ID 문자열 (예: '1,2,3')
AS
BEGIN
    -- ==========================================================
    -- 프로시저명 : dbo.USP_ADMIN_BOARD_DELETE
    -- 설      명 : 선택한 1건 이상의 게시글을 소프트 삭제(is_deleted='Y') 처리합니다.
    -- ==========================================================
    SET NOCOUNT ON;

    -- 쉼표 구분 ID 목록에 해당하는 게시글 소프트 삭제 처리
    UPDATE dbo.TBL_BOARD_CONTENT
    SET is_deleted = 'Y',       -- 삭제 여부 플래그 ('Y')
        updated_at = GETDATE()  -- 삭제 처리 일시
    WHERE content_id IN (
        SELECT CAST(value AS INT) FROM STRING_SPLIT(@p_content_ids, ',')
    );
END;
GO

-- ==============================================================
-- [11] 게시글 첨부파일 등록 (USP_ADMIN_BOARD_ATTACH_ADD)
-- ==============================================================
IF OBJECT_ID('dbo.USP_ADMIN_BOARD_ATTACH_ADD', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_BOARD_ATTACH_ADD;
GO
CREATE PROCEDURE dbo.USP_ADMIN_BOARD_ATTACH_ADD
    @p_content_id    INT,           -- 소속 게시글 고유 번호 (TBL_BOARD_CONTENT.content_id)
    @p_original_name NVARCHAR(260), -- 사용자가 업로드한 원본 파일명
    @p_saved_name    NVARCHAR(260), -- 서버에 저장된 고유 파일명
    @p_file_path     NVARCHAR(500), -- 서버 저장 상대 경로 (예: /upload/board/...)
    @p_file_size     BIGINT         -- 파일 크기 (Byte 단위)
AS
BEGIN
    -- ==========================================================
    -- 프로시저명 : dbo.USP_ADMIN_BOARD_ATTACH_ADD
    -- 설      명 : 게시글에 업로드된 첨부파일 메타데이터를 등록합니다.
    -- ==========================================================
    SET NOCOUNT ON;

    -- 게시글 첨부파일 레코드 추가
    INSERT INTO dbo.TBL_BOARD_ATTACH (
        content_id,    -- 게시글 고유 번호 (FK)
        original_name, -- 원본 파일명
        saved_name,    -- 서버 저장 파일명
        file_path,     -- 파일 저장 경로
        file_size,     -- 파일 크기 (Byte)
        created_at     -- 등록 일시
    ) VALUES (
        @p_content_id, @p_original_name, @p_saved_name, @p_file_path, @p_file_size, GETDATE()
    );
END;
GO

-- ==============================================================
-- [12] 게시글 첨부파일 개별 삭제 (USP_ADMIN_BOARD_ATTACH_DEL)
-- ==============================================================
IF OBJECT_ID('dbo.USP_ADMIN_BOARD_ATTACH_DEL', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_BOARD_ATTACH_DEL;
GO
CREATE PROCEDURE dbo.USP_ADMIN_BOARD_ATTACH_DEL
    @p_attach_id INT    -- 삭제할 첨부파일 고유 번호 (attach_id)
AS
BEGIN
    -- ==========================================================
    -- 프로시저명 : dbo.USP_ADMIN_BOARD_ATTACH_DEL
    -- 설      명 : 특정 첨부파일(@p_attach_id) 레코드를 테이블에서 삭제합니다.
    -- ==========================================================
    SET NOCOUNT ON;

    -- 첨부파일 단건 물리 삭제
    DELETE FROM dbo.TBL_BOARD_ATTACH
    WHERE attach_id = @p_attach_id;
END;
GO

-- ==============================================================
-- [13] 월별 과원관리 연도별(1~12월) 현황 조회 (USP_ADMIN_ORCHARD_LIST)
-- ==============================================================
IF OBJECT_ID('dbo.USP_ADMIN_ORCHARD_LIST', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_ORCHARD_LIST;
GO
CREATE PROCEDURE dbo.USP_ADMIN_ORCHARD_LIST
    @p_year INT   -- 조회할 대상 연도 (예: 2026)
AS
BEGIN
    -- ==========================================================
    -- 프로시저명 : dbo.USP_ADMIN_ORCHARD_LIST
    -- 설      명 : 특정 연도(@p_year)의 1월~12월 슬롯별 과원관리 등록 현황 및 노출 정보를 조회합니다.
    -- ==========================================================
    SET NOCOUNT ON;

    -- 1월부터 12월까지 고정 월 가상 테이블과 실제 등록 데이터를 LEFT JOIN하여 조회
    ;WITH Months AS (
        SELECT 1 AS month_num UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
        UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8
        UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12
    )
    SELECT 
        m.month_num AS target_month,                                               -- 대상 월 (1~12)
        o.orchard_id,                                                              -- 과원관리 고유 번호 (미등록 시 NULL)
        ISNULL(o.target_year, @p_year) AS target_year,                             -- 대상 연도
        o.title,                                                                   -- 과원관리 제목
        o.thumbnail_path,                                                          -- 대표 썸네일 이미지 경로
        ISNULL(o.visibility, 'private') AS visibility,                             -- 공개 상태 ('public'/'private')
        ISNULL(o.channel_web, 'N') AS channel_web,                                 -- 웹 채널 노출 여부 ('Y'/'N')
        ISNULL(o.channel_app, 'N') AS channel_app,                                 -- 앱 채널 노출 여부 ('Y'/'N')
        CASE WHEN o.orchard_id IS NOT NULL THEN 'REGISTERED' ELSE 'EMPTY' END AS status, -- 슬롯 등록 상태 ('REGISTERED'/'EMPTY')
        o.updated_at                                                               -- 최종 수정 일시
    FROM Months m
    LEFT JOIN dbo.TBL_ORCHARD_CONTENT o 
        ON o.target_month = m.month_num 
       AND o.target_year = @p_year 
       AND o.is_deleted = 'N'
    ORDER BY m.month_num ASC;
END;
GO

-- ==============================================================
-- [14] 월별 과원관리 단건 상세 조회 (USP_ADMIN_ORCHARD_GET)
-- ==============================================================
IF OBJECT_ID('dbo.USP_ADMIN_ORCHARD_GET', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_ORCHARD_GET;
GO
CREATE PROCEDURE dbo.USP_ADMIN_ORCHARD_GET
    @p_year  INT,   -- 조회할 대상 연도 (예: 2026)
    @p_month INT    -- 조회할 대상 월 (1 ~ 12)
AS
BEGIN
    -- ==========================================================
    -- 프로시저명 : dbo.USP_ADMIN_ORCHARD_GET
    -- 설      명 : 특정 연월(@p_year, @p_month)의 과원관리 기본 정보와 Web/App 채널별 본문 이미지 목록을 조회합니다.
    -- ==========================================================
    SET NOCOUNT ON;

    DECLARE @v_orchard_id INT = 0;

    -- 대상 연월에 해당하는 과원관리 고유 번호(orchard_id) 조회
    SELECT TOP 1 @v_orchard_id = orchard_id
    FROM dbo.TBL_ORCHARD_CONTENT
    WHERE target_year = @p_year AND target_month = @p_month AND is_deleted = 'N';

    -- [ResultSet 1] 월별 과원관리 마스터 기본 정보 조회
    SELECT TOP 1
        orchard_id,     -- 과원관리 고유 번호 (PK)
        target_year,    -- 대상 연도
        target_month,   -- 대상 월 (1~12)
        title,          -- 과원관리 제목
        thumbnail_path, -- 대표 썸네일 경로
        visibility,     -- 공개 상태 ('public'/'private')
        channel_web,    -- 웹 노출 여부 ('Y'/'N')
        channel_app,    -- 앱 노출 여부 ('Y'/'N')
        updated_at      -- 최종 수정 일시
    FROM dbo.TBL_ORCHARD_CONTENT
    WHERE orchard_id = @v_orchard_id;

    -- [ResultSet 2] Web/App 채널별 등록 이미지 목록 조회 (채널 및 노출 순서 오름차순)
    SELECT 
        image_id,      -- 이미지 고유 번호 (PK)
        orchard_id,    -- 과원관리 고유 번호 (FK)
        channel_type,  -- 채널 구분 ('WEB'/'APP')
        sort_order,    -- 노출 정렬 순서
        original_name, -- 원본 이미지 파일명
        saved_name,    -- 서버 저장 파일명
        file_path      -- 이미지 파일 상대 경로
    FROM dbo.TBL_ORCHARD_IMAGE
    WHERE orchard_id = @v_orchard_id
    ORDER BY channel_type ASC, sort_order ASC;
END;
GO

-- ==============================================================
-- [15] 월별 과원관리 저장 (등록/수정 Upsert) (USP_ADMIN_ORCHARD_SAVE)
-- ==============================================================
IF OBJECT_ID('dbo.USP_ADMIN_ORCHARD_SAVE', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_ORCHARD_SAVE;
GO
CREATE PROCEDURE dbo.USP_ADMIN_ORCHARD_SAVE
    @p_year           INT,                      -- 대상 연도 (예: 2026)
    @p_month          INT,                      -- 대상 월 (1 ~ 12)
    @p_title          NVARCHAR(200),            -- 과원관리 제목 (예: 2월 과원관리)
    @p_thumbnail_path NVARCHAR(500) = NULL,     -- 대표 썸네일 이미지 경로
    @p_visibility     VARCHAR(10)   = 'public', -- 공개 상태 ('public': 공개, 'private': 비공개)
    @p_channel_web    CHAR(1)       = 'Y',      -- 웹 채널 노출 여부 ('Y'/'N')
    @p_channel_app    CHAR(1)       = 'Y',      -- 앱 채널 노출 여부 ('Y'/'N')
    @p_author_id      VARCHAR(50)   = NULL,     -- 작성/수정 운영자 ID
    @r_orchard_id     INT OUTPUT                -- 저장된 과원관리 고유 번호(orchard_id) 반환
AS
BEGIN
    -- ==========================================================
    -- 프로시저명 : dbo.USP_ADMIN_ORCHARD_SAVE
    -- 설      명 : 특정 연월(@p_year, @p_month)의 과원관리 마스터 정보를 등록 또는 수정(Upsert)하고 orchard_id를 반환합니다.
    -- ==========================================================
    SET NOCOUNT ON;

    DECLARE @v_existing_id INT;

    -- 동일 연월 데이터 존재 여부 확인
    SELECT @v_existing_id = orchard_id 
    FROM dbo.TBL_ORCHARD_CONTENT 
    WHERE target_year = @p_year AND target_month = @p_month;

    IF @v_existing_id IS NULL
    BEGIN
        -- 해당 연월 과원관리 신규 등록 (INSERT)
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
        -- 기존 연월 과원관리 정보 갱신 (UPDATE)
        UPDATE dbo.TBL_ORCHARD_CONTENT
        SET title          = @p_title,                              -- 제목
            thumbnail_path = ISNULL(@p_thumbnail_path, thumbnail_path), -- 썸네일 경로 (NULL이면 기존 유지)
            visibility     = @p_visibility,                         -- 공개 여부
            channel_web    = @p_channel_web,                        -- 웹 노출 여부
            channel_app    = @p_channel_app,                        -- 앱 노출 여부
            author_id      = ISNULL(@p_author_id, author_id),       -- 작성/수정자 ID
            is_deleted     = 'N',                                   -- 삭제 상태 해제
            updated_at     = GETDATE()                              -- 최종 수정 일시
        WHERE orchard_id   = @v_existing_id;

        SET @r_orchard_id = @v_existing_id;
    END;
END;
GO

-- ==============================================================
-- [16] 월별 과원관리 소프트 삭제 (USP_ADMIN_ORCHARD_DELETE)
-- ==============================================================
IF OBJECT_ID('dbo.USP_ADMIN_ORCHARD_DELETE', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_ORCHARD_DELETE;
GO
CREATE PROCEDURE dbo.USP_ADMIN_ORCHARD_DELETE
    @p_year  INT,   -- 삭제할 대상 연도 (예: 2026)
    @p_month INT    -- 삭제할 대상 월 (1 ~ 12)
AS
BEGIN
    -- ==========================================================
    -- 프로시저명 : dbo.USP_ADMIN_ORCHARD_DELETE
    -- 설      명 : 특정 연월(@p_year, @p_month)의 과원관리 자료를 소프트 삭제(is_deleted='Y') 처리합니다.
    -- ==========================================================
    SET NOCOUNT ON;

    -- 대상 연월 과원관리 소프트 삭제 처리
    UPDATE dbo.TBL_ORCHARD_CONTENT
    SET is_deleted = 'Y',       -- 삭제 여부 플래그 ('Y')
        updated_at = GETDATE()  -- 삭제 처리 일시
    WHERE target_year = @p_year AND target_month = @p_month;
END;
GO

-- ==============================================================
-- [17] 월별 과원관리 본문 이미지 초기화 (USP_ADMIN_ORCHARD_IMAGE_CLEAR)
-- ==============================================================
IF OBJECT_ID('dbo.USP_ADMIN_ORCHARD_IMAGE_CLEAR', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_ORCHARD_IMAGE_CLEAR;
GO
CREATE PROCEDURE dbo.USP_ADMIN_ORCHARD_IMAGE_CLEAR
    @p_orchard_id   INT,                -- 과원관리 고유 번호 (TBL_ORCHARD_CONTENT.orchard_id)
    @p_channel_type VARCHAR(10) = NULL  -- 초기화할 채널 구분 ('WEB', 'APP', NULL 또는 빈값이면 전체 채널 삭제)
AS
BEGIN
    -- ==========================================================
    -- 프로시저명 : dbo.USP_ADMIN_ORCHARD_IMAGE_CLEAR
    -- 설      명 : 과원관리 저장 시 이미지 목록 재구성을 위해 기존 등록된 채널별(또는 전체) 본문 이미지를 삭제합니다.
    -- ==========================================================
    SET NOCOUNT ON;

    -- 채널 구분이 없으면 전체 이미지 삭제, 지정된 경우 해당 채널(WEB/APP) 이미지만 삭제
    IF @p_channel_type IS NULL OR @p_channel_type = ''
        DELETE FROM dbo.TBL_ORCHARD_IMAGE WHERE orchard_id = @p_orchard_id;
    ELSE
        DELETE FROM dbo.TBL_ORCHARD_IMAGE WHERE orchard_id = @p_orchard_id AND channel_type = @p_channel_type;
END;
GO

-- ==============================================================
-- [18] 월별 과원관리 본문 이미지 등록 (USP_ADMIN_ORCHARD_IMAGE_ADD)
-- ==============================================================
IF OBJECT_ID('dbo.USP_ADMIN_ORCHARD_IMAGE_ADD', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_ORCHARD_IMAGE_ADD;
GO
CREATE PROCEDURE dbo.USP_ADMIN_ORCHARD_IMAGE_ADD
    @p_orchard_id    INT,           -- 과원관리 고유 번호 (TBL_ORCHARD_CONTENT.orchard_id)
    @p_channel_type  VARCHAR(10),   -- 노출 채널 구분 ('WEB' 또는 'APP')
    @p_sort_order    INT = 1,       -- 채널 내 이미지 노출 순서 (1부터 시작)
    @p_original_name NVARCHAR(260), -- 업로드 원본 이미지 파일명
    @p_saved_name    NVARCHAR(260), -- 서버 저장 고유 파일명
    @p_file_path     NVARCHAR(500)  -- 이미지 파일 저장 상대 경로
AS
BEGIN
    -- ==========================================================
    -- 프로시저명 : dbo.USP_ADMIN_ORCHARD_IMAGE_ADD
    -- 설      명 : 월별 과원관리의 Web 또는 App 채널 본문 이미지를 노출 순서와 함께 등록합니다.
    -- ==========================================================
    SET NOCOUNT ON;

    -- 과원관리 채널별 본문 이미지 레코드 추가
    INSERT INTO dbo.TBL_ORCHARD_IMAGE (
        orchard_id,    -- 과원관리 고유 번호 (FK)
        channel_type,  -- 채널 구분 ('WEB'/'APP')
        sort_order,    -- 노출 정렬 순서
        original_name, -- 원본 파일명
        saved_name,    -- 서버 저장 파일명
        file_path,     -- 이미지 저장 경로
        created_at     -- 등록 일시
    ) VALUES (
        @p_orchard_id, UPPER(@p_channel_type), @p_sort_order, @p_original_name, @p_saved_name, @p_file_path, GETDATE()
    );
END;
GO

-- ==============================================================
-- [19] 상시 재배력 조회 (USP_ADMIN_CALENDAR_GET)
-- ==============================================================
IF OBJECT_ID('dbo.USP_ADMIN_CALENDAR_GET', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_CALENDAR_GET;
GO
CREATE PROCEDURE dbo.USP_ADMIN_CALENDAR_GET
    @p_year INT   -- 조회할 기준 연도 (예: 2026)
AS
BEGIN
    -- ==========================================================
    -- 프로시저명 : dbo.USP_ADMIN_CALENDAR_GET
    -- 설      명 : 기준 연도(@p_year)의 상시 재배력 기본 정보와 Web/App 채널별 본문 이미지 목록을 조회합니다.
    -- ==========================================================
    SET NOCOUNT ON;

    DECLARE @v_calendar_id INT = 0;

    -- 대상 연도의 상시 재배력 고유 번호(calendar_id) 조회
    SELECT TOP 1 @v_calendar_id = calendar_id
    FROM dbo.TBL_CALENDAR_CONTENT
    WHERE target_year = @p_year AND is_deleted = 'N';

    -- [ResultSet 1] 상시 재배력 마스터 기본 정보 조회
    SELECT TOP 1
        calendar_id,    -- 재배력 고유 번호 (PK)
        target_year,    -- 기준 연도
        title,          -- 재배력 제목
        thumbnail_path, -- 대표 썸네일 이미지 경로
        visibility,     -- 공개 상태 ('public'/'private')
        channel_web,    -- 웹 노출 여부 ('Y'/'N')
        channel_app,    -- 앱 노출 여부 ('Y'/'N')
        updated_at      -- 최종 수정 일시
    FROM dbo.TBL_CALENDAR_CONTENT
    WHERE calendar_id = @v_calendar_id;

    -- [ResultSet 2] 채널별(WEB/APP) 재배력 본문 이미지 목록 조회
    SELECT 
        image_id,      -- 이미지 고유 번호 (PK)
        calendar_id,   -- 재배력 고유 번호 (FK)
        channel_type,  -- 채널 구분 ('WEB'/'APP')
        sort_order,    -- 노출 정렬 순서
        original_name, -- 원본 이미지 파일명
        saved_name,    -- 서버 저장 파일명
        file_path      -- 이미지 파일 상대 경로
    FROM dbo.TBL_CALENDAR_IMAGE
    WHERE calendar_id = @v_calendar_id
    ORDER BY channel_type ASC, sort_order ASC;
END;
GO

-- ==============================================================
-- [20] 상시 재배력 저장 (등록/수정 Upsert) (USP_ADMIN_CALENDAR_SAVE)
-- ==============================================================
IF OBJECT_ID('dbo.USP_ADMIN_CALENDAR_SAVE', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_CALENDAR_SAVE;
GO
CREATE PROCEDURE dbo.USP_ADMIN_CALENDAR_SAVE
    @p_year           INT,                      -- 기준 연도 (예: 2026)
    @p_title          NVARCHAR(200),            -- 상시 재배력 제목 (예: 복숭아 재배력)
    @p_thumbnail_path NVARCHAR(500) = NULL,     -- 대표 썸네일 이미지 경로
    @p_visibility     VARCHAR(10)   = 'public', -- 공개 상태 ('public': 공개, 'private': 비공개)
    @p_channel_web    CHAR(1)       = 'Y',      -- 웹 채널 노출 여부 ('Y'/'N')
    @p_channel_app    CHAR(1)       = 'Y',      -- 앱 채널 노출 여부 ('Y'/'N')
    @p_author_id      VARCHAR(50)   = NULL,     -- 작성/수정 운영자 ID
    @r_calendar_id    INT OUTPUT                -- 저장된 재배력 고유 번호(calendar_id) 반환
AS
BEGIN
    -- ==========================================================
    -- 프로시저명 : dbo.USP_ADMIN_CALENDAR_SAVE
    -- 설      명 : 기준 연도(@p_year)의 상시 재배력 정보를 등록 또는 수정(Upsert)하고 calendar_id를 반환합니다.
    -- ==========================================================
    SET NOCOUNT ON;

    DECLARE @v_existing_id INT;

    -- 동일 연도 재배력 존재 여부 확인
    SELECT TOP 1 @v_existing_id = calendar_id 
    FROM dbo.TBL_CALENDAR_CONTENT 
    WHERE target_year = @p_year;

    IF @v_existing_id IS NULL
    BEGIN
        -- 해당 연도 상시 재배력 신규 등록 (INSERT)
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
        -- 기존 연도 상시 재배력 정보 갱신 (UPDATE)
        UPDATE dbo.TBL_CALENDAR_CONTENT
        SET title          = @p_title,                              -- 재배력 제목
            thumbnail_path = ISNULL(@p_thumbnail_path, thumbnail_path), -- 썸네일 경로 (NULL이면 기존 유지)
            visibility     = @p_visibility,                         -- 공개 여부
            channel_web    = @p_channel_web,                        -- 웹 노출 여부
            channel_app    = @p_channel_app,                        -- 앱 노출 여부
            author_id      = ISNULL(@p_author_id, author_id),       -- 작성/수정자 ID
            is_deleted     = 'N',                                   -- 삭제 플래그 해제
            updated_at     = GETDATE()                              -- 최종 수정 일시
        WHERE calendar_id  = @v_existing_id;

        SET @r_calendar_id = @v_existing_id;
    END;
END;
GO

-- ==============================================================
-- [21] 상시 재배력 본문 이미지 초기화 (USP_ADMIN_CALENDAR_IMAGE_CLEAR)
-- ==============================================================
IF OBJECT_ID('dbo.USP_ADMIN_CALENDAR_IMAGE_CLEAR', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_CALENDAR_IMAGE_CLEAR;
GO
CREATE PROCEDURE dbo.USP_ADMIN_CALENDAR_IMAGE_CLEAR
    @p_calendar_id  INT,                -- 상시 재배력 고유 번호 (TBL_CALENDAR_CONTENT.calendar_id)
    @p_channel_type VARCHAR(10) = NULL  -- 초기화할 채널 구분 ('WEB', 'APP', NULL 또는 빈값이면 전체 채널 삭제)
AS
BEGIN
    -- ==========================================================
    -- 프로시저명 : dbo.USP_ADMIN_CALENDAR_IMAGE_CLEAR
    -- 설      명 : 상시 재배력 저장 시 이미지 목록 재구성을 위해 기존 등록된 채널별(또는 전체) 이미지를 삭제합니다.
    -- ==========================================================
    SET NOCOUNT ON;

    -- 채널 구분이 없으면 전체 이미지 삭제, 지정된 경우 해당 채널(WEB/APP) 이미지만 삭제
    IF @p_channel_type IS NULL OR @p_channel_type = ''
        DELETE FROM dbo.TBL_CALENDAR_IMAGE WHERE calendar_id = @p_calendar_id;
    ELSE
        DELETE FROM dbo.TBL_CALENDAR_IMAGE WHERE calendar_id = @p_calendar_id AND channel_type = @p_channel_type;
END;
GO

-- ==============================================================
-- [22] 상시 재배력 본문 이미지 등록 (USP_ADMIN_CALENDAR_IMAGE_ADD)
-- ==============================================================
IF OBJECT_ID('dbo.USP_ADMIN_CALENDAR_IMAGE_ADD', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_CALENDAR_IMAGE_ADD;
GO
CREATE PROCEDURE dbo.USP_ADMIN_CALENDAR_IMAGE_ADD
    @p_calendar_id   INT,           -- 상시 재배력 고유 번호 (TBL_CALENDAR_CONTENT.calendar_id)
    @p_channel_type  VARCHAR(10),   -- 노출 채널 구분 ('WEB' 또는 'APP')
    @p_sort_order    INT = 1,       -- 채널 내 이미지 노출 순서 (1부터 시작)
    @p_original_name NVARCHAR(260), -- 업로드 원본 이미지 파일명
    @p_saved_name    NVARCHAR(260), -- 서버 저장 고유 파일명
    @p_file_path     NVARCHAR(500)  -- 이미지 파일 저장 상대 경로
AS
BEGIN
    -- ==========================================================
    -- 프로시저명 : dbo.USP_ADMIN_CALENDAR_IMAGE_ADD
    -- 설      명 : 상시 재배력의 Web 또는 App 채널 본문 이미지를 노출 순서와 함께 등록합니다.
    -- ==========================================================
    SET NOCOUNT ON;

    -- 상시 재배력 채널별 본문 이미지 레코드 추가
    INSERT INTO dbo.TBL_CALENDAR_IMAGE (
        calendar_id,   -- 상시 재배력 고유 번호 (FK)
        channel_type,  -- 채널 구분 ('WEB'/'APP')
        sort_order,    -- 노출 정렬 순서
        original_name, -- 원본 파일명
        saved_name,    -- 서버 저장 파일명
        file_path,     -- 이미지 저장 경로
        created_at     -- 등록 일시
    ) VALUES (
        @p_calendar_id, UPPER(@p_channel_type), @p_sort_order, @p_original_name, @p_saved_name, @p_file_path, GETDATE()
    );
END;
GO

-- ==============================================================
-- [23] 교육영상 목록 조회 (USP_ADMIN_VIDEO_LIST)
-- ==============================================================
IF OBJECT_ID('dbo.USP_ADMIN_VIDEO_LIST', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_VIDEO_LIST;
GO
CREATE PROCEDURE dbo.USP_ADMIN_VIDEO_LIST
    @p_category    NVARCHAR(50)  = NULL,   -- 영상 분류 필터 ('재배기술', '생육단계', '미분류', NULL: 전체)
    @p_keyword     NVARCHAR(100) = NULL    -- 영상 제목(표시제목/원본제목) 검색어
AS
BEGIN
    -- ==========================================================
    -- 프로시저명 : dbo.USP_ADMIN_VIDEO_LIST
    -- 설      명 : 교육영상 목록을 분류 및 키워드로 필터링하여 조회합니다. (홈 메인 노출 선정 영상 우선 정렬)
    -- ==========================================================
    SET NOCOUNT ON;

    -- 삭제되지 않은 교육영상 목록 조회 (홈 노출 선정 우선, 최신 수정일순)
    SELECT 
        video_id,       -- 교육영상 고유 번호 (PK)
        youtube_id,     -- 유튜브 영상 ID (11자리)
        source_url,     -- 원본 유튜브 URL
        display_title,  -- 관리자 지정 표시 제목
        original_title, -- 유튜브 수집 원본 제목
        category,       -- 영상 분류 ('재배기술'/'생육단계'/'미분류')
        thumbnail_url,  -- 썸네일 이미지 URL
        duration_text,  -- 영상 재생 시간 텍스트 (예: '11:26')
        is_playable,    -- 재생 가능 여부 ('Y'/'N')
        visibility,     -- 공개 여부 ('public'/'private')
        channel_web,    -- 웹 채널 노출 여부 ('Y'/'N')
        channel_app,    -- 앱 채널 노출 여부 ('Y'/'N')
        is_home_web,    -- 웹 홈 메인 노출 선정 여부 ('Y'/'N')
        is_home_app,    -- 앱 홈 메인 노출 선정 여부 ('Y'/'N')
        period_start,   -- 게시 시작일
        period_end,     -- 게시 종료일
        has_end_date,   -- 게시 종료일 지정 여부 ('Y'/'N')
        updated_at      -- 최종 수정 일시
    FROM dbo.TBL_VIDEO_CONTENT
    WHERE is_deleted = 'N'
      AND (@p_category IS NULL OR @p_category = '' OR category = @p_category)
      AND (@p_keyword IS NULL OR @p_keyword = '' OR display_title LIKE '%' + @p_keyword + '%' OR original_title LIKE '%' + @p_keyword + '%')
    ORDER BY 
        -- 홈 노출 중인 영상을 최상단에 우선 정렬
        CASE WHEN is_home_web = 'Y' OR is_home_app = 'Y' THEN 0 ELSE 1 END ASC,
        updated_at DESC, video_id DESC;
END;
GO

-- ==============================================================
-- [24] 교육영상 단건 상세 조회 (USP_ADMIN_VIDEO_GET)
-- ==============================================================
IF OBJECT_ID('dbo.USP_ADMIN_VIDEO_GET', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_VIDEO_GET;
GO
CREATE PROCEDURE dbo.USP_ADMIN_VIDEO_GET
    @p_video_id INT   -- 조회할 교육영상 고유 번호 (video_id)
AS
BEGIN
    -- ==========================================================
    -- 프로시저명 : dbo.USP_ADMIN_VIDEO_GET
    -- 설      명 : 특정 교육영상(@p_video_id)의 상세 설정, 유튜브 메타데이터 및 관련자료 첨부 정보를 조회합니다.
    -- ==========================================================
    SET NOCOUNT ON;

    -- 교육영상 단건 상세 정보 조회
    SELECT 
        video_id,       -- 교육영상 고유 번호 (PK)
        youtube_id,     -- 유튜브 영상 ID
        source_url,     -- 원본 유튜브 URL
        display_title,  -- 화면 표시 제목
        original_title, -- 유튜브 원본 제목
        category,       -- 영상 분류 ('재배기술'/'생육단계'/'미분류')
        description,    -- 영상 상세 설명
        thumbnail_url,  -- 유튜브 썸네일 URL
        duration_text,  -- 재생 시간 (예: '18:10')
        is_playable,    -- 재생 가능 여부 ('Y'/'N')
        visibility,     -- 공개 여부 ('public'/'private')
        channel_web,    -- 웹 채널 노출 여부 ('Y'/'N')
        channel_app,    -- 앱 채널 노출 여부 ('Y'/'N')
        is_home_web,    -- 웹 홈 메인 노출 여부 ('Y'/'N')
        is_home_app,    -- 앱 홈 메인 노출 여부 ('Y'/'N')
        period_start,   -- 게시 시작일
        period_end,     -- 게시 종료일
        has_end_date,   -- 게시 종료일 사용 여부 ('Y'/'N')
        attach_name,    -- 관련자료 첨부 원본 파일명
        attach_path,    -- 관련자료 첨부 서버 저장 경로
        updated_at      -- 최종 수정 일시
    FROM dbo.TBL_VIDEO_CONTENT
    WHERE video_id = @p_video_id AND is_deleted = 'N';
END;
GO

-- ==============================================================
-- [25] 교육영상 등록 및 수정 (USP_ADMIN_VIDEO_SAVE)
-- ==============================================================
IF OBJECT_ID('dbo.USP_ADMIN_VIDEO_SAVE', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_VIDEO_SAVE;
GO
CREATE PROCEDURE dbo.USP_ADMIN_VIDEO_SAVE
    @p_video_id       INT           = 0,    -- 교육영상 고유 번호 (0 이하: 신규 등록, 양수: 기존 영상 수정)
    @p_youtube_id     VARCHAR(50)   = '',   -- 유튜브 비디오 ID (11자리 식별자)
    @p_source_url     NVARCHAR(500) = '',   -- 원본 유튜브 영상 URL
    @p_display_title  NVARCHAR(200),        -- 화면 표시용 영상 제목
    @p_original_title NVARCHAR(200) = NULL, -- 유튜브 원본 제목
    @p_category       NVARCHAR(50),         -- 영상 분류 ('재배기술', '생육단계', '미분류')
    @p_description    NVARCHAR(MAX) = NULL, -- 영상 설명 본문
    @p_thumbnail_url  NVARCHAR(500) = NULL, -- 유튜브 썸네일 이미지 URL
    @p_duration_text  VARCHAR(20)   = NULL, -- 영상 재생 시간 텍스트 (예: '11:26')
    @p_is_playable    CHAR(1)       = 'Y',  -- 재생 가능 여부 ('Y'/'N')
    @p_visibility     VARCHAR(10),          -- 공개 상태 ('public': 공개, 'private': 비공개)
    @p_channel_web    CHAR(1),              -- 웹 채널 노출 여부 ('Y'/'N')
    @p_channel_app    CHAR(1),              -- 앱 채널 노출 여부 ('Y'/'N')
    @p_is_home_web    CHAR(1),              -- 웹 홈 메인 선정 여부 ('Y'/'N')
    @p_is_home_app    CHAR(1),              -- 앱 홈 메인 선정 여부 ('Y'/'N')
    @p_period_start   DATETIME,             -- 게시 시작일
    @p_period_end     DATETIME      = NULL, -- 게시 종료일 (종료일 없음일 경우 NULL)
    @p_has_end_date   CHAR(1)       = 'Y',  -- 게시 종료일 사용 여부 ('Y'/'N')
    @p_attach_name    NVARCHAR(260) = NULL, -- 관련자료 첨부파일명
    @p_attach_path    NVARCHAR(500) = NULL, -- 관련자료 첨부파일 저장 경로
    @r_video_id       INT           = 0 OUTPUT -- 저장 완료된 교육영상 고유 번호(video_id) 반환
AS
BEGIN
    -- ==========================================================
    -- 프로시저명 : dbo.USP_ADMIN_VIDEO_SAVE
    -- 설      명 : 교육영상 정보를 신규 등록하거나 기존 영상 정보를 수정하고 video_id를 반환합니다.
    -- ==========================================================
    SET NOCOUNT ON;

    IF @p_video_id <= 0
    BEGIN
        -- 교육영상 신규 등록 (INSERT)
        INSERT INTO dbo.TBL_VIDEO_CONTENT (
            youtube_id, source_url, display_title, original_title, category,
            description, thumbnail_url, duration_text, is_playable,
            visibility, channel_web, channel_app,
            is_home_web, is_home_app,
            period_start, period_end, has_end_date,
            attach_name, attach_path, is_deleted, created_at, updated_at
        ) VALUES (
            @p_youtube_id, @p_source_url, @p_display_title, ISNULL(@p_original_title, @p_display_title), @p_category,
            @p_description, @p_thumbnail_url, @p_duration_text, @p_is_playable,
            @p_visibility, @p_channel_web, @p_channel_app,
            @p_is_home_web, @p_is_home_app,
            @p_period_start, @p_period_end, @p_has_end_date,
            @p_attach_name, @p_attach_path, 'N', GETDATE(), GETDATE()
        );
        SET @r_video_id = SCOPE_IDENTITY();
    END
    ELSE
    BEGIN
        -- 기존 교육영상 정보 수정 (UPDATE)
        UPDATE dbo.TBL_VIDEO_CONTENT
        SET youtube_id     = CASE WHEN @p_youtube_id <> '' THEN @p_youtube_id ELSE youtube_id END,       -- 유튜브 ID
            source_url     = CASE WHEN @p_source_url <> '' THEN @p_source_url ELSE source_url END,       -- 원본 유튜브 URL
            display_title  = @p_display_title,                                                           -- 표시 제목
            original_title = ISNULL(@p_original_title, original_title),                                  -- 원본 제목
            category       = @p_category,                                                                -- 영상 분류
            description    = @p_description,                                                             -- 영상 설명
            thumbnail_url  = CASE WHEN @p_thumbnail_url <> '' THEN @p_thumbnail_url ELSE thumbnail_url END, -- 썸네일 URL
            is_playable    = @p_is_playable,                                                             -- 재생 가능 여부
            visibility     = @p_visibility,                                                              -- 공개 여부
            channel_web    = @p_channel_web,                                                             -- 웹 채널 노출 여부
            channel_app    = @p_channel_app,                                                             -- 앱 채널 노출 여부
            is_home_web    = @p_is_home_web,                                                             -- 웹 홈 메인 노출 여부
            is_home_app    = @p_is_home_app,                                                             -- 앱 홈 메인 노출 여부
            period_start   = @p_period_start,                                                            -- 게시 시작일
            period_end     = @p_period_end,                                                              -- 게시 종료일
            has_end_date   = @p_has_end_date,                                                            -- 종료일 사용 여부
            attach_name    = @p_attach_name,                                                             -- 관련자료 파일명
            attach_path    = @p_attach_path,                                                             -- 관련자료 경로
            updated_at     = GETDATE()                                                                   -- 최종 수정 일시
        WHERE video_id     = @p_video_id;

        SET @r_video_id = @p_video_id;
    END;
END;
GO

-- ==============================================================
-- [26] 교육영상 소프트 삭제 (USP_ADMIN_VIDEO_DELETE)
-- ==============================================================
IF OBJECT_ID('dbo.USP_ADMIN_VIDEO_DELETE', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_VIDEO_DELETE;
GO
CREATE PROCEDURE dbo.USP_ADMIN_VIDEO_DELETE
    @p_video_id INT   -- 삭제할 교육영상 고유 번호 (video_id)
AS
BEGIN
    -- ==========================================================
    -- 프로시저명 : dbo.USP_ADMIN_VIDEO_DELETE
    -- 설      명 : 특정 교육영상(@p_video_id)을 소프트 삭제(is_deleted='Y')하고 홈 메인 노출 설정을 해제합니다.
    -- ==========================================================
    SET NOCOUNT ON;

    -- 교육영상 소프트 삭제 및 홈 메인 노출 해제
    UPDATE dbo.TBL_VIDEO_CONTENT
    SET is_deleted  = 'Y',      -- 삭제 여부 플래그 ('Y')
        is_home_web = 'N',      -- 웹 홈 메인 노출 해제
        is_home_app = 'N',      -- 앱 홈 메인 노출 해제
        updated_at  = GETDATE() -- 삭제 처리 일시
    WHERE video_id  = @p_video_id;
END;
GO

-- ==============================================================
-- [27] 기존 9개 테이블(컬럼) 및 26개 프로시저(파라미터) MS_Description 일괄 등록
-- ==============================================================
IF OBJECT_ID('dbo.USP_SET_DESC', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_SET_DESC;
GO
CREATE PROCEDURE dbo.USP_SET_DESC
    @p_level1type VARCHAR(20),   -- 1단계 객체 유형 ('TABLE', 'PROCEDURE')
    @p_level1name NVARCHAR(128), -- 1단계 객체 이름 (테이블명 또는 프로시저명)
    @p_level2type VARCHAR(20) = NULL,   -- 2단계 객체 유형 ('COLUMN', 'PARAMETER', NULL)
    @p_level2name NVARCHAR(128) = NULL, -- 2단계 객체 이름 (컬럼명 또는 파라미터명)
    @p_desc       NVARCHAR(500)  -- 등록할 설명 (MS_Description)
AS
BEGIN
    -- ==========================================================
    -- 프로시저명 : dbo.USP_SET_DESC
    -- 설      명 : 테이블/컬럼/프로시저/파라미터의 MS_Description 확장 속성을 등록하거나 갱신하는 헬퍼 프로시저입니다.
    -- ==========================================================
    SET NOCOUNT ON;
    IF @p_level2type IS NULL
    BEGIN
        IF EXISTS (
            SELECT 1 FROM sys.extended_properties ep
            WHERE ep.name = N'MS_Description'
              AND ep.major_id = OBJECT_ID(N'dbo.' + @p_level1name)
              AND ep.minor_id = 0
        )
            EXEC sys.sp_updateextendedproperty @name=N'MS_Description', @value=@p_desc, @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=@p_level1type, @level1name=@p_level1name;
        ELSE
            EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=@p_desc, @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=@p_level1type, @level1name=@p_level1name;
    END
    ELSE
    BEGIN
        IF EXISTS (
            SELECT 1 FROM sys.extended_properties ep
            WHERE ep.name = N'MS_Description'
              AND ep.major_id = OBJECT_ID(N'dbo.' + @p_level1name)
              AND ep.minor_id = CASE
                  WHEN @p_level2type = 'COLUMN' THEN COLUMNPROPERTY(OBJECT_ID(N'dbo.' + @p_level1name), @p_level2name, 'ColumnId')
                  WHEN @p_level2type = 'PARAMETER' THEN (SELECT parameter_id FROM sys.parameters WHERE object_id = OBJECT_ID(N'dbo.' + @p_level1name) AND name = @p_level2name)
                  ELSE 0 END
        )
            EXEC sys.sp_updateextendedproperty @name=N'MS_Description', @value=@p_desc, @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=@p_level1type, @level1name=@p_level1name, @level2type=@p_level2type, @level2name=@p_level2name;
        ELSE
            EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=@p_desc, @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=@p_level1type, @level1name=@p_level1name, @level2type=@p_level2type, @level2name=@p_level2name;
    END
END;
GO

-- 1) TBL_OPERATOR (운영자 및 권한 테이블)
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_OPERATOR', NULL, NULL, N'복숭아자조금 관리자 계정 및 메뉴별 작성/게시 권한 테이블';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_OPERATOR', 'COLUMN', 'operator_id',        N'운영자 고유 식별키 (PK, 예: admin)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_OPERATOR', 'COLUMN', 'operator_name',      N'운영자 성명 (예: 정유현)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_OPERATOR', 'COLUMN', 'operator_account',   N'로그인 계정 아이디';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_OPERATOR', 'COLUMN', 'operator_password',  N'로그인 비밀번호 (SHA-256 64자리 단방향 해시)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_OPERATOR', 'COLUMN', 'status',             N'계정 상태 (ACTIVE: 사용, INACTIVE: 미사용)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_OPERATOR', 'COLUMN', 'perm_notice_write',  N'공지/게시글 작성 권한 여부 (Y/N)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_OPERATOR', 'COLUMN', 'perm_notice_post',   N'공지/게시글 게시 권한 여부 (Y/N)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_OPERATOR', 'COLUMN', 'perm_video_write',   N'교육영상 작성 권한 여부 (Y/N)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_OPERATOR', 'COLUMN', 'perm_video_post',    N'교육영상 게시 권한 여부 (Y/N)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_OPERATOR', 'COLUMN', 'perm_cal_write',     N'상시재배력 작성 권한 여부 (Y/N)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_OPERATOR', 'COLUMN', 'perm_cal_post',      N'상시재배력 게시 권한 여부 (Y/N)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_OPERATOR', 'COLUMN', 'perm_orchard_write', N'월별과원관리 작성 권한 여부 (Y/N)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_OPERATOR', 'COLUMN', 'perm_orchard_post',  N'월별과원관리 게시 권한 여부 (Y/N)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_OPERATOR', 'COLUMN', 'created_at',         N'계정 최초 생성 일시';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_OPERATOR', 'COLUMN', 'updated_at',         N'계정 최종 수정 일시';
IF COL_LENGTH('dbo.TBL_OPERATOR', 'operator_phone') IS NOT NULL
    EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_OPERATOR', 'COLUMN', 'operator_phone', N'운영자 휴대전화 번호 (숫자만 저장, SMS 인증용)';

-- 2) TBL_ADMIN_INVITATION (관리자 가입 공통 인증코드 테이블)
IF OBJECT_ID('dbo.TBL_ADMIN_INVITATION', 'U') IS NOT NULL
BEGIN
    EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_ADMIN_INVITATION', NULL, NULL, N'관리자 계정 생성 시 필요한 공통 가입 인증코드 관리 테이블';
    EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_ADMIN_INVITATION', 'COLUMN', 'inv_id',      N'가입 인증코드 설정 고유 번호 (PK, 기본값 1)';
    EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_ADMIN_INVITATION', 'COLUMN', 'inv_code',    N'공통 가입 인증코드 문자열 (예: peach1234)';
    EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_ADMIN_INVITATION', 'COLUMN', 'inv_version', N'인증코드 재발급 버전 번호';
    EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_ADMIN_INVITATION', 'COLUMN', 'issued_by',   N'인증코드 발급/변경 관리자 ID';
    EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_ADMIN_INVITATION', 'COLUMN', 'issued_at',   N'인증코드 발급/변경 일시';
END;

-- 3) TBL_BOARD_CONTENT (게시글 마스터 테이블)
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_BOARD_CONTENT', NULL, NULL, N'통합 게시글(협의회게시판 공지사항·언론보도·업장홍보, 복숭아정보, 재배자료) 마스터 테이블';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_BOARD_CONTENT', 'COLUMN', 'content_id',        N'게시글 고유 번호 (PK, 자동증가)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_BOARD_CONTENT', 'COLUMN', 'category',          N'게시판 분류 (공지 / 언론보도 / 업장홍보 / 복숭아와 건강 / 복숭아관련 소식 / 복숭아 홍보 / 재배자료)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_BOARD_CONTENT', 'COLUMN', 'title',             N'게시글 제목';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_BOARD_CONTENT', 'COLUMN', 'body_html',         N'게시글 본문 내용 (HTML)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_BOARD_CONTENT', 'COLUMN', 'visibility',        N'공개 설정 (public: 공개, private: 비공개)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_BOARD_CONTENT', 'COLUMN', 'is_draft',          N'임시저장 여부 (Y: 임시저장, N: 정식등록)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_BOARD_CONTENT', 'COLUMN', 'is_pinned',         N'공지사항 상단고정 여부 (Y/N)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_BOARD_CONTENT', 'COLUMN', 'channel_web',       N'Web 채널 노출 여부 (Y/N)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_BOARD_CONTENT', 'COLUMN', 'channel_app',       N'App 채널 노출 여부 (Y/N)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_BOARD_CONTENT', 'COLUMN', 'period_start',      N'게시 시작 일시';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_BOARD_CONTENT', 'COLUMN', 'period_end',        N'게시 종료 일시 (종료일 없음일 경우 NULL)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_BOARD_CONTENT', 'COLUMN', 'has_end_date',      N'게시 종료일 사용 여부 (Y/N)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_BOARD_CONTENT', 'COLUMN', 'is_urgent',         N'긴급 공지 설정 여부 (Y/N)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_BOARD_CONTENT', 'COLUMN', 'urgent_start',      N'긴급 노출 시작 일시';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_BOARD_CONTENT', 'COLUMN', 'urgent_end',        N'긴급 노출 종료 일시';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_BOARD_CONTENT', 'COLUMN', 'urgent_order',      N'홈 긴급 공지 노출 순서';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_BOARD_CONTENT', 'COLUMN', 'related_type',      N'연결 자료 유형 (calendar / orchard / video / post)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_BOARD_CONTENT', 'COLUMN', 'related_target_id', N'연결 자료 대상 식별값 (ID 또는 연월)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_BOARD_CONTENT', 'COLUMN', 'author_id',         N'작성자 운영자 ID';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_BOARD_CONTENT', 'COLUMN', 'author_name',       N'작성자 운영자 성명';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_BOARD_CONTENT', 'COLUMN', 'is_deleted',        N'소프트 삭제 여부 (Y: 삭제됨, N: 정상)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_BOARD_CONTENT', 'COLUMN', 'created_at',        N'최초 등록 일시';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_BOARD_CONTENT', 'COLUMN', 'updated_at',        N'최종 수정 일시';

-- 4) TBL_BOARD_ATTACH (게시글 첨부파일 테이블)
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_BOARD_ATTACH', NULL, NULL, N'게시글 첨부파일 관리 테이블';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_BOARD_ATTACH', 'COLUMN', 'attach_id',     N'첨부파일 고유 번호 (PK, 자동증가)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_BOARD_ATTACH', 'COLUMN', 'content_id',    N'소속 게시글 고유 번호 (FK -> TBL_BOARD_CONTENT.content_id)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_BOARD_ATTACH', 'COLUMN', 'original_name', N'업로드 원본 파일명';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_BOARD_ATTACH', 'COLUMN', 'saved_name',    N'서버 저장 고유 파일명';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_BOARD_ATTACH', 'COLUMN', 'file_path',     N'파일 저장 상대 경로';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_BOARD_ATTACH', 'COLUMN', 'file_size',     N'파일 크기 (Byte 단위)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_BOARD_ATTACH', 'COLUMN', 'download_cnt',  N'누적 다운로드 횟수';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_BOARD_ATTACH', 'COLUMN', 'created_at',    N'첨부파일 등록 일시';

-- 5) TBL_ORCHARD_CONTENT (월별 과원관리 마스터 테이블)
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_ORCHARD_CONTENT', NULL, NULL, N'월별 과원관리 마스터 테이블';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_ORCHARD_CONTENT', 'COLUMN', 'orchard_id',     N'과원관리 고유 번호 (PK, 자동증가)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_ORCHARD_CONTENT', 'COLUMN', 'target_year',    N'대상 연도 (예: 2026)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_ORCHARD_CONTENT', 'COLUMN', 'target_month',   N'대상 월 (1 ~ 12)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_ORCHARD_CONTENT', 'COLUMN', 'title',          N'과원관리 제목 (예: 2월 과원관리)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_ORCHARD_CONTENT', 'COLUMN', 'thumbnail_path', N'대표 썸네일 이미지 경로';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_ORCHARD_CONTENT', 'COLUMN', 'visibility',     N'공개 설정 (public: 공개, private: 비공개)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_ORCHARD_CONTENT', 'COLUMN', 'channel_web',    N'Web 채널 노출 여부 (Y/N)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_ORCHARD_CONTENT', 'COLUMN', 'channel_app',    N'App 채널 노출 여부 (Y/N)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_ORCHARD_CONTENT', 'COLUMN', 'author_id',      N'작성/수정 운영자 ID';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_ORCHARD_CONTENT', 'COLUMN', 'is_deleted',     N'소프트 삭제 여부 (Y/N)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_ORCHARD_CONTENT', 'COLUMN', 'created_at',     N'최초 등록 일시';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_ORCHARD_CONTENT', 'COLUMN', 'updated_at',     N'최종 수정 일시';

-- 6) TBL_ORCHARD_IMAGE (월별 과원관리 본문 이미지 테이블)
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_ORCHARD_IMAGE', NULL, NULL, N'월별 과원관리 Web/App 채널별 본문 이미지 목록 테이블';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_ORCHARD_IMAGE', 'COLUMN', 'image_id',      N'이미지 고유 번호 (PK, 자동증가)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_ORCHARD_IMAGE', 'COLUMN', 'orchard_id',    N'소속 과원관리 고유 번호 (FK -> TBL_ORCHARD_CONTENT.orchard_id)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_ORCHARD_IMAGE', 'COLUMN', 'channel_type',  N'노출 채널 구분 (WEB / APP)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_ORCHARD_IMAGE', 'COLUMN', 'sort_order',    N'채널 내 노출 정렬 순서 (1부터 시작)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_ORCHARD_IMAGE', 'COLUMN', 'original_name', N'업로드 원본 이미지 파일명';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_ORCHARD_IMAGE', 'COLUMN', 'saved_name',    N'서버 저장 고유 파일명';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_ORCHARD_IMAGE', 'COLUMN', 'file_path',     N'이미지 저장 상대 경로';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_ORCHARD_IMAGE', 'COLUMN', 'created_at',    N'이미지 등록 일시';

-- 7) TBL_CALENDAR_CONTENT (상시 재배력 마스터 테이블)
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_CALENDAR_CONTENT', NULL, NULL, N'연도별 상시 재배력 마스터 테이블';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_CALENDAR_CONTENT', 'COLUMN', 'calendar_id',    N'상시 재배력 고유 번호 (PK, 자동증가)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_CALENDAR_CONTENT', 'COLUMN', 'target_year',    N'기준 연도 (예: 2026)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_CALENDAR_CONTENT', 'COLUMN', 'title',          N'상시 재배력 제목 (예: 복숭아 재배력)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_CALENDAR_CONTENT', 'COLUMN', 'thumbnail_path', N'대표 썸네일 이미지 경로';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_CALENDAR_CONTENT', 'COLUMN', 'visibility',     N'공개 설정 (public: 공개, private: 비공개)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_CALENDAR_CONTENT', 'COLUMN', 'channel_web',    N'Web 채널 노출 여부 (Y/N)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_CALENDAR_CONTENT', 'COLUMN', 'channel_app',    N'App 채널 노출 여부 (Y/N)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_CALENDAR_CONTENT', 'COLUMN', 'author_id',      N'작성/수정 운영자 ID';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_CALENDAR_CONTENT', 'COLUMN', 'is_deleted',     N'소프트 삭제 여부 (Y/N)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_CALENDAR_CONTENT', 'COLUMN', 'created_at',     N'최초 등록 일시';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_CALENDAR_CONTENT', 'COLUMN', 'updated_at',     N'최종 수정 일시';

-- 8) TBL_CALENDAR_IMAGE (상시 재배력 본문 이미지 테이블)
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_CALENDAR_IMAGE', NULL, NULL, N'상시 재배력 Web/App 채널별 본문 이미지 목록 테이블';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_CALENDAR_IMAGE', 'COLUMN', 'image_id',      N'이미지 고유 번호 (PK, 자동증가)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_CALENDAR_IMAGE', 'COLUMN', 'calendar_id',   N'소속 재배력 고유 번호 (FK -> TBL_CALENDAR_CONTENT.calendar_id)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_CALENDAR_IMAGE', 'COLUMN', 'channel_type',  N'노출 채널 구분 (WEB / APP)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_CALENDAR_IMAGE', 'COLUMN', 'sort_order',    N'채널 내 노출 정렬 순서 (1부터 시작)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_CALENDAR_IMAGE', 'COLUMN', 'original_name', N'업로드 원본 이미지 파일명';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_CALENDAR_IMAGE', 'COLUMN', 'saved_name',    N'서버 저장 고유 파일명';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_CALENDAR_IMAGE', 'COLUMN', 'file_path',     N'이미지 저장 상대 경로';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_CALENDAR_IMAGE', 'COLUMN', 'created_at',    N'이미지 등록 일시';

-- 9) TBL_VIDEO_CONTENT (교육영상 관리 테이블)
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_VIDEO_CONTENT', NULL, NULL, N'교육영상(유튜브 연동) 관리 마스터 테이블';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_VIDEO_CONTENT', 'COLUMN', 'video_id',       N'교육영상 고유 번호 (PK, 자동증가)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_VIDEO_CONTENT', 'COLUMN', 'youtube_id',     N'유튜브 비디오 고유 ID (11자리)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_VIDEO_CONTENT', 'COLUMN', 'source_url',     N'원본 유튜브 영상 URL';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_VIDEO_CONTENT', 'COLUMN', 'display_title',  N'관리자 지정 화면 표시 제목';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_VIDEO_CONTENT', 'COLUMN', 'original_title', N'유튜브 수집 원본 영상 제목';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_VIDEO_CONTENT', 'COLUMN', 'category',       N'영상 분류 (재배기술 / 생육단계 / 미분류)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_VIDEO_CONTENT', 'COLUMN', 'description',    N'영상 상세 설명';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_VIDEO_CONTENT', 'COLUMN', 'thumbnail_url',  N'유튜브 썸네일 이미지 URL';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_VIDEO_CONTENT', 'COLUMN', 'duration_text',  N'영상 재생 시간 표시 문자열 (예: 11:26)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_VIDEO_CONTENT', 'COLUMN', 'is_playable',    N'영상 재생 가능 여부 (Y/N)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_VIDEO_CONTENT', 'COLUMN', 'visibility',     N'공개 설정 (public: 공개, private: 비공개)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_VIDEO_CONTENT', 'COLUMN', 'channel_web',    N'Web 채널 노출 여부 (Y/N)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_VIDEO_CONTENT', 'COLUMN', 'channel_app',    N'App 채널 노출 여부 (Y/N)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_VIDEO_CONTENT', 'COLUMN', 'is_home_web',    N'Web 홈 메인 노출 선정 여부 (Y/N)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_VIDEO_CONTENT', 'COLUMN', 'is_home_app',    N'App 홈 메인 노출 선정 여부 (Y/N)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_VIDEO_CONTENT', 'COLUMN', 'period_start',   N'게시 시작 일시';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_VIDEO_CONTENT', 'COLUMN', 'period_end',     N'게시 종료 일시 (종료일 없음일 경우 NULL)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_VIDEO_CONTENT', 'COLUMN', 'has_end_date',   N'게시 종료일 사용 여부 (Y/N)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_VIDEO_CONTENT', 'COLUMN', 'attach_name',    N'관련자료 첨부 원본 파일명';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_VIDEO_CONTENT', 'COLUMN', 'attach_path',    N'관련자료 첨부 파일 저장 경로';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_VIDEO_CONTENT', 'COLUMN', 'is_deleted',     N'소프트 삭제 여부 (Y/N)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_VIDEO_CONTENT', 'COLUMN', 'created_at',     N'최초 등록 일시';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_VIDEO_CONTENT', 'COLUMN', 'updated_at',     N'최종 수정 일시';

-- 10) 24개 기존 저장 프로시저 및 파라미터 설명 등록
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_LOGIN', NULL, NULL, N'관리자 로그인 검증 (SHA-256 비밀번호 해시 비교 및 권한 조회)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_LOGIN', 'PARAMETER', '@p_account',  N'로그인 계정 아이디 (또는 운영자 식별키)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_LOGIN', 'PARAMETER', '@p_password', N'입력 비밀번호 평문 (SHA-256 해시 변환 비교)';

EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_OPERATOR_LIST', NULL, NULL, N'전체 운영자 계정 및 메뉴별 작성/게시 권한 목록 조회';

EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_OPERATOR_GET', NULL, NULL, N'특정 운영자 계정 상세 정보 및 권한 단건 조회';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_OPERATOR_GET', 'PARAMETER', '@p_operator_id', N'조회할 운영자 고유 식별키';

EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_OPERATOR_SAVE', NULL, NULL, N'운영자 계정 상태 및 업무별 작성/게시 권한 수정';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_OPERATOR_SAVE', 'PARAMETER', '@p_operator_id',   N'수정 대상 운영자 고유 식별키';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_OPERATOR_SAVE', 'PARAMETER', '@p_status',        N'계정 상태 (ACTIVE/INACTIVE)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_OPERATOR_SAVE', 'PARAMETER', '@p_notice_write',  N'공지/게시글 작성 권한 (Y/N)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_OPERATOR_SAVE', 'PARAMETER', '@p_notice_post',   N'공지/게시글 게시 권한 (Y/N)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_OPERATOR_SAVE', 'PARAMETER', '@p_video_write',   N'교육영상 작성 권한 (Y/N)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_OPERATOR_SAVE', 'PARAMETER', '@p_video_post',    N'교육영상 게시 권한 (Y/N)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_OPERATOR_SAVE', 'PARAMETER', '@p_cal_write',     N'상시재배력 작성 권한 (Y/N)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_OPERATOR_SAVE', 'PARAMETER', '@p_cal_post',      N'상시재배력 게시 권한 (Y/N)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_OPERATOR_SAVE', 'PARAMETER', '@p_orchard_write', N'월별과원관리 작성 권한 (Y/N)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_OPERATOR_SAVE', 'PARAMETER', '@p_orchard_post',  N'월별과원관리 게시 권한 (Y/N)';

EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_HOME_DATA', NULL, NULL, N'관리자 홈 대시보드 4개 영역(이달의 과원관리, 상시 재배력, 교육영상, 최근 게시글) 통합 조회';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_HOME_DATA', 'PARAMETER', '@p_year',  N'기준 연도 (예: 2026)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_HOME_DATA', 'PARAMETER', '@p_month', N'기준 월 (1~12)';

EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_BOARD_DRAFT_COUNT', NULL, NULL, N'게시판 분류별 임시저장 게시글 건수 조회';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_BOARD_DRAFT_COUNT', 'PARAMETER', '@p_category', N'게시판 분류 (공지/언론보도/업장홍보/복숭아정보/재배자료)';

EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_BOARD_LIST', NULL, NULL, N'게시판 분류별 게시글 목록 검색/필터/페이징 조회';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_BOARD_LIST', 'PARAMETER', '@p_category',     N'게시판 분류 (공지/언론보도/업장홍보/복숭아정보/재배자료, NULL 시 전체)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_BOARD_LIST', 'PARAMETER', '@p_is_draft',     N'임시저장 목록 여부 (Y/N)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_BOARD_LIST', 'PARAMETER', '@p_period_type',  N'기간 필터 유형 (all/1/3/6/custom)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_BOARD_LIST', 'PARAMETER', '@p_period_start', N'검색 시작일 (YYYY-MM-DD)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_BOARD_LIST', 'PARAMETER', '@p_period_end',   N'검색 종료일 (YYYY-MM-DD)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_BOARD_LIST', 'PARAMETER', '@p_status',       N'게시 상태 필터 (게시예정/게시중/게시종료/비공개)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_BOARD_LIST', 'PARAMETER', '@p_field',        N'검색 대상 필드 (titleBody/title/author)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_BOARD_LIST', 'PARAMETER', '@p_keyword',      N'검색 키워드';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_BOARD_LIST', 'PARAMETER', '@p_page',         N'현재 페이지 번호';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_BOARD_LIST', 'PARAMETER', '@p_page_size',    N'페이지당 행 수';

EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_BOARD_GET', NULL, NULL, N'게시글 단건 본문 및 첨부파일 목록 조회';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_BOARD_GET', 'PARAMETER', '@p_content_id', N'조회할 게시글 고유 번호';

EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_BOARD_SAVE', NULL, NULL, N'게시글 신규 등록 및 수정 저장';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_BOARD_SAVE', 'PARAMETER', '@p_content_id',        N'게시글 고유 번호 (0: 신규, 양수: 수정)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_BOARD_SAVE', 'PARAMETER', '@p_category',          N'게시판 분류 (공지/언론보도/업장홍보/복숭아정보/재배자료)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_BOARD_SAVE', 'PARAMETER', '@p_title',             N'게시글 제목';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_BOARD_SAVE', 'PARAMETER', '@p_body_html',         N'게시글 본문 HTML';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_BOARD_SAVE', 'PARAMETER', '@p_visibility',        N'공개 설정 (public/private)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_BOARD_SAVE', 'PARAMETER', '@p_is_draft',          N'임시저장 여부 (Y/N)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_BOARD_SAVE', 'PARAMETER', '@p_is_pinned',         N'공지 상단고정 여부 (Y/N)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_BOARD_SAVE', 'PARAMETER', '@p_channel_web',       N'웹 채널 노출 여부 (Y/N)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_BOARD_SAVE', 'PARAMETER', '@p_channel_app',       N'앱 채널 노출 여부 (Y/N)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_BOARD_SAVE', 'PARAMETER', '@p_period_start',      N'게시 시작일';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_BOARD_SAVE', 'PARAMETER', '@p_period_end',        N'게시 종료일';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_BOARD_SAVE', 'PARAMETER', '@p_has_end_date',      N'종료일 사용 여부 (Y/N)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_BOARD_SAVE', 'PARAMETER', '@p_is_urgent',         N'긴급 공지 여부 (Y/N)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_BOARD_SAVE', 'PARAMETER', '@p_urgent_start',      N'긴급 시작일';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_BOARD_SAVE', 'PARAMETER', '@p_urgent_end',        N'긴급 종료일';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_BOARD_SAVE', 'PARAMETER', '@p_related_type',      N'연결 자료 유형';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_BOARD_SAVE', 'PARAMETER', '@p_related_target_id', N'연결 자료 대상 ID';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_BOARD_SAVE', 'PARAMETER', '@p_author_id',         N'작성자 ID';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_BOARD_SAVE', 'PARAMETER', '@p_author_name',       N'작성자 성명';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_BOARD_SAVE', 'PARAMETER', '@r_new_id',            N'저장된 게시글 고유 번호 반환 (OUTPUT)';

EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_BOARD_DELETE', NULL, NULL, N'게시글 단건/다건 소프트 삭제 처리';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_BOARD_DELETE', 'PARAMETER', '@p_content_ids', N'쉼표(,) 구분 삭제 대상 게시글 ID 목록';

EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_BOARD_ATTACH_ADD', NULL, NULL, N'게시글 첨부파일 메타데이터 등록';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_BOARD_ATTACH_ADD', 'PARAMETER', '@p_content_id',    N'소속 게시글 고유 번호';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_BOARD_ATTACH_ADD', 'PARAMETER', '@p_original_name', N'원본 파일명';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_BOARD_ATTACH_ADD', 'PARAMETER', '@p_saved_name',    N'서버 저장 파일명';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_BOARD_ATTACH_ADD', 'PARAMETER', '@p_file_path',     N'파일 저장 상대 경로';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_BOARD_ATTACH_ADD', 'PARAMETER', '@p_file_size',     N'파일 크기 (Byte)';

EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_BOARD_ATTACH_DEL', NULL, NULL, N'게시글 첨부파일 단건 삭제';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_BOARD_ATTACH_DEL', 'PARAMETER', '@p_attach_id', N'삭제할 첨부파일 고유 번호';

EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_ORCHARD_LIST', NULL, NULL, N'연도별 월별 과원관리(1~12월) 슬롯 현황 조회';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_ORCHARD_LIST', 'PARAMETER', '@p_year', N'조회 대상 연도';

EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_ORCHARD_GET', NULL, NULL, N'특정 연월의 월별 과원관리 상세 및 채널별 이미지 조회';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_ORCHARD_GET', 'PARAMETER', '@p_year',  N'조회 대상 연도';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_ORCHARD_GET', 'PARAMETER', '@p_month', N'조회 대상 월 (1~12)';

EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_ORCHARD_SAVE', NULL, NULL, N'월별 과원관리 마스터 정보 등록 및 수정 (Upsert)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_ORCHARD_SAVE', 'PARAMETER', '@p_year',           N'대상 연도';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_ORCHARD_SAVE', 'PARAMETER', '@p_month',          N'대상 월 (1~12)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_ORCHARD_SAVE', 'PARAMETER', '@p_title',          N'과원관리 제목';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_ORCHARD_SAVE', 'PARAMETER', '@p_thumbnail_path', N'대표 썸네일 경로';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_ORCHARD_SAVE', 'PARAMETER', '@p_visibility',     N'공개 상태 (public/private)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_ORCHARD_SAVE', 'PARAMETER', '@p_channel_web',    N'웹 노출 여부 (Y/N)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_ORCHARD_SAVE', 'PARAMETER', '@p_channel_app',    N'앱 노출 여부 (Y/N)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_ORCHARD_SAVE', 'PARAMETER', '@p_author_id',      N'작성/수정 운영자 ID';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_ORCHARD_SAVE', 'PARAMETER', '@r_orchard_id',     N'저장된 과원관리 고유 번호 반환 (OUTPUT)';

EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_ORCHARD_DELETE', NULL, NULL, N'특정 연월 과원관리 소프트 삭제';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_ORCHARD_DELETE', 'PARAMETER', '@p_year',  N'삭제 대상 연도';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_ORCHARD_DELETE', 'PARAMETER', '@p_month', N'삭제 대상 월 (1~12)';

EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_ORCHARD_IMAGE_CLEAR', NULL, NULL, N'월별 과원관리 채널별(또는 전체) 본문 이미지 삭제';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_ORCHARD_IMAGE_CLEAR', 'PARAMETER', '@p_orchard_id',   N'과원관리 고유 번호';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_ORCHARD_IMAGE_CLEAR', 'PARAMETER', '@p_channel_type', N'삭제할 채널 구분 (WEB/APP/NULL)';

EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_ORCHARD_IMAGE_ADD', NULL, NULL, N'월별 과원관리 채널별 본문 이미지 등록';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_ORCHARD_IMAGE_ADD', 'PARAMETER', '@p_orchard_id',    N'과원관리 고유 번호';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_ORCHARD_IMAGE_ADD', 'PARAMETER', '@p_channel_type',  N'채널 구분 (WEB/APP)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_ORCHARD_IMAGE_ADD', 'PARAMETER', '@p_sort_order',    N'노출 정렬 순서';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_ORCHARD_IMAGE_ADD', 'PARAMETER', '@p_original_name', N'원본 이미지 파일명';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_ORCHARD_IMAGE_ADD', 'PARAMETER', '@p_saved_name',    N'서버 저장 파일명';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_ORCHARD_IMAGE_ADD', 'PARAMETER', '@p_file_path',     N'이미지 저장 상대 경로';

EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_CALENDAR_GET', NULL, NULL, N'연도별 상시 재배력 기본 정보 및 채널별 이미지 조회';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_CALENDAR_GET', 'PARAMETER', '@p_year', N'조회 기준 연도';

EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_CALENDAR_SAVE', NULL, NULL, N'연도별 상시 재배력 등록 및 수정 (Upsert)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_CALENDAR_SAVE', 'PARAMETER', '@p_year',           N'기준 연도';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_CALENDAR_SAVE', 'PARAMETER', '@p_title',          N'재배력 제목';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_CALENDAR_SAVE', 'PARAMETER', '@p_thumbnail_path', N'대표 썸네일 경로';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_CALENDAR_SAVE', 'PARAMETER', '@p_visibility',     N'공개 상태 (public/private)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_CALENDAR_SAVE', 'PARAMETER', '@p_channel_web',    N'웹 노출 여부 (Y/N)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_CALENDAR_SAVE', 'PARAMETER', '@p_channel_app',    N'앱 노출 여부 (Y/N)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_CALENDAR_SAVE', 'PARAMETER', '@p_author_id',      N'작성/수정 운영자 ID';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_CALENDAR_SAVE', 'PARAMETER', '@r_calendar_id',    N'저장된 재배력 고유 번호 반환 (OUTPUT)';

EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_CALENDAR_IMAGE_CLEAR', NULL, NULL, N'상시 재배력 채널별(또는 전체) 본문 이미지 삭제';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_CALENDAR_IMAGE_CLEAR', 'PARAMETER', '@p_calendar_id',  N'상시 재배력 고유 번호';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_CALENDAR_IMAGE_CLEAR', 'PARAMETER', '@p_channel_type', N'삭제할 채널 구분 (WEB/APP/NULL)';

EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_CALENDAR_IMAGE_ADD', NULL, NULL, N'상시 재배력 채널별 본문 이미지 등록';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_CALENDAR_IMAGE_ADD', 'PARAMETER', '@p_calendar_id',   N'상시 재배력 고유 번호';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_CALENDAR_IMAGE_ADD', 'PARAMETER', '@p_channel_type',  N'채널 구분 (WEB/APP)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_CALENDAR_IMAGE_ADD', 'PARAMETER', '@p_sort_order',    N'노출 정렬 순서';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_CALENDAR_IMAGE_ADD', 'PARAMETER', '@p_original_name', N'원본 이미지 파일명';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_CALENDAR_IMAGE_ADD', 'PARAMETER', '@p_saved_name',    N'서버 저장 파일명';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_CALENDAR_IMAGE_ADD', 'PARAMETER', '@p_file_path',     N'이미지 저장 상대 경로';

EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_VIDEO_LIST', NULL, NULL, N'교육영상 목록 분류/키워드 필터 조회';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_VIDEO_LIST', 'PARAMETER', '@p_category', N'영상 분류 필터 (재배기술/생육단계/미분류)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_VIDEO_LIST', 'PARAMETER', '@p_keyword',  N'영상 제목 검색어';

EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_VIDEO_GET', NULL, NULL, N'교육영상 단건 상세 정보 조회';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_VIDEO_GET', 'PARAMETER', '@p_video_id', N'조회할 교육영상 고유 번호';

EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_VIDEO_SAVE', NULL, NULL, N'교육영상 신규 등록 및 수정 저장';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_VIDEO_SAVE', 'PARAMETER', '@p_video_id',       N'교육영상 고유 번호 (0: 신규, 양수: 수정)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_VIDEO_SAVE', 'PARAMETER', '@p_youtube_id',     N'유튜브 비디오 ID';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_VIDEO_SAVE', 'PARAMETER', '@p_source_url',     N'원본 유튜브 URL';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_VIDEO_SAVE', 'PARAMETER', '@p_display_title',  N'화면 표시 제목';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_VIDEO_SAVE', 'PARAMETER', '@p_original_title', N'유튜브 원본 제목';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_VIDEO_SAVE', 'PARAMETER', '@p_category',       N'영상 분류';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_VIDEO_SAVE', 'PARAMETER', '@p_description',    N'영상 상세 설명';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_VIDEO_SAVE', 'PARAMETER', '@p_thumbnail_url',  N'유튜브 썸네일 URL';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_VIDEO_SAVE', 'PARAMETER', '@p_duration_text',  N'영상 재생 시간 텍스트';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_VIDEO_SAVE', 'PARAMETER', '@p_is_playable',    N'재생 가능 여부 (Y/N)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_VIDEO_SAVE', 'PARAMETER', '@p_visibility',     N'공개 상태 (public/private)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_VIDEO_SAVE', 'PARAMETER', '@p_channel_web',    N'웹 노출 여부 (Y/N)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_VIDEO_SAVE', 'PARAMETER', '@p_channel_app',    N'앱 노출 여부 (Y/N)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_VIDEO_SAVE', 'PARAMETER', '@p_is_home_web',    N'웹 홈 메인 선정 여부 (Y/N)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_VIDEO_SAVE', 'PARAMETER', '@p_is_home_app',    N'앱 홈 메인 선정 여부 (Y/N)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_VIDEO_SAVE', 'PARAMETER', '@p_period_start',   N'게시 시작일';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_VIDEO_SAVE', 'PARAMETER', '@p_period_end',     N'게시 종료일';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_VIDEO_SAVE', 'PARAMETER', '@p_has_end_date',   N'종료일 사용 여부 (Y/N)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_VIDEO_SAVE', 'PARAMETER', '@p_attach_name',    N'관련자료 첨부파일명';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_VIDEO_SAVE', 'PARAMETER', '@p_attach_path',    N'관련자료 저장 경로';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_VIDEO_SAVE', 'PARAMETER', '@r_video_id',       N'저장된 교육영상 고유 번호 반환 (OUTPUT)';

EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_VIDEO_DELETE', NULL, NULL, N'교육영상 단건 소프트 삭제 및 홈 메인 노출 해제';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_VIDEO_DELETE', 'PARAMETER', '@p_video_id', N'삭제할 교육영상 고유 번호';
GO

DROP PROCEDURE dbo.USP_SET_DESC;
GO
