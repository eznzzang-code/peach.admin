-- ==============================================================
-- 복숭아자조금 관리자 (peach.admin) 설문조사 및 행사·교육참여 관리 DB 스키마 & 프로시저
-- 대상 DB: peach (121.78.131.15)
-- 기준 기획서: 복숭아자조금_PC관리자_화면기획서_통합본_퍼블기준수정_20261028 (v8)
-- ==============================================================

USE [peach];
GO

-- ==============================================================
-- 1. 테이블 생성
-- ==============================================================

-- [1-1] 설문·행사 개인정보 동의 기본값 설정 테이블 (TBL_PARTICIPATION_CONFIG)
IF OBJECT_ID('dbo.TBL_PARTICIPATION_CONFIG', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TBL_PARTICIPATION_CONFIG (
        config_id          INT             NOT NULL PRIMARY KEY DEFAULT 1, -- 설정 단일 행 식별자 (1 고정)
        consent_title      NVARCHAR(200)   NOT NULL,                       -- 개인정보 수집·이용 동의 기본 제목
        consent_purpose    NVARCHAR(1000)  NOT NULL,                       -- 개인정보 수집·이용 목적 기본 문구 (최근 저장값 기억)
        consent_items      NVARCHAR(1000)  NOT NULL,                       -- 개인정보 수집 항목 기본 문구 (최근 저장값 기억)
        consent_retention  NVARCHAR(1000)  NOT NULL,                       -- 개인정보 보유·이용기간 기본 문구 (최근 저장값 기억)
        updated_at         DATETIME        NOT NULL DEFAULT GETDATE()      -- 최종 수정 일시
    );

    INSERT INTO dbo.TBL_PARTICIPATION_CONFIG (
        config_id, consent_title, consent_purpose, consent_items, consent_retention, updated_at
    ) VALUES (
        1,
        N'개인정보 수집·이용 동의',
        N'설문조사 및 행사·교육 참여 접수, 운영 안내와 결과 분석',
        N'성명, 연락처, 설문 응답 및 신청 내용',
        N'수집·이용 목적 달성 후 지체 없이 파기',
        GETDATE()
    );
END;
GO

-- [1-2] 설문조사 및 행사·교육 마스터 테이블 (TBL_PARTICIPATION_FORM)
IF OBJECT_ID('dbo.TBL_PARTICIPATION_FORM', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TBL_PARTICIPATION_FORM (
        form_id             VARCHAR(64)     NOT NULL PRIMARY KEY,           -- 문서 고유 식별자 (PK, 예: id-...)
        form_kind           VARCHAR(20)     NOT NULL,                       -- 업무 구분 (survey: 설문조사, event: 행사·교육참여)
        title               NVARCHAR(200)   NOT NULL,                       -- 설문명 또는 행사·교육명
        description         NVARCHAR(MAX)   NULL,                           -- 소개 및 안내 문구
        status              VARCHAR(20)     NOT NULL DEFAULT 'draft',       -- 기본 상태 (draft: 작성중, live: 공개/참여중, closed: 종료)
        revision            INT             NOT NULL DEFAULT 1,             -- 문서 개정 번호 (저장 시 1씩 증가, 응답 유효성 검증용)
        is_public           CHAR(1)         NOT NULL DEFAULT 'N',           -- 공개 여부 (Y: 공개, N: 비공개/미공개)
        published_at        DATETIME        NULL,                           -- 최초 공개 일시 (NULL이면 작성중 미공개 상태)
        closed_at           DATETIME        NULL,                           -- 수동 종료 일시
        participation_token VARCHAR(64)     NULL,                           -- 참여 링크 고유 토큰 (participant.asp?participate=토큰)

        -- 참여/신청 기간 설정
        period_start        VARCHAR(20)     NOT NULL,                       -- 참여/신청 시작 일시 (YYYY-MM-DDTHH:mm)
        period_end          VARCHAR(20)     NOT NULL,                       -- 참여/신청 종료 일시 (YYYY-MM-DDTHH:mm)
        end_mode            VARCHAR(10)     NOT NULL DEFAULT 'auto',        -- 종료일 설정 방식 (auto: 1년 뒤 자동종료, manual: 직접 지정)
        completion_msg      NVARCHAR(1000)  NULL,                           -- 참여/신청 완료 후 표시할 안내 문구

        -- 행사·교육 전용 설정 (form_kind = 'event' 시 사용)
        event_type          NVARCHAR(20)    NULL DEFAULT N'교육',            -- 행사·교육 유형 (행사 / 교육)
        schedule_mode       VARCHAR(10)     NULL DEFAULT 'single',          -- 행사 일정 구분 (single: 하루 일정, period: 기간 일정)
        event_date          VARCHAR(20)     NULL,                           -- 행사 개최(시작) 일시 (YYYY-MM-DDTHH:mm)
        event_end_date      VARCHAR(20)     NULL,                           -- 행사 종료 일시 (YYYY-MM-DDTHH:mm, 기간 일정 시)
        event_place         NVARCHAR(200)   NULL,                           -- 행사·교육 개최 장소
        capacity_enabled    CHAR(1)         NOT NULL DEFAULT 'N',           -- 정원 적용 여부 (Y: 정원 제한 사용, N: 무제한)
        capacity_limit      INT             NOT NULL DEFAULT 30,            -- 참석 정원 인원수 (참석 확정 기준)
        waitlist_enabled    CHAR(1)         NOT NULL DEFAULT 'N',           -- 정원 초과 시 대기 접수 여부 (Y: 대기 접수, N: 전체 마감)

        -- 개인정보 수집·이용 동의 설정
        consent_included    CHAR(1)         NOT NULL DEFAULT 'Y',           -- 개인정보 동의 포함 여부 (Y: 포함, N: 미포함)
        consent_title       NVARCHAR(200)   NULL,                           -- 개인정보 동의 제목
        consent_purpose     NVARCHAR(1000)  NULL,                           -- 개인정보 수집·이용 목적
        consent_items       NVARCHAR(1000)  NULL,                           -- 개인정보 수집 항목
        consent_retention   NVARCHAR(1000)  NULL,                           -- 개인정보 보유 및 이용기간

        -- 문항 구조 JSON 및 메타데이터
        questions_json      NVARCHAR(MAX)   NULL,                           -- 전체 문항·선택지·이동경로 JSON 배열 (프론트엔드 완벽 호환용)
        author_id           VARCHAR(50)     NULL,                           -- 작성/수정 관리자 ID
        is_deleted          CHAR(1)         NOT NULL DEFAULT 'N',           -- 삭제 여부 (Y: 삭제됨, N: 정상)
        created_at          DATETIME        NOT NULL DEFAULT GETDATE(),     -- 최초 등록 일시
        updated_at          DATETIME        NOT NULL DEFAULT GETDATE()      -- 최종 수정 일시
    );

    CREATE INDEX IX_PARTICIPATION_FORM_KIND ON dbo.TBL_PARTICIPATION_FORM (form_kind, is_deleted, updated_at DESC);
    CREATE INDEX IX_PARTICIPATION_FORM_TOKEN ON dbo.TBL_PARTICIPATION_FORM (participation_token) WHERE participation_token IS NOT NULL;
END;
GO

-- [1-3] 설문조사 및 행사·교육 문항 상세 테이블 (TBL_PARTICIPATION_QUESTION)
IF OBJECT_ID('dbo.TBL_PARTICIPATION_QUESTION', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TBL_PARTICIPATION_QUESTION (
        question_seq        INT IDENTITY(1,1) NOT NULL PRIMARY KEY,         -- 문항 고유 순번 (PK)
        form_id             VARCHAR(64)     NOT NULL,                       -- 문서 고유 식별자 (TBL_PARTICIPATION_FORM.form_id FK)
        question_id         VARCHAR(64)     NOT NULL,                       -- 문서 내 문항 식별키 (예: q1, __event_attendance)
        sort_order          INT             NOT NULL DEFAULT 1,             -- 문항 노출 순서 (1부터 시작)
        system_type         VARCHAR(30)     NULL,                           -- 시스템 고정 문항 구분 (attendance: 행사 참석 여부 고정 문항)
        question_type       VARCHAR(20)     NOT NULL,                       -- 문항 유형 (single: 단일선택, multi: 복수선택, short: 단답형, long: 장문형, rating: 평점형)
        title               NVARCHAR(500)   NOT NULL,                       -- 질문 제목
        description         NVARCHAR(1000)  NULL,                           -- 질문 보조 설명
        is_required         CHAR(1)         NOT NULL DEFAULT 'Y',           -- 필수 응답 여부 (Y: 필수, N: 선택)
        next_target         VARCHAR(64)     NOT NULL DEFAULT 'next',        -- 기본 다음 이동 목적지 (next: 다음 질문, submit: 제출, 또는 특정 question_id)
        options_json        NVARCHAR(MAX)   NULL,                           -- 선택지 목록 및 답변별 이동(to) 설정 JSON 배열
        created_at          DATETIME        NOT NULL DEFAULT GETDATE()      -- 등록 일시
    );

    CREATE INDEX IX_PARTICIPATION_QUESTION_FORM ON dbo.TBL_PARTICIPATION_QUESTION (form_id, sort_order ASC);
END;
GO

-- [1-4] 설문 응답 및 행사·교육 참여 신청 내역 테이블 (TBL_PARTICIPATION_RESPONSE)
IF OBJECT_ID('dbo.TBL_PARTICIPATION_RESPONSE', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TBL_PARTICIPATION_RESPONSE (
        response_seq          INT IDENTITY(1,1) NOT NULL PRIMARY KEY,       -- 응답/신청 고유 순번 (PK)
        submission_id         VARCHAR(64)     NOT NULL,                     -- 제출 고유 식별키 (중복 제출 방지용)
        form_id               VARCHAR(64)     NOT NULL,                     -- 문서 고유 식별자 (TBL_PARTICIPATION_FORM.form_id FK)
        form_revision         INT             NOT NULL DEFAULT 1,           -- 제출 당시 문서 개정 번호 (revision)
        source_type           VARCHAR(20)     NOT NULL DEFAULT 'participation', -- 응답 출처 (participation: 실제 참여/신청)
        member_id             VARCHAR(64)     NULL,                         -- 회원 고유 식별값 (행사·교육 신청 시 확인된 회원 ID, 설문은 NULL)
        member_name           NVARCHAR(50)    NULL,                         -- 회원 성명 (행사·교육 신청자 이름)
        member_phone          VARCHAR(20)     NULL,                         -- 회원 휴대폰 번호 (행사·교육 신청자 연락처)
        respondent_id         VARCHAR(64)     NULL,                         -- 비회원 설문 참여자 브라우저 식별키
        attendance_choice     VARCHAR(20)     NULL,                         -- 행사 참석 여부 선택값 (attend: 참석, absent: 미참석)
        enrollment_status     VARCHAR(20)     NULL,                         -- 행사 접수 상태 (confirmed: 참석 확정, waitlist: 대기, absent: 미참석)
        answers_json          NVARCHAR(MAX)   NOT NULL,                     -- 문항별 답변 데이터 JSON 객체
        path_json             NVARCHAR(MAX)   NOT NULL,                     -- 실제 방문한 문항 ID 경로 JSON 배열
        consent_agreed        CHAR(1)         NOT NULL DEFAULT 'Y',         -- 개인정보 수집·이용 동의 여부 (Y / N)
        consent_snapshot_json NVARCHAR(MAX)   NULL,                         -- 제출 시점 개인정보 동의 문구 스냅샷 JSON
        submitted_at          DATETIME        NOT NULL DEFAULT GETDATE(),   -- 제출(응답/신청) 일시

        CONSTRAINT UQ_PARTICIPATION_SUBMISSION UNIQUE (submission_id)
    );

    CREATE INDEX IX_PARTICIPATION_RESPONSE_FORM ON dbo.TBL_PARTICIPATION_RESPONSE (form_id, submitted_at ASC);
    CREATE INDEX IX_PARTICIPATION_RESPONSE_MEMBER ON dbo.TBL_PARTICIPATION_RESPONSE (member_id, submitted_at DESC) WHERE member_id IS NOT NULL;
END;
GO

-- ==============================================================
-- 2. 저장 프로시저 (Stored Procedures) 생성
-- ==============================================================

-- [2-1] 설문조사 및 행사·교육 전체/조건별 목록 조회 (USP_ADMIN_PARTICIPATION_LIST)
IF OBJECT_ID('dbo.USP_ADMIN_PARTICIPATION_LIST', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_PARTICIPATION_LIST;
GO
CREATE PROCEDURE dbo.USP_ADMIN_PARTICIPATION_LIST
    @p_form_kind  VARCHAR(20)   = NULL,  -- 업무 구분 ('survey': 설문조사, 'event': 행사·교육, NULL: 전체)
    @p_keyword    NVARCHAR(100) = NULL,  -- 설문명/행사명 검색어
    @p_from_date  VARCHAR(10)   = NULL,  -- 조회 기간 시작일 (YYYY-MM-DD)
    @p_to_date    VARCHAR(10)   = NULL   -- 조회 기간 종료일 (YYYY-MM-DD)
AS
BEGIN
    -- ==========================================================
    -- 프로시저명 : dbo.USP_ADMIN_PARTICIPATION_LIST
    -- 설      명 : 설문조사(survey) 및 행사·교육참여(event) 문서 목록, 응답/신청 내역, 개인정보 동의 기본값 설정을 조회합니다.
    -- ==========================================================
    SET NOCOUNT ON;

    -- [ResultSet 1] 설문조사 / 행사·교육 마스터 목록 조회
    SELECT
        f.form_id,                                                -- 문서 고유 식별자 (PK)
        f.form_kind,                                              -- 업무 구분 ('survey': 설문조사, 'event': 행사·교육)
        f.title,                                                  -- 설문명 또는 행사·교육명
        f.description,                                            -- 소개 및 안내 문구
        f.status,                                                 -- 문서 상태 ('draft'/'live'/'closed')
        f.revision,                                               -- 문서 개정 번호
        f.is_public,                                              -- 공개 여부 ('Y'/'N')
        CONVERT(VARCHAR(19), f.published_at, 126) AS published_at_iso, -- 최초 공개 일시 (ISO 문자열)
        CONVERT(VARCHAR(19), f.closed_at, 126)    AS closed_at_iso,    -- 수동 종료 일시 (ISO 문자열)
        f.participation_token,                                    -- 외부/회원 참여 링크 고유 토큰
        f.period_start,                                           -- 참여/신청 시작 일시 (YYYY-MM-DDTHH:mm)
        f.period_end,                                             -- 참여/신청 종료 일시 (YYYY-MM-DDTHH:mm)
        f.end_mode,                                               -- 종료일 설정 방식 ('auto'/'manual')
        f.completion_msg,                                         -- 참여 완료 안내 문구
        f.event_type,                                             -- 행사 유형 ('행사'/'교육')
        f.schedule_mode,                                          -- 행사 일정 구분 ('single'/'period')
        f.event_date,                                             -- 행사 개최(시작) 일시
        f.event_end_date,                                         -- 행사 종료 일시
        f.event_place,                                            -- 행사 개최 장소
        f.capacity_enabled,                                       -- 정원 적용 여부 ('Y'/'N')
        f.capacity_limit,                                         -- 참석 정원 인원수
        f.waitlist_enabled,                                       -- 정원 초과 시 대기 접수 여부 ('Y'/'N')
        f.consent_included,                                       -- 개인정보 동의 포함 여부 ('Y'/'N')
        f.consent_title,                                          -- 개인정보 동의 제목
        f.consent_purpose,                                        -- 개인정보 수집·이용 목적
        f.consent_items,                                          -- 개인정보 수집 항목
        f.consent_retention,                                      -- 개인정보 보유·이용기간
        f.questions_json,                                         -- 전체 문항 구조 JSON 배열
        f.author_id,                                              -- 작성/수정 관리자 ID
        CONVERT(VARCHAR(19), f.created_at, 126)   AS created_at_iso,   -- 최초 생성 일시 (ISO 문자열)
        CONVERT(VARCHAR(19), f.updated_at, 126)   AS updated_at_iso    -- 최종 수정 일시 (ISO 문자열)
    FROM dbo.TBL_PARTICIPATION_FORM f
    WHERE f.is_deleted = 'N'
      AND (@p_form_kind IS NULL OR @p_form_kind = '' OR f.form_kind = @p_form_kind)
      AND (@p_keyword IS NULL OR @p_keyword = '' OR f.title LIKE N'%' + @p_keyword + N'%')
      AND (@p_to_date IS NULL OR @p_to_date = '' OR LEFT(f.period_start, 10) <= @p_to_date)
      AND (@p_from_date IS NULL OR @p_from_date = '' OR LEFT(f.period_end, 10) >= @p_from_date)
    ORDER BY f.updated_at DESC, f.created_at DESC;

    -- [ResultSet 2] 해당 문서들의 응답/신청 전체 내역 조회
    SELECT
        r.response_seq,                                           -- 응답/신청 일련번호 (PK)
        r.submission_id,                                          -- 제출 고유 식별키
        r.form_id,                                                -- 소속 문서 고유 식별자 (FK)
        r.form_revision,                                          -- 응답 시점 문서 개정 번호
        r.source_type,                                            -- 접수 출처 구분
        r.member_id,                                              -- 회원 고유 식별값 (행사·교육 전용)
        r.member_name,                                            -- 회원 성명
        r.member_phone,                                           -- 회원 휴대폰 번호
        r.respondent_id,                                          -- 비회원 설문 참여자 식별키
        r.attendance_choice,                                      -- 행사 참석 여부 선택 ('attend'/'absent')
        r.enrollment_status,                                      -- 행사 접수 상태 ('confirmed'/'waitlist'/'absent')
        r.answers_json,                                           -- 문항별 답변 JSON 객체
        r.path_json,                                              -- 실제 방문한 문항 ID 경로 JSON 배열
        r.consent_agreed,                                         -- 개인정보 동의 여부 ('Y'/'N')
        r.consent_snapshot_json,                                  -- 제출 시점 동의 문구 스냅샷 JSON
        CONVERT(VARCHAR(19), r.submitted_at, 126) AS submitted_at_iso -- 제출 완료 일시 (ISO 문자열)
    FROM dbo.TBL_PARTICIPATION_RESPONSE r
    INNER JOIN dbo.TBL_PARTICIPATION_FORM f ON f.form_id = r.form_id
    WHERE f.is_deleted = 'N'
      AND (@p_form_kind IS NULL OR @p_form_kind = '' OR f.form_kind = @p_form_kind)
    ORDER BY r.submitted_at ASC, r.response_seq ASC;

    -- [ResultSet 3] 개인정보 동의 기본값 설정 단건 조회
    SELECT TOP 1
        config_id,                                                -- 설정 고유 번호 (PK)
        consent_title,                                            -- 개인정보 동의 기본 제목
        consent_purpose,                                          -- 개인정보 수집·이용 목적 기본 문구
        consent_items,                                            -- 개인정보 수집 항목 기본 문구
        consent_retention,                                        -- 개인정보 보유·이용기간 기본 문구
        CONVERT(VARCHAR(19), updated_at, 126) AS updated_at_iso   -- 최종 수정 일시 (ISO 문자열)
    FROM dbo.TBL_PARTICIPATION_CONFIG
    WHERE config_id = 1;
END;
GO

-- [2-2] 설문조사 및 행사·교육 단건 상세 조회 (USP_ADMIN_PARTICIPATION_GET)
IF OBJECT_ID('dbo.USP_ADMIN_PARTICIPATION_GET', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_PARTICIPATION_GET;
GO
CREATE PROCEDURE dbo.USP_ADMIN_PARTICIPATION_GET
    @p_form_id             VARCHAR(64) = NULL, -- 조회할 문서 고유 식별자 (form_id)
    @p_participation_token VARCHAR(64) = NULL  -- 조회할 참여 링크 고유 토큰 (participation_token)
AS
BEGIN
    -- ==========================================================
    -- 프로시저명 : dbo.USP_ADMIN_PARTICIPATION_GET
    -- 설      명 : 문서 ID(@p_form_id) 또는 참여 링크 토큰(@p_participation_token)으로 단건 상세, 문항 목록, 응답 내역을 조회합니다.
    -- ==========================================================
    SET NOCOUNT ON;

    DECLARE @v_target_id VARCHAR(64);

    -- 문서 ID 또는 참여 토큰으로 대상 문서 식별자(form_id) 확인
    SELECT TOP 1 @v_target_id = form_id
    FROM dbo.TBL_PARTICIPATION_FORM
    WHERE is_deleted = 'N'
      AND (
            (@p_form_id IS NOT NULL AND @p_form_id <> '' AND form_id = @p_form_id)
         OR (@p_participation_token IS NOT NULL AND @p_participation_token <> '' AND participation_token = @p_participation_token)
      );

    -- [ResultSet 1] 문서 마스터 상세 정보 조회
    SELECT
        form_id,                                                -- 문서 고유 식별자 (PK)
        form_kind,                                              -- 업무 구분 ('survey'/'event')
        title,                                                  -- 설문명 또는 행사·교육명
        description,                                            -- 소개 및 안내 문구
        status,                                                 -- 문서 상태 ('draft'/'live'/'closed')
        revision,                                               -- 문서 개정 번호
        is_public,                                              -- 공개 여부 ('Y'/'N')
        CONVERT(VARCHAR(19), published_at, 126) AS published_at_iso, -- 최초 공개 일시
        CONVERT(VARCHAR(19), closed_at, 126)    AS closed_at_iso,    -- 수동 종료 일시
        participation_token,                                    -- 참여 링크 고유 토큰
        period_start,                                           -- 참여/신청 시작 일시
        period_end,                                             -- 참여/신청 종료 일시
        end_mode,                                               -- 종료일 설정 방식 ('auto'/'manual')
        completion_msg,                                         -- 참여 완료 안내 문구
        event_type,                                             -- 행사 유형 ('행사'/'교육')
        schedule_mode,                                          -- 행사 일정 구분 ('single'/'period')
        event_date,                                             -- 행사 개최(시작) 일시
        event_end_date,                                         -- 행사 종료 일시
        event_place,                                            -- 행사 개최 장소
        capacity_enabled,                                       -- 정원 적용 여부 ('Y'/'N')
        capacity_limit,                                         -- 참석 정원 인원수
        waitlist_enabled,                                       -- 대기 접수 여부 ('Y'/'N')
        consent_included,                                       -- 개인정보 동의 포함 여부 ('Y'/'N')
        consent_title,                                          -- 개인정보 동의 제목
        consent_purpose,                                        -- 수집·이용 목적
        consent_items,                                          -- 수집 항목
        consent_retention,                                      -- 보유·이용기간
        questions_json,                                         -- 전체 문항 구조 JSON 배열
        author_id,                                              -- 작성/수정 관리자 ID
        CONVERT(VARCHAR(19), created_at, 126)   AS created_at_iso,   -- 최초 생성 일시
        CONVERT(VARCHAR(19), updated_at, 126)   AS updated_at_iso    -- 최종 수정 일시
    FROM dbo.TBL_PARTICIPATION_FORM
    WHERE form_id = @v_target_id AND is_deleted = 'N';

    -- [ResultSet 2] 문서 소속 문항 상세 목록 조회
    SELECT
        question_seq,  -- 문항 고유 일련번호 (PK)
        form_id,       -- 소속 문서 고유 식별자 (FK)
        question_id,   -- 문서 내 문항 식별키 (예: q1, q2)
        sort_order,    -- 문항 노출 순서
        system_type,   -- 시스템 고정 문항 구분 ('attendance' 또는 NULL)
        question_type, -- 문항 유형 ('single'/'multi'/'short'/'long')
        title,         -- 질문 제목
        description,   -- 질문 보조 설명
        is_required,   -- 필수 응답 여부 ('Y'/'N')
        next_target,   -- 기본 다음 이동 대상 ('next'/'submit'/문항ID)
        options_json   -- 선택지 배열 JSON
    FROM dbo.TBL_PARTICIPATION_QUESTION
    WHERE form_id = @v_target_id
    ORDER BY sort_order ASC, question_seq ASC;

    -- [ResultSet 3] 문서 소속 응답/신청 목록 조회
    SELECT
        response_seq,                                           -- 응답/신청 일련번호 (PK)
        submission_id,                                          -- 제출 고유 식별키
        form_id,                                                -- 소속 문서 고유 식별자 (FK)
        form_revision,                                          -- 응답 시점 문서 개정 번호
        source_type,                                            -- 접수 출처 구분
        member_id,                                              -- 회원 고유 식별값
        member_name,                                            -- 회원 성명
        member_phone,                                           -- 회원 휴대폰 번호
        respondent_id,                                          -- 비회원 설문 참여자 식별키
        attendance_choice,                                      -- 행사 참석 여부 선택 ('attend'/'absent')
        enrollment_status,                                      -- 행사 접수 상태 ('confirmed'/'waitlist'/'absent')
        answers_json,                                           -- 문항별 답변 JSON 객체
        path_json,                                              -- 방문 문항 경로 JSON 배열
        consent_agreed,                                         -- 개인정보 동의 여부 ('Y'/'N')
        consent_snapshot_json,                                  -- 제출 시점 동의 문구 스냅샷 JSON
        CONVERT(VARCHAR(19), submitted_at, 126) AS submitted_at_iso -- 제출 완료 일시
    FROM dbo.TBL_PARTICIPATION_RESPONSE
    WHERE form_id = @v_target_id
    ORDER BY submitted_at ASC, response_seq ASC;
END;
GO

-- [2-3] 설문조사 및 행사·교육 등록/수정 (USP_ADMIN_PARTICIPATION_SAVE)
IF OBJECT_ID('dbo.USP_ADMIN_PARTICIPATION_SAVE', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_PARTICIPATION_SAVE;
GO
CREATE PROCEDURE dbo.USP_ADMIN_PARTICIPATION_SAVE
    @p_form_id             VARCHAR(64),                  -- 문서 고유 식별자 (PK)
    @p_form_kind           VARCHAR(20),                  -- 업무 구분 (survey / event)
    @p_title               NVARCHAR(200),                -- 설문명 또는 행사·교육명
    @p_description         NVARCHAR(MAX)   = NULL,       -- 소개 및 안내 문구
    @p_status              VARCHAR(20)     = 'draft',    -- 문서 상태 (draft / live / closed)
    @p_revision            INT             = 1,          -- 문서 개정 번호
    @p_is_public           CHAR(1)         = 'N',        -- 공개 여부 (Y / N)
    @p_published_at        VARCHAR(30)     = NULL,       -- 최초 공개 일시 (ISO 문자열)
    @p_closed_at           VARCHAR(30)     = NULL,       -- 수동 종료 일시 (ISO 문자열)
    @p_participation_token VARCHAR(64)     = NULL,       -- 참여 링크 고유 토큰
    @p_period_start        VARCHAR(20),                  -- 참여/신청 시작 일시 (YYYY-MM-DDTHH:mm)
    @p_period_end          VARCHAR(20),                  -- 참여/신청 종료 일시 (YYYY-MM-DDTHH:mm)
    @p_end_mode            VARCHAR(10)     = 'auto',     -- 종료일 설정 방식 (auto / manual)
    @p_completion_msg      NVARCHAR(1000)  = NULL,       -- 참여 완료 안내 문구
    @p_event_type          NVARCHAR(20)    = N'교육',     -- 행사 유형 (행사 / 교육)
    @p_schedule_mode       VARCHAR(10)     = 'single',   -- 행사 일정 구분 (single / period)
    @p_event_date          VARCHAR(20)     = NULL,       -- 행사 개최(시작) 일시
    @p_event_end_date      VARCHAR(20)     = NULL,       -- 행사 종료 일시
    @p_event_place         NVARCHAR(200)   = NULL,       -- 행사 개최 장소
    @p_capacity_enabled    CHAR(1)         = 'N',        -- 정원 적용 여부 (Y / N)
    @p_capacity_limit      INT             = 30,         -- 참석 정원 인원수
    @p_waitlist_enabled    CHAR(1)         = 'N',        -- 정원 초과 시 대기 접수 여부 (Y / N)
    @p_consent_included    CHAR(1)         = 'Y',        -- 개인정보 동의 포함 여부 (Y / N)
    @p_consent_title       NVARCHAR(200)   = NULL,       -- 개인정보 동의 제목
    @p_consent_purpose     NVARCHAR(1000)  = NULL,       -- 개인정보 수집·이용 목적
    @p_consent_items       NVARCHAR(1000)  = NULL,       -- 개인정보 수집 항목
    @p_consent_retention   NVARCHAR(1000)  = NULL,       -- 개인정보 보유·이용기간
    @p_questions_json      NVARCHAR(MAX)   = NULL,       -- 전체 문항 구조 JSON 배열
    @p_author_id           VARCHAR(50)     = NULL,       -- 작성/수정 관리자 ID
    @p_save_consent_def    CHAR(1)         = 'N'         -- 개인정보 동의 기본값 갱신 여부 (Y / N)
AS
BEGIN
    -- ==========================================================
    -- 프로시저명 : dbo.USP_ADMIN_PARTICIPATION_SAVE
    -- 설      명 : 설문조사 또는 행사·교육 문서를 신규 등록하거나 수정하며, 문항 정규화 테이블 및 개인정보 동의 기본값을 동기화합니다.
    -- ==========================================================
    SET NOCOUNT ON;

    DECLARE @v_pub_dt DATETIME = NULL;
    DECLARE @v_cls_dt DATETIME = NULL;

    -- 공개 일시 및 수동 종료 일시 ISO 문자열을 DATETIME으로 변환
    IF @p_published_at IS NOT NULL AND @p_published_at <> ''
        SET @v_pub_dt = TRY_CAST(REPLACE(LEFT(@p_published_at, 19), 'T', ' ') AS DATETIME);

    IF @p_closed_at IS NOT NULL AND @p_closed_at <> ''
        SET @v_cls_dt = TRY_CAST(REPLACE(LEFT(@p_closed_at, 19), 'T', ' ') AS DATETIME);

    -- 기존 문서 존재 시 UPDATE, 미존재 시 INSERT
    IF EXISTS (SELECT 1 FROM dbo.TBL_PARTICIPATION_FORM WHERE form_id = @p_form_id)
    BEGIN
        -- 기존 설문/행사 문서 수정 (UPDATE)
        UPDATE dbo.TBL_PARTICIPATION_FORM
        SET form_kind           = @p_form_kind,                                                        -- 업무 구분
            title               = @p_title,                                                            -- 제목
            description         = @p_description,                                                      -- 소개 및 안내 문구
            status              = @p_status,                                                           -- 문서 상태
            revision            = CASE WHEN @p_revision > revision THEN @p_revision ELSE revision + 1 END, -- 개정 번호 증가
            is_public           = @p_is_public,                                                        -- 공개 여부
            published_at        = COALESCE(@v_pub_dt, published_at),                                   -- 최초 공개 일시
            closed_at           = @v_cls_dt,                                                           -- 수동 종료 일시
            participation_token = COALESCE(NULLIF(@p_participation_token, ''), participation_token),   -- 참여 링크 토큰
            period_start        = @p_period_start,                                                     -- 참여 시작 일시
            period_end          = @p_period_end,                                                       -- 참여 종료 일시
            end_mode            = @p_end_mode,                                                         -- 종료일 설정 방식
            completion_msg      = @p_completion_msg,                                                   -- 완료 안내 문구
            event_type          = @p_event_type,                                                       -- 행사 유형
            schedule_mode       = @p_schedule_mode,                                                    -- 행사 일정 구분
            event_date          = @p_event_date,                                                       -- 행사 시작 일시
            event_end_date      = @p_event_end_date,                                                   -- 행사 종료 일시
            event_place         = @p_event_place,                                                      -- 행사 장소
            capacity_enabled    = @p_capacity_enabled,                                                 -- 정원 적용 여부
            capacity_limit      = @p_capacity_limit,                                                   -- 참석 정원
            waitlist_enabled    = @p_waitlist_enabled,                                                 -- 대기 접수 여부
            consent_included    = @p_consent_included,                                                 -- 개인정보 동의 포함 여부
            consent_title       = @p_consent_title,                                                    -- 동의 제목
            consent_purpose     = @p_consent_purpose,                                                  -- 수집·이용 목적
            consent_items       = @p_consent_items,                                                    -- 수집 항목
            consent_retention   = @p_consent_retention,                                                -- 보유·이용기간
            questions_json      = @p_questions_json,                                                   -- 전체 문항 JSON
            author_id           = COALESCE(@p_author_id, author_id),                                   -- 작성/수정자 ID
            is_deleted          = 'N',                                                                 -- 삭제 상태 해제
            updated_at          = GETDATE()                                                            -- 최종 수정 일시
        WHERE form_id = @p_form_id;
    END
    ELSE
    BEGIN
        -- 신규 설문/행사 문서 등록 (INSERT)
        INSERT INTO dbo.TBL_PARTICIPATION_FORM (
            form_id, form_kind, title, description, status, revision,
            is_public, published_at, closed_at, participation_token,
            period_start, period_end, end_mode, completion_msg,
            event_type, schedule_mode, event_date, event_end_date, event_place,
            capacity_enabled, capacity_limit, waitlist_enabled,
            consent_included, consent_title, consent_purpose, consent_items, consent_retention,
            questions_json, author_id, is_deleted, created_at, updated_at
        ) VALUES (
            @p_form_id, @p_form_kind, @p_title, @p_description, @p_status, CASE WHEN @p_revision > 0 THEN @p_revision ELSE 1 END,
            @p_is_public, @v_pub_dt, @v_cls_dt, NULLIF(@p_participation_token, ''),
            @p_period_start, @p_period_end, @p_end_mode, @p_completion_msg,
            @p_event_type, @p_schedule_mode, @p_event_date, @p_event_end_date, @p_event_place,
            @p_capacity_enabled, @p_capacity_limit, @p_waitlist_enabled,
            @p_consent_included, @p_consent_title, @p_consent_purpose, @p_consent_items, @p_consent_retention,
            @p_questions_json, @p_author_id, 'N', GETDATE(), GETDATE()
        );
    END;

    -- 문항 JSON을 파싱하여 정규화 테이블(TBL_PARTICIPATION_QUESTION)에 동기화 저장
    IF @p_questions_json IS NOT NULL AND ISJSON(@p_questions_json) = 1
    BEGIN
        DELETE FROM dbo.TBL_PARTICIPATION_QUESTION WHERE form_id = @p_form_id;

        INSERT INTO dbo.TBL_PARTICIPATION_QUESTION (
            form_id, question_id, sort_order, system_type, question_type,
            title, description, is_required, next_target, options_json, created_at
        )
        SELECT
            @p_form_id,                                                                    -- 문서 고유 식별자 (FK)
            ISNULL(JSON_VALUE(q.[value], '$.id'), CONCAT('q', CAST(q.[key] AS INT) + 1)),  -- 문항 식별키
            CAST(q.[key] AS INT) + 1,                                                      -- 문항 노출 순서
            JSON_VALUE(q.[value], '$.system'),                                             -- 시스템 고정 문항 구분
            ISNULL(JSON_VALUE(q.[value], '$.type'), 'single'),                             -- 문항 유형
            ISNULL(JSON_VALUE(q.[value], '$.title'), N''),                                 -- 질문 제목
            JSON_VALUE(q.[value], '$.description'),                                        -- 질문 보조 설명
            CASE WHEN JSON_VALUE(q.[value], '$.required') = 'false' THEN 'N' ELSE 'Y' END, -- 필수 응답 여부
            ISNULL(JSON_VALUE(q.[value], '$.next'), 'next'),                               -- 기본 다음 이동 대상
            JSON_QUERY(q.[value], '$.options'),                                            -- 선택지 배열 JSON
            GETDATE()                                                                      -- 생성 일시
        FROM OPENJSON(@p_questions_json) q;
    END;

    -- 개인정보 동의 기본값 갱신 요청 시 TBL_PARTICIPATION_CONFIG 업데이트
    IF @p_save_consent_def = 'Y'
    BEGIN
        UPDATE dbo.TBL_PARTICIPATION_CONFIG
        SET consent_title     = COALESCE(NULLIF(@p_consent_title, N''), consent_title),         -- 동의 제목 기본값
            consent_purpose   = COALESCE(NULLIF(@p_consent_purpose, N''), consent_purpose),     -- 수집·이용 목적 기본값
            consent_items     = COALESCE(NULLIF(@p_consent_items, N''), consent_items),         -- 수집 항목 기본값
            consent_retention = COALESCE(NULLIF(@p_consent_retention, N''), consent_retention), -- 보유·이용기간 기본값
            updated_at        = GETDATE()                                                       -- 수정 일시
        WHERE config_id = 1;
    END;
END;
GO

-- [2-4] 설문조사 및 행사·교육 삭제 (USP_ADMIN_PARTICIPATION_DELETE)
IF OBJECT_ID('dbo.USP_ADMIN_PARTICIPATION_DELETE', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_PARTICIPATION_DELETE;
GO
CREATE PROCEDURE dbo.USP_ADMIN_PARTICIPATION_DELETE
    @p_form_id  VARCHAR(64),                  -- 삭제할 문서 고유 식별자 (PK)
    @r_code     INT            = 0 OUTPUT,    -- 처리 결과 코드 (0: 성공, -1: 미존재, -2: 응답 존재로 삭제 불가)
    @r_message  NVARCHAR(200)  = N'' OUTPUT   -- 처리 결과 메시지 반환
AS
BEGIN
    -- ==========================================================
    -- 프로시저명 : dbo.USP_ADMIN_PARTICIPATION_DELETE
    -- 설      명 : 접수된 응답·신청이 없는 설문조사/행사·교육 문서를 소프트 삭제(is_deleted='Y') 처리합니다.
    -- ==========================================================
    SET NOCOUNT ON;

    -- 1. 삭제 대상 문서 존재 여부 확인
    IF NOT EXISTS (SELECT 1 FROM dbo.TBL_PARTICIPATION_FORM WHERE form_id = @p_form_id AND is_deleted = 'N')
    BEGIN
        SET @r_code = -1;
        SET @r_message = N'항목을 찾을 수 없습니다.';
        RETURN;
    END;

    -- 2. 접수된 응답·신청 내역 존재 여부 확인 (응답이 있으면 삭제 불가)
    IF EXISTS (SELECT 1 FROM dbo.TBL_PARTICIPATION_RESPONSE WHERE form_id = @p_form_id)
    BEGIN
        SET @r_code = -2;
        SET @r_message = N'응답·신청이 있어 삭제할 수 없습니다.';
        RETURN;
    END;

    -- 3. 문서 소프트 삭제 및 비공개 전환 처리
    UPDATE dbo.TBL_PARTICIPATION_FORM
    SET is_deleted = 'Y',       -- 삭제 여부 플래그 ('Y')
        is_public  = 'N',       -- 공개 상태 해제 ('N')
        updated_at = GETDATE()  -- 삭제 처리 일시
    WHERE form_id = @p_form_id;

    SET @r_code = 0;
    SET @r_message = N'삭제되었습니다.';
END;
GO

-- [2-5] 설문 응답 및 행사·교육 참여 신청 제출 (USP_ADMIN_PARTICIPATION_SUBMIT)
IF OBJECT_ID('dbo.USP_ADMIN_PARTICIPATION_SUBMIT', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_PARTICIPATION_SUBMIT;
GO
CREATE PROCEDURE dbo.USP_ADMIN_PARTICIPATION_SUBMIT
    @p_submission_id         VARCHAR(64),                  -- 제출 고유 식별키 (중복 제출 방지 멱등키)
    @p_form_id               VARCHAR(64),                  -- 대상 문서 고유 식별자 (FK)
    @p_form_revision         INT             = 1,          -- 응답 시점 문서 개정 번호
    @p_member_id             VARCHAR(64)     = NULL,       -- 회원 고유 식별값 (행사·교육 전용)
    @p_member_name           NVARCHAR(50)    = NULL,       -- 회원 성명
    @p_member_phone          VARCHAR(20)     = NULL,       -- 회원 휴대폰 번호
    @p_respondent_id         VARCHAR(64)     = NULL,       -- 비회원 설문 참여자 식별키
    @p_attendance_choice     VARCHAR(20)     = NULL,       -- 행사 참석 여부 선택 ('attend': 참석, 'absent': 미참석)
    @p_answers_json          NVARCHAR(MAX),                -- 문항별 답변 JSON 객체
    @p_path_json             NVARCHAR(MAX),                -- 방문 문항 경로 JSON 배열
    @p_consent_agreed        CHAR(1)         = 'Y',        -- 개인정보 수집·이용 동의 여부 ('Y' / 'N')
    @p_consent_snapshot_json NVARCHAR(MAX)   = NULL,       -- 제출 시점 동의 문구 스냅샷 JSON
    @r_code                  INT             = 0 OUTPUT,   -- 처리 결과 코드 (0: 성공, 1: 기존 제출 반환, 음수: 오류)
    @r_enrollment            VARCHAR(20)     = '' OUTPUT,  -- 판정된 행사 접수 상태 ('confirmed'/'waitlist'/'absent')
    @r_message               NVARCHAR(200)   = N'' OUTPUT  -- 처리 결과 또는 오류 메시지
AS
BEGIN
    -- ==========================================================
    -- 프로시저명 : dbo.USP_ADMIN_PARTICIPATION_SUBMIT
    -- 설      명 : 참여자의 설문 응답 또는 회원의 행사·교육 참여 신청을 검증하고 저장합니다.
    --              중복 제출 방지, 회원 중복 신청 방지, 참석 정원 및 대기(confirmed/waitlist/absent) 자동 판정을 수행합니다.
    -- ==========================================================
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRAN;

    -- 1. 동일 submission_id 재시도 여부 확인 (멱등성 보장)
    IF EXISTS (SELECT 1 FROM dbo.TBL_PARTICIPATION_RESPONSE WITH (UPDLOCK, HOLDLOCK) WHERE submission_id = @p_submission_id)
    BEGIN
        SELECT TOP 1
            @r_code       = 1,                              -- 중복 제출 재반환 코드 (1)
            @r_enrollment = ISNULL(enrollment_status, ''),  -- 기존 판정된 접수 상태
            @r_message    = N'이미 접수된 응답입니다.'       -- 결과 메시지
        FROM dbo.TBL_PARTICIPATION_RESPONSE
        WHERE submission_id = @p_submission_id;

        COMMIT TRAN;
        RETURN;
    END;

    -- 2. 대상 문서 상태 및 정원/동의 설정 조회 (잠금)
    DECLARE @v_kind VARCHAR(20), @v_pub DATETIME, @v_is_pub CHAR(1), @v_cls DATETIME;
    DECLARE @v_rev INT, @v_cap_on CHAR(1), @v_cap_limit INT, @v_wait_on CHAR(1), @v_consent_inc CHAR(1);

    SELECT TOP 1
        @v_kind        = form_kind,        -- 업무 구분 ('survey'/'event')
        @v_pub         = published_at,     -- 최초 공개 일시
        @v_is_pub      = is_public,        -- 현재 공개 여부 ('Y'/'N')
        @v_cls         = closed_at,        -- 수동 종료 일시
        @v_rev         = revision,         -- 현재 문서 개정 번호
        @v_cap_on      = capacity_enabled, -- 정원 사용 여부 ('Y'/'N')
        @v_cap_limit   = capacity_limit,   -- 참석 정원 제한수
        @v_wait_on     = waitlist_enabled, -- 대기 접수 허용 여부 ('Y'/'N')
        @v_consent_inc = consent_included  -- 개인정보 동의 필수 여부 ('Y'/'N')
    FROM dbo.TBL_PARTICIPATION_FORM WITH (UPDLOCK, HOLDLOCK)
    WHERE form_id = @p_form_id AND is_deleted = 'N';

    IF @v_kind IS NULL
    BEGIN
        ROLLBACK TRAN;
        SET @r_code = -10;
        SET @r_message = N'항목을 찾을 수 없습니다.';
        RETURN;
    END;

    IF @v_pub IS NULL
    BEGIN
        ROLLBACK TRAN;
        SET @r_code = -11;
        SET @r_message = N'아직 공개되지 않았습니다.';
        RETURN;
    END;

    IF @v_is_pub <> 'Y'
    BEGIN
        ROLLBACK TRAN;
        SET @r_code = -12;
        SET @r_message = N'비공개로 전환된 항목입니다.';
        RETURN;
    END;

    IF @v_cls IS NOT NULL
    BEGIN
        ROLLBACK TRAN;
        SET @r_code = -13;
        SET @r_message = N'참여가 종료되었습니다.';
        RETURN;
    END;

    IF @v_consent_inc = 'Y' AND @p_consent_agreed <> 'Y'
    BEGIN
        ROLLBACK TRAN;
        SET @r_code = -14;
        SET @r_message = N'개인정보 동의가 필요합니다.';
        RETURN;
    END;

    -- 3. 행사·교육인 경우 회원 확인, 중복 신청, 정원/대기 판정
    SET @r_enrollment = '';
    IF @v_kind = 'event'
    BEGIN
        IF @p_member_id IS NULL OR LTRIM(RTRIM(@p_member_id)) = ''
        BEGIN
            ROLLBACK TRAN;
            SET @r_code = -20;
            SET @r_message = N'회원 확인 후 행사·교육에 참여할 수 있습니다.';
            RETURN;
        END;

        -- 동일 회원의 중복 신청 여부 확인
        IF EXISTS (SELECT 1 FROM dbo.TBL_PARTICIPATION_RESPONSE WHERE form_id = @p_form_id AND member_id = @p_member_id)
        BEGIN
            ROLLBACK TRAN;
            SET @r_code = -21;
            SET @r_message = N'이미 참여한 항목입니다.';
            RETURN;
        END;

        -- 현재 참석 확정(confirmed) 인원수 집계
        DECLARE @v_confirmed_cnt INT = 0;
        SELECT @v_confirmed_cnt = COUNT(*)
        FROM dbo.TBL_PARTICIPATION_RESPONSE
        WHERE form_id = @p_form_id
          AND ISNULL(attendance_choice, 'attend') <> 'absent'
          AND ISNULL(enrollment_status, 'confirmed') <> 'waitlist';

        -- 정원 마감 및 대기 미사용 시 접수 차단
        IF @v_cap_on = 'Y' AND @v_confirmed_cnt >= @v_cap_limit AND @v_wait_on <> 'Y'
        BEGIN
            ROLLBACK TRAN;
            SET @r_code = -22;
            SET @r_message = N'신청 접수가 마감되었습니다.';
            RETURN;
        END;

        -- 참석/미참석/대기 상태 결정
        IF @p_attendance_choice = 'absent'
            SET @r_enrollment = 'absent';
        ELSE IF @v_cap_on = 'Y' AND @v_confirmed_cnt >= @v_cap_limit
            SET @r_enrollment = 'waitlist';
        ELSE
            SET @r_enrollment = 'confirmed';
    END
    ELSE IF @v_kind = 'survey'
    BEGIN
        -- 동일 기기(브라우저 식별키 respondent_id)의 설문 중복 응답 여부 확인
        IF @p_respondent_id IS NOT NULL AND LTRIM(RTRIM(@p_respondent_id)) <> ''
           AND EXISTS (SELECT 1 FROM dbo.TBL_PARTICIPATION_RESPONSE WHERE form_id = @p_form_id AND respondent_id = @p_respondent_id)
        BEGIN
            ROLLBACK TRAN;
            SET @r_code = -31;
            SET @r_message = N'이미 참여한 설문입니다.';
            RETURN;
        END;
    END;

    -- 4. 응답/신청 내역 테이블에 최종 저장 (INSERT)
    INSERT INTO dbo.TBL_PARTICIPATION_RESPONSE (
        submission_id, form_id, form_revision, source_type,
        member_id, member_name, member_phone, respondent_id,
        attendance_choice, enrollment_status,
        answers_json, path_json, consent_agreed, consent_snapshot_json, submitted_at
    ) VALUES (
        @p_submission_id, @p_form_id, @v_rev, 'participation',
        NULLIF(@p_member_id, ''), NULLIF(@p_member_name, N''), NULLIF(@p_member_phone, ''), NULLIF(@p_respondent_id, ''),
        NULLIF(@p_attendance_choice, ''), NULLIF(@r_enrollment, ''),
        @p_answers_json, @p_path_json, @p_consent_agreed, @p_consent_snapshot_json, GETDATE()
    );

    COMMIT TRAN;
    SET @r_code = 0;
    SET @r_message = N'정상적으로 접수되었습니다.';
END;
GO

-- [2-6] 회원별 행사·교육 참여내역 조회 (USP_ADMIN_PARTICIPATION_MEMBER_HISTORY)
IF OBJECT_ID('dbo.USP_ADMIN_PARTICIPATION_MEMBER_HISTORY', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_ADMIN_PARTICIPATION_MEMBER_HISTORY;
GO
CREATE PROCEDURE dbo.USP_ADMIN_PARTICIPATION_MEMBER_HISTORY
    @p_member_id VARCHAR(64) -- 조회할 회원의 고유 식별값 (member_id)
AS
BEGIN
    -- ==========================================================
    -- 프로시저명 : dbo.USP_ADMIN_PARTICIPATION_MEMBER_HISTORY
    -- 설      명 : 회원 확인을 거친 특정 회원(@p_member_id)의 행사·교육 참여 신청 내역을 최신순으로 조회합니다.
    -- ==========================================================
    SET NOCOUNT ON;

    -- 특정 회원의 행사·교육 참여 신청 이력 및 행사 정보 조회
    SELECT
        r.response_seq,                                           -- 응답/신청 일련번호 (PK)
        r.submission_id,                                          -- 제출 고유 식별키
        r.form_id,                                                -- 행사·교육 문서 고유 식별자 (FK)
        f.participation_token,                                    -- 참여 링크 고유 토큰
        f.title,                                                  -- 행사·교육명
        f.event_type,                                             -- 행사 유형 ('행사'/'교육')
        f.schedule_mode,                                          -- 일정 구분 ('single'/'period')
        f.event_date,                                             -- 개최(시작) 일시
        f.event_end_date,                                         -- 종료 일시
        f.event_place,                                            -- 개최 장소
        f.questions_json,                                         -- 문항 구조 JSON 배열
        r.member_id,                                              -- 회원 고유 식별값
        r.member_name,                                            -- 회원 성명
        r.attendance_choice,                                      -- 참석 여부 선택 ('attend'/'absent')
        r.enrollment_status,                                      -- 접수 상태 ('confirmed'/'waitlist'/'absent')
        r.answers_json,                                           -- 제출 답변 JSON 객체
        r.path_json,                                              -- 방문 문항 경로 JSON 배열
        r.consent_agreed,                                         -- 개인정보 동의 여부 ('Y'/'N')
        r.consent_snapshot_json,                                  -- 제출 시점 동의 문구 스냅샷 JSON
        CONVERT(VARCHAR(19), r.submitted_at, 126) AS submitted_at_iso -- 신청 제출 일시 (ISO 문자열)
    FROM dbo.TBL_PARTICIPATION_RESPONSE r
    INNER JOIN dbo.TBL_PARTICIPATION_FORM f ON f.form_id = r.form_id
    WHERE f.is_deleted = 'N'
      AND f.form_kind = 'event'
      AND r.member_id = @p_member_id
    ORDER BY r.submitted_at DESC, r.response_seq DESC;
END;
GO

-- ==============================================================
-- 3. 테이블 / 컬럼 / 프로시저 / 파라미터 상세 설명 (MS_Description) 등록
-- ==============================================================

IF OBJECT_ID('dbo.USP_SET_DESC', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_SET_DESC;
GO
CREATE PROCEDURE dbo.USP_SET_DESC
    @p_level1type VARCHAR(20),
    @p_level1name NVARCHAR(128),
    @p_level2type VARCHAR(20) = NULL,
    @p_level2name NVARCHAR(128) = NULL,
    @p_desc       NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    IF @p_level2type IS NULL
    BEGIN
        IF EXISTS (
            SELECT 1 FROM sys.extended_properties
            WHERE major_id = OBJECT_ID(N'dbo.' + @p_level1name) AND minor_id = 0 AND name = N'MS_Description'
        )
            EXEC sys.sp_updateextendedproperty @name=N'MS_Description', @value=@p_desc, @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=@p_level1type, @level1name=@p_level1name;
        ELSE
            EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=@p_desc, @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=@p_level1type, @level1name=@p_level1name;
    END
    ELSE
    BEGIN
        IF EXISTS (
            SELECT 1 FROM sys.extended_properties ep
            WHERE ep.major_id = OBJECT_ID(N'dbo.' + @p_level1name)
              AND ep.name = N'MS_Description'
              AND (
                    (@p_level2type = 'COLUMN' AND ep.minor_id = COLUMNPROPERTY(OBJECT_ID(N'dbo.' + @p_level1name), @p_level2name, 'ColumnId'))
                 OR (@p_level2type = 'PARAMETER' AND ep.minor_id = (SELECT parameter_id FROM sys.parameters WHERE object_id = OBJECT_ID(N'dbo.' + @p_level1name) AND name = @p_level2name))
              )
        )
            EXEC sys.sp_updateextendedproperty @name=N'MS_Description', @value=@p_desc, @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=@p_level1type, @level1name=@p_level1name, @level2type=@p_level2type, @level2name=@p_level2name;
        ELSE
            EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=@p_desc, @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=@p_level1type, @level1name=@p_level1name, @level2type=@p_level2type, @level2name=@p_level2name;
    END
END;
GO

-- [3-1] TBL_PARTICIPATION_CONFIG 테이블 및 컬럼 설명
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_CONFIG', NULL, NULL, N'설문조사 및 행사·교육참여 개인정보 수집·이용 동의 기본값 설정 테이블';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_CONFIG', 'COLUMN', 'config_id',         N'설정 단일 행 고유 식별자 (1 고정)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_CONFIG', 'COLUMN', 'consent_title',     N'개인정보 수집·이용 동의 기본 제목';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_CONFIG', 'COLUMN', 'consent_purpose',   N'개인정보 수집·이용 목적 기본 문구 (최근 저장값 기억)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_CONFIG', 'COLUMN', 'consent_items',     N'개인정보 수집 항목 기본 문구 (최근 저장값 기억)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_CONFIG', 'COLUMN', 'consent_retention', N'개인정보 보유 및 이용기간 기본 문구 (최근 저장값 기억)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_CONFIG', 'COLUMN', 'updated_at',        N'최종 수정 일시';

-- [3-2] TBL_PARTICIPATION_FORM 테이블 및 컬럼 설명
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_FORM', NULL, NULL, N'설문조사(survey) 및 행사·교육참여(event) 문서 마스터 테이블';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_FORM', 'COLUMN', 'form_id',             N'문서 고유 식별자 (PK, 예: id-...)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_FORM', 'COLUMN', 'form_kind',           N'업무 구분 (survey: 설문조사, event: 행사·교육참여)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_FORM', 'COLUMN', 'title',               N'설문명 또는 행사·교육명';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_FORM', 'COLUMN', 'description',         N'설문 또는 행사·교육 소개·안내 문구';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_FORM', 'COLUMN', 'status',              N'문서 기본 상태 (draft: 작성중, live: 공개/참여중, closed: 종료)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_FORM', 'COLUMN', 'revision',            N'문서 개정 번호 (저장 시 1씩 증가, 동시성 및 응답 유효성 검증용)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_FORM', 'COLUMN', 'is_public',           N'공개 여부 (Y: 공개, N: 비공개/미공개)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_FORM', 'COLUMN', 'published_at',        N'최초 공개 일시 (NULL이면 작성중 미공개 상태)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_FORM', 'COLUMN', 'closed_at',           N'수동 종료 처리 일시';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_FORM', 'COLUMN', 'participation_token', N'외부/웹·앱 참여 링크용 고유 토큰 (participant.asp?participate=토큰)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_FORM', 'COLUMN', 'period_start',        N'참여/신청 시작 일시 (YYYY-MM-DDTHH:mm)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_FORM', 'COLUMN', 'period_end',          N'참여/신청 종료 일시 (YYYY-MM-DDTHH:mm)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_FORM', 'COLUMN', 'end_mode',            N'종료일 설정 방식 (auto: 시작일 기준 1년 뒤 자동 종료, manual: 직접 지정)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_FORM', 'COLUMN', 'completion_msg',      N'참여/신청 완료 후 표시할 안내 문구';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_FORM', 'COLUMN', 'event_type',          N'행사·교육 유형 (행사 / 교육, event 전용)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_FORM', 'COLUMN', 'schedule_mode',       N'행사 일정 구분 (single: 하루 일정, period: 기간 일정)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_FORM', 'COLUMN', 'event_date',          N'행사 개최(시작) 일시 (YYYY-MM-DDTHH:mm)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_FORM', 'COLUMN', 'event_end_date',      N'행사 종료 일시 (YYYY-MM-DDTHH:mm, 기간 일정 시)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_FORM', 'COLUMN', 'event_place',         N'행사·교육 개최 장소';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_FORM', 'COLUMN', 'capacity_enabled',    N'정원 제한 적용 여부 (Y: 정원 적용, N: 무제한)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_FORM', 'COLUMN', 'capacity_limit',      N'참석 확정 기준 정원 인원수';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_FORM', 'COLUMN', 'waitlist_enabled',    N'정원 초과 시 대기 접수 여부 (Y: 대기 접수 사용, N: 정원 도달 시 전체 마감)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_FORM', 'COLUMN', 'consent_included',    N'개인정보 수집·이용 동의 포함 여부 (Y: 포함, N: 미포함)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_FORM', 'COLUMN', 'consent_title',       N'개인정보 수집·이용 동의 제목';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_FORM', 'COLUMN', 'consent_purpose',     N'개인정보 수집·이용 목적';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_FORM', 'COLUMN', 'consent_items',       N'개인정보 수집 항목';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_FORM', 'COLUMN', 'consent_retention',   N'개인정보 보유 및 이용기간';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_FORM', 'COLUMN', 'questions_json',      N'전체 문항·선택지·답변별 이동경로 JSON 배열';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_FORM', 'COLUMN', 'author_id',           N'작성/수정 관리자 ID';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_FORM', 'COLUMN', 'is_deleted',          N'삭제 여부 (Y: 삭제됨, N: 정상)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_FORM', 'COLUMN', 'created_at',          N'최초 등록 일시';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_FORM', 'COLUMN', 'updated_at',          N'최종 수정 일시';

-- [3-3] TBL_PARTICIPATION_QUESTION 테이블 및 컬럼 설명
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_QUESTION', NULL, NULL, N'설문조사 및 행사·교육 문항 상세 정규화 테이블';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_QUESTION', 'COLUMN', 'question_seq',  N'문항 고유 순번 (PK, 자동증가)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_QUESTION', 'COLUMN', 'form_id',       N'소속 문서 고유 식별자 (TBL_PARTICIPATION_FORM.form_id)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_QUESTION', 'COLUMN', 'question_id',   N'문서 내 문항 식별키 (예: q1, __event_attendance)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_QUESTION', 'COLUMN', 'sort_order',    N'문항 노출 순서 (1부터 시작)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_QUESTION', 'COLUMN', 'system_type',   N'시스템 고정 문항 구분 (attendance: 행사 참석 여부 고정 문항, 일반 문항은 NULL)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_QUESTION', 'COLUMN', 'question_type', N'문항 유형 (single: 단일선택, multi: 복수선택, short: 단답형, long: 장문형, rating: 평점형)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_QUESTION', 'COLUMN', 'title',         N'질문 제목';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_QUESTION', 'COLUMN', 'description',   N'질문 보조 설명';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_QUESTION', 'COLUMN', 'is_required',   N'필수 응답 여부 (Y: 필수, N: 선택)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_QUESTION', 'COLUMN', 'next_target',   N'기본 다음 이동 목적지 (next: 다음 질문, submit: 제출, 또는 특정 question_id)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_QUESTION', 'COLUMN', 'options_json',  N'선택지 목록 및 답변별 이동(to) 설정 JSON 배열';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_QUESTION', 'COLUMN', 'created_at',    N'등록 일시';

-- [3-4] TBL_PARTICIPATION_RESPONSE 테이블 및 컬럼 설명
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_RESPONSE', NULL, NULL, N'설문조사 응답 및 행사·교육 참여 신청 내역 테이블';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_RESPONSE', 'COLUMN', 'response_seq',          N'응답/신청 고유 순번 (PK, 자동증가)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_RESPONSE', 'COLUMN', 'submission_id',         N'제출 고유 식별키 (중복 제출 방지 UNIQUE 키)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_RESPONSE', 'COLUMN', 'form_id',               N'대상 문서 고유 식별자 (TBL_PARTICIPATION_FORM.form_id)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_RESPONSE', 'COLUMN', 'form_revision',         N'제출 당시 문서 개정 번호 (revision)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_RESPONSE', 'COLUMN', 'source_type',           N'응답 출처 구분 (participation: 실제 참여/신청)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_RESPONSE', 'COLUMN', 'member_id',             N'행사·교육 신청 회원 고유 식별값 (설문은 NULL)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_RESPONSE', 'COLUMN', 'member_name',           N'행사·교육 신청 회원 성명';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_RESPONSE', 'COLUMN', 'member_phone',          N'행사·교육 신청 회원 휴대폰 번호';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_RESPONSE', 'COLUMN', 'respondent_id',         N'비회원 설문 참여자 브라우저 식별키';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_RESPONSE', 'COLUMN', 'attendance_choice',     N'행사 참석 여부 선택값 (attend: 참석, absent: 미참석)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_RESPONSE', 'COLUMN', 'enrollment_status',     N'행사 접수 상태 (confirmed: 참석 확정, waitlist: 대기, absent: 미참석)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_RESPONSE', 'COLUMN', 'answers_json',          N'문항별 답변 데이터 JSON 객체';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_RESPONSE', 'COLUMN', 'path_json',             N'응답자가 실제 방문한 문항 ID 경로 JSON 배열';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_RESPONSE', 'COLUMN', 'consent_agreed',        N'개인정보 수집·이용 동의 여부 (Y / N)';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_RESPONSE', 'COLUMN', 'consent_snapshot_json', N'제출 시점 개인정보 동의 문구 스냅샷 JSON';
EXEC dbo.USP_SET_DESC 'TABLE', 'TBL_PARTICIPATION_RESPONSE', 'COLUMN', 'submitted_at',          N'제출(응답/신청) 일시';

-- [3-5] 저장 프로시저 및 파라미터 설명 등록
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_LIST', NULL, NULL, N'설문조사(survey) 및 행사·교육참여(event) 목록·응답내역·기본동의설정을 조회하는 프로시저';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_LIST', 'PARAMETER', '@p_form_kind', N'업무 구분 (survey: 설문조사, event: 행사·교육, NULL: 전체)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_LIST', 'PARAMETER', '@p_keyword',   N'설문명 또는 행사·교육명 검색어';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_LIST', 'PARAMETER', '@p_from_date', N'참여/신청 기간 조회 시작일 (YYYY-MM-DD)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_LIST', 'PARAMETER', '@p_to_date',   N'참여/신청 기간 조회 종료일 (YYYY-MM-DD)';

EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_GET', NULL, NULL, N'설문조사 및 행사·교육 단건 상세(문서ID 또는 참여토큰 기준), 문항 목록, 응답 내역을 조회하는 프로시저';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_GET', 'PARAMETER', '@p_form_id',             N'조회할 문서 고유 식별자 (form_id)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_GET', 'PARAMETER', '@p_participation_token', N'조회할 외부/회원 참여 링크 토큰 (participation_token)';

EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_SAVE', NULL, NULL, N'설문조사 및 행사·교육 문서를 등록/수정하고 문항 테이블 및 개인정보 동의 기본값을 동기화하는 프로시저';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_SAVE', 'PARAMETER', '@p_form_id',             N'문서 고유 식별자 (PK)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_SAVE', 'PARAMETER', '@p_form_kind',           N'업무 구분 (survey: 설문조사, event: 행사·교육)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_SAVE', 'PARAMETER', '@p_title',               N'설문명 또는 행사·교육명';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_SAVE', 'PARAMETER', '@p_description',         N'소개 및 안내 문구';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_SAVE', 'PARAMETER', '@p_status',              N'문서 상태 (draft: 작성중, live: 공개, closed: 종료)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_SAVE', 'PARAMETER', '@p_revision',            N'문서 개정 번호';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_SAVE', 'PARAMETER', '@p_is_public',           N'공개 여부 (Y / N)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_SAVE', 'PARAMETER', '@p_published_at',        N'최초 공개 일시 (ISO 문자열)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_SAVE', 'PARAMETER', '@p_closed_at',           N'수동 종료 일시 (ISO 문자열)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_SAVE', 'PARAMETER', '@p_participation_token', N'참여 링크 고유 토큰';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_SAVE', 'PARAMETER', '@p_period_start',        N'참여/신청 시작 일시 (YYYY-MM-DDTHH:mm)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_SAVE', 'PARAMETER', '@p_period_end',          N'참여/신청 종료 일시 (YYYY-MM-DDTHH:mm)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_SAVE', 'PARAMETER', '@p_end_mode',            N'종료일 설정 방식 (auto / manual)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_SAVE', 'PARAMETER', '@p_completion_msg',      N'참여 완료 안내 문구';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_SAVE', 'PARAMETER', '@p_event_type',          N'행사 유형 (행사 / 교육)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_SAVE', 'PARAMETER', '@p_schedule_mode',       N'행사 일정 구분 (single: 하루 일정, period: 기간 일정)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_SAVE', 'PARAMETER', '@p_event_date',          N'행사 개최(시작) 일시';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_SAVE', 'PARAMETER', '@p_event_end_date',      N'행사 종료 일시 (기간 일정 시)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_SAVE', 'PARAMETER', '@p_event_place',         N'행사 개최 장소';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_SAVE', 'PARAMETER', '@p_capacity_enabled',    N'정원 적용 여부 (Y / N)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_SAVE', 'PARAMETER', '@p_capacity_limit',      N'참석 확정 기준 정원 인원수';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_SAVE', 'PARAMETER', '@p_waitlist_enabled',    N'정원 초과 시 대기 접수 여부 (Y / N)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_SAVE', 'PARAMETER', '@p_consent_included',    N'개인정보 동의 포함 여부 (Y / N)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_SAVE', 'PARAMETER', '@p_consent_title',       N'개인정보 동의 제목';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_SAVE', 'PARAMETER', '@p_consent_purpose',     N'개인정보 수집·이용 목적';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_SAVE', 'PARAMETER', '@p_consent_items',       N'개인정보 수집 항목';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_SAVE', 'PARAMETER', '@p_consent_retention',   N'개인정보 보유·이용기간';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_SAVE', 'PARAMETER', '@p_questions_json',      N'전체 문항·선택지·이동경로 JSON 배열';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_SAVE', 'PARAMETER', '@p_author_id',           N'작성/수정 관리자 ID';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_SAVE', 'PARAMETER', '@p_save_consent_def',    N'개인정보 동의 기본값(TBL_PARTICIPATION_CONFIG) 갱신 여부 (Y / N)';

EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_DELETE', NULL, NULL, N'작성중(미공개)이며 응답이 없는 설문조사/행사·교육 문서를 삭제 처리하는 프로시저';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_DELETE', 'PARAMETER', '@p_form_id', N'삭제할 문서 고유 식별자';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_DELETE', 'PARAMETER', '@r_code',    N'처리 결과 코드 (0: 성공, -1: 미존재, -2: 응답 존재로 삭제 불가)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_DELETE', 'PARAMETER', '@r_message', N'처리 결과 메시지';

EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_SUBMIT', NULL, NULL, N'설문조사 응답 및 행사·교육 참여 신청을 검증(중복·기간·정원·대기 판정)하고 저장하는 프로시저';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_SUBMIT', 'PARAMETER', '@p_submission_id',         N'제출 고유 식별키 (재시도 멱등성 보장)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_SUBMIT', 'PARAMETER', '@p_form_id',               N'대상 문서 고유 식별자';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_SUBMIT', 'PARAMETER', '@p_form_revision',         N'제출 시점 문서 개정 번호';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_SUBMIT', 'PARAMETER', '@p_member_id',             N'행사·교육 신청 회원 고유 식별값 (설문은 NULL)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_SUBMIT', 'PARAMETER', '@p_member_name',           N'행사·교육 신청 회원 성명';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_SUBMIT', 'PARAMETER', '@p_member_phone',          N'행사·교육 신청 회원 휴대폰 번호';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_SUBMIT', 'PARAMETER', '@p_respondent_id',         N'비회원 설문 참여자 브라우저 식별키';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_SUBMIT', 'PARAMETER', '@p_attendance_choice',     N'행사 참석 여부 선택 (attend: 참석, absent: 미참석)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_SUBMIT', 'PARAMETER', '@p_answers_json',          N'문항별 답변 JSON 객체';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_SUBMIT', 'PARAMETER', '@p_path_json',             N'실제 방문한 문항 경로 JSON 배열';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_SUBMIT', 'PARAMETER', '@p_consent_agreed',        N'개인정보 수집·이용 동의 여부 (Y / N)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_SUBMIT', 'PARAMETER', '@p_consent_snapshot_json', N'제출 시점 동의 문구 스냅샷 JSON';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_SUBMIT', 'PARAMETER', '@r_code',                  N'처리 결과 코드 (0: 성공, 1: 기존 제출 반환, 음수: 실패)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_SUBMIT', 'PARAMETER', '@r_enrollment',            N'판정된 행사 접수 상태 (confirmed: 참석 확정, waitlist: 대기, absent: 미참석)';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_SUBMIT', 'PARAMETER', '@r_message',               N'처리 결과 메시지';

EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_MEMBER_HISTORY', NULL, NULL, N'확인된 회원의 행사·교육 참여 신청 내역을 조회하는 프로시저';
EXEC dbo.USP_SET_DESC 'PROCEDURE', 'USP_ADMIN_PARTICIPATION_MEMBER_HISTORY', 'PARAMETER', '@p_member_id', N'조회할 회원의 고유 식별값 (member_id)';

DROP PROCEDURE dbo.USP_SET_DESC;
GO
