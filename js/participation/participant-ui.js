(function(global){
  'use strict';
  const M=global.PeachSurveyModel,R=global.PeachSurveyRuntime,S=global.PeachSurveyStore;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function consent(form) {
    const c=form.consent;if(!c.included)return '';
    return `<section class="ps-consent-preview"><h3>${esc(c.title)} <span class="ps-tag">필수</span></h3><dl><dt>수집·이용 목적</dt><dd>${esc(c.purpose||'미입력 · 공개 전 입력 필요')}</dd><dt>수집 항목</dt><dd>${esc(c.items||'미입력 · 공개 전 입력 필요')}</dd><dt>보유·이용기간</dt><dd>${esc(c.retention||'미입력 · 공개 전 입력 필요')}</dd></dl><p class="ps-subtle">동의를 거부할 수 있으며, 거부 시 제출할 수 없습니다.</p><label class="ps-answer"><input type="checkbox" data-run-consent>개인정보 수집·이용에 동의합니다.</label></section>`;
  }
  function mount(host,{form,mode='preview',actor=null,channel='app',onExit=()=>{},onDone=()=>{},embedded=false}) {
    let session=R.create(form,mode),stage=mode==='preview'?'intro':form.questions.length?'question':form.consent.included?'consent':'intro',busy=false,error='',recovery=false,enrollment=null;
    const finalText=form.kind==='survey'?'제출하기':'신청하기';
    const btn=(text,action,primary=false)=>`<button type="button" class="${primary?'primary':''}" data-run-action="${action}">${text}</button>`;
    function footer(){const last=!R.destination(session);return `<p class="ps-errors" data-run-error ${error?'':'hidden'} role="alert">${esc(error)}</p>${recovery?btn('상세로 돌아가기','recover'):''}<div class="ps-row">${stage==='question'&&(session.history.length||mode==='preview')?btn('이전','back'):''}${btn(last&&!form.consent.included?finalText:'다음','next',true)}</div>`;}
    function render(){
      const q=form.questions.find(q=>q.id===session.id),a=session.answers[session.id];
      let body='';
      if(stage==='intro')body=`${mode==='preview'?`<h2>${esc(form.title)}</h2><p style="white-space:pre-wrap">${esc(form.description)}</p>${form.kind==='event'?`<div class="ps-note">${esc(form.settings.eventType||'행사')} · ${esc(M.scheduleText(form))}<br>${esc(form.settings.place)}${form.settings.capacityEnabled?' · 정원 '+form.settings.capacity+'명':''}</div>`:''}<p class="ps-note">관리자 미리보기 화면입니다. 여기서 테스트로 입력·제출한 내용은 실제 결과나 정원에 반영되지 않습니다.</p>`:''}${form.questions.length?btn(form.kind==='survey'?'응답 시작':'신청 시작','begin',true):`<div data-run-footer>${footer()}</div>`}`;
      if(stage==='question')body=`<span class="ps-subtle">${session.history.length+1}번째 질문</span><h2>${esc(q.title)}${q.required?' <span class="ps-required">*</span>':''}</h2>${q.description?`<p>${esc(q.description)}</p>`:''}${form.kind==='event'&&M.isAttendance(q)&&form.settings.capacityEnabled&&form.settings.waitlistEnabled?'<p class="ps-note" role="status">참석 선택 시 접수 시점에 따라 대기로 접수될 수 있습니다. 미참석은 대기로 접수되지 않습니다.</p>':''}${['single','multi'].includes(q.type)?q.options.map(o=>`<label class="ps-answer"><input type="${q.type==='single'?'radio':'checkbox'}" name="run-answer" value="${o.id}" ${Array.isArray(a)?a.includes(o.id)?'checked':'':a===o.id?'checked':''}> ${esc(o.label)}</label>`).join(''):q.type==='rating'?[1,2,3,4,5].map(n=>`<label class="ps-answer"><input type="radio" name="run-answer" value="${n}" ${String(a)===String(n)?'checked':''}>${'★'.repeat(n)}</label>`).join(''):`${q.type==='long'?`<textarea aria-label="답변" data-run-text placeholder="답변을 입력해 주세요">${esc(a||'')}</textarea>`:`<input type="text" aria-label="답변" data-run-text placeholder="답변을 입력해 주세요" value="${esc(a||'')}">`}`}<div data-run-footer>${footer()}</div>`;
      if(stage==='consent')body=`${consent(form)}<p class="ps-errors" data-run-error ${error?'':'hidden'} role="alert">${esc(error)}</p>${recovery?btn('상세로 돌아가기','recover'):''}<div class="ps-row">${session.id?btn('이전 질문','back'):''}${btn(finalText,'next',true)}</div>`;
      if(stage==='done')body=`<h2>${mode==='preview'?'미리보기 테스트가 완료되었습니다.':form.kind==='survey'?'응답이 완료되었습니다.':enrollment==='waitlist'?'대기 신청이 접수되었습니다.':enrollment==='absent'?'미참석 응답이 접수되었습니다.':'참석 신청이 완료되었습니다.'}</h2>${enrollment==='waitlist'?'<p class="ps-note">정원이 마감되어 대기로 접수되었습니다. 참석 확정 상태가 아닙니다.</p>':''}<p>${esc(form.settings.completion)}</p>${mode==='preview'?'<div class="ps-note">미리보기 테스트이므로 실제 결과에는 저장되지 않았습니다.</div>':''}<div class="ps-row">${mode==='preview'?btn('처음부터 다시 테스트','restart'):''}${btn(mode==='preview'?'미리보기 닫기':form.kind==='survey'?'설문 목록으로':'내 참여내역 보기','exit',true)}</div>`;
      host.innerHTML=`<div class="ps-runner"><div class="ps-row ps-runner-header"><span class="ps-tag">${mode==='preview'?'미리보기 · 전체 '+form.questions.length+'문항':'참여하기'}</span>${stage!=='done'&&!embedded?btn(mode==='preview'?'닫기':'상세로','exit'):''}</div>${body}</div>`;
    }
    function read(){const q=form.questions.find(q=>q.id===session.id);if(!q)return undefined;if(['single','rating'].includes(q.type))return host.querySelector('[name="run-answer"]:checked')?.value||'';if(q.type==='multi')return [...host.querySelectorAll('[name="run-answer"]:checked')].map(el=>el.value);return host.querySelector('[data-run-text]').value.trim();}
    function showError(){const el=host.querySelector('[data-run-error]');if(el){el.textContent=error;el.hidden=!error;}}
    host.oninput=e=>{if(e.target.matches('[data-run-text]'))R.answer(session,read());};
    host.onchange=e=>{if(e.target.name==='run-answer'){R.answer(session,read());host.querySelector('[data-run-footer]').innerHTML=footer();}};
    host.onclick=e=>{
      const action=e.target.closest('[data-run-action]')?.dataset.runAction;if(!action)return;
      if(action==='recover'){onExit(false);return;}
      if(action==='exit'){onExit(stage==='done');return;}
      if(action==='restart'){session=R.create(form,mode);stage='intro';error='';busy=false;enrollment=null;render();return;}
      if(action==='begin'){stage='question';render();return;}
      if(action==='back'){error='';if(stage==='consent'){stage=session.id?'question':'intro';render();return;}if(!session.history.length){if(mode==='preview')stage='intro';else{onExit(false);return;}}else session.id=session.history.pop();render();return;}
      if(action==='next'){
        if(busy||session.done)return;
        if(stage==='consent'){
          if(!M.consentAllowsSubmit(form,host.querySelector('[data-run-consent]')?.checked===true)){error='개인정보 수집·이용 동의를 확인해 주세요.';showError();return;}
        }else{
          if(session.id)R.answer(session,read());
          error=R.error(session,true);if(error){showError();return;}
          if(R.destination(session)){R.advance(session);error='';render();return;}
          if(form.consent.included){stage='consent';error='';render();return;}
        }
        busy=true;
        try{
          const result=S.submit(form.id,R.payload(session,actor),{mode,actor,channel});
          if(!result.ok){busy=false;error=result.message;recovery=/문서가 변경|질문 구조|동의 안내가 변경/.test(error);if(recovery)render();else showError();return;}
          enrollment=result.response?.enrollment||null;session.done=true;stage='done';render();onDone(result);
        }catch(e){busy=false;const msg=String(e?.message||'').trim();error=msg?`저장에 실패했습니다. (${msg})`:'저장에 실패했습니다. 같은 요청으로 다시 제출할 수 있습니다.';showError();}
      }
    };
    render();return {session:()=>session};
  }
  global.PeachParticipantUI={mount,consent};
})(window);
