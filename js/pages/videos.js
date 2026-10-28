/* 교육영상은 유튜브 채널에서 수집한 영상을 홈페이지·앱용으로 가공합니다.
   채널 배지는 공개 위치입니다. 지금 홈에 노출 중인 영상만 목록 위에 두고 배경색으로 구분합니다.
   App 홈은 대표 영상 한 개이며, 비공개·기간 종료 시 자동으로 다른 영상을 올리지 않습니다. */
(function () {
  'use strict';
  var videos=[],current,attachment,dirty=false;
  var q=function(s,r){return (r||document).querySelector(s);};
  var value=function(id){var el=document.getElementById(id);return el?el.value:'';};
  var checked=function(id){return !!document.getElementById(id)?.checked;};
  var escapeText=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
  function today(){return new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'}).replaceAll('-','.');}
  function eligible(item,channel){var homes=item.homeChannels||[],channels=item.channels||[];return homes.indexOf(channel)!==-1&&channels.indexOf(channel)!==-1&&item.visibility==='public'&&item.playable===true&&item.publishStart<=today()&&(item.noEnd||item.publishEnd>=today());}
  function notice(message){q('#video-notice-message').textContent=message;AdminUI.openModal('modal-video-notice');}
  function select(id,v){var input=document.getElementById(id);if(!input)return;input.value=v;var root=input.closest('.select');root?.querySelectorAll('.select__option').forEach(function(o){o.classList.toggle('is-selected',o.dataset.value===v);if(o.dataset.value===v)q('.select__label',root).textContent=o.textContent;});}
  function formValue(){var channels=['Web','App'].filter(function(c){return checked('video-channel-'+c.toLowerCase());});return Object.assign({},current,{key:'video:'+current.id,kind:'video',displayTitle:value('video-display-title').trim(),description:value('video-description'),visibility:value('video-visibility'),category:value('video-category'),publishStart:value('video-publish-start'),publishEnd:value('video-publish-end'),noEnd:checked('video-no-end'),channels:channels,homeChannels:['Web','App'].filter(function(c){return channels.indexOf(c)!==-1&&checked('video-main-'+c.toLowerCase());}),attachment:attachment});}
  function validation(v){if(!v.displayTitle)return '표시 제목을 입력해 주세요.';if(!['재배기술','생육단계'].includes(v.category))return '영상 분류를 선택해 주세요.';if(v.visibility==='public'&&!v.channels.length)return '공개할 채널을 선택해 주세요.';if(v.homeChannels.some(function(c){return !v.channels.includes(c);}))return '홈 선정한 채널의 노출채널도 선택해 주세요. Web과 App은 각각 설정합니다.';if(!/^\d{4}\.\d{2}\.\d{2}$/.test(v.publishStart))return '게시 시작일을 선택해 주세요.';if(!v.noEnd&&!/^\d{4}\.\d{2}\.\d{2}$/.test(v.publishEnd))return '게시 종료일을 선택해 주세요.';if(!v.noEnd&&v.publishEnd<v.publishStart)return '게시 종료일은 시작일과 같거나 이후여야 합니다.';if(v.homeChannels.includes('App')&&(!v.playable||v.visibility!=='public'||!v.channels.includes('App')||v.publishStart>today()||!v.noEnd&&v.publishEnd<today()))return 'App 공개·재생 가능·현재 게시기간인 영상만 대표 영상으로 선정할 수 있습니다. 홈 선정을 해제하거나 공개 조건을 확인해 주세요.';return '';}
  function syncChannelMains(){['web','app'].forEach(function(c){var input=document.getElementById('video-main-'+c);if(input)input.disabled=!checked('video-channel-'+c);});}
  function showAttachment(){var list=q('#video-attachment-list');if(!list)return;list.replaceChildren();if(!attachment||!attachment.name)return;var item=document.createElement('li');item.className='upload-list__item';var icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('class','upload__icon');icon.setAttribute('viewBox','0 0 18 18');icon.setAttribute('aria-hidden','true');icon.innerHTML='<path d="M5 2.5h5.2L13 5.2V15.5H5z" fill="none" stroke="currentColor" stroke-width="1.2"></path><path d="M10 2.5V5.5h3" fill="none" stroke="currentColor" stroke-width="1.2"></path>';var name=document.createElement('span');name.className='upload-list__name';name.textContent=attachment.name;name.title=attachment.name;var remove=document.createElement('button');remove.type='button';remove.className='upload__remove';remove.textContent='제거';remove.addEventListener('click',function(){attachment=null;var input=q('#video-attachment');if(input)input.value='';dirty=true;showAttachment();});item.append(icon,name,remove);list.append(item);}
  async function detail(){
    var id=new URLSearchParams(location.search).get('id');
    try {
      var resGet = await fetch('proc/video_proc.asp?action=get&id=' + encodeURIComponent(id || ''));
      var jsonGet = await resGet.json();
      if (jsonGet && jsonGet.success && jsonGet.item) {
        current = jsonGet.item;
      }
    } catch (e) {}
    if (!current) {
      current=videos.find(function(v){return String(v.id)===id;});
    }
    var form=q('#video-form');if(!current){form.hidden=true;q('#video-missing').hidden=false;return;}attachment=current.attachment||null;
    ['original-id','original-title','duration','playable'].forEach(function(name){var key={'original-id':'originalId','original-title':'originalTitle','duration':'duration'}[name];var el=q('#video-'+name);if(el)el.textContent=name==='playable'?(current.playable?'재생 가능':'재생 불가'):(current[key]||current.youtubeId||'');});
    var thumbnail=q('#video-thumbnail');if(thumbnail&&current.thumbnail)thumbnail.style.backgroundImage='url("'+encodeURI(current.thumbnail)+'")';
    select('video-visibility',current.visibility);select('video-category',current.category||'');
    ['Web','App'].forEach(function(c){q('#video-channel-'+c.toLowerCase()).checked=current.channels.includes(c);q('#video-main-'+c.toLowerCase()).checked=current.homeChannels.includes(c);});
    syncChannelMains();
    q('#video-publish-start').value=current.publishStart;q('#video-publish-end').value=current.publishEnd||'';q('#video-no-end').checked=current.noEnd;
    q('#video-no-end').dispatchEvent(new Event('change',{bubbles:true}));q('#video-display-title').value=current.displayTitle||current.originalTitle;q('#video-description').value=current.description||'';showAttachment();form.hidden=false;
    form.onsubmit=function(e){e.preventDefault();};form.addEventListener('input',function(){dirty=true;});form.addEventListener('change',function(){dirty=true;});
    ['web','app'].forEach(function(c){q('#video-channel-'+c).addEventListener('change',syncChannelMains);});
    q('#video-attachment').onchange=function(){var file=this.files&&this.files[0];if(!file)return;if(!(/\.pdf$/i.test(file.name)||/^image\/(png|jpeg)$/.test(file.type))){this.value='';notice('PDF·PNG·JPG 관련자료를 선택해 주세요.');return;}attachment=file;dirty=true;showAttachment();};
    q('#video-save').onclick=async function(){
      var v=formValue(),error=validation(v);
      if(error){notice(error);return;}
      this.disabled=true;
      try{
        var fd=new FormData();
        fd.append('action','save');
        fd.append('id',String(current.id));
        fd.append('displayTitle',v.displayTitle);
        fd.append('category',v.category);
        fd.append('description',v.description||'');
        fd.append('visibility',v.visibility);
        fd.append('channels',v.channels.join(','));
        fd.append('homeChannels',v.homeChannels.join(','));
        fd.append('publishStart',v.publishStart);
        fd.append('publishEnd',v.publishEnd||'');
        fd.append('noEnd',v.noEnd?'true':'false');
        if(attachment instanceof File){
          fd.append('attachment_file',attachment);
        } else if(attachment&&attachment.name){
          fd.append('attachmentName',attachment.name);
          fd.append('attachmentPath',attachment.path||('/uploads/videos/'+attachment.name));
        } else {
          fd.append('attachmentName','');
          fd.append('attachmentPath','');
        }
        var res=await fetch('proc/video_proc.asp',{method:'POST',body:fd});
        var json=await res.json();
        if(json&&json.success){
          dirty=false;
          location.href='videos-list.asp?saved=1';
        } else {
          notice('저장하지 못했습니다: '+(json?json.message:''));
        }
      }catch(e){
        notice('저장 중 통신 오류가 발생했습니다.');
      }finally{
        this.disabled=false;
      }
    };
    q('#video-preview').onclick=function(){var v=formValue(),error=validation(v);if(error){notice(error);return;}preview(v);};
    q('#video-list').onclick=function(e){if(dirty){e.preventDefault();AdminUI.openModal('modal-video-leave');}};
    var videoDelete=q('#video-delete');if(videoDelete)videoDelete.onclick=function(){AdminUI.openModal('modal-video-delete');};
    var videoDeleteConfirm=q('#video-delete-confirm');
    if(videoDeleteConfirm)videoDeleteConfirm.onclick=async function(){
      videoDeleteConfirm.disabled=true;
      try{
        var fd=new FormData();
        fd.append('action','delete');
        fd.append('id',String(current.id));
        var res=await fetch('proc/video_proc.asp',{method:'POST',body:fd});
        var json=await res.json();
        if(json&&json.success){
          dirty=false;
          location.href='videos-list.asp?deleted=1';
        } else {
          videoDeleteConfirm.disabled=false;
          notice('삭제 실패: '+(json?json.message:''));
        }
      }catch(e){
        videoDeleteConfirm.disabled=false;
        notice('삭제 중 통신 오류가 발생했습니다.');
      }
    };
    q('#video-leave-confirm').onclick=function(){dirty=false;location.href='videos-list.asp';};
    var original=q('#video-original-open');if(original){original.disabled=!current.originalUrl;original.onclick=function(e){e.preventDefault();if(current.originalUrl&&/^https?:\/\//.test(current.originalUrl))window.open(current.originalUrl,'_blank','noopener');};if(!current.originalUrl)original.title='원본 영상 URL 연동 예정';}
    window.addEventListener('beforeunload',function(e){if(dirty){e.preventDefault();e.returnValue='';}});
  }
  function confirmReplacement(previous,next){return new Promise(function(resolve){var d=document.createElement('dialog');d.id='video-replace-confirm';d.className='flow-preview-dialog';d.innerHTML='<header><h2>앱 홈 대표 영상을 교체할까요?</h2></header><div style="padding:24px"><p id="replace-old"></p><p id="replace-new"></p><p>Web 홈 선정과 영상 목록의 최신순 정렬은 바뀌지 않습니다.</p><button class="btn" id="replace-cancel">취소</button> <button class="btn" id="replace-save">교체 후 저장</button></div>';d.querySelector('#replace-old').textContent='현재: '+previous.map(function(v){return v.displayTitle;}).join(', ');d.querySelector('#replace-new').textContent='변경: '+next.displayTitle;var finish=function(ok){d.close();d.remove();resolve(ok);};d.querySelector('#replace-cancel').onclick=function(){finish(false);};d.querySelector('#replace-save').onclick=function(){finish(true);};d.oncancel=function(e){e.preventDefault();finish(false);};document.body.append(d);d.showModal();});}
  function preview(v){var d=q('#video-app-preview');if(!d){d=document.createElement('dialog');d.id='video-app-preview';d.className='flow-preview-dialog';d.innerHTML='<header><h2>App 교육영상 미리보기</h2><button type="button" class="btn">닫기</button></header><div class="flow-phone"><div class="flow-phone__header">‹ 교육영상</div><div class="flow-phone__body"></div></div>';d.querySelector('header button').onclick=function(){d.close();};document.body.append(d);}var body=q('.flow-phone__body',d);body.replaceChildren();if(v.thumbnail){var im=document.createElement('img');im.src=v.thumbnail;im.alt=v.displayTitle;body.append(im);}var title=document.createElement('h3');title.textContent=v.displayTitle;var meta=document.createElement('p');meta.textContent=v.category+' · '+v.duration;var text=document.createElement('p');text.textContent=v.description;body.append(title,meta,text);if(v.attachment){var file=document.createElement(v.attachment instanceof Blob?'a':'p');file.textContent='첨부자료: '+v.attachment.name;if(v.attachment instanceof Blob){var fileUrl=URL.createObjectURL(v.attachment);file.href=fileUrl;file.target='_blank';file.rel='noopener';file.className='btn';d.addEventListener('close',function(){URL.revokeObjectURL(fileUrl);},{once:true});}body.append(file);}var hint=document.createElement('p');hint.className='flow-guide';hint.textContent='App '+(v.channels.includes('App')?'선택':'미선택')+' / App 홈 '+(v.homeChannels.includes('App')?'선정':'미선정')+'. 공개 전 검수용 화면이며 영상 재생은 연동 예정입니다.';body.append(hint);d.showModal();}
  function list(){var page=1,pageSize=10,filtered=videos.slice(),nav=q('[data-pagination]'),tbody=q('#videos-table tbody');
    var info=document.createElement('p');info.className='flow-guide';info.textContent='유튜브 채널에서 불러온 영상을 홈페이지와 앱용으로 가공합니다. 지금 홈에 나오는 영상만 목록 위에 올리고, 채널 배지는 메인이 아니어도 공개된 Web·App을 보여 줍니다. 비공개·기간이 끝난 영상은 홈 표시에서 빠지며 다른 영상으로 자동 교체하지 않습니다.';q('#videos-table').closest('.table-wrap').before(info);
    var listQuery=new URLSearchParams(location.search);if(listQuery.get('saved')==='1'||listQuery.get('deleted')==='1'){var saved=document.createElement('p');saved.className='flow-guide';saved.setAttribute('role','status');saved.textContent=listQuery.get('deleted')==='1'?'교육영상을 삭제했습니다.':'교육영상을 저장했습니다.';info.before(saved);}
    function search(){var f=function(n){return q('.videos-page [name="'+n+'"]').value;};var status=f('collectionStatus'),exposure=f('mainExposure'),category=f('category'),keyword=f('keyword').trim().toLowerCase();filtered=videos.filter(function(v){var exposed=eligible(v,'Web')||eligible(v,'App');var videoCategory=v.category||'미분류';return (!status||v.collectionStatus===status)&&(!exposure||exposure==='노출'&&exposed||exposure==='미노출'&&!exposed)&&(!category||videoCategory===category)&&(!keyword||(v.displayTitle+' '+v.originalTitle).toLowerCase().includes(keyword));});page=1;render();}
    function showingHomes(v){return ['Web','App'].filter(function(c){return eligible(v,c);});}
    function ordered(){return filtered.slice().sort(function(a,b){var aHome=showingHomes(a).length>0,bHome=showingHomes(b).length>0;if(aHome!==bHome)return aHome?-1:1;return (b.collectedAt||'').localeCompare(a.collectedAt||'')||b.id-a.id;});}
    function channelBadges(v){var names=['Web','App'].filter(function(c){return (v.channels||[]).indexOf(c)!==-1;});return names.length?names.map(function(c){return '<span class="badge">'+c+'</span>';}).join(''):'—';}
    function durationCell(v){if(!v.duration)return '—';return '<span class="videos-duration"><svg class="videos-duration__icon" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" stroke-width="1.2"></circle><path d="M6.8 5.2v5.6L11.3 8 6.8 5.2Z" fill="currentColor"></path></svg>'+escapeText(v.duration)+'</span>';}
    function render(){tbody.innerHTML=ordered().slice((page-1)*pageSize,page*pageSize).map(function(v){var homes=showingHomes(v);return '<tr'+(homes.length?' class="is-notice"':'')+'><td>'+String(v.id)+'</td><td>'+escapeText(v.category||'미분류')+'</td><td><a class="videos-title" href="videos-detail.asp?id='+encodeURIComponent(v.id)+'">'+escapeText(v.displayTitle||v.originalTitle)+'</a></td><td>'+channelBadges(v)+'</td><td>'+durationCell(v)+'</td><td>'+escapeText(v.collectionStatus)+'</td></tr>';}).join('')||'<tr><td colspan="6">검색 결과가 없습니다.</td></tr>';var pages=Math.ceil(filtered.length/pageSize);nav.hidden=!pages;nav.dataset.current=page;nav.dataset.total=pages||1;AdminUI.refreshPagination(nav);}
    q('#videos-search').onclick=search;q('.videos-page .list-filters').addEventListener('select:change',search);q('.videos-page [name="keyword"]').onkeydown=function(e){if(e.key==='Enter'){e.preventDefault();search();}};nav.addEventListener('pagination:change',function(e){page=e.detail.page;render();});render();
    q('#videos-refresh').onclick=function(){q('#video-collect-message').textContent='외부 영상 수집 API는 연결 전입니다. 기존 영상과 관리자 설정은 변경하지 않았습니다.';AdminUI.openModal('modal-video-collect');};
  }
  Admin.ready(async function(){
    try {
      var res = await fetch('proc/video_proc.asp?action=list');
      var json = await res.json();
      if (json && json.success && Array.isArray(json.items)) {
        videos = json.items;
      } else {
        videos = [];
      }
      if (q('#videos-table')) list();
      if (q('#video-form')) await detail();
    } catch(e) {
      videos = MockData.videos;
      if (q('#videos-table')) list();
      if (q('#video-form')) await detail();
    }
  });
})();
