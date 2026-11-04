/* Administrator: list -> editor with inline settings -> operation detail. */
(function(){
  'use strict';
  const M=window.PeachSurveyModel,S=window.PeachSurveyStore;
  const root=document.getElementById('peach-survey-prototype'),dialog=document.getElementById('ps-dialog');
  const types={single:'단일 선택',multi:'복수 선택',short:'단답형',long:'장문형',rating:'평점형'};
  const labels={draft:'작성중',scheduled:'참여예정',live:'참여중',closed:'종료',capacity:'정원 마감',waitlist:'대기 접수중'};
  const openBranches=new Set();let editorReturn='list';
  let forms=S.load(),form=null,baseline=null,kind='survey',page='list',tab='basic',filter='all',query='',queryFrom='',queryTo='',pendingDeleteId=null,selected=null,dirty=false,resultTab='summary';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const button=(text,action,attrs='',cls='')=>`<button type="button" class="${cls}" data-action="${action}" ${attrs}>${text}</button>`;
  const noun=()=>kind==='survey'?'설문':'행사·교육';
  const locked=()=>M.structureLocked(form);
  const qLabel=(f,id)=>id==='submit'?'제출':!id||id==='next'?'다음 질문':f.questions.some(q=>q.id===id)?`Q${f.questions.findIndex(q=>q.id===id)+1}. ${f.questions.find(q=>q.id===id).title}`:'⚠ 삭제된 질문';
  const view=(name,...args)=>PeachSurveyEditor.render(name,{form,kind,selected,esc,button,types,openBranches,locked,qLabel,M},...args);
  const time=v=>v?esc(v.replace('T',' ').slice(0,16)):'미입력';
  const responses=()=>form.responses;
  function toast(text){const el=document.getElementById('ps-toast');el.textContent=text;el.classList.add('on');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('on'),String(text||'').length>20?4500:2800);}
  function failText(prefix,e,fallback){const msg=String(e?.message||'').trim();if(!msg||msg===prefix)return `${prefix} ${fallback}`;return msg.startsWith(prefix)?msg:`${prefix} (${msg})`;}
  function modal(title,body){dialog.innerHTML=`<div class="ps-dialog-head"><strong>${title}</strong>${button('닫기','close-dialog')}</div><div class="ps-dialog-body">${body}</div>`;if(!dialog.open)dialog.showModal();}
  function persist(){try{S.save(forms);return true;}catch(e){toast(failText('저장에 실패했습니다.',e,'현재 화면에서 다시 저장해 주세요.'));return false;}}
  function mark(){dirty=true;const el=root.querySelector('[data-save-status]');if(el)el.textContent='저장하지 않은 변경';}
  function commit(){
    form.updated=new Date().toISOString();
    const next=S.load(),i=next.findIndex(f=>f.id===form.id),latest=next[i];
    if(latest&&baseline&&latest.revision!==baseline.revision){toast('다른 화면에서 문서가 변경되었습니다. 상세를 다시 열어 주세요.');return false;}
    if(latest&&M.structureLocked(latest)&&JSON.stringify(latest.questions)!==JSON.stringify(form.questions)){toast('다른 화면에서 응답이 접수되어 질문 변경을 저장할 수 없습니다. 상세를 다시 열어 주세요.');return false;}
    if(latest){form.responses=M.clone(latest.responses);form.testResponses=M.clone(latest.testResponses);if(page==='editor'&&latest.publishedAt)['publishedAt','isPublic','closedAt','participationToken'].forEach(k=>form[k]=latest[k]);}
    if(form.publishedAt){const errors=M.validate(form,{publish:true});if(errors.length){modal('저장 전 확인',`<div class="ps-errors">${errors.map(esc).join('<br>')}</div>`);return false;}}
    form.revision=(latest?.revision||0)+1;
    if(i<0)next.push(M.clone(form));else next[i]=M.clone(form);
    const changedConsent=!baseline||['purpose','items','retention'].some(k=>form.consent[k]!==baseline.consent[k]);
    try{S.save(next,changedConsent?{consentDefaults:form.consent}:{});}catch(e){toast(failText('저장에 실패했습니다.',e,'다시 시도해 주세요.'));return false;}
    forms=next;baseline=M.clone(form);dirty=false;return true;
  }
  let pendingNavigation=null,pendingSave=null;
  function navigate(fn){
    if(!dirty){fn();return;}
    pendingNavigation=fn;
    modal('저장하지 않은 변경',`<p>변경한 내용을 저장한 뒤 이동하시겠습니까?</p><div class="ps-row">${button('저장 후 이동','save-navigate','','primary')}${button('저장하지 않고 이동','discard-navigate')}</div>`);
  }
  function saveThen(fn){
    if(form.publishedAt){const errors=M.validate(form,{publish:true});if(errors.length){modal('저장 전 확인',`<div class="ps-errors">${errors.map(esc).join('<br>')}</div>`);return;}}
    if(M.majorEventChange(S.load().find(f=>f.id===form.id)||baseline,form)){
      pendingSave=fn;
      modal('행사 주요 정보 변경',`<p>이미 신청자가 있습니다. 변경한 일정·장소를 저장하시겠습니까?</p><p class="ps-subtle" style="line-height:1.7">• 기존 신청 내역은 그대로 유지됩니다.<br>• 일정·장소를 수정해도 문자가 자동 발송되지는 않으니, 변경 안내는 별도로 연락해 주세요.</p>${button('변경 내용 저장','confirm-major-save','','primary')}`);return;
    }
    if(commit())fn();
  }
  function open(id,edit=false,target='basic',from='list'){if(edit)editorReturn=from;
    const stored=S.load().find(f=>f.id===id)||forms.find(f=>f.id===id);if(!stored){toast('항목을 찾을 수 없습니다.');return;}
    form=M.clone(stored);baseline=M.clone(form);kind=form.kind;selected=form.questions[0]?.id;page=edit?'editor':'detail';tab=target;dirty=false;render();window.scrollTo(0,0);
  }
  function syncRoute(){
    const family=kind==='event'?'events':'surveys';
    const file=family+'-'+(page==='list'?'list':page==='editor'?(form?.publishedAt?'edit':'create'):tab==='results'?(kind==='event'?'applicants':'results'):'detail')+'.asp';
    const u=new URL(file,location.href);if(form&&page!=='list')u.searchParams.set('id',form.id);if(page==='editor'&&tab==='flow')u.searchParams.set('tab','flow');if(page==='list'&&filter!=='all')u.searchParams.set('filter',filter);
    if(location.protocol==='file:'){
      // File documents may only rewrite their fragment. URL updates must never prevent rendering.
      const local=new URL(location.href),state=new URLSearchParams(u.search);state.set('screen',file);local.hash=state.toString();
      if(location.href!==local.href)try{history.replaceState(null,'',local);}catch(e){}
    }else if(location.href!==u.href)try{history.replaceState(null,'',u);}catch(e){}

    document.title=(kind==='event'?'행사·교육참여':'설문조사')+' '+(page==='list'?'관리':page==='editor'?'작성·수정':tab==='results'?'결과':'상세')+' | 복숭아자조금 관리자';
    document.body.dataset.page=kind==='event'?'events':'surveys';
    document.querySelectorAll('.sidebar [data-menu]').forEach(link=>{const active=link.dataset.menu===document.body.dataset.page;link.classList.toggle('is-active',active);if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
  }
  function render(){syncRoute();root.innerHTML=page==='list'?listView():page==='editor'?editorView():detailView();}
  function listView(){
    const list=forms.filter(f=>f.kind===kind&&(filter==='all'||M.status(f)===filter)&&f.title.includes(query)&&M.matchesPeriod(f,queryFrom,queryTo));
    return `<div class="ps-heading"><div><h1>${noun()} 관리</h1><p>임시저장 중인 항목과 현재 진행·종료된 항목을 한눈에 확인하고 관리합니다.</p></div>${button('+ '+noun()+' 만들기','new','','primary')}</div><div class="ps-toolbar"><div class="ps-chips">${[['all','전체'],...Object.entries(labels).filter(([key])=>kind==='event'||!['capacity','waitlist'].includes(key))].map(([key,label])=>button(label,'filter',`data-value="${key}"`,filter===key?'active':'')).join('')}</div><input type="search" aria-label="제목 검색" placeholder="제목 검색" data-search value="${esc(query)}" style="max-width:250px"><input type="date" aria-label="조회 시작일" data-query-from value="${esc(queryFrom)}" style="max-width:165px"><span>~</span><input type="date" aria-label="조회 종료일" data-query-to value="${esc(queryTo)}" style="max-width:165px">${button('조회','search')}${button('초기화','reset-search')}</div><table class="ps-table"><thead><tr><th>${noun()}명</th><th>공개</th><th>참여 상태</th><th>${kind==='survey'?'응답':'신청'}기간</th><th>${kind==='survey'?'응답':'신청'} 수</th><th>관리</th></tr></thead><tbody>${list.map(f=>`<tr><td class="ps-title">${button(esc(f.title||'제목 없는 '+noun()),'open',`data-id="${f.id}"`,'ps-title-link')}</td><td>${!f.publishedAt?'미공개':f.isPublic?'공개':'비공개'}</td><td><span class="ps-tag">${labels[M.status(f)]}</span></td><td class="ps-subtle">${time(f.settings.start)}<br>~ ${time(f.settings.end)}</td><td>${f.responses.length}</td><td>${f.publishedAt?button('문항 미리보기','preview-item',`data-id="${f.id}"`):''}${!f.publishedAt?button('삭제','delete-item',`data-id="${f.id}"`):''}</td></tr>`).join('')||'<tr><td colspan="6" class="ps-empty">등록된 항목이 없습니다.</td></tr>'}</tbody></table>`;
  }
  function editorView(){
    return `<div class="ps-heading"><div>${button(editorReturn==='detail'?'← 상세':'← 목록','editor-back','','ps-link')}<h1>${noun()} ${form.publishedAt?'수정':'작성'}</h1><span class="ps-subtle" data-save-status>${dirty?'저장하지 않은 변경':'저장됨'}</span>${!form.publishedAt&&kind==='survey'?'<p class="ps-subtle" style="line-height:1.7">• <strong>[설문 공개하기]</strong>를 누르면 바로 설문이 시작되고 참여 주소(링크)가 만들어집니다.<br>• 아직 작성 중이라면 <strong>[임시저장]</strong>을 눌러주세요.</p>':''}${locked()?'<p class="ps-lock">• 이미 참여자가 답변을 제출한 항목은 통계가 섞이지 않도록 질문을 추가·삭제하거나 보기를 바꿀 수 없습니다.</p>':''}</div><div class="ps-row">${button('미리보기','preview')}${button(form.publishedAt?'저장':'임시저장','save')}${!form.publishedAt?button(kind==='survey'?'설문 공개하기':'공개하기','publish','','primary'):''}</div></div>${tab==='flow'?view('flowView'):writeView()}`;
  }
  function input(label,key,type='text'){return `<label class="ps-field"><span>${label}</span><input type="${type}" data-setting="${key}" value="${esc(form.settings[key])}" ${type==='number'?'min="1"':''}></label>`;}
  function inlineSettings(){const auto=form.settings.endMode==='auto',limit=M.autoEnd(form.settings.start);return `<section class="ps-card ps-inline-settings" id="ps-inline-settings"><h3>${kind==='survey'?'참여':'신청'} 기간</h3><div class="ps-grid2">${input('참여 시작','start','datetime-local')}<div><label class="ps-check"><input type="checkbox" data-end-manual ${!auto?'checked':''}>종료일 직접 지정</label>${auto?`<p class="ps-subtle">시작일로부터 1년 뒤 자동 종료</p><strong data-auto-end>${time(limit)}</strong>`:`<label class="ps-field"><span>참여 종료</span><input type="datetime-local" data-setting="end" value="${esc(form.settings.end)}" min="${esc(form.settings.start)}" max="${esc(limit)}"></label>`}</div></div><p class="ps-subtle">종료일을 따로 정하지 않으면 시작일로부터 1년 동안 열려 있습니다. (직접 정할 때도 최대 1년까지 설정 가능)</p>${kind==='survey'?'':`<p class="ps-subtle">행사·교육 신청은 복숭아자조금 회원 확인(이름·연락처) 후 참여합니다.</p><label class="ps-check"><input type="checkbox" data-setting="capacityEnabled" ${form.settings.capacityEnabled?'checked':''}>정원 적용</label>${form.settings.capacityEnabled?`${input('정원 (참석 인원 기준)','capacity','number')}<label class="ps-check"><input type="checkbox" data-setting="waitlistEnabled" ${form.settings.waitlistEnabled?'checked':''}>정원 초과 시 대기 접수</label><p class="ps-subtle">${form.settings.waitlistEnabled?'정원을 넘어서 참석 신청한 회원은 자동으로 \'대기\'로 접수되며, 확정 인원수에는 포함되지 않습니다.':'참석 신청 인원이 정원에 차면 자동으로 신청이 마감됩니다.'}</p>`:'<p class="ps-subtle">정원을 적용하지 않으면 인원 제한 없이 신청을 받습니다.</p>'}`}</section>`;}
  function completionEditor(){return `<section class="ps-card" id="ps-completion-editor"><h3>완료 안내</h3><label class="ps-field"><span>참여 완료 후 표시할 문구</span><textarea data-setting="completion" placeholder="참여 완료 문구 입력">${esc(form.settings.completion)}</textarea></label></section>`;}
  function writeView(){return `<div class="ps-editor ps-form-editor"><div class="ps-canvas"><section class="ps-card ps-intro-card"><div class="ps-cover-line"></div><label class="ps-field"><span>${noun()}명</span><input type="text" data-form="title" placeholder="제목을 입력해 주세요" value="${esc(form.title)}"></label><label class="ps-field"><span>소개·안내</span><textarea data-form="description" placeholder="안내 내용을 입력해 주세요">${esc(form.description)}</textarea></label>${kind==='event'?`<label class="ps-field"><span>유형</span><select data-setting="eventType"><option ${form.settings.eventType==='행사'?'selected':''}>행사</option><option ${form.settings.eventType==='교육'?'selected':''}>교육</option></select></label><div class="ps-grid2"><label class="ps-field"><span>행사 일정</span><select data-setting="scheduleMode"><option value="single" ${form.settings.scheduleMode==='single'?'selected':''}>하루 일정</option><option value="period" ${form.settings.scheduleMode==='period'?'selected':''}>기간 일정</option></select></label>${input(form.settings.scheduleMode==='period'?'행사 시작일시':'행사 일시','date','datetime-local')}${form.settings.scheduleMode==='period'?input('행사 종료일시','eventEnd','datetime-local'):''}${input('장소','place')}</div>`:''}</section>${inlineSettings()}${form.questions.map((q,i)=>view('questionCard',q,i)).join('')}${!form.questions.length?`<section class="ps-card ps-empty"><p>${kind==='survey'?'질문을 추가해 주세요.':'추가로 물어볼 질문이 있을 때만 질문을 추가해 주세요.'}</p>${button('+ 질문 추가','add')}</section>`:''}${view('consentEditor')}${completionEditor()}</div><aside class="ps-outline ps-right-outline"><div class="ps-outline-tabs"><strong>작성 목차</strong></div>${button('기본정보·참여 설정','scroll-settings','','ps-link')}${form.questions.map((q,i)=>`<div class="ps-outline-item ${q.id===selected?'active':''}" draggable="${!locked()&&!M.isAttendance(q)}" data-drag-id="${q.id}">${button((i+1)+'. '+esc(q.title||'제목 없는 질문'),'select',`data-id="${q.id}"`)}<span>≡</span></div>`).join('')}${button('개인정보 동의','scroll-consent','','ps-link')}${button('완료 안내','scroll-completion','','ps-link')}${button('질문 이동 경로','flow','','ps-flow-link')}</aside></div>`;}
  function link(){const url=new URL('participant.asp','http://ko-peach.kr/');url.searchParams.set('participate',form.participationToken);return url.href;}
  function detailView(){return `<div class="ps-heading"><div>${button('← 목록','list','','ps-link')}<h1>${esc(form.title||'제목 없는 '+noun())}</h1><p>${!form.publishedAt?'미공개':form.isPublic?'공개':'비공개'} · ${labels[M.status(form)]}</p></div><div class="ps-row">${button('문항 미리보기','preview')}${button('수정','edit')}${button('더보기','more')}</div></div><nav class="ps-tabs" aria-label="상세 탭">${button('기본정보·참여 링크','detail-tab','data-tab="basic"',tab==='basic'?'active':'')}${button(kind==='survey'?'응답 결과':'신청자 관리','detail-tab','data-tab="results"',tab==='results'?'active':'')}</nav>${tab==='basic'?basicView():resultsView()}`;}
  function basicView(){return `<section class="ps-card"><h3>기본정보</h3><p style="white-space:pre-wrap">${esc(form.description||'등록된 안내가 없습니다.')}</p><dl class="ps-detail-grid"><dt>참여기간</dt><dd>${time(form.settings.start)} ~ ${time(M.effectiveEnd(form))}${form.settings.endMode==='auto'?' (1년 후 자동 종료)':''}</dd>${kind==='event'?'<dt>참여 방식</dt><dd>회원 확인(이름·연락처) 후 신청</dd>':''}${kind==='event'?`<dt>행사정보</dt><dd>${esc(form.settings.eventType)} · ${esc(M.scheduleText(form))} · ${esc(form.settings.place)}</dd><dt>정원</dt><dd>${form.settings.capacityEnabled?M.attendanceCount(form)+' / '+form.settings.capacity+'명 (참석 기준) · '+(form.settings.waitlistEnabled?'대기 접수 사용':'정원 도달 시 전체 마감'):'인원 제한 없음'}</dd>`:''}${kind==='event'?`<dt>접수 현황</dt><dd>참석 확정 ${M.attendanceCount(form)}명 · 미참석 ${responses().filter(r=>M.attendanceOf(r)==='absent').length}명 · 대기 ${M.waitlistCount(form)}명</dd>`:''}<dt>개인정보 동의</dt><dd>${form.consent.included?'포함':'미포함'}</dd><dt>${kind==='survey'?'응답':'신청'} 수</dt><dd>${responses().length}건</dd></dl></section><section class="ps-card"><h3>참여 링크</h3>${form.publishedAt?`<label class="ps-field"><span>회원·참여자에게 보낼 참여 주소 (링크)</span><input type="text" data-link value="${esc(link())}" readonly></label><div class="ps-row">${button('참여 링크 복사','copy-link')}<a class="ps-native-button" href="${esc(link())}" target="_blank" rel="noopener">참여 링크 열기</a></div><p class="ps-subtle" style="line-height:1.7">• 위 주소를 복사해 문자나 카카오톡 등으로 보내주시면 바로 참여할 수 있습니다.<br>• ${kind==='survey'?'설문은 별도 로그인 없이 바로 참여하며':'행사·교육은 이름·연락처로 회원 확인 후 신청하며'}, 기간이 끝나면 자동으로 마감 안내가 표시됩니다.</p>${!form.isPublic?'<p class="ps-lock">• 현재 비공개 상태이므로 링크에 접속해도 참여할 수 없습니다.</p>':''}`:'<p class="ps-subtle" style="line-height:1.7">• 임시저장 상태에서는 참여 주소(링크)가 아직 만들어지지 않습니다.<br>• 공개하기를 누르면 이곳에서 바로 주소를 복사할 수 있습니다.</p>'}</section>`;}
  function answerText(q,a){if(a===undefined)return '미응답';if(Array.isArray(a))return a.map(id=>q.options.find(o=>o.id===id)?.label||id).join(', ');return q.options.find(o=>o.id===a)?.label||String(a||'미응답');}
  function consentText(r){return r.consent?.agreed?'동의 · '+new Date(r.consent.at).toLocaleString('ko-KR'):r.consent===null?'미포함':'기록 없음';}
  function resultsView(){const rs=responses();return `<div class="ps-heading"><div><h2>${kind==='survey'?'응답 결과':'신청자 관리'} ${rs.length}건</h2><p>실제로 제출 완료된 참여 내역만 집계됩니다. (관리자 미리보기 테스트는 제외)</p>${kind==='event'?`<p>참석 확정 ${M.attendanceCount(form)}명 · 미참석 ${rs.filter(r=>M.attendanceOf(r)==='absent').length}명 · 대기 ${M.waitlistCount(form)}명</p>`:''}</div>${rs.length?button('엑셀 다운로드','download'):''}</div>${rs.length?`${kind==='survey'?`<div class="ps-chips ps-result-tabs">${button('문항별 집계','result-tab','data-value="summary"',resultTab==='summary'?'active':'')}${button('개별 응답','result-tab','data-value="individual"',resultTab==='individual'?'active':'')}</div>`:''}${kind==='event'||resultTab==='individual'?`<table class="ps-table"><thead><tr><th>제출일시</th><th>${kind==='survey'?'참여자':'신청 회원 (회원번호·성명)'}</th>${kind==='event'?'<th>접수 상태</th>':''}<th>개인정보 동의</th><th>상세</th></tr></thead><tbody>${rs.map((r,index)=>`<tr><td>${new Date(r.at).toLocaleString('ko-KR')}</td><td>${kind==='survey'?'참여자 '+(index+1):esc(r.memberName&&r.memberId?r.memberId+' / '+r.memberName:r.memberId||r.memberName||'회원 정보 없음')}</td>${kind==='event'?`<td>${M.enrollmentLabel(r)}</td>`:''}<td>${esc(consentText(r))}</td><td>${button('답변 보기','response',`data-id="${r.id}"`)}</td></tr>`).join('')}</tbody></table>`:form.questions.map((q,i)=>{const reached=rs.filter(r=>r.path.includes(q.id)),answered=reached.filter(r=>r.answers[q.id]!==''&&r.answers[q.id]!==undefined&&(!Array.isArray(r.answers[q.id])||r.answers[q.id].length));return `<section class="ps-card"><h3>${i+1}. ${esc(q.title)}</h3><p class="ps-subtle">질문을 본 사람 ${reached.length}명 · 답변한 사람 ${answered.length}명 · 앞 질문 선택에 따라 건너뛴 사람 ${rs.length-reached.length}명</p>${['single','multi','rating'].includes(q.type)?(q.type==='rating'?[1,2,3,4,5].map(v=>({id:String(v),label:v+'점'})):q.options).map(o=>{const count=answered.filter(r=>Array.isArray(r.answers[q.id])?r.answers[q.id].includes(o.id):String(r.answers[q.id])===o.id).length,rate=reached.length?Math.round(100*count/reached.length):0;return `<div class="ps-row"><span>${esc(o.label)}</span><span class="ps-view-switch">${count}명 · ${rate}%</span></div><div class="ps-resultbar"><i style="width:${rate}%"></i></div>`;}).join(''):answered.map(r=>`<div class="ps-note">${esc(r.answers[q.id])}</div>`).join('')||'<p class="ps-subtle">응답 없음</p>'}</section>`;}).join('')}`:'<div class="ps-card ps-empty">아직 접수된 응답·신청이 없습니다.</div>'}`;}
  function newQuestion(type='single'){return {id:M.uid(),title:'',description:'',type,required:true,next:'next',options:['single','multi'].includes(type)?[{id:M.uid(),label:'',to:'next'},{id:M.uid(),label:'',to:'next'}]:[]};}
  function preview(target=form){const errors=M.validate(target,{publish:true});if(errors.length){modal('미리보기 전 확인',`<div class="ps-errors">${errors.map(esc).join('<br>')}</div>`);return;}dialog.innerHTML='';PeachParticipantUI.mount(dialog,{form:target,mode:'preview',onExit:()=>dialog.close()});dialog.showModal();}
  function publish(){const errors=M.validate(form,{publish:true});if(errors.length){modal('공개 전 확인',`<div class="ps-errors">${errors.map(esc).join('<br>')}</div>`);return;}form.publishedAt=new Date().toISOString();form.participationToken=form.participationToken||M.uid();form.isPublic=true;form.status='live';if(commit()){page='detail';tab='basic';render();window.scrollTo(0,0);toast('공개가 완료되어 참여 주소(링크)가 생성되었습니다.');}}
  function download(name,blobOrText,type='application/json'){const blob=blobOrText instanceof Blob?blobOrText:new Blob([blobOrText],{type}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
  function formatKstDateTime(iso){if(!iso)return '';const d=new Date(iso);if(isNaN(d.getTime()))return String(iso);const p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;}
  function shortConsentText(r){return r.consent?.agreed?'동의':r.consent===null?'미포함':'미동의';}
  function qTypeLabel(t){return {single:'단일 선택',multi:'복수 선택',rating:'5점 척도',short:'단답형 주관식',long:'장문형 주관식'}[t]||'문항';}
  function barCell(rate){const r=Math.max(0,Math.min(100,Number(rate)||0)),total=20;let filled=Math.round(r/5);if(r>0&&filled===0)filled=1;const rich=[];if(filled>0)rich.push({t:'█'.repeat(filled),color:'FFE11D48',sz:7});if(filled<total)rich.push({t:'█'.repeat(total-filled),color:'FFE5E7EB',sz:7});return {v:'',s:8,skipWidth:true,rich};}
  function buildXlsxWorkbookBlob(sheets){
    const xmlEsc=v=>String(v??'').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    const colLetter=n=>{let s='';for(let x=n+1;x>0;x=Math.floor((x-1)/26))s=String.fromCharCode(65+(x-1)%26)+s;return s;};
    const textWidth=v=>Array.from(String(v??'')).reduce((w,ch)=>w+(ch.charCodeAt(0)>127?2.1:1.1),0);
    const usedNames=new Set();
    const normSheets=sheets.map((sh,idx)=>{
      let base=String(sh.name||('시트'+(idx+1))).replace(/[\\/?*[\]:]/g,' ').trim().slice(0,28)||('시트'+(idx+1)),name=base,n=2;
      while(usedNames.has(name)){name=`${base}(${n++})`;}
      usedNames.add(name);
      const colCount=sh.rows.reduce((m,r)=>Math.max(m,r.cells.length),1);
      const widths=Array.from({length:colCount},(_,c)=>{
        let maxW=sh.minWidths?.[c]||10;
        for(const r of sh.rows){if(r.skipWidth)continue;const cell=r.cells[c];if(!cell||cell.skipWidth)continue;const firstLine=String(cell.v??'').split(/\r?\n/)[0]||'';maxW=Math.max(maxW,Math.ceil(textWidth(firstLine))+4);}
        return Math.min(58,maxW);
      });
      const colsXml=`<cols>${widths.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join('')}</cols>`;
      const merges=[];
      const rowsXml=sh.rows.map((r,ri)=>{
        const rNum=ri+1,ht=r.ht||22;
        if(r.merges){for(const [c1,c2] of r.merges){if(c2>c1)merges.push(`${colLetter(c1)}${rNum}:${colLetter(c2)}${rNum}`);}}
        const cellsXml=r.cells.map((cell,ci)=>{
          const st=cell?.s??0;
          if(cell?.rich?.length){return `<c r="${colLetter(ci)}${rNum}" s="${st}" t="inlineStr"><is>${cell.rich.map(run=>`<r><rPr><rFont val="맑은 고딕"/><color rgb="${run.color}"/><sz val="${run.sz||10}"/></rPr><t xml:space="preserve">${xmlEsc(run.t)}</t></r>`).join('')}</is></c>`;}
          const raw=String(cell?.v??''),safe=/^[=+@\-\t\r]/.test(raw)&&isNaN(Number(raw))?"'"+raw:raw;
          return `<c r="${colLetter(ci)}${rNum}" s="${st}" t="inlineStr"><is><t xml:space="preserve">${xmlEsc(safe)}</t></is></c>`;
        }).join('');
        return `<row r="${rNum}" ht="${ht}" customHeight="1">${cellsXml}</row>`;
      }).join('');
      const mergeXml=merges.length?`<mergeCells count="${merges.length}">${merges.map(ref=>`<mergeCell ref="${ref}"/>`).join('')}</mergeCells>`:'';
      return {name:xmlEsc(name),xml:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${colsXml}<sheetData>${rowsXml}</sheetData>${mergeXml}</worksheet>`};
    });
    const stylesXml='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
      +'<fonts count="5">'
      +'<font><sz val="10"/><color rgb="FF111827"/><name val="맑은 고딕"/></font>'
      +'<font><b/><sz val="10.5"/><color rgb="FFFFFFFF"/><name val="맑은 고딕"/></font>'
      +'<font><b/><sz val="14"/><color rgb="FF111827"/><name val="맑은 고딕"/></font>'
      +'<font><b/><sz val="10.5"/><color rgb="FF9F1239"/><name val="맑은 고딕"/></font>'
      +'<font><sz val="10"/><color rgb="FFE11D48"/><name val="맑은 고딕"/></font>'
      +'</fonts>'
      +'<fills count="6">'
      +'<fill><patternFill patternType="none"/></fill>'
      +'<fill><patternFill patternType="gray125"/></fill>'
      +'<fill><patternFill patternType="solid"><fgColor rgb="FF334155"/><bgColor indexed="64"/></patternFill></fill>'
      +'<fill><patternFill patternType="solid"><fgColor rgb="FFFDF2F4"/><bgColor indexed="64"/></patternFill></fill>'
      +'<fill><patternFill patternType="solid"><fgColor rgb="FFF8FAFC"/><bgColor indexed="64"/></patternFill></fill>'
      +'<fill><patternFill patternType="solid"><fgColor rgb="FFFFF1F2"/><bgColor indexed="64"/></patternFill></fill>'
      +'</fills>'
      +'<borders count="3">'
      +'<border><left/><right/><top/><bottom/><diagonal/></border>'
      +'<border><left style="thin"><color rgb="FFCBD5E1"/></left><right style="thin"><color rgb="FFCBD5E1"/></right><top style="thin"><color rgb="FFCBD5E1"/></top><bottom style="thin"><color rgb="FFCBD5E1"/></bottom><diagonal/></border>'
      +'<border><left/><right/><top/><bottom style="medium"><color rgb="FFE11D48"/></bottom><diagonal/></border>'
      +'</borders>'
      +'<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
      +'<cellXfs count="9">'
      +'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
      +'<xf numFmtId="0" fontId="2" fillId="3" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>'
      +'<xf numFmtId="0" fontId="3" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>'
      +'<xf numFmtId="0" fontId="0" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>'
      +'<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>'
      +'<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>'
      +'<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>'
      +'<xf numFmtId="0" fontId="3" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>'
      +'<xf numFmtId="0" fontId="4" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>'
      +'</cellXfs></styleSheet>';
    const contentTypes=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${normSheets.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`;
    const workbookXml=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${normSheets.map((s,i)=>`<sheet name="${s.name}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets></workbook>`;
    const wbRelsXml=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${normSheets.map((_,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}<Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
    const files=[
      ['[Content_Types].xml',contentTypes],
      ['_rels/.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
      ['xl/workbook.xml',workbookXml],
      ['xl/_rels/workbook.xml.rels',wbRelsXml],
      ['xl/styles.xml',stylesXml],
      ...normSheets.map((s,i)=>[`xl/worksheets/sheet${i+1}.xml`,s.xml])
    ];
    const enc=new TextEncoder(),crcTable=new Uint32Array(256);
    for(let i=0;i<256;i++){let c=i;for(let k=0;k<8;k++)c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1);crcTable[i]=c>>>0;}
    const crc32=u8=>{let c=0xFFFFFFFF;for(let i=0;i<u8.length;i++)c=crcTable[(c^u8[i])&0xFF]^(c>>>8);return (c^0xFFFFFFFF)>>>0;};
    const localParts=[],centralParts=[];let offset=0;
    for(const [path,content] of files){
      const nameBytes=enc.encode(path),dataBytes=enc.encode(content),crc=crc32(dataBytes);
      const lh=new Uint8Array(30+nameBytes.length),lv=new DataView(lh.buffer);
      lv.setUint32(0,0x04034b50,true);lv.setUint16(4,20,true);lv.setUint16(6,0x0800,true);lv.setUint16(8,0,true);
      lv.setUint16(10,0,true);lv.setUint16(12,0x5821,true);lv.setUint32(14,crc,true);
      lv.setUint32(18,dataBytes.length,true);lv.setUint32(22,dataBytes.length,true);lv.setUint16(26,nameBytes.length,true);lv.setUint16(28,0,true);
      lh.set(nameBytes,30);localParts.push(lh,dataBytes);
      const ch=new Uint8Array(46+nameBytes.length),cv=new DataView(ch.buffer);
      cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(8,0x0800,true);cv.setUint16(10,0,true);
      cv.setUint16(12,0,true);cv.setUint16(14,0x5821,true);cv.setUint32(16,crc,true);
      cv.setUint32(20,dataBytes.length,true);cv.setUint32(24,dataBytes.length,true);cv.setUint16(28,nameBytes.length,true);
      cv.setUint16(30,0,true);cv.setUint16(32,0,true);cv.setUint16(34,0,true);cv.setUint16(36,0,true);cv.setUint32(38,0,true);cv.setUint32(42,offset,true);
      ch.set(nameBytes,46);centralParts.push(ch);offset+=lh.length+dataBytes.length;
    }
    const cdSize=centralParts.reduce((s,p)=>s+p.length,0),eocd=new Uint8Array(22),ev=new DataView(eocd.buffer);
    ev.setUint32(0,0x06054b50,true);ev.setUint16(8,files.length,true);ev.setUint16(10,files.length,true);ev.setUint32(12,cdSize,true);ev.setUint32(16,offset,true);
    return new Blob([...localParts,...centralParts,eocd],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  }
  function buildSummarySheet(rs,printedAt){
    const spanRow=(text,style,cols=5,ht=26)=>({ht,skipWidth:true,merges:[[0,cols-1]],cells:Array.from({length:cols},(_,i)=>({v:i===0?text:'',s:style,skipWidth:true}))});
    const metaRow=(label,val,cols=5)=>({ht:22,merges:[[1,cols-1]],cells:[{v:label,s:2},...Array.from({length:cols-1},(_,i)=>({v:i===0?val:'',s:3,skipWidth:true}))]});
    const blankRow=(cols=5)=>({ht:12,skipWidth:true,cells:Array.from({length:cols},()=>({v:'',s:0}))});
    const rows=[
      spanRow(` ${kind==='survey'?'설문조사 결과 요약 보고서':'행사·교육 접수 및 응답 요약'} — ${form.title||noun()}`,1,5,34),
      metaRow('참여 기간',`${time(form.settings.start)} ~ ${time(M.effectiveEnd(form))}`,5),
      ...(kind==='event'?[metaRow('행사 정보',`${form.settings.eventType||'행사'} · ${M.scheduleText(form)} · ${form.settings.place||'장소 미정'}`,5)]:[]),
      metaRow(kind==='survey'?'총 응답 인원':'접수 현황',kind==='survey'?`총 ${rs.length}명 참여  (출력일시: ${printedAt})`:`총 ${rs.length}명 신청  (참석 확정 ${M.attendanceCount(form)}명 · 대기 ${M.waitlistCount(form)}명 · 미참석 ${rs.filter(r=>M.attendanceOf(r)==='absent').length}명)  |  출력일시: ${printedAt}`,5),
      blankRow(5)
    ];
    if(kind==='event'){
      const confirmed=M.attendanceCount(form),wait=M.waitlistCount(form),absent=rs.filter(r=>M.attendanceOf(r)==='absent').length;
      rows.push(spanRow(' [접수 상태 요약]',7,5,25));
      rows.push({ht:24,cells:['구분','상태 설명','인원(명)','비율(%)','비율 그래프'].map(h=>({v:h,s:4}))});
      for(const [k,desc,cnt] of [['참석 확정','정원 내 참석 접수 인원',confirmed],['대기 접수','정원 초과 대기 인원',wait],['미참석','불참 응답 인원',absent]]){
        const rate=rs.length?Math.round(100*cnt/rs.length):0;
        rows.push({ht:22,cells:[{v:k,s:5},{v:desc,s:6},{v:cnt+'명',s:5},{v:rate+'%',s:5},barCell(rate)]});
      }
      rows.push(blankRow(5));
    }
    form.questions.forEach((q,qi)=>{
      const reached=rs.filter(r=>r.path.includes(q.id));
      const answered=reached.filter(r=>r.answers[q.id]!==''&&r.answers[q.id]!==undefined&&(!Array.isArray(r.answers[q.id])||r.answers[q.id].length));
      rows.push(spanRow(` 문항 ${qi+1}. ${q.title||('질문 '+(qi+1))}   [${qTypeLabel(q.type)} · 응답 ${answered.length}명]`,7,5,26));
      if(['single','multi','rating'].includes(q.type)){
        rows.push({ht:24,cells:['보기 번호','선택지 (보기 내용)','응답 인원','응답 비율','비율 그래프'].map(h=>({v:h,s:4}))});
        const opts=q.type==='rating'?[1,2,3,4,5].map(v=>({id:String(v),label:v+'점'})):q.options;
        opts.forEach((o,oi)=>{
          const count=answered.filter(r=>Array.isArray(r.answers[q.id])?r.answers[q.id].includes(o.id):String(r.answers[q.id])===o.id).length;
          const rate=reached.length?Math.round(100*count/reached.length):0;
          rows.push({ht:22,cells:[{v:`보기 ${oi+1}`,s:5},{v:o.label||('선택지 '+(oi+1)),s:6},{v:`${count}명`,s:5},{v:`${rate}%`,s:5},barCell(rate)]});
        });
      }else{
        rows.push({ht:24,merges:[[1,3]],cells:[{v:'연번',s:4},{v:'제출된 주관식 답변 내용',s:4},{v:'',s:4,skipWidth:true},{v:'',s:4,skipWidth:true},{v:'제출일시',s:4}]});
        if(answered.length){
          answered.forEach((r,ai)=>{
            rows.push({ht:22,merges:[[1,3]],cells:[{v:String(ai+1),s:5},{v:String(r.answers[q.id]??''),s:6,skipWidth:true},{v:'',s:6,skipWidth:true},{v:'',s:6,skipWidth:true},{v:formatKstDateTime(r.at),s:5}]});
          });
        }else{
          rows.push({ht:22,merges:[[0,4]],cells:[{v:'제출된 주관식 답변이 없습니다.',s:5,skipWidth:true},{v:'',s:5},{v:'',s:5},{v:'',s:5},{v:'',s:5}]});
        }
      }
      rows.push(blankRow(5));
    });
    return {name:kind==='survey'?'문항별 통계 요약':'접수 및 문항 요약',minWidths:[13,30,13,13,24],rows};
  }
  function buildDetailSheet(rs,printedAt){
    const headers=kind==='survey'
      ?['연번','참여자','제출일시',...form.questions.map((q,i)=>`문항 ${i+1}. ${q.title||('질문 '+(i+1))}`),'개인정보 동의']
      :['연번','접수 상태','성명','연락처','회원번호',...form.questions.map((q,i)=>`문항 ${i+1}. ${q.title||('질문 '+(i+1))}`),'신청일시','개인정보 동의'];
    const cols=headers.length;
    const spanRow=(text,style,ht=32)=>({ht,skipWidth:true,merges:[[0,cols-1]],cells:Array.from({length:cols},(_,i)=>({v:i===0?text:'',s:style,skipWidth:true}))});
    const metaRow=(label,val)=>({ht:22,merges:[[1,cols-1]],cells:[{v:label,s:2},...Array.from({length:cols-1},(_,i)=>({v:i===0?val:'',s:3,skipWidth:true}))]});
    const rows=[
      spanRow(` ${kind==='survey'?'설문조사 참여자별 상세 응답':'행사·교육 신청자 명단'} — ${form.title||noun()}`,1,34),
      metaRow(kind==='survey'?'응답 건수':'신청 인원',`총 ${rs.length}명  |  출력일시: ${printedAt}`),
      {ht:12,skipWidth:true,cells:Array.from({length:cols},()=>({v:'',s:0}))},
      {ht:25,cells:headers.map(h=>({v:h,s:4}))},
      ...rs.map((r,idx)=>{
        const qCells=form.questions.map(q=>({v:r.path.includes(q.id)?answerText(q,r.answers[q.id]):'- (건너뜀)',s:6}));
        return {
          ht:22,
          cells:kind==='survey'
            ?[{v:String(idx+1),s:5},{v:`참여자 ${idx+1}`,s:5},{v:formatKstDateTime(r.at),s:5},...qCells,{v:shortConsentText(r),s:5}]
            :[{v:String(idx+1),s:5},{v:M.enrollmentLabel(r),s:5},{v:r.memberName||'-',s:5},{v:r.memberPhone||'-',s:5},{v:r.memberId||'-',s:5},...qCells,{v:formatKstDateTime(r.at),s:5},{v:shortConsentText(r),s:5}]
        };
      })
    ];
    return {name:kind==='survey'?'참여자별 상세 응답':'신청자 명단',minWidths:kind==='survey'?[9,14,22]:[9,13,14,18,16],rows};
  }
  function excelDownload(){
    const rs=responses(),now=new Date(),printedAt=formatKstDateTime(now.toISOString());
    const ymd=`${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
    const safeTitle=String(form.title||noun()).replace(/[\\/:*?"<>|]/g,'_').trim().slice(0,40)||noun();
    const summarySheet=buildSummarySheet(rs,printedAt),detailSheet=buildDetailSheet(rs,printedAt);
    const sheets=kind==='survey'?[summarySheet,detailSheet]:[detailSheet,summarySheet];
    const suffix=kind==='survey'?'설문결과':'신청자명단';
    download(`${safeTitle}_${suffix}_${ymd}.xlsx`,buildXlsxWorkbookBlob(sheets));
  }
  function reveal(id){root.querySelector(`[data-card="${id}"]`)?.scrollIntoView({block:'center'});}
  root.addEventListener('toggle',e=>{if(e.target.dataset.branch){if(e.target.open)openBranches.add(e.target.dataset.branch);else openBranches.delete(e.target.dataset.branch);}},true);
  root.addEventListener('input',e=>{const el=e.target;if(el.dataset.form){form[el.dataset.form]=el.value;mark();}if(el.dataset.setting){form.settings[el.dataset.setting]=el.type==='checkbox'?el.checked:el.type==='number'?Number(el.value):el.value;if(el.dataset.setting==='start'&&form.settings.endMode==='auto')form.settings.end=M.autoEnd(el.value);mark();}if(el.dataset.consent){form.consent[el.dataset.consent]=el.type==='checkbox'?el.checked:el.value;mark();}if(el.dataset.q&&!locked()){const q=form.questions.find(q=>q.id===el.dataset.id);q[el.dataset.q]=el.type==='checkbox'?el.checked:el.value;if(el.dataset.q==='title'){const item=root.querySelector('.ps-outline-item [data-id="'+q.id+'"]');if(item)item.textContent=(form.questions.indexOf(q)+1)+'. '+(q.title||'제목 없는 질문');}mark();}if(el.dataset.optionLabel&&!locked()){form.questions.find(q=>q.id===el.dataset.qid).options.find(o=>o.id===el.dataset.optionLabel).label=el.value;mark();}});
  root.addEventListener('change',e=>{const el=e.target;if(el.hasAttribute('data-end-manual')){form.settings.endMode=el.checked?'manual':'auto';form.settings.end=M.autoEnd(form.settings.start);mark();render();return;}if(el.dataset.setting==='start'){if(form.settings.endMode==='auto')form.settings.end=M.autoEnd(form.settings.start);render();return;}if(el.dataset.route&&!locked()){form.questions.find(q=>q.id===el.dataset.qid).options.find(o=>o.id===el.dataset.route).to=el.value;mark();render();}else if(el.dataset.q==='type'){const q=form.questions.find(q=>q.id===el.dataset.id);if(!q.options.length&&['single','multi'].includes(q.type))q.options=newQuestion(q.type).options;if(q.type!=='single')q.options.forEach(o=>delete o.to);render();}else if(el.dataset.consent==='included'||['capacityEnabled','waitlistEnabled'].includes(el.dataset.setting)||['required','next'].includes(el.dataset.q)||el.dataset.setting==='scheduleMode')render();});
  function search(){const from=root.querySelector('[data-query-from]').value,to=root.querySelector('[data-query-to]').value;if(from&&to&&from>to){toast('조회 종료일을 시작일 이후로 지정해 주세요.');return;}query=root.querySelector('[data-search]').value;queryFrom=from;queryTo=to;forms=S.load();render();}
  root.addEventListener('keydown',e=>{if(e.target.matches('[data-search],[data-query-from],[data-query-to]')&&e.key==='Enter')search();});
  root.addEventListener('focusin',e=>{const c=e.target.closest('[data-card]');if(c){selected=c.dataset.card;root.querySelectorAll('[data-card]').forEach(x=>x.classList.toggle('selected',x.dataset.card===selected));root.querySelectorAll('.ps-outline-item').forEach(x=>x.classList.toggle('active',x.dataset.dragId===selected));}});
  let dragged=null;
  root.addEventListener('dragstart',e=>{const h=e.target.closest('[data-drag-id]');if(!h||locked()||M.isAttendance(form.questions.find(q=>q.id===h.dataset.dragId))){e.preventDefault();return;}dragged=h.dataset.dragId;e.dataTransfer.setData('text/plain',dragged);});
  root.addEventListener('dragover',e=>{if(dragged&&e.target.closest('[data-card],[data-drag-id]'))e.preventDefault();});
  root.addEventListener('drop',e=>{const t=e.target.closest('[data-card],[data-drag-id]');if(!t||!dragged||locked())return;e.preventDefault();const i=form.questions.findIndex(q=>q.id===dragged),j=form.questions.findIndex(q=>q.id===(t.dataset.card||t.dataset.dragId));if(i>=0&&j>=0&&!M.isAttendance(form.questions[j])){const [q]=form.questions.splice(i,1);form.questions.splice(j,0,q);selected=q.id;mark();render();}dragged=null;});
  root.addEventListener('dragend',()=>dragged=null);
  document.addEventListener('click',async e=>{
    const b=e.target.closest('[data-action]');if(!b||!root.contains(b)&&!dialog.contains(b))return;const a=b.dataset.action,id=b.dataset.id;
    if(a==='close-dialog'){dialog.close();return;}
    if(a==='save-navigate'){dialog.close();saveThen(()=>{const fn=pendingNavigation;pendingNavigation=null;fn?.();});return;}
    if(a==='discard-navigate'){dirty=false;dialog.close();const fn=pendingNavigation;pendingNavigation=null;fn?.();return;}
    if(a==='confirm-major-save'){dialog.close();if(commit()){const fn=pendingSave;pendingSave=null;fn?.();}return;}
    if(a==='section'||a==='help'||a==='list'){navigate(()=>{if(a==='section'){kind=b.dataset.kind;filter='all';query='';}page=a==='help'?'help':'list';forms=S.load();render();window.scrollTo(0,0);});return;}
    if(a==='search'){search();return;}
    if(a==='reset-search'){query='';queryFrom='';queryTo='';forms=S.load();render();return;}
    if(a==='preview-item'){const target=S.load().find(f=>f.id===id);if(target)preview(target);return;}
    if(a==='delete-item'){pendingDeleteId=id;modal('항목 삭제',`<p>작성중인 항목을 삭제하시겠습니까?</p>${button('삭제하기','confirm-delete','','primary')}`);return;}
    if(a==='filter'){filter=b.dataset.value;render();return;}
    if(a==='new'){navigate(()=>{form=S.newForm(kind);form.title='';form.description='';form.questions=kind==='event'?[M.attendanceQuestion()]:[];if(kind==='event')form.settings.place='';baseline=null;selected=null;editorReturn='list';page='editor';tab='write';dirty=true;render();window.scrollTo(0,0);});return;}
    if(a==='open'){open(id,!forms.find(f=>f.id===id).publishedAt);return;}
    if(a==='edit'){open(form.id,true,'basic','detail');return;}
    if(a==='editor-back'){navigate(()=>{if(editorReturn==='detail')open(form.id);else{page='list';forms=S.load();render();window.scrollTo(0,0);}});return;}
    if(a==='save'){saveThen(()=>{page='detail';tab='basic';render();window.scrollTo(0,0);toast('저장했습니다.');});return;}
    if(a==='publish'){publish();return;}
    if(a==='detail-tab'){tab=b.dataset.tab;render();return;}
    if(a==='preview'){preview();return;}
    if(a==='flow'){tab='flow';render();return;}
    if(a==='tab'){tab='write';render();return;}
    if(a==='select'){selected=id;tab='write';render();reveal(id);return;}
    if(['scroll-settings','scroll-consent','scroll-completion'].includes(a)){root.querySelector(a==='scroll-settings'?'#ps-inline-settings':a==='scroll-consent'?'#ps-consent-editor':'#ps-completion-editor').scrollIntoView({block:'center'});return;}
    if(a==='copy-link'){try{await navigator.clipboard.writeText(link());toast('참여 링크를 복사했습니다.');}catch(e){root.querySelector('[data-link]').select();toast('링크를 선택했습니다. Ctrl+C로 복사해 주세요.');}return;}
    if(a==='result-tab'){resultTab=b.dataset.value;render();return;}
    if(a==='download'){excelDownload();return;}
    if(a==='response'){const r=responses().find(r=>r.id===id);modal('개별 답변',`<p>개인정보 동의: ${esc(consentText(r))}</p>`+form.questions.map(q=>`<div class="ps-note"><strong>${esc(q.title)}</strong><br>${esc(r.path.includes(q.id)?answerText(q,r.answers[q.id]):'앞 질문 선택에 따라 건너뜀')}</div>`).join(''));return;}
    if(a==='more'){modal('항목 관리',`<div class="ps-row">${button('복사해서 작성','copy-form')}${form.publishedAt?button(form.isPublic?'비공개 전환':'다시 공개','visibility'):''}${form.publishedAt&&!form.closedAt?button('참여 종료','end'):''}${button('삭제','delete-form',responses().length?'disabled':'')}</div><p class="ps-subtle" style="line-height:1.7">• 답변·신청이 접수된 항목은 통계 보존을 위해 삭제할 수 없습니다.<br>• <strong>[참여 종료]</strong>는 새 참여만 마감하며, <strong>[비공개 전환]</strong>은 화면 노출과 참여를 모두 멈춥니다.</p>`);return;}
    if(a==='copy-form'){const copy=M.clone(form);copy.id=M.uid();copy.revision=1;copy.title+=' (복사)';copy.publishedAt=null;copy.participationToken=null;copy.isPublic=false;copy.closedAt=null;copy.status='draft';copy.responses=[];copy.testResponses=[];forms=S.load();forms.push(copy);if(persist()){dialog.close();open(copy.id,true);}return;}
    if(a==='visibility'){form.isPublic=!form.isPublic;if(commit()){dialog.close();render();}return;}
    if(a==='end'){modal('참여 종료',`<p>새로운 응답·신청을 마감하시겠습니까? 기존 결과와 상세 링크는 유지됩니다.</p>${button('참여 종료','confirm-end','','primary')}`);return;}
    if(a==='confirm-end'){form.closedAt=new Date().toISOString();if(commit()){dialog.close();render();}return;}
    if(a==='delete-form'){if(responses().length)return;pendingDeleteId=form.id;modal('항목 삭제',`<p>응답·신청이 없는 이 항목을 삭제하시겠습니까?</p>${button('삭제하기','confirm-delete','','primary')}`);return;}
    if(a==='confirm-delete'){try{const result=S.remove(pendingDeleteId);if(!result.ok){toast(failText('삭제에 실패했습니다.',{message:result.message},'다시 시도해 주세요.'));return;}pendingDeleteId=null;forms=S.load();dialog.close();page='list';render();}catch(e){toast(failText('삭제에 실패했습니다.',e,'다시 시도해 주세요.'));}return;}
    if(a==='export'){download('peach-forms-v4.json',S.export(forms));return;}
    if(['move','delete-q','confirm-delete-q','duplicate-q','add-option','remove-option'].includes(a)&&M.isAttendance(form.questions.find(q=>q.id===id||q.id===b.dataset.qid)))return;
    if(['add','move','delete-q','confirm-delete-q','duplicate-q','add-option','remove-option'].includes(a)&&locked()){toast('접수된 응답이 있어 질문 구조를 변경할 수 없습니다.');return;}
    if(a==='add'){const q=newQuestion(),i=form.questions.findIndex(x=>x.id===b.dataset.after);if(i<0)form.questions.push(q);else form.questions.splice(i+1,0,q);selected=q.id;mark();render();reveal(q.id);return;}
    if(a==='move'){const i=form.questions.findIndex(q=>q.id===id),j=i+Number(b.dataset.step);if(j<0||j>=form.questions.length||M.isAttendance(form.questions[j]))return;[form.questions[i],form.questions[j]]=[form.questions[j],form.questions[i]];mark();render();return;}
    if(a==='delete-q'){modal('질문 삭제',`<p>질문을 삭제하면 연결된 이동을 다시 설정해야 합니다.</p>${button('질문 삭제','confirm-delete-q',`data-id="${id}"`,'primary')}`);return;}
    if(a==='confirm-delete-q'){form.questions=form.questions.filter(q=>q.id!==id);selected=form.questions[0]?.id;mark();dialog.close();render();return;}
    if(a==='duplicate-q'){const q=M.clone(form.questions.find(q=>q.id===id));q.id=M.uid();q.options.forEach(o=>o.id=M.uid());form.questions.splice(form.questions.findIndex(x=>x.id===id)+1,0,q);selected=q.id;mark();render();return;}
    if(a==='add-option'){form.questions.find(q=>q.id===id).options.push({id:M.uid(),label:'',to:'next'});mark();render();return;}
    if(a==='remove-option'){const q=form.questions.find(q=>q.id===b.dataset.qid);if(q.options.length<=2){toast('선택지를 두 개 이상 유지해 주세요.');return;}q.options=q.options.filter(o=>o.id!==id);mark();render();}
  });
  window.addEventListener('storage',e=>{if(['peach-admin-participation:v1','peach-survey-prototype:v1'].includes(e.key)&&!dirty){forms=S.load();if(form){const stored=forms.find(f=>f.id===form.id);if(stored){form=M.clone(stored);baseline=M.clone(form);}}render();}});
  window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
  // Protect transitions to existing administrator menus without altering their controllers.
  document.addEventListener('click',e=>{const anchor=e.target.closest('a[href]');if(!anchor||!dirty||anchor.target==='_blank'||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||e.defaultPrevented)return;const href=anchor.getAttribute('href');if(!href||href.startsWith('#'))return;e.preventDefault();navigate(()=>{dirty=false;location.href=anchor.href;});});
  const fragment=new URLSearchParams((location.hash||'').replace(/^#/,'')),params=location.protocol==='file:'&&fragment.has('screen')?fragment:new URLSearchParams(location.search),file=location.protocol==='file:'&&fragment.has('screen')?fragment.get('screen'):location.pathname.split('/').pop()||'';
  kind=file.startsWith('events-')?'event':'survey';
  if(file.includes('-drafts'))filter='draft';else if(Object.keys(labels).includes(params.get('filter')))filter=params.get('filter');
  if(/-(create|edit|detail|results|applicants)\.(asp|html)$/.test(file)){
    const stored=forms.find(f=>f.id===params.get('id')&&f.kind===kind);
    if(stored){form=M.clone(stored);baseline=M.clone(form);selected=form.questions[0]?.id;page=/-(create|edit)\.(asp|html)$/.test(file)?'editor':'detail';tab=/-(results|applicants)\.(asp|html)$/.test(file)?'results':params.get('tab')==='flow'?'flow':'write';if(page==='detail'&&tab!=='results')tab='basic';editorReturn='list';render();}
    else if(file.includes('-create')&&!params.get('id')){form=S.newForm(kind);form.title='';form.description='';form.questions=kind==='event'?[M.attendanceQuestion()]:[];baseline=null;page='editor';tab='write';dirty=true;render();}
    else{root.innerHTML='<section class="ps-card ps-empty"><h1>항목을 찾을 수 없습니다.</h1><p>삭제되었거나 잘못된 주소입니다.</p><a class="ps-native-button" href="'+(kind==='event'?'events':'surveys')+'-list.asp">목록으로</a></section>';}
  }else render();
})();

