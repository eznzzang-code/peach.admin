-- ==============================================================
-- 복숭아자조금 관리자 (peach.admin) 데이터베이스 스키마
-- 대상 DB: peach
-- 기획서: 복숭아자조금_PC관리자_화면기획서_개발전달용_20261023 기준
-- ==============================================================

USE [peach];
GO

-- 1. 운영자 및 권한 테이블 (Slide 34~36)
IF OBJECT_ID('dbo.TBL_OPERATOR', 'U') IS NOT NULL DROP TABLE dbo.TBL_OPERATOR;
CREATE TABLE dbo.TBL_OPERATOR (
    operator_id        VARCHAR(50)     NOT NULL PRIMARY KEY,          -- 운영자 식별키 (예: admin, operator-a)
    operator_name      NVARCHAR(50)    NOT NULL,                      -- 이름 (예: 정유현)
    operator_account   VARCHAR(50)     NOT NULL,                      -- 로그인 계정 아이디
    operator_password  VARCHAR(200)    NOT NULL,                      -- 비밀번호 (해시)
    status             VARCHAR(10)     NOT NULL DEFAULT 'ACTIVE',     -- 계정상태: ACTIVE(사용), INACTIVE(미사용)
    
    -- 업무별 작성/게시 권한 (Y/N)
    perm_notice_write  CHAR(1)         NOT NULL DEFAULT 'N',          -- 공지/게시글 작성
    perm_notice_post   CHAR(1)         NOT NULL DEFAULT 'N',          -- 공지/게시글 게시
    perm_video_write   CHAR(1)         NOT NULL DEFAULT 'N',          -- 교육영상 작성
    perm_video_post    CHAR(1)         NOT NULL DEFAULT 'N',          -- 교육영상 게시
    perm_cal_write     CHAR(1)         NOT NULL DEFAULT 'N',          -- 상시재배력 작성
    perm_cal_post      CHAR(1)         NOT NULL DEFAULT 'N',          -- 상시재배력 게시
    perm_orchard_write CHAR(1)         NOT NULL DEFAULT 'N',          -- 월별과원관리 작성
    perm_orchard_post  CHAR(1)         NOT NULL DEFAULT 'N',          -- 월별과원관리 게시

    created_at         DATETIME        NOT NULL DEFAULT GETDATE(),
    updated_at         DATETIME        NOT NULL DEFAULT GETDATE()
);
GO

-- 2. 게시글 테이블 (공지사항, 복숭아정보, 재배자료) (Slide 3~16)
IF OBJECT_ID('dbo.TBL_BOARD_CONTENT', 'U') IS NOT NULL DROP TABLE dbo.TBL_BOARD_CONTENT;
CREATE TABLE dbo.TBL_BOARD_CONTENT (
    content_id         INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    category           NVARCHAR(30)    NOT NULL,                      -- 공지 / 복숭아정보 / 재배자료
    title              NVARCHAR(200)   NOT NULL,                      -- 제목
    body_html          NVARCHAR(MAX)   NOT NULL,                      -- 본문 내용 (HTML)
    
    visibility         VARCHAR(10)     NOT NULL DEFAULT 'public',     -- 공개여부: public(공개), private(비공개), draft(임시저장)
    is_draft           CHAR(1)         NOT NULL DEFAULT 'N',          -- 임시저장 여부: Y / N
    is_pinned          CHAR(1)         NOT NULL DEFAULT 'N',          -- 공지사항 상단고정 여부: Y / N (공지사항 전용)
    
    -- 채널 노출 여부
    channel_web        CHAR(1)         NOT NULL DEFAULT 'Y',          -- Web 노출
    channel_app        CHAR(1)         NOT NULL DEFAULT 'Y',          -- App 노출
    
    -- 게시 기간
    period_start       DATETIME        NOT NULL,                      -- 게시 시작일
    period_end         DATETIME        NULL,                          -- 게시 종료일 (종료일 없음일 경우 NULL)
    has_end_date       CHAR(1)         NOT NULL DEFAULT 'Y',          -- 종료일 여부: Y / N
    
    -- 긴급 설정
    is_urgent          CHAR(1)         NOT NULL DEFAULT 'N',          -- 긴급 사용 여부: Y / N
    urgent_start       DATETIME        NULL,                          -- 긴급 시작일
    urgent_end         DATETIME        NULL,                          -- 긴급 종료일
    urgent_order       INT             NOT NULL DEFAULT 0,            -- 홈 긴급 노출 순서
    
    -- 연결 자료 (Slide 12: relatedTarget)
    related_type       VARCHAR(30)     NULL,                          -- calendar, orchard, video, post
    related_target_id  VARCHAR(100)    NULL,                          -- 대상 식별자 (ID 또는 연월)
    
    author_id          VARCHAR(50)     NOT NULL,                      -- 작성자 ID
    author_name        NVARCHAR(50)    NOT NULL,                      -- 작성자 이름
    
    is_deleted         CHAR(1)         NOT NULL DEFAULT 'N',          -- 삭제 여부: Y / N
    created_at         DATETIME        NOT NULL DEFAULT GETDATE(),
    updated_at         DATETIME        NOT NULL DEFAULT GETDATE()
);
CREATE INDEX IX_BOARD_CATEGORY_DATE ON dbo.TBL_BOARD_CONTENT (category, is_deleted, updated_at DESC);
GO

-- 3. 게시글 첨부파일 테이블 (Slide 13)
IF OBJECT_ID('dbo.TBL_BOARD_ATTACH', 'U') IS NOT NULL DROP TABLE dbo.TBL_BOARD_ATTACH;
CREATE TABLE dbo.TBL_BOARD_ATTACH (
    attach_id          INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    content_id         INT             NOT NULL,                      -- TBL_BOARD_CONTENT 외래키
    original_name      NVARCHAR(260)   NOT NULL,                      -- 원본 파일명
    saved_name         NVARCHAR(260)   NOT NULL,                      -- 서버 저장 파일명
    file_path          NVARCHAR(500)   NOT NULL,                      -- 파일 저장 경로
    file_size          BIGINT          NOT NULL DEFAULT 0,            -- 파일 크기 (Byte)
    download_cnt       INT             NOT NULL DEFAULT 0,            -- 다운로드 수
    created_at         DATETIME        NOT NULL DEFAULT GETDATE()
);
CREATE INDEX IX_BOARD_ATTACH_CONTENT ON dbo.TBL_BOARD_ATTACH (content_id);
GO

-- 4. 월별 과원관리 테이블 (Slide 17~23)
IF OBJECT_ID('dbo.TBL_ORCHARD_CONTENT', 'U') IS NOT NULL DROP TABLE dbo.TBL_ORCHARD_CONTENT;
CREATE TABLE dbo.TBL_ORCHARD_CONTENT (
    orchard_id         INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    target_year        INT             NOT NULL,                      -- 연도 (예: 2026, 2027)
    target_month       INT             NOT NULL,                      -- 월 (1 ~ 12)
    title              NVARCHAR(200)   NOT NULL,                      -- 제목 (예: 2월 과원관리)
    thumbnail_path     NVARCHAR(500)   NULL,                          -- 썸네일 이미지 경로
    
    visibility         VARCHAR(10)     NOT NULL DEFAULT 'public',     -- 공개여부: public / private
    channel_web        CHAR(1)         NOT NULL DEFAULT 'Y',          -- Web 채널 노출
    channel_app        CHAR(1)         NOT NULL DEFAULT 'Y',          -- App 채널 노출
    
    author_id          VARCHAR(50)     NULL,
    is_deleted         CHAR(1)         NOT NULL DEFAULT 'N',
    created_at         DATETIME        NOT NULL DEFAULT GETDATE(),
    updated_at         DATETIME        NOT NULL DEFAULT GETDATE(),
    
    CONSTRAINT UQ_ORCHARD_YEAR_MONTH UNIQUE (target_year, target_month)
);
GO

-- 5. 월별 과원관리 본문 이미지 목록 (Slide 20: Web/App 채널별 복수 이미지 및 순서)
IF OBJECT_ID('dbo.TBL_ORCHARD_IMAGE', 'U') IS NOT NULL DROP TABLE dbo.TBL_ORCHARD_IMAGE;
CREATE TABLE dbo.TBL_ORCHARD_IMAGE (
    image_id           INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    orchard_id         INT             NOT NULL,                      -- TBL_ORCHARD_CONTENT 외래키
    channel_type       VARCHAR(10)     NOT NULL,                      -- WEB / APP
    sort_order         INT             NOT NULL DEFAULT 1,            -- 노출 순서 (위/아래 정렬)
    original_name      NVARCHAR(260)   NOT NULL,
    saved_name         NVARCHAR(260)   NOT NULL,
    file_path          NVARCHAR(500)   NOT NULL,
    created_at         DATETIME        NOT NULL DEFAULT GETDATE()
);
CREATE INDEX IX_ORCHARD_IMAGE_SORT ON dbo.TBL_ORCHARD_IMAGE (orchard_id, channel_type, sort_order);
GO

-- 6. 상시 재배력 테이블 (Slide 24~26)
IF OBJECT_ID('dbo.TBL_CALENDAR_CONTENT', 'U') IS NOT NULL DROP TABLE dbo.TBL_CALENDAR_CONTENT;
CREATE TABLE dbo.TBL_CALENDAR_CONTENT (
    calendar_id        INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    target_year        INT             NOT NULL,                      -- 기준 연도
    title              NVARCHAR(200)   NOT NULL,                      -- 제목 (예: 복숭아 재배력)
    thumbnail_path     NVARCHAR(500)   NULL,                          -- 대표 썸네일
    
    visibility         VARCHAR(10)     NOT NULL DEFAULT 'public',     -- 공개여부: public / private
    channel_web        CHAR(1)         NOT NULL DEFAULT 'Y',          -- Web 채널 노출
    channel_app        CHAR(1)         NOT NULL DEFAULT 'Y',          -- App 채널 노출
    
    author_id          VARCHAR(50)     NULL,
    is_deleted         CHAR(1)         NOT NULL DEFAULT 'N',
    created_at         DATETIME        NOT NULL DEFAULT GETDATE(),
    updated_at         DATETIME        NOT NULL DEFAULT GETDATE()
);
GO

-- 7. 상시 재배력 본문 이미지 목록 (Slide 25: Web/App 채널별 복수 이미지 및 순서)
IF OBJECT_ID('dbo.TBL_CALENDAR_IMAGE', 'U') IS NOT NULL DROP TABLE dbo.TBL_CALENDAR_IMAGE;
CREATE TABLE dbo.TBL_CALENDAR_IMAGE (
    image_id           INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    calendar_id        INT             NOT NULL,                      -- TBL_CALENDAR_CONTENT 외래키
    channel_type       VARCHAR(10)     NOT NULL,                      -- WEB / APP
    sort_order         INT             NOT NULL DEFAULT 1,            -- 노출 순서
    original_name      NVARCHAR(260)   NOT NULL,
    saved_name         NVARCHAR(260)   NOT NULL,
    file_path          NVARCHAR(500)   NOT NULL,
    created_at         DATETIME        NOT NULL DEFAULT GETDATE()
);
CREATE INDEX IX_CALENDAR_IMAGE_SORT ON dbo.TBL_CALENDAR_IMAGE (calendar_id, channel_type, sort_order);
GO

-- 8. 교육영상 테이블 (Slide 28~33)
IF OBJECT_ID('dbo.TBL_VIDEO_CONTENT', 'U') IS NOT NULL DROP TABLE dbo.TBL_VIDEO_CONTENT;
CREATE TABLE dbo.TBL_VIDEO_CONTENT (
    video_id           INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    youtube_id         VARCHAR(50)     NOT NULL,                      -- 유튜브 영상 ID 또는 고유 비디오 ID
    source_url         NVARCHAR(500)   NOT NULL,                      -- 원본 영상 URL
    display_title      NVARCHAR(200)   NOT NULL,                      -- 표시 제목 (관리자 가공)
    original_title     NVARCHAR(200)   NULL,                          -- 유튜브 수집 원본 제목
    category           NVARCHAR(50)    NOT NULL,                      -- 분류: 재배기술 / 생육단계
    description        NVARCHAR(MAX)   NULL,                          -- 영상 설명
    thumbnail_url      NVARCHAR(500)   NULL,                          -- 썸네일 URL
    duration_text      VARCHAR(20)     NULL,                          -- 재생 시간 (예: 12:34)
    is_playable        CHAR(1)         NOT NULL DEFAULT 'Y',          -- 재생 가능 여부
    
    visibility         VARCHAR(10)     NOT NULL DEFAULT 'public',     -- 공개여부: public / private
    channel_web        CHAR(1)         NOT NULL DEFAULT 'Y',          -- Web 채널 노출
    channel_app        CHAR(1)         NOT NULL DEFAULT 'Y',          -- App 채널 노출
    
    -- 홈 메인 노출 선정 (Slide 29, 31)
    is_home_web        CHAR(1)         NOT NULL DEFAULT 'N',          -- Web 메인 선정 영상
    is_home_app        CHAR(1)         NOT NULL DEFAULT 'N',          -- App 메인 선정 영상 (단 1개만 유지)
    
    -- 게시 기간
    period_start       DATETIME        NOT NULL,                      -- 게시 시작일
    period_end         DATETIME        NULL,                          -- 게시 종료일
    has_end_date       CHAR(1)         NOT NULL DEFAULT 'Y',
    
    -- 관련자료 단일 첨부파일 (Slide 30)
    attach_name        NVARCHAR(260)   NULL,
    attach_path        NVARCHAR(500)   NULL,
    
    is_deleted         CHAR(1)         NOT NULL DEFAULT 'N',
    created_at         DATETIME        NOT NULL DEFAULT GETDATE(),
    updated_at         DATETIME        NOT NULL DEFAULT GETDATE()
);
CREATE INDEX IX_VIDEO_HOME ON dbo.TBL_VIDEO_CONTENT (is_deleted, is_home_web, is_home_app);
GO

-- 기본 최고관리자 계정 1건 등록 (초기 데이터)
INSERT INTO dbo.TBL_OPERATOR (
    operator_id, operator_name, operator_account, operator_password, status,
    perm_notice_write, perm_notice_post, perm_video_write, perm_video_post,
    perm_cal_write, perm_cal_post, perm_orchard_write, perm_orchard_post
) VALUES (
    'admin', N'정유현', 'admin', 'admin1234!', 'ACTIVE',
    'Y', 'Y', 'Y', 'Y',
    'Y', 'Y', 'Y', 'Y'
);
GO
