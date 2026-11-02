(function(global){
  'use strict';
  const M=global.PeachSurveyModel;
  function create(form,mode='preview') {
    return {form:M.clone(form),mode,id:form.questions[0]?.id||null,answers:{},history:[],submissionId:M.uid(),done:false};
  }
  function answer(session,value) {
    const q=session.form.questions.find(q=>q.id===session.id);
    if(!q)throw new Error('질문을 찾을 수 없습니다.');
    if(JSON.stringify(session.answers[q.id])!==JSON.stringify(value)) {
      session.form.questions.slice(session.form.questions.indexOf(q)+1).forEach(x=>delete session.answers[x.id]);
    }
    session.answers[q.id]=value;
  }
  function destination(session) {
    const q=session.form.questions.find(q=>q.id===session.id);
    return q?M.next(session.form,q,session.answers[q.id]):null;
  }
  function error(session,agreed=false) {
    const q=session.form.questions.find(q=>q.id===session.id),a=session.answers[session.id];
    if(q?.required&&(a===undefined||a===''||Array.isArray(a)&&!a.length))return '답변을 입력하거나 선택해 주세요.';
    if(!destination(session)&&!M.consentAllowsSubmit(session.form,agreed))return '개인정보 수집·이용 동의를 확인해 주세요.';
    return '';
  }
  function advance(session) {
    const next=destination(session);
    if(session.id)session.history.push(session.id);
    session.id=next;
    return next;
  }
  function payload(session,member) {
    const path=[...session.history,...(session.id?[session.id]:[])];
    return {formRevision:session.form.revision,id:session.submissionId,submissionId:session.submissionId,source:'participation',memberId:member?.id,memberName:member?.name,at:new Date().toISOString(),answers:Object.fromEntries(path.map(id=>[id,session.answers[id]])),path,consent:session.form.consent.included?{...M.clone(session.form.consent),agreed:true,at:new Date().toISOString()}:null};
  }
  global.PeachSurveyRuntime={create,answer,destination,error,advance,payload};
})(window);
