---
name: peach_admin
description: 복숭아자조금 PC관리자(peach.admin) 시스템 구조, DB 스키마(peach), SMS 인증(2028/2020), 화면기획서(v8) 적용 현황 및 FTP 배포 도메인 지식
---

# 복숭아자조금 PC관리자 (`peach.admin`) 도메인 명세서

## 1. 시스템 개요 및 환경 정보
- **워크스페이스 경로**: `c:\Workspace\peach.admin`
- **언어 / 플랫폼**: Classic ASP (VBScript, UTF-8 `CodePage=65001`)
- **테스트 URL**: `http://peachlocal.admin.edu-ok.co.kr`
- **실제 운영 도메인**: `ko-peach.kr`
- **FTP 배포 경로**: `ftp://121.78.131.31:12000/selfhelpPeachAdmin` (계정: `.vscode/sftp.json` 참조)
  - 업로드 제외 대상: `/복숭아 관리자`, `*.html`, `.vscode`, `.agents`, `AGENTS.md`, `*.py`, `*.sql`
- **전용 데이터베이스 (`inc/dbconn.asp`)**:
  - 서버: `121.78.131.15` (MSSQL)
  - DB명 (`Initial Catalog`): `peach` (계정: `peach`)
  - **주의**: 동일 서버의 구 `selfhelp` DB(`Initial Catalog=selfhelp`)는 절대 조회/사용 금지 (`C:\Workspace\com.bhsoft.nselfhelp` MariaDB `nself_help_db`로 이관 완료).

---

## 2. 핵심 모듈 및 파일 맵

| 구분 | 주요 파일 경로 | 역할 및 핵심 로직 |
| :--- | :--- | :--- |
| **로그인 / 회원가입 화면** | `login.asp`<br>`js/auth-custom.js`<br>`js/pages/signup.js`<br>`js/admin-account-api.js` | 로그인 폼, 가입 인증코드 게이트 모달(`#modal-signup-invitation`), 회원가입 모달(`#modal-signup`), 4자리 SMS 인증번호 입력/검증 |
| **아이디·비밀번호 찾기** | `find-account.asp`<br>`js/auth-custom.js` | 이름+휴대폰 4자리 SMS 인증 기반 아이디 찾기, 아이디+휴대폰 4자리 SMS 인증 기반 비밀번호 재설정 |
| **내 관리자 정보** | `admin-account.asp`<br>`js/pages/admin-account.js`<br>`js/admin-account-api.js` | 헤더 우측 관리자 이름 클릭 시 이동. 기본정보(이름) 수정, 휴대폰 번호 변경(4자리 SMS 인증), 비밀번호 변경, 가입 인증코드 조회/복사/재발행 |
| **인증·계정 백엔드** | `proc/auth_proc.asp`<br>`proc/account_proc.asp` | `peach.dbo.TBL_OPERATOR` 및 `peach.dbo.TBL_ADMIN_INVITATION` 전용 처리, 순수 VBScript AES-256-CBC 암호화 기반 `send_sms.asp` 직접 발송 |
| **게시글 관리** | `contents-list.asp`, `contents-create.asp`, `contents-edit.asp`<br>`js/pages/contents.js`, `proc/board_proc.asp` | 좌측 사이드바 대메뉴(`협의회게시판` / `복숭아정보` / `재배자료`) + 세부 카테고리 탭·선택(`협의회게시판`: `공지사항`·`언론보도`·`업장홍보`, `복숭아정보`: `복숭아와 건강`·`복숭아관련 소식`·`복숭아 홍보`) 연동 |
| **교육영상 관리** | `videos-list.asp`, `videos-detail.asp`, `videos-create.asp`<br>`proc/video_proc.asp` | 유튜브 URL 수동 등록/수정/삭제(`ExtractYouTubeId`로 썸네일 자동 생성), 메인 노출(`is_exposed='Y'`) 최대 3건 제한 |
| **캘린더 관리** | `crop-calendar-list.asp`, `crop-calendar-detail.asp`, `crop-calendar-create.asp`, `crop-calendar-edit.asp`<br>`proc/calendar_proc.asp` | 생육·재배 캘린더 관리 |
| **농가 및 과원 관리** | `orchard-tips-list.asp`, `orchard-tips-detail.asp`, `orchard-tips-create.asp`, `orchard-tips-edit.asp`<br>`proc/orchard_proc.asp` | 과원 관리 팁 조회/관리 |
| **행사·교육참여 관리** | `events-list.asp`, `events-create.asp`, `events-edit.asp`, `events-detail.asp`, `events-applicants.asp`, `events-drafts.asp`, `events-calendar.asp`<br>`proc/participation_proc.asp` | 행사·교육 등록/수정/복제/삭제, 참석 정원·대기 설정, 신청자 현황(확정/대기/미참석) 및 2시트(`신청자 명단` + `접수 및 문항 요약`) 보고서형 `.xlsx` 엑셀 다운로드, 월별 일정표 |
| **설문조사 관리** | `surveys-list.asp`, `surveys-create.asp`, `surveys-edit.asp`, `surveys-detail.asp`, `surveys-results.asp`, `surveys-drafts.asp`<br>`proc/participation_proc.asp` | 설문조사 등록/수정/복제/삭제, 문항별 답변 분기(이동 경로), 결과 차트·문항별 통계 및 2시트(`문항별 통계 요약` + `참여자별 상세 응답`) 보고서형 `.xlsx` 엑셀 다운로드 |
| **외부/회원 참여 링크** | `participant.asp`<br>`js/participation/app.js`, `js/participation/store.js`, `js/participation/member-auth.js` | 관리자에서 사용자에게 전달하는 참여 링크(`js/participation/app.js`의 `link()`)가 사용자 도메인 `http://ko-peach.kr/participant.asp?participate={token}`으로 생성되며, 사용자 홈페이지(`c:\Workspace\peach` 및 FTP `/selfhelpPeach`)에도 동일 참여 모듈 배포 완료 |

---

## 3. 인증 및 SMS 발송 상세 메커니즘 (`proc/account_proc.asp`, `proc/auth_proc.asp`)

1. **Java WAS(`wkwhrma`) 인증 연동 완전 분리**:
   - 과거 버전과 달리 로그인, 아이디/비밀번호 찾기, 아이디 중복확인, 휴대폰 인증번호 생성/검증 시 Java WAS(`https://xn--jj0b479bhta.kr/wkwhrma/...`)를 일절 호출하지 않음.
   - 모든 관리자 계정은 `peach.dbo.TBL_OPERATOR` 테이블 기준으로만 조회 및 수정됨.
   - `operator_password`는 평문이 아닌 MSSQL `LOWER(CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', CAST(@pw AS VARCHAR(200))), 2))` 기반 64자리 SHA-256 단방향 해시값으로 저장·검증됨.
2. **SMS 게이트웨이(`send_sms.asp`) 직접 연동**:
   - 게이트웨이 URL: `https://selfhelp.edu-ok.co.kr/selfhelpAPI/send_sms.asp`
   - ASP에서 4자리 인증번호(`1000~9999`)를 생성하여 ASP `Session`에 보관(`SMS_CHALLENGE_CODE`, `FIND_ID_AUTH_CODE`, `PWD_AUTH_CODE`)하고, `BuildDirectSmsPayload`로 JSON 페이로드를 생성한 뒤 `PureAesEncrypt`로 AES-256-CBC 암호화하여 전송함.
   - `GetDefaultBranchId()` 분기 규칙:
     - 내부/로컬 IP (`115.95.86.155`, `127.0.0.1`, `::1`, `192.168.*`, `121.78.131.*`) 및 `ko-peach.kr` 외 도메인:
       - `branchId` (`ETC2`) = `2028`
       - `branchName` (`ETC4`) = `자조금통합지원센터`
       - `sender` (`SEND_PHONE`) = `0448654942`
     - `ko-peach.kr` 도메인 (외부 접속):
       - `branchId` (`ETC2`) = `2020`
       - `branchName` (`ETC4`) = `(사)한국복숭아생산자협의회`
       - `sender` (`SEND_PHONE`) = `0432317774`

---

## 4. 최종 퍼블리싱 원본(`01_최종퍼블`) 및 화면기획서(v8, `20261028`) 기준
- **최종 퍼블리싱 기준 경로 (필수 참조)**:
  - `C:\Workspace\peach.admin\복숭아 관리자\01_최종퍼블\peach-admin`
  - 모든 신규/수정 화면은 위 폴더의 HTML 마크업, CSS(`css/*.css`), JS(`js/*.js`) 구조를 그대로 유지하면서 Classic ASP(`.asp` + `proc/*_proc.asp`) 및 `peach` DB와 연동해야 함.
- **최종 화면기획서 경로**:
  - `C:\Workspace\peach.admin\복숭아 관리자\02_화면기획서\복숭아자조금_PC관리자_화면기획서_통합본_퍼블기준수정_20261028.pptx`

### 4.1 완료된 전체 메뉴 개편 및 신규 구축 현황
- `운영자·권한 관리` 메뉴 제거 (`inc/sidebar.asp`, `index.asp`)
- 헤더 우측 관리자 이름 클릭 시 `내 관리자 정보`(`admin-account.asp`) 이동 및 `회원가입`(`login.asp`) 연동
- `게시글 관리` 채널 구분 제거 및 `협의회게시판`(`공지사항`·`언론보도`·`업장홍보`) / `복숭아자조금`(`자조금 가입안내`·`자조금 사업현황`·`자조금 홍보`) / `복숭아정보`(`복숭아와 건강`·`복숭아관련 소식`·`복숭아 홍보`) 세부 카테고리 탭·드롭다운 확장 완료 (`재배자료`는 추후 `재배정보` 게시판용으로 유지)
- `교육영상 관리` 유튜브 URL 직접 등록/수정/삭제 및 메인노출 최대 3건 제한 적용
- **신규 `행사·교육참여 관리` (`events-*.asp`) 및 `설문조사 관리` (`surveys-*.asp`), 외부/회원 참여 페이지 (`participant.asp`) 구축 완료**:
  - 좌측 사이드바(`inc/sidebar.asp`) `교육영상 관리` 하단에 `행사·교육참여 관리`, `설문조사 관리` 메뉴 연결 완료
  - 전용 CSS(`css/participation/*.css` 7종) 및 JS(`js/participation/*.js` 8종) 반영, `store.js` 및 `member-auth.js`를 `proc/participation_proc.asp` DB API와 직결
- **전 메뉴 안내 문구·용어 일반인 눈높이 평문 한국어 전면 개편 완료 (`2026-11-04`)**:
  - 초기 시연/프로토타입 잔재 문구(`시연용`, `브라우저 저장소`, `connected=1`, `데이터베이스에 저장`, `자동 일괄 공개 규칙`, `지정 순서로 수동 전환` 등) 전량 제거 및 비전공 실무자 기준의 직관적 안내문으로 교체 완료

---

## 5. 설문조사·행사참여 DB 스키마 및 회원 확인 메커니즘 (`schema_participation.sql`, `proc/participation_proc.asp`)

1. **전용 테이블 (4종)**:
   - `dbo.TBL_PARTICIPATION_CONFIG`: 개인정보 수집·이용 동의 기본 문구(최근 저장값 기억) 단일 행 설정 테이블 (`config_id = 1`)
   - `dbo.TBL_PARTICIPATION_FORM`: 설문조사(`form_kind='survey'`) 및 행사·교육(`form_kind='event'`) 마스터 테이블 (`form_id` PK, `participation_token` UNIQUE 인덱스)
   - `dbo.TBL_PARTICIPATION_QUESTION`: 문항·선택지·이동경로(`next_target`, `options_json`) 정규화 상세 테이블
   - `dbo.TBL_PARTICIPATION_RESPONSE`: 설문 응답 및 행사·교육 신청 내역 테이블 (`submission_id` UNIQUE 멱등키, 행사 접수 상태 `confirmed` / `waitlist` / `absent`)
2. **전용 저장 프로시저 (6종)**:
   - `dbo.USP_ADMIN_PARTICIPATION_LIST`: 설문/행사 마스터 + 응답 내역 + 기본 동의 설정 3개 ResultSet 일괄 조회
   - `dbo.USP_ADMIN_PARTICIPATION_GET`: `form_id` 또는 `participation_token` 단건 상세 조회
   - `dbo.USP_ADMIN_PARTICIPATION_SAVE`: 문서 `INSERT`/`UPDATE`, `OPENJSON` 기반 `TBL_PARTICIPATION_QUESTION` 동기화, `TBL_PARTICIPATION_CONFIG` 기본값 갱신
   - `dbo.USP_ADMIN_PARTICIPATION_DELETE`: 응답/신청 내역이 없는 문서만 소프트 삭제(`is_deleted='Y'`) 허용 (응답 존재 시 `@r_code = -2` 차단)
   - `dbo.USP_ADMIN_PARTICIPATION_SUBMIT`: 트랜잭션 잠금(`UPDLOCK, HOLDLOCK`) 하에 중복 제출 멱등성(`submission_id`), 설문 기기·브라우저 중복 응답 차단(`respondent_id`), 행사 회원 중복 신청 차단(`member_id`), 정원(`capacity_limit`) 및 대기(`waitlist_enabled`) 자동 판정 저장
   - `dbo.USP_ADMIN_PARTICIPATION_MEMBER_HISTORY`: 특정 회원(`@p_member_id`)의 행사·교육 신청 이력 조회
3. **Java 프로젝트 수정 없는 복숭아자조금 회원 확인 (`action=match_member`)**:
   - 행사·교육 참여 시 이름+휴대폰 번호로 회원을 확인할 때, 구 `selfhelp` DB를 조회하거나 `com.bhsoft.nselfhelp` 소스를 수정하지 않고 `consentBillForm.do`(`JSESSIONID` 세션 수립) → `consentBillStep2.do` (`pBranchID` = 내부/테스트 `2028`, `ko-peach.kr` 운영 `2020`)로 이름+휴대폰+재회원(`statecode='0101'`) 일치를 검증한 뒤 `/wkwhrma/api/getStudentnoForReceipt.do`로 정확한 `회원번호(studentno)`를 매칭 반환함 (SMS 발송 없음).
4. **DB 문서화 표준 (`procedures_peach.sql`, `schema_participation.sql`)**:
   - `peach` DB 내 전체 13개 테이블과 30개 저장 프로시저 모두 SSMS 디자인/수정 창에서 즉시 확인 가능하도록 `MS_Description` 확장 속성(총 398건)과 파라미터·`BEGIN` 헤더·쿼리별 인라인 `--` 주석이 완비되어 있음.

