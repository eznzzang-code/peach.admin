(function(global){
  'use strict';
  const KEY='peach-admin-participation:v1',M=global.PeachSurveyModel;
  function load(){try{const data=JSON.parse((localStorage.getItem(KEY)||localStorage.getItem('peach-survey-prototype:v1')));if(Array.isArray(data?.forms))return data.forms.map(M.prepare);}catch(e){}return [];}
  function defaults(){try{const d=JSON.parse((localStorage.getItem(KEY)||localStorage.getItem('peach-survey-prototype:v1')));return {...M.consentDefaults(),...(d?.consentDefaults||{})};}catch(e){return M.consentDefaults();}}
  function save(forms,options={}){const remembered=defaults();if(options.consentDefaults)for(const k of ['purpose','items','retention'])remembered[k]=options.consentDefaults[k];localStorage.setItem(KEY,JSON.stringify({version:4,forms,consentDefaults:remembered}));}
  function newForm(kind){const f=M.seed(kind),d=new Date(),pad=n=>String(n).padStart(2,'0');f.settings.start=`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;f.settings.end=M.autoEnd(f.settings.start);if(kind==='event'){f.settings.date='';f.settings.eventEnd='';f.settings.place='';}f.consent={...defaults(),included:true};return f;}
  function remove(id){const forms=load(),f=forms.find(f=>f.id===id);if(!f)return {ok:false,message:'항목을 찾을 수 없습니다.'};if(f.responses.length)return {ok:false,message:'응답·신청이 있어 삭제할 수 없습니다.'};save(forms.filter(f=>f.id!==id));return {ok:true};}
  function visitor(){const key='peach-survey-prototype:visitor';let id=localStorage.getItem(key);if(!id){id=M.uid();localStorage.setItem(key,id);}return {id,name:'비회원 링크 참여'};}
  function submit(formId,response,{mode='preview',channel='app',actor=null,now=new Date()}={}) {
    if(mode==='preview')return {ok:true,preview:true};
    if(mode!=='participation')return {ok:false,message:'잘못된 제출 경로입니다.'};
    const forms=load(),form=forms.find(f=>f.id===formId);
    if(!form)return {ok:false,message:'항목을 찾을 수 없습니다.'};
    const identity=form.kind==='survey'?(actor||visitor()):actor;
    const replay=form.responses.find(r=>r.submissionId===response.submissionId);
    if(replay&&(form.kind==='survey'?replay.respondentId===identity.id:replay.memberId===actor?.id))return {ok:true,response:replay,replayed:true};
    if(response.formRevision!==undefined&&response.formRevision!==form.revision)return {ok:false,message:'문서가 변경되었습니다. 상세에서 다시 시작해 주세요.'};
    const gate=M.gate(form,{now,channel,actor});
    if(!gate.allowed)return {ok:false,message:gate.message};
    const invalid=M.validateResponse(form,response);if(invalid)return {ok:false,message:invalid};
    if(form.consent.included&&['title','purpose','items','retention'].some(k=>response.consent?.[k]!==form.consent[k]))return {ok:false,message:'동의 안내가 변경되었습니다. 상세에서 다시 시작해 주세요.'};
    if(!M.consentAllowsSubmit(form,response.consent?.agreed))return {ok:false,message:'개인정보 동의가 필요합니다.'};
    let enrollment=null;
    if(form.kind==='event')enrollment=M.attendanceOf(response)==='absent'?'absent':form.settings.capacityEnabled&&M.attendanceCount(form)>=Number(form.settings.capacity)?'waitlist':'confirmed';
    const saved={...response,enrollment,source:'participation',memberId:form.kind==='event'?actor.id:null,memberName:form.kind==='event'?actor.name:null,respondentId:form.kind==='survey'?identity.id:null};
    form.responses.push(saved);
    save(forms);return {ok:true,response:saved};
  }
  global.PeachSurveyStore={load,save,submit,newForm,defaults,visitor,remove,export:forms=>JSON.stringify({version:4,forms,consentDefaults:defaults()},null,2)};
})(window);
