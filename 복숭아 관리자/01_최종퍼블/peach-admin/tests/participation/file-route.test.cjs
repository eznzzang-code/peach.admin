const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const target=process.env.PEACH_ADMIN_TEST_ROOT||'C:/Users/user/Desktop/복숭아자조금/peach-admin_261028/peach-admin_261028';
const source=fs.readFileSync(path.join(target,'tests/participation/integration.test.cjs'),'utf8').split('(async()=>{')[0];
const setup=new Function('require','__dirname',source+'\nreturn setup;')(require,path.join(target,'tests/participation'));
const app=process.argv[2]||path.join(target,'js/participation/app.js'),portal=process.argv[3]||path.join(target,'js/participation/portal.js');
function fileHistory(x,alwaysReject=false){x.c.history.replaceState=(_a,_b,u)=>{const next=new URL(u);if(alwaysReject||next.pathname!==x.c.location.pathname||next.search!==x.c.location.search)throw new Error('SecurityError: local document URL rewrite denied');x.c.location=next;};}
function run(x,file){vm.runInContext(fs.readFileSync(file,'utf8'),x.c);}
(async()=>{
 const x=setup('file:///C:/final-admin/events-list.html');fileHistory(x);run(x,app);await x.click('new');assert(x.root.innerHTML.includes('기본문항 · 필수 고정'));assert(x.root.innerHTML.includes('행사·교육 작성'));assert.equal(x.c.location.pathname,'/C:/final-admin/events-list.html');assert.equal(new URLSearchParams(x.c.location.hash.slice(1)).get('screen'),'events-create.html');
 await x.click('save');assert(x.root.innerHTML.includes('미공개'));const saved=x.c.PeachSurveyStore.load();assert.equal(saved.length,1);assert.equal(saved[0].kind,'event');assert.equal(new URLSearchParams(x.c.location.hash.slice(1)).get('screen'),'events-detail.html');const reload=setup(x.c.location.href,saved);fileHistory(reload);run(reload,app);assert.equal(new URLSearchParams(reload.c.location.hash.slice(1)).get('id'),saved[0].id);assert(reload.root.innerHTML.includes('신청 수'));
 await x.click('edit');assert(x.root.innerHTML.includes('기본문항 · 필수 고정'));await x.click('flow');assert(x.root.innerHTML.includes('<svg'));
 const deny=setup('file:///C:/final-admin/events-list.html');fileHistory(deny,true);run(deny,app);await deny.click('new');assert(deny.root.innerHTML.includes('기본문항 · 필수 고정'),'even blocked fragment history must not stop rendering');
 const survey=setup('file:///C:/final-admin/surveys-list.html');fileHistory(survey);run(survey,app);await survey.click('new');assert(survey.root.innerHTML.includes('설문 작성'));
 const p=setup('file:///C:/final-admin/participant.html?participate=token');fileHistory(p);run(p,portal);p.rootHandlers.click({target:{closest:()=>({dataset:{portalAction:'list',kind:'event'}})}});assert.equal(new URLSearchParams(p.c.location.hash.slice(1)).get('kind'),'event');assert(p.root.innerHTML.includes('공개된 항목이 없습니다'));
 console.log('PASS: file document event/survey creation, draft save/reload/edit/flow, fragment-only routes, completely denied history fallback, participant navigation.');
})().catch(e=>{console.error(e);process.exitCode=1});
