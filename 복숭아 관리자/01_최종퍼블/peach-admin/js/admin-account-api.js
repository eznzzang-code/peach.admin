/* Publishing adapters only. Replace AdminAccountApi with session-bound server APIs.
   Shared invitation and display-name persistence below are explicitly browser demo data.
   Passwords, SMS codes and verification proofs are never persisted in browser storage. */
(function(g){'use strict';
 const INV='peach-admin-invitation-demo:v1',PROFILE='peach-admin-profile-demo:v1';
 const error=(message,code='INVALID')=>Object.assign(new Error(message),{code});
 const digits=v=>String(v||'').replace(/\D/g,'');
 const rules={digits,validPhone:v=>/^01[016789]\d{7,8}$/.test(digits(v)),validPassword:v=>typeof v==='string'&&v.length>=8&&v.length<=20&&/[A-Za-z]/.test(v)&&/\d/.test(v),validName:v=>typeof v==='string'&&!!v.trim()&&v.trim().length<=40};
 function read(key,fallback){const raw=localStorage.getItem(key);return raw?JSON.parse(raw):fallback;}
 function current(){const user=g.DemoAuth?.current();if(!user)throw error('로그인 후 이용해 주세요.','AUTH');return user;}
 function random(){const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',bytes=new Uint8Array(16);g.crypto.getRandomValues(bytes);return Array.from(bytes,v=>alphabet[v%alphabet.length]).join('');}
 const api={
  async getProfile(){const u=current(),profiles=read(PROFILE,{});return {id:u.id,name:profiles[u.id]?.name||'정유현',phone:profiles[u.id]?.phone||''};},
  async updateProfile({name}){const u=current();if(!rules.validName(name))throw error('이름을 1~40자로 입력해 주세요.');const profiles=read(PROFILE,{});profiles[u.id]={...profiles[u.id],name:name.trim()};localStorage.setItem(PROFILE,JSON.stringify(profiles));return this.getProfile();},
  async getInvitation(){current();return read(INV,null);},
  async issueInvitation(expectedVersion){current();const previous=read(INV,null);if((previous?.version||null)!==(expectedVersion||null))throw error('다른 화면에서 가입코드가 변경되었습니다. 다시 확인해 주세요.','STALE');const value={code:random(),version:random(),issuedAt:new Date().toISOString()};localStorage.setItem(INV,JSON.stringify(value));return value;},
  async verifyInvitation(code){const value=read(INV,null);if(!value||value.code!==String(code||'').trim())throw error('가입 인증코드가 올바르지 않습니다. 관리자에게 현재 코드를 확인해 주세요.','INVITATION');return {token:value.version,version:value.version};},
  async validateInvitation(grant){const value=read(INV,null);if(!value||!grant?.token||grant.token!==value.version)throw error('가입 인증코드가 변경되었습니다. 새 코드로 다시 확인해 주세요.','INVITATION');return true;},
  async sendPhoneCode(){current();throw error('인증번호를 발송하지 못했습니다. 잠시 후 다시 시도해 주세요.');},
  async verifyPhoneCode(){current();throw error('인증번호를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.');},
  async updatePhone(){current();throw error('휴대폰 번호를 변경하지 못했습니다. 잠시 후 다시 시도해 주세요.');},
  async changePassword(){current();throw error('비밀번호를 변경하지 못했습니다. 잠시 후 다시 시도해 주세요.');}
 };
 // Phone challenge binds proof to the exact new number and invalidates stale async responses.
 function phoneFlow(adapter,now=()=>Date.now()){
  let epoch=0,sent='',challenge=null,expires=0,retry=0,verified='',proof=null,proofExpires=0,pending=false,count=0;
  function edit(phone){if(digits(phone)!==sent){epoch++;sent='';challenge=null;expires=0;retry=0;verified='';proof=null;proofExpires=0;pending=false;count=0;}}
  return {
   edit,
   async send(phone){phone=digits(phone);if(!rules.validPhone(phone))throw error('휴대폰 번호 형식을 확인해 주세요.');if(pending)throw error('요청을 처리 중입니다.');if(sent===phone&&retry>now())throw error('잠시 후 인증번호를 다시 발송해 주세요.');if(sent===phone&&count>=5)throw error('발송 횟수를 초과했습니다. 잠시 후 다시 시도해 주세요.');edit(phone);const ticket=++epoch;pending=true;verified='';proof=null;try{const r=await adapter.sendPhoneCode(phone);if(ticket!==epoch)throw error('번호가 변경되었습니다. 다시 인증해 주세요.');if(!r?.challengeId)throw error('인증번호를 발송하지 못했습니다.');sent=phone;challenge=r.challengeId;expires=now()+Math.min(180,Math.max(1,Number(r.expiresIn)||180))*1000;retry=now()+Math.max(1,Number(r.retryAfter)||60)*1000;count++;return {expiresIn:Math.ceil((expires-now())/1000)};}finally{if(ticket===epoch)pending=false;}},
   async verify(phone,code){phone=digits(phone);if(pending)throw error('요청을 처리 중입니다.');if(phone!==sent||!challenge)throw error('새 번호로 인증번호를 먼저 발송해 주세요.');if(expires<=now())throw error('인증번호 유효시간이 지났습니다. 다시 발송해 주세요.');if(!/^\d{6}$/.test(code))throw error('인증번호 6자리를 입력해 주세요.');const ticket=epoch;pending=true;try{const r=await adapter.verifyPhoneCode({phone,code,challengeId:challenge});if(ticket!==epoch)throw error('번호가 변경되었습니다. 다시 인증해 주세요.');if(r?.verified!==true||!r.proof)throw error('인증번호가 확인되지 않았습니다.');verified=phone;proof=r.proof;proofExpires=now()+Math.min(300,Math.max(1,Number(r.expiresIn)||300))*1000;return true;}finally{if(ticket===epoch)pending=false;}},
   proof(phone){if(verified!==digits(phone)||!proof||proofExpires<=now())throw error('변경할 새 휴대폰 번호의 인증을 완료해 주세요.');return proof;},
   remaining(){return Math.max(0,Math.ceil((expires-now())/1000));}
  };
 }
 g.AdminAccountRules={...rules,phoneFlow};g.AdminAccountApi=g.AdminAccountApi||api;
})(window);
