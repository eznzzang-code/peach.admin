# 복숭아자조금 PC관리자 (`peach.admin`) 프로젝트 핵심 규칙 (AGENTS.md)

## 1. 데이터베이스 및 타 시스템 접근 철칙
1. **복숭아 관리자 전용 DB (`peach`)**:
   - MSSQL (`121.78.131.15`, `Initial Catalog=peach`, 설정 파일: `inc/dbconn.asp`)을 사용합니다.
2. **구 `selfhelp` MSSQL DB 접근 절대 금지**:
   - 어떠한 경우에도 `Data Source=121.78.131.15;Initial Catalog=selfhelp;User Id=selfhelp;...` 구 DB에 접속하여 데이터를 조회하거나 가져오지 마십시오.
   - 구 `selfhelp` 시스템은 Java 기반의 `C:\Workspace\com.bhsoft.nselfhelp` (MariaDB `nself_help_db`)로 완전히 이관되었습니다.
3. **Java 프로젝트(`C:\Workspace\com.bhsoft.nselfhelp`) 임의 수정 금지**:
   - 복숭아 관리자(`c:\Workspace\peach.admin`)의 기능을 수정할 때 Java 프로젝트(`com.bhsoft.nselfhelp`)의 소스를 임의로 수정하지 않고, ASP(`peach.admin`) 내에서 해결합니다.
4. **DB 테이블·컬럼 설명(`MS_Description`) 및 프로시저 주석 필수 작성**:
   - 신규 테이블/컬럼/프로시저를 생성하거나 수정할 때는 반드시 SSMS 디자인(Design) 창에서 확인 가능하도록 `sys.sp_addextendedproperty` (`MS_Description`)를 테이블·컬럼·프로시저·파라미터 단위로 빠짐없이 등록합니다.
   - SSMS에서 프로시저 우클릭 → `수정(Modify)` 시 `CREATE PROCEDURE` 상단 주석은 SSMS가 자동 제거하므로, 반드시 ① 각 `@p_...` 파라미터 우측 인라인 주석(`--`), ② `BEGIN` 직후 프로시저 요약 헤더 주석, ③ 각 `SELECT`/`INSERT`/`UPDATE`/`DELETE` 쿼리 상단 설명 주석 및 `SELECT` 컬럼 우측 주석을 함께 작성합니다.

## 2. 관리자 계정 인증 및 로그인 철칙 (Java WAS 인증 연동 금지)
1. **오직 `peach.dbo.TBL_OPERATOR` 테이블만 사용**:
   - 로그인(`login`), 회원가입(`create_account`), 아이디 중복확인(`check_id`), 아이디 찾기(`send_auth_find_id`, `find_id_verify`), 비밀번호 찾기(`check_pwd_id`, `send_auth_find_pwd`, `verify_code_find_pwd`, `reset_password`), 내 관리자 정보(`get_profile`, `update_profile`, `update_phone`, `change_password`)는 **100% `peach.dbo.TBL_OPERATOR` 테이블만 바라보아야 합니다.**
   - **절대로** `https://xn--jj0b479bhta.kr/wkwhrma/login/...` (`loginExcute.do`, `checkIdExcute.do`, `findIdExcute.do`, `pwdReset.do`)나 `/api/initAuthNumber.do`, `/api/checkAuthNumber.do` 등 Java WAS로 로그인/계정/인증번호 요청을 보내거나 fallback 처리하지 마십시오. (구 `tblemployee` 계정인 `test0001` 등이 로그인되는 현상 방지)
2. **가입 인증코드 (`peach.dbo.TBL_ADMIN_INVITATION`)**:
   - 회원가입 시 필요한 공통 가입 인증코드는 `dbo.TBL_ADMIN_INVITATION` (`inv_id = 1`)에서 관리하며, 초기 코드는 소문자 `peach1234`이고 검증 시에는 대소문자 구분 없이(`UCase`) 비교합니다.
3. **비밀번호 SHA-256 단방향 암호화(해시) 저장**:
   - `dbo.TBL_OPERATOR.operator_password`는 절대 평문으로 저장하지 않으며, MSSQL 내장 `LOWER(CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', CAST(@pw AS VARCHAR(200))), 2))` (64자리 소문자 16진수 SHA-256 해시)로 단방향 암호화하여 저장 및 비교합니다.

## 3. SMS 인증번호 발송 및 `branchId` / 단체명 분기 철칙
1. **인증번호 자리수 및 검증 방식**:
   - 인증번호는 **4자리 숫자(`1000` ~ `9999`)**로 ASP(`proc/account_proc.asp`, `proc/auth_proc.asp`)에서 직접 생성하여 ASP `Session`에 저장하고 직접 대조 검증합니다.
   - 프론트엔드(`login.asp`, `js/pages/signup.js`, `js/admin-account-api.js`, `js/pages/admin-account.js`)에서도 4자리(`/^\d{4,6}$/`) 기준으로 검증합니다.
2. **순수 VBScript AES-256-CBC 암호화 (`PureAesEncrypt` / `PureAesDecrypt`)**:
   - `peachlocal.admin.edu-ok.co.kr` IIS 환경에는 32비트 `CSharpAES.AES` COM DLL이 등록되어 있지 않으므로(`800401f3`), `Server.CreateObject("CSharpAES.AES")`를 사용하지 않고 ASP 내장 순수 VBScript AES-256-CBC 함수(`PureAesEncrypt`, 키: `G7hQ4vL9pZ2dX5kC8bT1eS3yR4mW6qJ3`)로 암호화하여 `https://selfhelp.edu-ok.co.kr/selfhelpAPI/send_sms.asp` 게이트웨이를 호출합니다.
   - `GFMult(ByVal a, ByVal b)` 함수는 반드시 `ByVal` 인자를 유지해야 합니다(VBScript 기본 `ByRef`로 인한 상태 배열 오염 방지).
3. **접속 환경별 `branchId` (`ETC2`) / `branchName` (`ETC4`) / `sender` (`SEND_PHONE`) 분기**:
   - **내부 또는 로컬 IP (`115.95.86.155`, `127.0.0.1`, `::1`, `192.168.*`, `121.78.131.*`) 또는 테스트 도메인(`peachlocal.admin.edu-ok.co.kr`) 접속 시**:
     - `branchId` (`ETC2`): **`2028`** (테스트 자조금)
     - `branchName` (`ETC4`): **`자조금통합지원센터`**
     - `sender` (`SEND_PHONE`): **`0448654942`** (`044-865-4942`)
   - **실제 운영 도메인 (`ko-peach.kr`) 외부 접속 시**:
     - `branchId` (`ETC2`): **`2020`**
     - `branchName` (`ETC4`): **`(사)한국복숭아생산자협의회`**
     - `sender` (`SEND_PHONE`): **`0432317774`** (`043-231-7774`)
   - 단체명 및 대표번호는 구 `selfhelp` DB가 아닌 `com.bhsoft.nselfhelp` (`https://xn--jj0b479bhta.kr/sideform.do`)에서 `targetBranchId` 기준으로 실시간 조회하여 반영합니다.

## 4. 퍼블리싱 원본 참조 및 Classic ASP 변환·FTP 배포 규칙
1. **최종 퍼블리싱 원본(`01_최종퍼블`) 100% 기준 준수**:
   - 모든 화면(HTML 구조, CSS 스타일, JS 인터랙션)을 만들거나 수정할 때는 반드시 **`C:\Workspace\peach.admin\복숭아 관리자\01_최종퍼블\peach-admin`** 폴더에 있는 최종 퍼블리싱 원본을 100% 기준으로 참고하여 ASP로 제작합니다.
   - 화면기획서 최종본은 `C:\Workspace\peach.admin\복숭아 관리자\02_화면기획서\복숭아자조금_PC관리자_화면기획서_통합본_퍼블기준수정_20261028.pptx`를 함께 참조합니다.
2. **VBScript `Or` / `And` 단락 평가(Short-Circuit) 미지원 및 음수 `CLng(0 & val)` 금지**:
   - `If rs.EOF Or CStr(rs("col")) = "" Then` 과 같이 작성하면 `rs.EOF`가 `True`일 때도 `rs("col")`을 평가하여 `80020009` 런타임 에러가 발생합니다. 반드시 `If Not rs.EOF Then` 블록 안에서 컬럼 값을 읽어야 합니다.
   - 프로시저 OUTPUT 코드 등 음수가 반환될 수 있는 숫자에 `CLng(0 & val)`을 사용하면 `val = -1`일 때 문자열 `"0-1"`이 되어 Type Mismatch 에러가 발생합니다. 반드시 `IsNumeric` 검사를 거치는 `SafeLng(val, defaultVal)` 헬퍼를 사용하십시오.
3. **FTP 배포 규칙 (`ftp://121.78.131.31:12000/selfhelpPeachAdmin`)**:
   - 로컬 수정 후 테스트/반영 시 FTP 서버(`ftp://121.78.131.31:12000/selfhelpPeachAdmin`)에 해당 `.asp`, `.js`, `.css` 파일을 업로드하여 동기화합니다.
   - 단, `/복숭아 관리자` 폴더, `.html` 퍼블리싱 원본 파일, `.agents` 폴더, `AGENTS.md`, 임시 스크립트 파일은 절대 FTP에 업로드하지 않습니다.

## 5. 지식 누적 및 `SKILL.md` 업데이트 원칙
- 새로운 메뉴 개발, DB 테이블/프로시저 변경, 연동 규칙 보완 등 주요 작업이 완료될 때마다 `.agents/skills/peach_admin/SKILL.md` 및 본 `AGENTS.md`에 최신 팩트를 즉시 기록하여 다음 세션에서도 동일한 컨텍스트를 100% 유지합니다.

