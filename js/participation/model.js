(function (global) {
  'use strict';
  const clone = value => JSON.parse(JSON.stringify(value));
  const uid = () => 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,8);
  const consentDefaults = () => ({included:true,title:'개인정보 수집·이용 동의',purpose:'설문조사 및 행사·교육 참여 접수, 운영 안내와 결과 분석',items:'성명, 연락처, 설문 응답 및 신청 내용',retention:'수집·이용 목적 달성 후 지체 없이 파기'});
  function prepare(form) { form.revision=Number.isInteger(form.revision)&&form.revision>0?form.revision:1; form.settings=Object.assign({endMode:'manual',capacityEnabled:false,eventType:'교육'},form.settings);if(form.settings.endMode==='auto')form.settings.end=autoEnd(form.settings.start);form.publishedAt=form.publishedAt||((form.status&&form.status!=='draft')?form.updated:null);if(form.isPublic===undefined)form.isPublic=!!form.publishedAt;form.closedAt=form.closedAt||(form.status==='closed'?form.updated:null);if(form.publishedAt&&!form.participationToken)form.participationToken=uid();form.testResponses=form.testResponses||[];const legacy=(form.responses||[]).filter(r=>r.source!=='participation');form.testResponses.push(...legacy.map(r=>({...r,source:r.demo?'legacy-demo':'legacy-preview'})));form.responses=(form.responses||[]).filter(r=>r.source==='participation');form.consent=Object.assign(consentDefaults(),form.consent||{});if(!form.consentDefaultsVersion){for(const k of ['purpose','items','retention'])if(!form.consent[k]?.trim())form.consent[k]=consentDefaults()[k];form.consentDefaultsVersion=1;}form.questions.forEach(q=>{if(q.title==='새 질문을 입력해 주세요.'){q.title='';q.options.forEach(o=>{if(/^선택지 [12]$|^새 선택지$/.test(o.label))o.label='';});}});return form; }
  const ATTENDANCE_ID='__event_attendance';
  const isAttendance=q=>q?.system==='attendance';
  function attendanceQuestion(){return {id:ATTENDANCE_ID,system:'attendance',title:'참석 여부',type:'single',required:true,description:'참석 또는 미참석을 선택해 주세요.',options:[{id:'attend',label:'참석',to:'next'},{id:'absent',label:'미참석',to:'next'}],next:'next'};}
  function prepareEvent(form){if(form.kind!=='event')return form;form.settings.scheduleMode=form.settings.scheduleMode||'single';form.settings.eventEnd=form.settings.eventEnd||'';form.settings.waitlistEnabled=!!form.settings.waitlistEnabled;form.questions=[attendanceQuestion(),...form.questions.filter(q=>!isAttendance(q)&&q.id!==ATTENDANCE_ID)];return form;}
  function attendanceOf(response){return response.answers?.[ATTENDANCE_ID]||'legacy';}
  function attendanceCount(form){return form.responses.filter(r=>attendanceOf(r)!=='absent'&&r.enrollment!=='waitlist').length;}
  function waitlistCount(form){return form.responses.filter(r=>r.enrollment==='waitlist').length;}
  function enrollmentLabel(response){return response.enrollment==='waitlist'?'대기':attendanceOf(response)==='absent'?'미참석':attendanceOf(response)==='attend'?'참석 확정':'기존 기록 · 미확인';}
  function scheduleText(form){const s=form.settings;return (s.date||'').replace('T',' ')+(s.scheduleMode==='period'?' ~ '+(s.eventEnd||'').replace('T',' '):'');}
  const consentAllowsSubmit = (form, agreed) => !form.consent?.included || agreed === true;
  function seed(kind = 'survey') {
    return {id:uid(),kind,title:kind === 'survey' ? '2026 복숭아 재배교육 수요조사' : '겨울철 복숭아 재배교육 참여 신청',description:'더 나은 교육을 준비할 수 있도록 여러분의 의견을 들려주세요.',status:'draft',updated:new Date().toISOString(),settings:{endMode:'auto',start:'2026-10-27T09:00',end:'2026-11-30T18:00',completion:'참여해 주셔서 감사합니다.',date:'2026-12-10T14:00',place:'복숭아자조금 교육장',capacity:30},questions:[{id:'q1',title:'주로 재배하는 복숭아 품종을 알려주세요.',type:'short',required:true,options:[],next:'next'},{id:'q2',title:'복숭아 재배교육에 참여한 경험이 있습니까?',type:'single',required:true,options:[{id:'yes',label:'Y · 참여한 적 있어요',to:'q2a'},{id:'no',label:'N · 처음이에요',to:'q3'}],next:'next'},{id:'q2a',title:'어떤 교육에 참여하셨나요?',type:'long',required:true,options:[],next:'q3'},{id:'q3',title:'앞으로 받고 싶은 교육을 선택해 주세요.',type:'multi',required:true,options:[{id:'a',label:'전정 및 수형 관리'},{id:'b',label:'병해충 방제'},{id:'c',label:'수확 및 품질 관리'}],next:'next'}],responses:[]};
  }
  function next(form,q,answer) {
    const option = q.type === 'single' ? q.options.find(o=>o.id === answer) : null;
    const destination = option?.to || q.next || 'next';
    if(destination === 'submit') return null;
    if(destination !== 'next') return destination;
    return form.questions[form.questions.findIndex(x=>x.id===q.id)+1]?.id || null;
  }
  function trace(form,answers) {
    const path=[]; let id=form.questions[0]?.id;
    while(id && path.length <= form.questions.length) {
      if(path.includes(id)) throw new Error('질문 이동이 순환합니다.');
      const q=form.questions.find(x=>x.id===id); if(!q) throw new Error('이동할 질문을 찾을 수 없습니다.');
      path.push(id); if(!(id in answers)) break; id=next(form,q,answers[id]);
    }
    return path;
  }
  function validate(form, {publish=false} = {}) {
    const errors=[]; if(!form.title.trim())errors.push('제목을 입력해 주세요.');
    if(publish && form.consent?.included && ['purpose','items','retention'].some(k=>!form.consent[k]?.trim())) errors.push('개인정보 동의의 수집·이용 목적, 수집 항목, 보유·이용기간을 입력해 주세요.');
    if(form.kind==='survey'&&!form.questions.length)errors.push('질문을 한 개 이상 추가해 주세요.');
    if(!form.settings.start || !form.settings.end || form.settings.start>=form.settings.end)errors.push('시작일과 종료일을 확인해 주세요.');
    if(form.kind==='event'&&(!form.settings.date||!form.settings.place.trim()||(form.settings.capacityEnabled&&(!Number.isInteger(Number(form.settings.capacity))||Number(form.settings.capacity)<1))))errors.push('행사 일시·장소·정원을 확인해 주세요.');
    if(form.kind==='event'&&form.settings.scheduleMode==='period'&&(!form.settings.eventEnd||form.settings.eventEnd<=form.settings.date))errors.push('행사 종료일시는 시작일시보다 뒤로 지정해 주세요.');
    if(form.kind==='event'&&(!isAttendance(form.questions[0])||form.questions[0].id!==ATTENDANCE_ID))errors.push('고정 참석 여부 문항이 필요합니다.');
    const maxEnd=autoEnd(form.settings.start);if(form.settings.end&&maxEnd&&new Date(form.settings.end)>new Date(maxEnd))errors.push('참여기간은 시작일로부터 최대 1년입니다.');
    form.questions.forEach((q,i)=>{
      if(!q.title.trim())errors.push(`질문 ${i+1}의 제목이 비어 있습니다.`);
      if(['single','multi'].includes(q.type)&&(q.options.length<2||q.options.some(o=>!o.label.trim())))errors.push(`질문 ${i+1}의 선택지를 두 개 이상 입력해 주세요.`);
      const targets=q.type==='single'?q.options.map(o=>o.to||q.next):[q.next];
      targets.forEach(t=>{if(t&&t!=='next'&&t!=='submit'&&form.questions.findIndex(x=>x.id===t)<=i)errors.push(`질문 ${i+1}: 다음으로 이동할 질문은 현재 질문보다 아래쪽에 있는 질문으로 선택해 주세요.`);});
    });
    const reached=new Set();
    function walk(i){if(i<0||i>=form.questions.length||reached.has(i))return;reached.add(i);const q=form.questions[i];const targets=q.type==='single'?q.options.map(o=>o.to||q.next):[q.next];targets.forEach(t=>{if(t==='submit')return;walk(!t||t==='next'?i+1:form.questions.findIndex(x=>x.id===t));});}
    walk(0);form.questions.forEach((q,i)=>{if(!reached.has(i))errors.push(`질문 ${i+1}번으로 이어지는 경로가 없습니다. 앞 질문의 답변별 이동 설정을 확인해 주세요.`);});
    return [...new Set(errors)];
  }
  function autoEnd(start){
    const m=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(start||'');if(!m)return '';
    const year=Number(m[1])+1,month=Number(m[2]),day=Math.min(Number(m[3]),new Date(year,month,0).getDate());
    return `${year}-${m[2]}-${String(day).padStart(2,'0')}T${m[4]}:${m[5]}`;
  }
  function effectiveEnd(form){return form.settings.endMode==='auto'?autoEnd(form.settings.start):form.settings.end;}
  function status(form,now=new Date()) {
    if(!form.publishedAt)return 'draft';
    if(form.closedAt || new Date(effectiveEnd(form)).getTime()<=new Date(now).getTime())return 'closed';
    if(new Date(form.settings.start).getTime()>new Date(now).getTime())return 'scheduled';
    if(form.kind==='event'&&form.settings.capacityEnabled&&attendanceCount(form)>=Number(form.settings.capacity))return form.settings.waitlistEnabled?'waitlist':'capacity';
    return 'live';
  }
  function gate(form,{now=new Date(),channel='app',actor=null}={}) {
    const fail=(code,message)=>({allowed:false,code,message});
    if(!form.publishedAt)return fail('draft','아직 공개되지 않았습니다.');
    if(!form.isPublic)return fail('hidden','비공개로 전환된 항목입니다.');
    if(status(form,now)==='closed')return fail('closed','참여가 종료되었습니다.');
    if(status(form,now)==='scheduled')return fail('scheduled','참여 시작 전입니다.');
    if(form.kind==='event'&&!actor)return fail('login','회원 확인 후 행사·교육에 참여할 수 있습니다.');
    if(form.kind==='event'&&form.responses.some(r=>r.memberId===actor?.id))return fail('duplicate','이미 참여한 항목입니다.');
    if(form.kind==='survey'&&actor?.id&&form.responses.some(r=>r.respondentId===actor.id))return fail('duplicate','이미 참여한 설문입니다.');
    if(form.kind==='event'&&form.settings.capacityEnabled&&attendanceCount(form)>=Number(form.settings.capacity)&&!form.settings.waitlistEnabled)return fail('capacity','신청 접수가 마감되었습니다.');
    return {allowed:true,code:'open',message:'참여할 수 있습니다.'};
  }
  function validateResponse(form,response) {
    let path;
    try{path=trace(form,response.answers||{});}catch(e){return '질문 구조가 변경되었습니다. 상세에서 다시 시작해 주세요.';}
    if(JSON.stringify(path)!==JSON.stringify(response.path))return '질문 이동 경로가 일치하지 않습니다.';
    for(const id of path){
      const q=form.questions.find(q=>q.id===id),v=response.answers[id];
      if(q.required&&(v===undefined||v===''||typeof v==='string'&&!v.trim()||Array.isArray(v)&&!v.length))return '필수 답변이 누락되었습니다.';
      if(v!==undefined&&v!==''&&q.type==='single'&&!q.options.some(o=>o.id===v))return '선택지를 확인해 주세요.';
      if(v!==undefined&&v!==''&&['short','long'].includes(q.type)&&typeof v!=='string')return '답변 형식을 확인해 주세요.';
      if(v!==undefined&&v!==''&&q.type==='rating'&&(!['string','number'].includes(typeof v)||!Number.isInteger(Number(v))||Number(v)<1||Number(v)>5))return '평점은 1점부터 5점까지 선택해 주세요.';
      if(q.type==='multi'&&v!==undefined&&(!Array.isArray(v)||new Set(v).size!==v.length||v.some(id=>!q.options.some(o=>o.id===id))))return '선택지를 확인해 주세요.';
    }
    const last=path[path.length-1];
    if(last&&next(form,form.questions.find(q=>q.id===last),response.answers[last]))return '아직 답변할 질문이 남아 있습니다.';
    return '';
  }
  function matchesPeriod(form,from='',to=''){const start=(form.settings.start||'').slice(0,10),end=(effectiveEnd(form)||'').slice(0,10);return (!from&&!to)||!!start&&!!end&&(!to||start<=to)&&(!from||end>=from);}
  function structureLocked(form){return form.responses.some(r=>r.source==='participation');}
  function majorEventChange(before,after){return before?.kind==='event'&&before.responses.length>0&&['date','scheduleMode','eventEnd','place'].some(k=>before.settings[k]!==after.settings[k]);}
  const rawSeed=seed;
  const prepareBase=prepare;
  global.PeachSurveyModel={clone,uid,seed:kind=>prepareEvent(prepareBase(rawSeed(kind))),next,trace,validate,prepare:form=>prepareEvent(prepareBase(form)),consentDefaults,consentAllowsSubmit,status,gate,structureLocked,majorEventChange,validateResponse,autoEnd,effectiveEnd,isAttendance,attendanceQuestion,attendanceOf,attendanceCount,waitlistCount,enrollmentLabel,scheduleText,matchesPeriod};
})(window);
