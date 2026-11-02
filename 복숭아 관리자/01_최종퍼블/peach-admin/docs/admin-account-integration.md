# 관리자 가입 인증·내 정보 개발 연결 기준

## 화면
- 로그인 회원가입 → 가입 인증코드 확인 모달 → 기존 가입 모달. 이름·아이디·휴대폰·비밀번호 입력.
- 상단 이름 → admin-account.html. 아이디 읽기 전용, 이름 수정, 새 번호 인증을 통한 휴대폰 변경, 현재 비밀번호 검증 후 비밀번호 변경.
- 같은 내 정보 페이지에 공통 가입코드 발행/복사/재발행. 복사는 코드 변경 없음. 최초 미발행 상태에서 발행 가능. 재발행 전 기존 코드 무효 안내 확인.
- 설문·행사 화면 및 다른 업무 컨트롤러 유지. 모든 기존 상단 이름에 공통 링크 연결.

## 확정 정책
가입 인증코드는 관리자 전체가 공통으로 사용하며 유효기간이 없습니다. 재발행 즉시 이전 코드와 이전 검증 결과를 모두 무효화합니다. 가입 폼 진입 전과 최종 계정 생성 시 유효성을 확인합니다. 기존 가입 계정에는 영향을 주지 않습니다. 전화 SMS 인증번호의 유효시간과 가입 공통 코드의 무기한 정책은 서로 다릅니다.

아이디는 조회 전용입니다. 비밀번호는 기존 값 표시/저장소 보관 없이 현재 비밀번호+새 비밀번호+확인을 입력합니다. 새 비밀번호는 기존 가입과 동일한 영문/숫자 포함 8~20자입니다. 휴대폰은 새 번호를 인증한 서버 증빙으로만 변경합니다. 번호 재입력/인증 만료/실패 시 변경 불가, 기존 번호 유지. 이름 수정이 미저장 상태이면 휴대폰 변경 성공 후에도 이름 입력을 유지합니다.

## 퍼블리싱과 운영 구분
js/admin-account-api.js의 기본 어댑터는 기존 DemoAuth의 테스트 로그인에 연결됩니다. 현재 테스트 계정은 기존 test / 1111 그대로입니다. 이름과 공통 가입코드는 같은 브라우저/origin의 명시적인 시연용 저장소입니다. 가입 코드 및 프로필은 실제 서버의 전체 관리자 계정 공유나 보안 기능을 제공하지 않습니다. 기존 회원가입의 SMS/계정 생성 연동 대기 정책을 유지합니다. SMS나 비밀번호 변경이 서버 성공 없이 완료됐다고 표시하지 않습니다. 비밀번호/SMS번호/증빙은 localStorage/sessionStorage에 보관하지 않습니다.

## 서버 API 교체 계약
AdminAccountApi를 서버 어댑터로 교체합니다. 모든 내 정보·코드 관리 API는 로그인 세션에 귀속하며 클라이언트가 넘긴 다른 관리자 ID로 조회/수정하지 않습니다.

- getProfile() → {id, name, phone}: 실제 최초 가입정보 조회. 기존 이름 미수집 계정은 마이그레이션 값을 제공하거나 최초 이름 입력 허용.
- updateProfile({name}) → 저장된 전체 본인 정보. 아이디 변경 불가.
- getInvitation() → {code, version, issuedAt} 또는 null. 관리자 인증 필수.
- issueInvitation(expectedVersion) → 새 {code, version, issuedAt}. 관리자 인증 필수. 서버 암호학적 난수 생성/단일 활성 버전/원자적 교체. 미발행은 expectedVersion=null. 오래된 버전 재발행 요청은 충돌 처리.
- verifyInvitation(code) → 공개 가입 전 확인 API. 오류 시 코드/계정 정보 노출 없이 실패. 성공 시 불투명한 가입 증빙 반환.
- validateInvitation(grant) → 폼 진입 및 제출 직전 검증. 실제 createAccount에서도 동일 검증을 원자적으로 다시 수행. 프런트의 검증만으로 가입 권한을 인정하지 않음. 재발행은 기존 코드로 얻은 모든 grant도 무효화.
- sendPhoneCode(phone) → {challengeId, expiresIn, retryAfter}. 현재 로그인한 관리자와 새 번호에 귀속. 서버 발송 횟수/재발송 간격 제한. 미연동 시 성공 처리 금지.
- verifyPhoneCode({phone, code, challengeId}) → {verified:true, proof, expiresIn}. 새 번호에 귀속된 서버 증빙 필수. 프런트는 증빙 없으면 verified=true만으로 통과하지 않음.
- updatePhone({phone, verificationProof}) → 저장된 전체 본인 정보. 서버가 번호·세션·증빙·유효기간·사용 여부 검사 후 기존 번호 교체.
- changePassword({currentPassword,newPassword}) → {changed:true}. 서버가 현재 비밀번호 검증과 새 정책 검사 후 변경. 비밀번호는 서버 해시 저장, 응답에 비밀번호 반환 금지.

기존 SignupApi는 createAccount({name,id,phone,password,phoneVerificationProof,invitationGrant}) 계약으로 확장했습니다. sendCode와 verifyCode에는 공통 코드 검증 결과/전화 challenge를 함께 전달합니다. 서버에서 아이디 중복·SMS 증빙·공통코드 활성 버전과 가입을 하나의 처리로 검사합니다. 직접 URL·DOM 조작은 서버 검증을 우회하지 못해야 합니다.

## 검증
Node: tests/admin-account/account.test.cjs 및 기존 tests/participation 전체. 메모리 저장소에서 무기한 공통코드/재발행/구코드 및 구증빙 차단/다른 관리자 격리/미로그인 차단/휴대폰 번호·만료·비동기 응답 변경/증빙 누락/서버 미연동 실패/비밀번호 저장소 미보관 확인.

공통 가입코드의 발행→로그아웃→가입 확인 시연은 최종 폴더의 미리보기_실행.cmd로 실행한 같은 HTTP 주소에서 사용합니다. file:// 저장소는 브라우저마다 파일별로 분리될 수 있으므로 별도 파일 간 코드 공유를 보장하지 않습니다. 운영은 서버 공통 저장을 사용합니다.
