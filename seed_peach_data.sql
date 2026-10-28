-- ==============================================================
-- 복숭아자조금 관리자 (peach.admin) 메인 화면 기준 초기 데이터 삽입
-- 대상 DB: peach
-- 실행: SSMS 쿼리창에서 F5를 눌러 실행하세요.
-- ==============================================================

USE [peach];
GO

-- 1. 상시 재배력 초기 데이터 (TBL_CALENDAR_CONTENT)
DELETE FROM dbo.TBL_CALENDAR_CONTENT WHERE target_year = 2026;
INSERT INTO dbo.TBL_CALENDAR_CONTENT (
    target_year, title, thumbnail_path, visibility, channel_web, channel_app, author_id, is_deleted, created_at, updated_at
) VALUES (
    2026, N'복숭아 재배력', 'assets/home/cultivation-thumbnail.png', 'public', 'Y', 'Y', 'admin', 'N', GETDATE(), GETDATE()
);
GO

-- 2. 월별 과원관리 1~12월 초기 데이터 (TBL_ORCHARD_CONTENT)
DELETE FROM dbo.TBL_ORCHARD_CONTENT WHERE target_year = 2026;
INSERT INTO dbo.TBL_ORCHARD_CONTENT (target_year, target_month, title, thumbnail_path, visibility, channel_web, channel_app, author_id, is_deleted, created_at, updated_at) VALUES
(2026, 1, N'새로운 한 해의 시작을 준비할 때', 'assets/home/orchard-01-thumb.png', 'public', 'Y', 'Y', 'admin', 'N', GETDATE(), GETDATE()),
(2026, 2, N'한 해의 결실을 준비할 때', 'assets/home/orchard-02-thumb.png', 'public', 'Y', 'Y', 'admin', 'N', GETDATE(), GETDATE()),
(2026, 3, N'봄의 시작을 맞이할 때', 'assets/home/orchard-03-thumb.png', 'public', 'Y', 'Y', 'admin', 'N', GETDATE(), GETDATE()),
(2026, 4, N'새로운 생명이 피어나는 때', 'assets/home/orchard-04-thumb.png', 'public', 'Y', 'Y', 'admin', 'N', GETDATE(), GETDATE()),
(2026, 5, N'건강한 열매를 가꾸는 때', 'assets/home/orchard-05-thumb.png', 'public', 'Y', 'Y', 'admin', 'N', GETDATE(), GETDATE()),
(2026, 6, N'여름의 생장을 살펴볼 때', 'assets/home/orchard-06-thumb.png', 'public', 'Y', 'Y', 'admin', 'N', GETDATE(), GETDATE()),
(2026, 7, N'정성의 결실이 익어가는 때', 'assets/home/orchard-07-thumb.png', 'public', 'Y', 'Y', 'admin', 'N', GETDATE(), GETDATE()),
(2026, 8, N'달콤한 수확의 기쁨을 나눌 때', 'assets/home/orchard-08-thumb.png', 'public', 'Y', 'Y', 'admin', 'N', GETDATE(), GETDATE()),
(2026, 9, N'풍성한 결실을 마무리할 때', 'assets/home/orchard-09-thumb.png', 'public', 'Y', 'Y', 'admin', 'N', GETDATE(), GETDATE()),
(2026, 10, N'수확을 마치고 내년을 준비할 때', 'assets/home/orchard-10-thumb.png', 'public', 'Y', 'Y', 'admin', 'N', GETDATE(), GETDATE()),
(2026, 11, N'한 해의 과원을 돌아볼 때', 'assets/home/orchard-11-thumb.png', 'public', 'Y', 'Y', 'admin', 'N', GETDATE(), GETDATE()),
(2026, 12, N'새로운 계절을 준비하는 때', 'assets/home/orchard-12-thumb.png', 'public', 'Y', 'Y', 'admin', 'N', GETDATE(), GETDATE());
GO

-- 3. 교육영상 초기 데이터 3건 (TBL_VIDEO_CONTENT) - 홈 메인 노출
DELETE FROM dbo.TBL_VIDEO_CONTENT WHERE video_id IN (1, 2, 3);
INSERT INTO dbo.TBL_VIDEO_CONTENT (
    youtube_id, source_url, display_title, original_title, category, description, thumbnail_url,
    duration_text, is_playable, visibility, channel_web, channel_app, is_home_web, is_home_app,
    period_start, period_end, has_end_date, is_deleted, created_at, updated_at
) VALUES
(
    '1VmE5mcH23Y', 'https://youtu.be/1VmE5mcH23Y',
    N'꽃눈이 좋아야 수정이 잘 되고 핵할이 없다', N'꽃눈이 좋아야 수정이 잘 되고 핵할이 없다',
    N'재배기술', N'꽃눈 관리 및 착과율 향상 요령 안내', 'assets/app-video-1.png',
    '15:20', 'Y', 'public', 'Y', 'Y', 'Y', 'Y',
    '2026-01-01', NULL, 'N', 'N', GETDATE(), GETDATE()
),
(
    '2VmE5mcH24Z', 'https://youtu.be/2VmE5mcH24Z',
    N'꺾거나 비틀지 말고 지긋이 눌러라', N'꺾거나 비틀지 말고 지긋이 눌러라',
    N'재배기술', N'가지 유인 및 신초 관리 핵심 기술', 'assets/app-video-2.png',
    '12:45', 'Y', 'public', 'Y', 'Y', 'Y', 'N',
    '2026-01-01', NULL, 'N', 'N', GETDATE(), GETDATE()
),
(
    '3VmE5mcH25A', 'https://youtu.be/3VmE5mcH25A',
    N'야간온도를 25도 이내로 떨어뜨려라', N'야간온도를 25도 이내로 떨어뜨려라',
    N'생육단계', N'고온기 과원 온도 관리 및 열화 방지법', 'assets/app-video-2.png',
    '18:10', 'Y', 'public', 'Y', 'Y', 'Y', 'N',
    '2026-01-01', NULL, 'N', 'N', GETDATE(), GETDATE()
);
GO

-- 4. 최근 게시글 초기 데이터 3건 (TBL_BOARD_CONTENT)
IF NOT EXISTS (SELECT 1 FROM dbo.TBL_BOARD_CONTENT WHERE category = N'공지' AND title LIKE N'%과원관리 요령%')
BEGIN
    INSERT INTO dbo.TBL_BOARD_CONTENT (
        category, title, body_html, visibility, is_draft, is_pinned,
        channel_web, channel_app, period_start, period_end, has_end_date,
        is_urgent, urgent_start, urgent_end, author_id, author_name, is_deleted, created_at, updated_at
    ) VALUES
    (
        N'공지', N'과원관리 요령 - 긴급', N'<p>가을철 과원관리 요령 긴급 공지사항입니다.</p>',
        'public', 'N', 'Y', 'Y', 'Y', '2026-01-01', NULL, 'N',
        'Y', '2026-01-01', '2027-12-31', 'admin', N'김복숭', 'N', GETDATE(), GETDATE()
    ),
    (
        N'복숭아정보', N'과원관리 요령', N'<p>복숭아 과원관리 종합 요령 정보입니다.</p>',
        'public', 'N', 'N', 'Y', 'Y', '2026-01-01', NULL, 'N',
        'N', NULL, NULL, 'admin', N'김복숭', 'N', GETDATE(), GETDATE()
    ),
    (
        N'재배자료', N'과원관리 요령', N'<p>재배자료 과원관리 요령 매뉴얼입니다.</p>',
        'public', 'N', 'N', 'Y', 'Y', '2026-01-01', NULL, 'N',
        'N', NULL, NULL, 'admin', N'김복숭', 'N', GETDATE(), GETDATE()
    );
END;
GO

SELECT '메인 화면 기준 초기 데이터 삽입 완료' AS result;
GO
