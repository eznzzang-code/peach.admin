/* Match existing peach-fund members. No account creation or persistent authentication history. */
(function(g){
  'use strict';
  let member=null,version=0;
  const digits=v=>String(v||'').replace(/\D/g,'');
  g.PeachEventMemberApi=g.PeachEventMemberApi||{
    async matchMember({name,phone}){
      const body=new URLSearchParams();
      body.set('action','match_member');
      body.set('name',String(name||'').trim());
      body.set('phone',digits(phone));
      const res=await fetch('proc/participation_proc.asp?action=match_member',{
        method:'POST',
        headers:{'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8'},
        body:body.toString()
      });
      if(!res.ok)throw new Error('회원 정보를 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.');
      return await res.json();
    }
  };
  g.PeachEventMemberAuth={
    current(){return member?{...member}:null;},
    cancel(){version++;},
    async verify(name,phone){
      name=String(name||'').trim();
      phone=digits(phone);
      if(!name||name.length>40)throw new Error('이름을 1~40자로 입력해 주세요.');
      if(!/^01[016789]\d{7,8}$/.test(phone))throw new Error('휴대폰 번호를 확인해 주세요.');
      const ticket=++version,r=await g.PeachEventMemberApi.matchMember({name,phone});
      if(ticket!==version)throw new Error('회원 확인이 취소되었습니다.');
      if(r?.verified!==true||typeof r.member?.id!=='string'||!r.member.id.trim())throw new Error(r?.message||'일치하는 회원 정보가 없습니다. 이름과 휴대폰 번호를 확인해 주세요.');
      member={id:r.member.id,name:r.member.name||name,phone};
      if(r.verificationToken)member.verificationToken=r.verificationToken;
      return {...member};
    }
  };
})(window);

