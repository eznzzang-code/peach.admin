/* One participant detail for menu, notification and external-link entry. */
(function(){
  'use strict';
  const M=PeachSurveyModel,S=PeachSurveyStore,root=document.getElementById('peach-survey-prototype');
  const params=new URLSearchParams(location.search);if(location.protocol==='file:')new URLSearchParams((location.hash||'').replace(/^#/,'')).forEach((value,key)=>params.set(key,value));
  let responseId=params.get('response'),token=params.get('participate'),channel=params.get('channel')||(token?'link':'app'),kind=params.get('kind')||'survey',page=params.get('view')||(token?'detail':'list'),actor=PeachEventMemberAuth.current(),authOpen=false,authBusy=false,authError='',authRequestVersion=0,runner=null,historyIndex=Number(history.state?.psPortalIndex)||0,restoringHistory=false,skipLeaveOnce=false,leaveDialog=null,pendingLeave=null,leaveFocus=null;const guest=S.visitor();

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const btn=(t,a,attrs='',primary=false,active=false)=>`<button type="button" class="${primary?'primary':active?'active':''}" data-portal-action="${a}" ${attrs}>${t}</button>`;
  const forms=()=>S.load();
  const selected=()=>forms().find(f=>f.participationToken===token);
  const actorFor=f=>f?.kind==='survey'?guest:actor;
  function urlState(replace=false){const u=new URL(location.href);if(token)u.searchParams.set('participate',token);else u.searchParams.delete('participate');if(page==='mine'&&responseId)u.searchParams.set('response',responseId);else u.searchParams.delete('response');u.searchParams.set('channel',channel);u.searchParams.set('view',page);u.searchParams.set('kind',kind);if(location.protocol==='file:'){const local=new URL(location.href);local.hash=u.searchParams.toString();try{if(!replace)historyIndex++;history[replace?'replaceState':'pushState']({psPortalIndex:historyIndex},'',local);}catch(e){}}else try{if(!replace)historyIndex++;history[replace?'replaceState':'pushState']({psPortalIndex:historyIndex},'',u);}catch(e){}}
  function hasAnswers(){return page==='run'&&runner&&!runner.session().done&&Object.values(runner.session().answers).some(v=>Array.isArray(v)?v.length:typeof v==='string'?v.trim():v!==undefined&&v!==null);}
  function closeLeave(){leaveDialog?.remove();leaveDialog=null;pendingLeave=null;root.querySelector('.ps-portal')?.removeAttribute?.('inert');document.body.classList?.toggle?.('is-modal-open',authOpen);leaveFocus?.focus?.();}
  function askLeave(action){
    if(!hasAnswers()){action();return;}
    if(leaveDialog)return;
    pendingLeave=action;leaveFocus=document.activeElement;leaveDialog=document.createElement('div');leaveDialog.className='modal ps-member-modal ps-leave-modal';
    leaveDialog.innerHTML=`<div class="modal__backdrop" data-portal-action="leave-cancel"></div><div class="modal__dialog ps-member-dialog" role="dialog" aria-modal="true" aria-labelledby="ps-leave-title"><div class="modal__header"><h2 class="modal__title" id="ps-leave-title">작성 중인 답변</h2>${btn('×','leave-cancel','aria-label="닫기"')}</div><div class="modal__body"><p>작성 중인 답변은 저장되지 않습니다. 이 화면을 나가시겠습니까?</p></div><div class="modal__footer">${btn('계속 작성','leave-cancel')}${btn('나가기','leave-confirm','',true)}</div></div>`;
    root.querySelector('.ps-portal')?.setAttribute?.('inert','');root.appendChild(leaveDialog);document.body.classList?.toggle?.('is-modal-open',true);leaveDialog.querySelector('[data-portal-action="leave-cancel"]')?.focus?.();
  }
  function readLocation(){const p=new URLSearchParams(location.search);if(location.protocol==='file:')new URLSearchParams((location.hash||'').replace(/^#/, '')).forEach((v,k)=>p.set(k,v));responseId=p.get('response');token=p.get('participate');channel=p.get('channel')||(token?'link':'app');kind=p.get('kind')||'survey';page=p.get('view')||(token?'detail':'list');if(!['list','history','mine','detail','run'].includes(page))page=token?'detail':'list';}
  function render(){
    document.body.classList?.toggle?.('is-modal-open',authOpen);
    if(page==='history'){kind='event';token=null;responseId=null;urlState(true);}
    if(page==='mine'&&selected()?.kind==='survey'){page='history';kind='event';token=null;responseId=null;urlState(true);}
    const f=selected();if(f&&['detail','run','mine'].includes(page)&&kind!==f.kind){kind=f.kind;urlState(true);}
    if(page==='run'&&(!f||!M.gate(f,{channel,actor:actorFor(f)}).allowed)){page='detail';urlState(true);}
    runner=null;
    root.innerHTML=`<div class="ps-portal" ${authOpen?'inert':''}><header class="ps-portal-header"><img src="assets/logo-mark.png" alt=""><strong>복숭아자조금 참여</strong></header><nav class="ps-tabs">${btn('설문조사','list','data-kind="survey"',false,page==='list'&&kind==='survey')}${btn('행사·교육','list','data-kind="event"',false,page==='list'&&kind==='event')}${btn('내 참여내역','history','',false,page==='history'||page==='mine')}</nav><main class="ps-portal-content">${page==='list'?listView():page==='history'?historyView():page==='mine'?mineView():page==='run'?'<div id="ps-participant-run"></div>':detailView(f)}</main></div>${authOpen?memberDialog():''}`;
    if(page==='detail'&&f&&f.questions.length===0&&M.gate(f,{channel,actor:actorFor(f)}).allowed)mount(f);
    if(page==='run'&&f)mount(f);
  }
  function card(f,history=false,response=null){const action=history?'mine':'detail',attrs=`data-token="${esc(f.participationToken)}" ${response?`data-response="${esc(response.id)}"`:''}`;return `<article class="ps-card"><span class="ps-tag">${f.kind==='survey'?'설문':f.settings.eventType||'행사'}</span>${history?'':` <span class="ps-tag">${publicStatus(f)}</span>`}<h3><a class="ps-title-link" href="?view=${action}&amp;kind=${f.kind}&amp;participate=${encodeURIComponent(f.participationToken)}${response?'&amp;response='+encodeURIComponent(response.id):''}" data-portal-action="${action}" ${attrs}>${esc(f.title)}</a></h3><p class="ps-subtle">${history?new Date(response.at).toLocaleString('ko-KR')+' · '+M.enrollmentLabel(response):(f.kind==='event'?'신청기간: ':'참여기간: ')+esc(f.settings.start.replace('T',' '))+' ~ '+esc(M.effectiveEnd(f).replace('T',' '))}</p></article>`;}
  function publicStatus(f){const state=M.status(f);return ({scheduled:'접수 예정',closed:'접수 종료',capacity:'신청 마감',waitlist:'대기 접수중',draft:'미공개',live:f.kind==='event'?'신청 접수중':'참여중'})[state]||'참여중';}
  function listView(){const list=forms().filter(f=>f.kind===kind&&f.publishedAt&&f.isPublic);return `<h1>${kind==='survey'?'설문조사':'행사·교육'}</h1>${list.map(f=>card(f)).join('')||'<div class="ps-card ps-empty">공개된 항목이 없습니다.</div>'}`;}
  function loginButton(){return `<section class="ps-card ps-empty"><h2>회원 확인이 필요합니다</h2><p>행사·교육 참여내역은 확인된 회원만 확인할 수 있습니다.</p>${btn('회원 확인 후 계속','login','',true)}</section>`;}
  function memberDialog(){return `<div class="modal ps-member-modal"><div class="modal__backdrop" data-portal-action="auth-close"></div><div class="modal__dialog ps-member-dialog" role="dialog" aria-modal="true" aria-labelledby="ps-member-title"><div class="modal__header"><h2 class="modal__title" id="ps-member-title">행사·교육 회원 확인</h2>${btn('×','auth-close','aria-label="닫기"')}</div><form data-event-member-form novalidate><div class="modal__body"><p>복숭아자조금에 등록된 이름과 휴대폰 번호를 입력해 주세요.</p><label for="ps-member-name">이름</label><input id="ps-member-name" data-member-name autocomplete="name" maxlength="40" placeholder="이름을 입력해 주세요"><label for="ps-member-phone">휴대폰 번호</label><input id="ps-member-phone" data-member-phone type="tel" autocomplete="tel" maxlength="13" placeholder="010-0000-0000"><p class="ps-errors" data-member-error role="alert" ${authError?'':'hidden'}>${esc(authError)}</p></div><div class="modal__footer">${btn('취소','auth-close')}<button type="submit" class="primary" ${authBusy?'disabled':''}>회원 확인 후 계속</button></div></form></div></div>`;}
  function eventIcon(name){
    const paths={calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18M8 15h2M14 15h2"/>',pin:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',people:'<circle cx="9" cy="8" r="3"/><path d="M3 21v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M21 21v-2a6 6 0 0 0-4-5"/>',lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>'};
    return `<svg class="ps-event-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.calendar}</svg>`;
  }
  function eventTime(value){return value?`<time datetime="${esc(value)}">${esc(value.replace('T',' ').slice(0,16).replaceAll('-','.'))}</time>`:'<span>미입력</span>';}
  function eventRange(start,end){return `${eventTime(start)}<span class="ps-event-date-tail"><span class="ps-event-date-sep" aria-hidden="true">~</span>${eventTime(end)}</span>`;}
  function eventDetail(f,g){
    const state=M.status(f),hidden=!f.isPublic,closed=['closed','capacity'].includes(state),waiting=state==='waitlist';
    const label=hidden?'비공개':state==='draft'?'작성중':state==='scheduled'?'신청 예정':state==='closed'?'접수 종료':state==='capacity'?'정원 마감':waiting?'대기 접수중':'신청 접수중';
    const info=(icon,title,value)=>`<div class="ps-event-info-row"><dt>${eventIcon(icon)}<span>${title}</span></dt><dd>${value}</dd></div>`;
    let action='';
    if(g.allowed)action=`${btn('신청하기','start','',true)}<p class="ps-event-action-help">신청 결과는 내 참여내역에서 확인할 수 있습니다.</p>`;
    else if(g.code==='login')action=`<div class="ps-event-auth">${eventIcon('lock')}<div><strong>회원 정보 확인 후 신청할 수 있어요</strong><p>이름과 휴대폰 번호로 회원 정보를 확인합니다.</p></div></div>${btn('회원 확인 후 계속','login','',true)}`;
    else action=`<div class="ps-event-state-message" role="status">${esc(g.message)}</div>${g.code==='duplicate'?btn('내 참여내역 보기','history','',true):''}`;
    return `<article class="ps-event-detail">
      <header class="ps-event-hero"><div class="ps-event-badges"><span class="ps-event-type">${esc(f.settings.eventType||'행사')}</span><span class="ps-event-status ${hidden||closed?'is-closed':waiting?'is-waiting':''}"><i aria-hidden="true"></i>${label}</span></div><h1>${esc(f.title)}</h1><p class="ps-event-subtitle">함께 배우고 참여하는 복숭아자조금 행사·교육</p></header>
      <div class="ps-event-body"><dl class="ps-event-info">${info('calendar','개최 일정',f.settings.scheduleMode==='period'?eventRange(f.settings.date,f.settings.eventEnd):eventTime(f.settings.date))}${info('pin','장소',esc(f.settings.place||'미입력'))}${info('clock','신청기간',eventRange(f.settings.start,M.effectiveEnd(f)))}</dl>
      ${waiting?'<div class="ps-event-waiting" role="status"><strong>현재 대기 접수 중입니다.</strong><p>참석을 선택하면 대기로 접수되며, 참석 확정 상태는 아닙니다.</p></div>':''}
      ${f.description?.trim()?`<section class="ps-event-description"><h2>행사 안내</h2><p>${esc(f.description)}</p></section>`:''}</div>
      <footer class="ps-event-action">${action}</footer></article>`;
  }
  function detailView(f){
    if(!f)return '<div class="ps-card"><h2>항목을 찾을 수 없습니다.</h2><p>링크가 올바른지 확인해 주세요.</p></div>';
    const g=M.gate(f,{channel,actor:actorFor(f)});
    if(f.kind==='event')return eventDetail(f,g);
    return `<article class="ps-card"><h1>${esc(f.title)}</h1><p style="white-space:pre-wrap">${esc(f.description)}</p><p>참여기간: ${esc(f.settings.start.replace('T',' '))} ~ ${esc(M.effectiveEnd(f).replace('T',' '))}</p>${g.allowed?(f.questions.length?btn(f.kind==='survey'?'응답하기':'신청하기','start','',true):'<div id="ps-participant-run"></div>'):`<div class="ps-note">${esc(g.message)}</div>${g.code==='login'?loginButton():g.code==='duplicate'?(f.kind==='survey'?btn('설문 목록으로','list','data-kind="survey"'):btn('내 참여내역 보기','history')):''}`}</article>`;
  }
  function owns(f,r){return f.kind==='event'&&!!actor&&r.memberId===actor.id;}
  function historyView(){const cards=actor?forms().filter(f=>f.kind==='event').flatMap(f=>f.responses.filter(r=>owns(f,r)).map(r=>card(f,true,r))).join(''):'';return `<h1>행사·교육 참여내역</h1><p class="ps-subtle" style="margin:8px 0 18px">확인된 회원이 신청한 행사·교육 내역을 확인할 수 있습니다.</p>${!actor?loginButton():cards||'<div class="ps-card ps-empty">행사·교육 참여내역이 없습니다.</div>'}`;}
  function answer(q,v){return Array.isArray(v)?v.map(id=>q.options.find(o=>o.id===id)?.label||id).join(', '):q.options.find(o=>o.id===v)?.label||String(v||'미응답');}
  function mineView(){if(!actor)return `<h1>행사·교육 참여내역</h1>${loginButton()}`;const f=selected(),r=f?.kind==='event'?f.responses.filter(r=>owns(f,r)).find((r,i,all)=>responseId?r.id===responseId:i===all.length-1):null;if(!r)return `${btn('← 내 참여내역','history')}<div class="ps-card ps-empty">내 참여내역을 찾을 수 없습니다.</div>`;return `${btn('← 내 참여내역','history')}<article class="ps-card"><h1>${esc(f.title)}</h1><p>${new Date(r.at).toLocaleString('ko-KR')} ${f.kind==='survey'?'응답 완료':M.enrollmentLabel(r)+' 접수'}</p>${f.questions.filter(q=>r.path.includes(q.id)).map(q=>`<div class="ps-note"><strong>${esc(q.title)}</strong><br>${esc(answer(q,r.answers[q.id]))}</div>`).join('')}<p class="ps-subtle">개인정보 동의: ${r.consent?.agreed?'동의함':'미포함'}</p></article>`;}
  function mount(f){runner=PeachParticipantUI.mount(root.querySelector('#ps-participant-run'),{form:f,mode:'participation',actor:f.kind==='survey'?guest:actor,channel,embedded:page==='detail',onExit:done=>{const finish=()=>{if(done&&f.kind==='survey'){page='list';kind='survey';token=null;responseId=null;}else{page=done?'history':'detail';if(done)kind='event';}urlState();render();window.scrollTo(0,0);};if(done)finish();else askLeave(finish);}});}
  root.addEventListener('click',e=>{
    const b=e.target.closest('[data-portal-action]');if(!b)return;e.preventDefault?.();const a=b.dataset.portalAction;
    if(a==='leave-cancel'){closeLeave();return;}
    if(a==='leave-confirm'){const action=pendingLeave;closeLeave();action?.();return;}
    if(['list','detail','mine','history','history-kind'].includes(a)){const data={...b.dataset};askLeave(()=>handleAction(a,{dataset:data}));return;}
    handleAction(a,b);
  });
  function handleAction(a,b){
    if(a==='list'){kind=b.dataset.kind;page='list';token=null;urlState();render();}
    if(a==='detail'||a==='mine'){token=b.dataset.token;responseId=b.dataset.response||null;page=a;urlState();render();window.scrollTo(0,0);}
    if(a==='history'||a==='history-kind'){page='history';kind='event';token=null;responseId=null;urlState();render();}
    if(a==='login'){authOpen=true;authError='';render();root.querySelector('[data-member-name]')?.focus?.();}
    if(a==='auth-close'){PeachEventMemberAuth.cancel();authRequestVersion++;authOpen=false;authBusy=false;authError='';render();root.querySelector('[data-portal-action="login"]')?.focus?.();}
    if(a==='start'){const f=selected(),g=M.gate(f,{channel,actor:actorFor(f)});if(!g.allowed){render();return;}page='run';urlState();render();window.scrollTo(0,0);}
  }
  root.addEventListener('submit',async e=>{
    if(!e.target.matches('[data-event-member-form]'))return;e.preventDefault();if(authBusy)return;authBusy=true;
    const requestVersion=++authRequestVersion,name=root.querySelector('[data-member-name]').value,phone=root.querySelector('[data-member-phone]').value,error=root.querySelector('[data-member-error]'),submit=e.target.querySelector('[type="submit"]');submit.disabled=true;
    try{const verified=await PeachEventMemberAuth.verify(name,phone);if(!authOpen||requestVersion!==authRequestVersion)return;actor=verified;authOpen=false;authError='';const f=selected();if(page==='detail'&&f?.kind==='event'&&M.gate(f,{channel,actor}).allowed)page='run';urlState();render();window.scrollTo(0,0);}catch(err){if(authOpen&&requestVersion===authRequestVersion){authError=err.message||'회원 정보를 확인하지 못했습니다.';error.textContent=authError;error.hidden=false;}}finally{if(requestVersion===authRequestVersion){authBusy=false;submit.disabled=false;}}
  });
  window.addEventListener('keydown',e=>{if(leaveDialog){if(e.key==='Escape'){closeLeave();return;}if(e.key==='Tab'){const nodes=[...leaveDialog.querySelectorAll('button:not(:disabled)')],first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}return;}if(!authOpen)return;if(e.key==='Escape'){PeachEventMemberAuth.cancel();authRequestVersion++;authOpen=false;authBusy=false;render();return;}if(e.key==='Tab'){const nodes=[...root.querySelectorAll('.ps-member-dialog button:not(:disabled),.ps-member-dialog input')],first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
  window.addEventListener('storage',()=>{if(page!=='run'&&!authOpen&&!leaveDialog)render();});
  window.addEventListener('beforeunload',e=>{if(hasAnswers()){e.preventDefault();e.returnValue='';}});
  window.addEventListener('popstate',e=>{
    if(restoringHistory){restoringHistory=false;return;}
    const nextIndex=Number(e.state?.psPortalIndex);
    if(!skipLeaveOnce&&hasAnswers()){
      if(Number.isFinite(nextIndex)&&nextIndex!==historyIndex){const delta=historyIndex-nextIndex;restoringHistory=true;history.go(delta);askLeave(()=>{skipLeaveOnce=true;history.go(-delta);});}else{urlState(true);askLeave(()=>{page='detail';urlState();render();});}return;
    }
    skipLeaveOnce=false;
    PeachEventMemberAuth.cancel();authRequestVersion++;authOpen=false;authBusy=false;authError='';
    if(Number.isFinite(nextIndex))historyIndex=nextIndex;
    readLocation();render();window.scrollTo(0,0);
  });
  readLocation();urlState(true);render();
})();
