(function () {
  'use strict';
  var q = function (s, root) { return (root || document).querySelector(s); };
  var urls = [], previewUrls = [], record, dirty = false;
  var kind, year, month, records, form, calendarGalleries;
  function escapeText(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function(c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  var selectChevron = '<svg class="select__chevron" viewBox="0 0 10 10" aria-hidden="true"><path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"></path></svg>';
  function customSelectMarkup(options) {
    var items = options.items || [];
    var first = items[0] || { value: '', label: '' };
    var list = items.map(function (item, index) {
      return '<li><button type="button" class="select__option' + (index === 0 ? ' is-selected' : '') + '" data-value="' + escapeText(item.value) + '">' + escapeText(item.label) + '</button></li>';
    }).join('');
    return '<div class="select" id="' + options.id + '" data-select>' +
      '<button type="button" class="select__button"' + (options.buttonId ? ' id="' + options.buttonId + '"' : '') + ' aria-haspopup="listbox" aria-expanded="false"' + (options.aria ? ' aria-label="' + escapeText(options.aria) + '"' : '') + '>' +
        '<span class="select__label">' + escapeText(first.label) + '</span>' + selectChevron +
      '</button>' +
      '<ul class="select__list" role="listbox" hidden>' + list + '</ul>' +
      '<input type="hidden" id="' + options.inputId + '" value="' + escapeText(first.value) + '">' +
    '</div>';
  }
  function setSelectValue(root, value) {
    if (!root) return;
    var hidden = q("input[type='hidden']", root);
    var label = q('.select__label', root);
    var matched = null;
    root.querySelectorAll('.select__option').forEach(function (option) {
      var on = option.getAttribute('data-value') === String(value);
      option.classList.toggle('is-selected', on);
      if (on) matched = option;
    });
    if (hidden) hidden.value = matched ? matched.getAttribute('data-value') : String(value == null ? '' : value);
    if (label && matched) label.textContent = matched.textContent;
  }
  function today() { return new Date().toLocaleDateString('sv-SE', {timeZone:'Asia/Seoul'}); }
  function currentYear() { return Number(today().slice(0,4)); }
  function fileSource(block, preview) {
    if (!block.file) return block.src || '';
    var url = URL.createObjectURL(block.file); (preview ? previewUrls : urls).push(url); return url;
  }
  function revoke(list) { list.splice(0).forEach(function (url) { URL.revokeObjectURL(url); }); }
  function status(text, error) { var el=q('#resource-status'); el.textContent=text; el.classList.toggle('flow-error',!!error); }
  function orchardEdit() { return document.body.dataset.resource === 'edit'; }
  function formatFileSize(size) {
    var value = Number(size) || 0;
    if (value < 1024) return value + 'B';
    if (value < 1024 * 1024) return Math.round(value / 1024) + 'KB';
    return (value / (1024 * 1024)).toFixed(1) + 'MB';
  }
  function fileAllowed(file, acceptPdf) {
    if (/^image\/(png|jpeg|webp)$/.test(file.type)) return true;
    return !!acceptPdf && (file.type === 'application/pdf' || /\.pdf$/i.test(file.name));
  }
  function uploadIcon(kind) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'orchard-upload__icon');
    svg.setAttribute('viewBox', '0 0 18 18');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = kind === 'image'
      ? '<rect x="2" y="3.5" width="14" height="11" rx="1.2" fill="none" stroke="currentColor" stroke-width="1.2"></rect><circle cx="6.2" cy="7.2" r="1.1" fill="currentColor"></circle><path d="M3.5 12.5 7 9.2l2.2 2.1 1.6-1.4 3.7 3.1" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"></path>'
      : '<path d="M5 8.5 9 4.5l4 4" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"></path><path d="M9 5v7.2" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"></path><path d="M4 13.5h10" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"></path>';
    return svg;
  }
  function createUpload(options) {
    var zone = document.createElement('div');
    zone.className = 'orchard-upload';
    var input = document.createElement('input');
    input.type = 'file';
    input.className = 'orchard-upload__input';
    input.accept = options.accept;
    if (options.id) input.id = options.id;
    input.setAttribute('aria-label', options.aria);
    var empty = document.createElement('div');
    empty.className = 'orchard-upload__empty';
    var hint = document.createElement('span');
    hint.className = 'orchard-upload__hint';
    hint.append(document.createTextNode(options.hint + ' '));
    var pick = document.createElement('button');
    pick.type = 'button';
    pick.className = 'orchard-upload__pick';
    pick.textContent = '파일선택';
    hint.append(pick);
    var ext = document.createElement('span');
    ext.className = 'orchard-upload__ext';
    ext.textContent = options.ext;
    empty.append(uploadIcon(options.icon), hint, ext);
    if (options.dense) zone.classList.add('orchard-upload--dense');
    var chosen = document.createElement('div');
    chosen.className = 'orchard-upload__chosen';
    chosen.hidden = true;
    var fileIcon = uploadIcon(options.icon);
    fileIcon.classList.add('orchard-upload__file-icon');
    var meta = document.createElement('div');
    meta.className = 'orchard-upload__meta';
    var nameEl = document.createElement('span');
    nameEl.className = 'orchard-upload__name';
    var sizeEl = document.createElement('span');
    sizeEl.className = 'orchard-upload__size';
    meta.append(nameEl, sizeEl);
    var actions = document.createElement('div');
    actions.className = 'orchard-upload__actions';
    var change = document.createElement('button');
    change.type = 'button';
    change.className = 'btn btn--sm orchard-upload__pick';
    change.textContent = '파일 변경';
    var remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'btn btn--sm';
    remove.textContent = '제거';
    remove.hidden = !options.allowRemove;
    actions.append(change, remove);
    chosen.append(fileIcon, meta, actions);
    zone.append(input, empty, chosen);
    function paint(file, storedName) {
      var hasFile = !!file || !!storedName;
      zone.classList.toggle('is-selected', hasFile);
      empty.hidden = hasFile;
      chosen.hidden = !hasFile;
      nameEl.textContent = file ? file.name : (storedName || '');
      sizeEl.hidden = !hasFile;
      sizeEl.textContent = file && file.size != null ? formatFileSize(file.size) : (storedName ? '저장된 파일' : '');
    }
    function take(file) {
      if (!file) return;
      if (options.onFile(file) === false) return;
      paint(file);
    }
    function openPicker(event) {
      event.preventDefault();
      event.stopPropagation();
      input.click();
    }
    zone.addEventListener('click', function (event) {
      if (event.target.closest('button')) return;
      input.click();
    });
    qsaPicks();
    function qsaPicks() {
      zone.querySelectorAll('.orchard-upload__pick').forEach(function (button) { button.addEventListener('click', openPicker); });
    }
    input.addEventListener('change', function (event) {
      var file = input.files && input.files[0];
      input.value = '';
      if (!file) return;
      if (options.onFile(file) === false) { event.stopPropagation(); return; }
      paint(file);
    });
    zone.addEventListener('dragover', function (event) { event.preventDefault(); zone.classList.add('is-dragover'); });
    zone.addEventListener('dragleave', function () { zone.classList.remove('is-dragover'); });
    zone.addEventListener('drop', function (event) {
      event.preventDefault();
      zone.classList.remove('is-dragover');
      var file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
      take(file);
    });
    if (options.allowRemove) {
      remove.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        input.value = '';
        if (options.onRemove) options.onRemove();
        paint(null, '');
      });
    }
    paint(options.file || null, options.storedName || '');
    return zone;
  }
  function seed(monthNumber) {
    var src = (window.ADMIN_ORCHARD_MONTHS || []).find(function (m) { return m.month === monthNumber; });
    if (!src) return null;
    var blocks = [{kind:'title',name:'월별 제목 원본',src:src.title,alt:monthNumber+'월 중점 관리사항'}];
    src.parts.forEach(function (p) {
      blocks.push({kind:p.kind==='wide'?'table':'body',name:p.label,src:p.src,alt:p.label,width:p.w,fragments:p.fragments || []});
    });
    (src.tables || []).forEach(function (p) { blocks.push({kind:'table',name:p.label || '가로표',src:p.src,alt:p.label || '가로표',width:p.w}); });
    return {key:'orchard:2026:'+monthNumber,kind:'orchard',year:2026,month:monthNumber,title:'2026년 '+monthNumber+'월 중점 과원관리',channels:['App'],visibility:'public',blocks:blocks,bg:src.bg,accent:src.accent,spiral:src.spiral,updatedAt:'2026.10.19',preparation:'검수완료'};
  }
  function defaults(key) {
    if(key==='calendar') return {key:'calendar',kind:'calendar',title:'복숭아 재배력',channels:['Web','App'],visibility:'public',thumbnail:{name:'peach-cultivation-thumbnail.jpg',src:'assets/peach-cultivation-thumbnail.jpg'},webImages:[{id:'cal-web-1',name:'peach-cultivation-content.jpg',src:'assets/peach-cultivation-content.jpg'}],appImages:[{id:'cal-app-1',name:'peach-cultivation-content.jpg',src:'assets/peach-cultivation-content.jpg'}],blocks:[{kind:'body',name:'peach-cultivation-content.jpg',src:'assets/peach-cultivation-content.jpg',alt:'복숭아 재배력: 연간 생육·농작업·병해충 방제'}],updatedAt:'2026.10.19'};
    if(year===2026) return seed(month);
    return null;
  }
  function resolved(y,m) { var saved=records.find(function (r) { return r.key==='orchard:'+y+':'+m; }); if(saved) return saved.deleted ? null : saved; return y===2026 ? seed(m) : null; }
  async function list() {
    var selected=Number(new URLSearchParams(location.search).get('year')) || currentYear();
    var years=new Set([2026,currentYear(),currentYear()+1]);records.filter(function(r){return r.kind==='orchard';}).forEach(function(r){years.add(r.year);});
    if(selected<2000||selected>2100) selected=currentYear();years.add(selected);
    var select=q('#resource-year');
    var yearList=q('.select__list', select);
    yearList.innerHTML=Array.from(years).sort(function(a,b){return b-a;}).map(function(y){return '<li><button type="button" class="select__option" data-value="'+y+'">'+y+'</button></li>';}).join('');
    setSelectValue(select, selected);
    select.addEventListener('select:change', function(event){selected=Number(event.detail.value);history.replaceState(null,'','?year='+selected);loadAndRender();});

    async function loadAndRender() {
      var dbItems = null;
      try {
        var res = await fetch('proc/orchard_proc.asp?action=list&year=' + selected);
        var json = await res.json();
        if (json && json.success && Array.isArray(json.items)) {
          dbItems = json.items;
        }
      } catch(e) {}

      var savedCount=0,demoCount=0;
      var now=today();
      var nowYear=Number(now.slice(0,4));
      var nowMonth=Number(now.slice(5,7));

      q('#resource-rows').innerHTML=Array.from({length:12},function(_,i){
        var m=i+1;
        var dbItem = dbItems ? dbItems.find(function(item){ return item.month === m && item.id; }) : null;
        var stored=records.find(function(r){return r.key==='orchard:'+selected+':'+m;});
        var saved=dbItem ? {
          title: dbItem.title,
          visibility: dbItem.visibility,
          channels: dbItem.channels || [],
          updatedAt: dbItem.updatedAt,
          preparation: '검수완료'
        } : (stored&&!stored.deleted?stored:null);

        var demo=!saved&&selected===2026?seed(m):null;
        var shown=saved||demo;
        if(saved)savedCount++;else if(demo)demoCount++;
        var open=shown?'공개':'—';
        if(shown){
          if(shown.visibility==='public'||shown.visibility==='공개')open='공개';
          else if(shown.visibility==='private'||shown.visibility==='비공개')open='비공개';
          else open='—';
        }
        var href='monthly-content-form.asp?type=orchard&year='+selected+'&month='+m+'&mode='+(shown?'edit':'create');
        var titleCell=shown?'<a class="contents-title" href="'+href+'">'+escapeText(shown.title||'(제목 없음)')+'</a>':'—';
        var current=selected===nowYear&&m===nowMonth;
        return '<tr'+(current?' class="is-current"':'')+'><th scope="row">'+m+'월</th><td>'+titleCell+'</td><td>'+escapeText(shown?shown.preparation||'작성중':'미등록')+'</td><td>'+escapeText(open)+'</td><td>'+escapeText(shown?shown.channels.join(' / '):'—')+'</td><td>'+escapeText(shown?shown.updatedAt:'—')+'</td><td><a class="btn" href="'+href+'">'+(shown?'수정':'등록')+'</a></td></tr>';
      }).join('');
      q('#resource-summary').textContent='저장 '+savedCount+'개월 / 시연 '+demoCount+'개월 / 미등록 '+(12-savedCount-demoCount)+'개월';
    }

    loadAndRender();
    var listQuery=new URLSearchParams(location.search);
    if(listQuery.get('saved')==='1')status('자료가 데이터베이스에 저장되었습니다.');
    else if(listQuery.get('deleted')==='1')status('해당 월 콘텐츠가 데이터베이스에서 삭제되었습니다.');
  }
  function exposureMarkup() {
    var channel = '<div class="orchard-field"><span class="orchard-field__label">노출채널</span><div class="orchard-field__control"><div class="orchard-cluster"><label class="checkbox"><input type="checkbox" id="resource-web"><span class="checkbox__box" aria-hidden="true"></span><span class="checkbox__text">Web(홈페이지)</span></label><label class="checkbox"><input type="checkbox" id="resource-app"><span class="checkbox__box" aria-hidden="true"></span><span class="checkbox__text">App</span></label></div></div></div>';
    var preparation = kind==='orchard'?'<label class="orchard-field__label orchard-field__label--next" for="resource-preparation">준비 상태</label><div class="orchard-field__control"><select class="input" id="resource-preparation"><option>작성중</option><option>검수완료</option></select></div></div>':'</div>';
    return channel+'<div class="orchard-field orchard-field--pair"><label class="orchard-field__label" for="resource-visibility">공개 상태</label><div class="orchard-field__control"><select class="input" id="resource-visibility"><option value="private">비공개</option><option value="public">공개</option></select></div>'+preparation;
  }
  function fields(){
    if (orchardEdit()) return '<div class="orchard-field"><label class="orchard-field__label" for="resource-title">자료 제목<span class="required">*</span></label><div class="orchard-field__control"><input class="input input--block" id="resource-title" required></div></div>';
    var thumb = kind==='calendar' ? '<div class="form-row"><label class="form-row__label" for="resource-thumb">썸네일</label><div class="form-row__controls"><div class="resource-thumb"><input class="resource-thumb__input" id="resource-thumb" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" aria-describedby="resource-thumb-name"><button type="button" class="btn resource-thumb__pick" id="resource-thumb-pick">파일 선택</button><span class="resource-thumb__name is-empty" id="resource-thumb-name">선택된 파일이 없습니다.</span><button type="button" class="resource-thumb__clear" id="resource-thumb-clear" hidden aria-label="첨부 파일 삭제">×</button></div></div></div>' : '';
    var visibilitySelect=customSelectMarkup({id:'resource-visibility-select',buttonId:'resource-visibility-button',inputId:'resource-visibility',aria:'공개 상태',items:[{value:'public',label:'공개'},{value:'private',label:'비공개'}]});
    return '<div class="form-row"><label class="form-row__label" for="resource-title">자료 제목 *</label><div class="form-row__controls"><input class="input input--block" id="resource-title" required></div></div>'+thumb+'<div class="flow-row"><span>노출채널</span><label><input type="checkbox" id="resource-web">Web(홈페이지)</label><label><input type="checkbox" id="resource-app">App</label><label>공개 상태 '+visibilitySelect+'</label>'+(kind==='orchard'?'<label>준비 상태 <select id="resource-preparation"><option>작성중</option><option>검수완료</option></select></label>':'')+'</div>';
  }
  function bindCalendarContents(){
    var galleries={web:[],app:[]};
    calendarGalleries=galleries;
    var seq=0;
    ['web','app'].forEach(function(channel){
      var stored=channel==='web'?record.webImages:record.appImages;
      if(!Array.isArray(stored)) return;
      stored.forEach(function(item){
        if(!item) return;
        if(item.file) galleries[channel].push({id:item.id || ('cal-'+(++seq)), file:item.file, name:item.name || item.file.name, url:URL.createObjectURL(item.file)});
        else if(item.src) galleries[channel].push({id:item.id || ('cal-'+(++seq)), name:item.name || '', src:item.src, url:item.src});
      });
    });
    function channelOn(channel){var box=q('#resource-'+channel);return !!(box && box.checked);}
    function imageFile(file){return file && (fileAllowed(file,false) || /\.(jpe?g|png|webp)$/i.test(file.name||''));}
    function remember(){
      record.webImages=galleries.web.map(function(item){return {id:item.id,name:item.name,file:item.file,src:item.file?'':item.src||''};});
      record.appImages=galleries.app.map(function(item){return {id:item.id,name:item.name,file:item.file,src:item.file?'':item.src||''};});
    }
    function render(channel){
      var items=galleries[channel];
      var grid=q('#calendar-'+channel+'-grid');
      var count=q('#calendar-'+channel+'-count');
      var section=q('#calendar-'+channel+'-section');
      var input=q('#calendar-'+channel+'-input');
      if(!grid || !section) return;
      var enabled=channelOn(channel);
      section.classList.toggle('is-disabled',!enabled);
      section.classList.toggle('is-active',enabled);
      section.setAttribute('aria-disabled',enabled?'false':'true');
      if(input) input.disabled=!enabled;
      if(count) count.textContent=items.length+'장';
      grid.replaceChildren();
      items.forEach(function(item,index){
        var card=document.createElement('article');
        card.className='monthly-gallery__card';
        var thumb=document.createElement('div');
        thumb.className='monthly-gallery__thumb';
        var image=document.createElement('img');
        image.src=item.url;
        image.alt=item.name || '';
        thumb.appendChild(image);
        var meta=document.createElement('div');
        meta.className='monthly-gallery__meta';
        var order=document.createElement('span');
        order.className='monthly-gallery__order';
        order.textContent=String(index+1);
        var name=document.createElement('span');
        name.className='monthly-gallery__name';
        name.textContent=item.name || '';
        name.title=item.name || '';
        var actions=document.createElement('div');
        actions.className='monthly-gallery__actions';
        [[-1,'위로 이동','↑'],[1,'아래로 이동','↓']].forEach(function(move){
          var button=document.createElement('button');
          var next=index+move[0];
          button.type='button';
          button.className='monthly-gallery__move';
          button.disabled=!enabled || next<0 || next>=items.length;
          button.title=move[1];
          button.setAttribute('aria-label',move[1]);
          button.textContent=move[2];
          button.addEventListener('click',function(){
            var swapped=items[index];
            items[index]=items[next];
            items[next]=swapped;
            dirty=true;
            remember();
            render(channel);
          });
          actions.appendChild(button);
        });
        var remove=document.createElement('button');
        remove.type='button';
        remove.className='monthly-gallery__delete';
        remove.title='삭제';
        remove.disabled=!enabled;
        remove.setAttribute('aria-label',(index+1)+'번 이미지 삭제');
        remove.textContent='삭제';
        remove.addEventListener('click',function(){
          if(item.file && item.url) URL.revokeObjectURL(item.url);
          items.splice(index,1);
          dirty=true;
          remember();
          render(channel);
        });
        actions.appendChild(remove);
        meta.appendChild(order);
        meta.appendChild(name);
        meta.appendChild(actions);
        card.appendChild(meta);
        card.appendChild(thumb);
        grid.appendChild(card);
      });
    }
    function take(channel,fileList){
      if(!channelOn(channel)) return;
      var rejected=false;
      Array.prototype.forEach.call(fileList||[],function(file){
        if(!imageFile(file)){rejected=true;return;}
        galleries[channel].push({id:'cal-'+(++seq),file:file,name:file.name,url:URL.createObjectURL(file)});
        dirty=true;
      });
      var input=q('#calendar-'+channel+'-input');
      if(input) input.value='';
      remember();
      render(channel);
      if(rejected) status('JPG, JPEG, PNG, WebP 이미지만 첨부할 수 있습니다.',true);
      else status('');
    }
    ['web','app'].forEach(function(channel){
      var input=q('#calendar-'+channel+'-input');
      var drop=q('#calendar-'+channel+'-drop');
      var pick=q('#calendar-'+channel+'-pick');
      var box=q('#resource-'+channel);
      if(!input || !drop || !pick) return;
      if(box) box.addEventListener('change',function(){render(channel);});
      input.addEventListener('change',function(event){event.stopPropagation();take(channel,input.files);});
      pick.addEventListener('click',function(event){event.preventDefault();event.stopPropagation();if(input.disabled)return;input.click();});
      drop.addEventListener('click',function(event){if(input.disabled || event.target.closest('button') || event.target===input)return;input.click();});
      drop.addEventListener('dragover',function(event){if(!channelOn(channel))return;event.preventDefault();drop.classList.add('is-dragover');});
      drop.addEventListener('dragleave',function(){drop.classList.remove('is-dragover');});
      drop.addEventListener('drop',function(event){event.preventDefault();drop.classList.remove('is-dragover');take(channel,event.dataTransfer && event.dataTransfer.files);});
      render(channel);
    });
    window.addEventListener('pagehide',function(){
      ['web','app'].forEach(function(channel){galleries[channel].forEach(function(item){if(item.file && item.url) URL.revokeObjectURL(item.url);});});
    });
  }
  async function edit(){
    var params=new URLSearchParams(location.search);kind=document.body.dataset.resource==='calendar'?'calendar':'orchard';
    if(params.get('type')==='cultivation'){location.replace('cultivation-content.asp');return;}
    year=Number(params.get('year'));month=Number(params.get('month'));
    if(kind==='orchard'&&(!Number.isInteger(year)||year<2000||year>2100||!Number.isInteger(month)||month<1||month>12||params.get('type')!=='orchard')){status('연도·월이 올바르지 않습니다. 목록에서 자료를 선택해 주세요.',true);return;}
    if (kind === 'calendar') {
      try {
        var cRes = await fetch('proc/calendar_proc.asp?action=get');
        var cJson = await cRes.json();
        if (cJson && cJson.success && cJson.item) {
          record = {
            key: 'calendar',
            kind: 'calendar',
            title: cJson.item.title || '복숭아 재배력',
            channels: cJson.item.channels || ['Web', 'App'],
            visibility: cJson.item.visibility || 'public',
            thumbnail: cJson.item.thumbnail ? { name: cJson.item.thumbnail.split('/').pop(), src: cJson.item.thumbnail } : null,
            webImages: [],
            appImages: []
          };
          if (Array.isArray(cJson.images) && cJson.images.length > 0) {
            cJson.images.forEach(function (img) {
              var itm = {
                id: 'cal-' + img.channel.toLowerCase() + '-' + img.id,
                name: img.name,
                src: img.path,
                path: img.path
              };
              if (img.channel.toUpperCase() === 'WEB') record.webImages.push(itm);
              else if (img.channel.toUpperCase() === 'APP') record.appImages.push(itm);
            });
          }
        }
      } catch (ce) {
        console.warn('DB 재배력 조회 실패:', ce);
      }
    }
    if (!record) {
      var key=kind==='calendar'?'calendar':'orchard:'+year+':'+month;
      var stored=records.find(function(r){return r.key===key;});
      var saved=stored || defaults(key);
      record=saved || {key:key,kind:kind,year:year,month:month,title:'',blocks:[],channels:[],visibility:'private',preparation:'작성중'};
      record=structuredClone(record);
    }
    if(kind==='calendar' && !record.thumbnail && !(record.webImages && record.webImages.length) && !(record.appImages && record.appImages.length)){
      var calendarDemo=defaults('calendar');
      record.thumbnail=calendarDemo.thumbnail;
      record.webImages=calendarDemo.webImages.map(function(item){return Object.assign({},item);});
      record.appImages=calendarDemo.appImages.map(function(item){return Object.assign({},item);});
      record.channels=['Web','App'];
    }
    var heading=kind==='calendar'?'상시 재배력':year+'년 '+month+'월 과원관리 자료 '+((stored || (saved && params.get('mode')!=='create'))?'수정':'등록');
    if (params.get('saved') === '1') status('자료가 데이터베이스에 저장되었습니다.');
    q('#resource-heading').textContent=heading;
    form=q('#resource-form');form.hidden=false;q('#resource-fields').innerHTML=fields();
    var exposureHost=q('#resource-exposure'); if(exposureHost) exposureHost.innerHTML=exposureMarkup();
    q('#resource-title').value=record.title;
    if(kind==='calendar'){
      var thumbName=q('#resource-thumb-name');
      var thumbInput=q('#resource-thumb');
      var thumbPick=q('#resource-thumb-pick');
      var thumbClear=q('#resource-thumb-clear');
      function paintThumb(file){
        var name=file && file.name ? file.name : '';
        if(thumbPick) thumbPick.textContent=name ? '파일 변경' : '파일 선택';
        if(thumbName){
          thumbName.textContent=name || '선택된 파일이 없습니다.';
          thumbName.title=name;
          thumbName.classList.toggle('is-empty', !name);
        }
        if(thumbClear) thumbClear.hidden=!name;
      }
      paintThumb(record.thumbnail);
      if(thumbPick && thumbInput) thumbPick.addEventListener('click', function(){ thumbInput.click(); });
      if(thumbClear && thumbInput) thumbClear.addEventListener('click', function(){
        thumbInput.value='';
        delete record.thumbnail;
        dirty=true;
        paintThumb(null);
        status('');
      });
      if(thumbInput) thumbInput.addEventListener('change', function(){
        var file=thumbInput.files && thumbInput.files[0];
        if(!file){delete record.thumbnail; paintThumb(null); return;}
        if(!fileAllowed(file,false) && !/\.(jpe?g|png|webp)$/i.test(file.name||'')){status('썸네일은 PNG·JPG·WebP 파일을 선택해 주세요.',true); thumbInput.value=''; paintThumb(record.thumbnail); return;}
        record.thumbnail=file;
        paintThumb(file);
        dirty=true;
        status('');
      });
    }
    q('#resource-web').checked=record.channels.includes('Web');q('#resource-app').checked=record.channels.includes('App');
    var visibilitySelect=q('#resource-visibility-select');
    if(visibilitySelect){setSelectValue(visibilitySelect, record.visibility);if(window.AdminUI)AdminUI.init(q('#resource-fields'));}
    else q('#resource-visibility').value=record.visibility;
    if(kind==='calendar') bindCalendarContents();
    if(kind==='orchard')q('#resource-preparation').value=record.preparation || '작성중';
    form.addEventListener('input',function(){dirty=true;});form.addEventListener('change',function(){dirty=true;});form.addEventListener('select:change',function(){dirty=true;});
    form.onsubmit=async function(e){
      e.preventDefault();
      var value=readForm();
      if(!valid(value))return;
      var btn=q('#resource-save');
      btn.disabled=true;
      try{
        var fd = new FormData();
        fd.append('action', 'save');
        if (kind === 'calendar') {
          fd.append('year', String(value.year || currentYear()));
          fd.append('title', value.title || '복숭아 재배력');
          fd.append('visibility', value.visibility || 'public');
          fd.append('channels', (value.channels || []).join(','));

          var thumbInput = q('#resource-thumb');
          if (thumbInput && thumbInput.files && thumbInput.files[0]) {
            fd.append('thumbnail_file', thumbInput.files[0]);
          } else if (record && record.thumbnail && record.thumbnail.src) {
            fd.append('thumbnail', record.thumbnail.src);
          }

          var webItems = (calendarGalleries && calendarGalleries.web) || [];
          fd.append('web_count', String(webItems.length));
          webItems.forEach(function (item, idx) {
            if (item.file) {
              fd.append('web_item_kind_' + idx, 'new');
              fd.append('web_file_' + idx, item.file);
            } else {
              fd.append('web_item_kind_' + idx, 'keep');
              fd.append('web_item_name_' + idx, item.name || '');
              fd.append('web_item_path_' + idx, item.src || item.path || '');
            }
          });

          var appItems = (calendarGalleries && calendarGalleries.app) || [];
          fd.append('app_count', String(appItems.length));
          appItems.forEach(function (item, idx) {
            if (item.file) {
              fd.append('app_item_kind_' + idx, 'new');
              fd.append('app_file_' + idx, item.file);
            } else {
              fd.append('app_item_kind_' + idx, 'keep');
              fd.append('app_item_name_' + idx, item.name || '');
              fd.append('app_item_path_' + idx, item.src || item.path || '');
            }
          });

          var res = await fetch('proc/calendar_proc.asp', { method: 'POST', body: fd });
          var json = await res.json();
          if (json && json.success) {
            dirty = false;
            location.href = 'cultivation-content.asp?saved=1';
          } else {
            status('저장 실패: ' + (json ? json.message : ''), true);
          }
        } else {
          fd.append('year', String(year));
          fd.append('month', String(month));
          fd.append('title', value.title || '');
          fd.append('visibility', value.visibility || 'public');
          fd.append('channels', (value.channels || []).join(','));
          if (record.thumbnail && record.thumbnail.name) {
            fd.append('thumbnail', '/uploads/' + record.thumbnail.name);
          }
          var res = await fetch('proc/orchard_proc.asp', { method: 'POST', body: fd });
          var json = await res.json();
          if (json && json.success) {
            dirty = false;
            location.href = 'orchard-content.asp?year=' + year + '&saved=1';
          } else {
            status('저장 실패: ' + (json ? json.message : ''), true);
          }
        }
      }catch(err){
        status('저장 중 통신 오류가 발생했습니다.', true);
      }finally{
        btn.disabled=false;
      }
    };
    var listLink=q('#resource-list');if(listLink)listLink.onclick=function(e){if(dirty&&!confirm('입력한 내용을 저장하지 않고 목록으로 이동하시겠습니까?'))e.preventDefault();};
    var addBlock=q('#resource-add');
    if(addBlock){addBlock.hidden=kind==='calendar';addBlock.onclick=function(){record.blocks.push({kind:'body',name:'',alt:''});dirty=true;renderBlocks();};}
    q('#resource-preview').onclick=function(){if(kind==='calendar'){previewCalendar();return;}var value=readForm();if(valid(value))preview(value);};
    if(kind==='orchard'){
      var initialOriginal=record.original || null;
      var originalHost=q('#resource-original');
      if(originalHost && orchardEdit()){
        var field=document.createElement('div'); field.className='orchard-field';
        var label=document.createElement('span'); label.className='orchard-field__label'; label.textContent='원본 자료';
        var control=document.createElement('div'); control.className='orchard-field__control';
        var note=document.createElement('p'); note.className='orchard-form__note'; note.textContent='기존 앱의 가공된 원본 이미지를 사용합니다.'; note.hidden=!!initialOriginal;
        control.append(createUpload({
          id:'resource-original-file', accept:'.pdf,image/png,image/jpeg,image/webp', aria:'원본 자료', icon:'file',
          hint:'이 곳에 파일을 드래그 하세요, 또는', ext:'PDF, PNG, JPG, WebP', allowRemove:!initialOriginal, file:initialOriginal,
          onFile:function(file){if(!fileAllowed(file,true)){status('원본 자료는 PDF·PNG·JPG·WebP 파일을 선택해 주세요.',true);return false;}record.original=file;note.hidden=true;dirty=true;status('');},
          onRemove:function(){delete record.original;note.hidden=false;dirty=true;}
        }), note);
        field.append(label, control); originalHost.append(field);
      }else{
        var raw=document.createElement('div');raw.className='flow-row';
        var rawLabel=document.createElement('label');rawLabel.textContent='원본 자료 (PDF·이미지)';
        var rawInput=document.createElement('input');rawInput.type='file';rawInput.id='resource-original';rawInput.accept='.pdf,image/png,image/jpeg,image/webp';
        var rawName=document.createElement('span');rawName.textContent=record.original?record.original.name:'기존 앱의 가공된 원본 이미지를 사용합니다.';
        rawLabel.append(rawInput);raw.append(rawLabel,rawName);q('#resource-fields').after(raw);
        rawInput.onchange=function(){var f=rawInput.files[0];if(!f)return;if(!fileAllowed(f,true)){status('원본 자료는 PDF·PNG·JPG·WebP 파일을 선택해 주세요.',true);rawInput.value='';return;}record.original=f;rawName.textContent=f.name;dirty=true;};
      }
    }
    if(q('#resource-blocks')) renderBlocks();
    if(params.get('saved')==='1')status('이 브라우저에 저장했습니다. 통합 검수의 앱 탭에서 저장값을 확인할 수 있습니다. 실제 서버 반영은 별도입니다.');
    window.addEventListener('beforeunload',function(e){if(dirty){e.preventDefault();e.returnValue='';}});
  }
  function readForm(){return Object.assign({},record,{title:q('#resource-title').value.trim(),visibility:q('#resource-visibility').value,preparation:kind==='orchard'?q('#resource-preparation').value:undefined,channels:['Web','App'].filter(function(c){return q('#resource-'+c.toLowerCase()).checked;})});}
  function valid(value){if(!value.title){status('자료 제목을 입력해 주세요.',true);q('#resource-title').focus();return false;}if(value.visibility==='public'&&!value.channels.length){status('공개할 채널을 선택해 주세요.',true);return false;}if(kind!=='calendar'&&(!value.blocks.length||value.blocks.some(function(b){return !b.file&&!b.src;}))){status('각 구성의 원본 파일을 선택해 주세요.',true);return false;}status('');return true;}
  function iconAction(label, svg, extraClass) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'orchard-icon-btn' + (extraClass ? ' ' + extraClass : '');
    btn.title = label;
    btn.setAttribute('aria-label', label);
    var icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 16 16');
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = svg;
    btn.append(icon);
    return btn;
  }
  function renderOrchardCards(){
    var root=q('#resource-blocks'); root.replaceChildren();
    var upIcon = '<path d="M8 12.5V3.8M8 3.8 4.6 7.2M8 3.8l3.4 3.4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"></path>';
    var downIcon = '<path d="M8 3.5v8.7M8 12.2 4.6 8.8M8 12.2l3.4-3.4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"></path>';
    var removeIcon = '<path d="M3.4 4.4h9.2M6.2 4.4V3.2h3.6v1.2M4.6 4.4l.5 8.3h5.8l.5-8.3" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"></path>';
    record.blocks.forEach(function(block,i){
      var card=document.createElement('article'); card.className='orchard-card';
      var head=document.createElement('div'); head.className='orchard-card__head';
      var typeWrap=document.createElement('div'); typeWrap.className='orchard-card__type';
      var index=document.createElement('span'); index.className='orchard-card__index'; index.textContent=String(i+1);
      var select=document.createElement('select'); select.className='input'; select.setAttribute('aria-label',(i+1)+'번째 구성 유형');
      select.innerHTML='<option value="title">제목</option><option value="body">본문·단</option><option value="table">가로표</option>';
      select.value=block.kind; select.onchange=function(){block.kind=select.value;dirty=true;};
      typeWrap.append(index, select);
      var actions=document.createElement('div'); actions.className='orchard-card__actions';
      [['위로 이동',-1,upIcon],['아래로 이동',1,downIcon]].forEach(function(move){var btn=iconAction(move[0], move[2]); btn.disabled=i+move[1]<0||i+move[1]>=record.blocks.length; btn.onclick=function(){var j=i+move[1]; [record.blocks[i],record.blocks[j]]=[record.blocks[j],record.blocks[i]]; dirty=true; renderBlocks();}; actions.append(btn);});
      var remove=iconAction('제거', removeIcon, 'orchard-icon-btn--remove'); remove.onclick=function(){record.blocks.splice(i,1); dirty=true; renderBlocks();}; actions.append(remove);
      head.append(typeWrap, actions);
      var body=document.createElement('div'); body.className='orchard-card__body';
      var fileField=document.createElement('div'); fileField.className='orchard-card__col';
      var fileLabel=document.createElement('span'); fileLabel.className='orchard-card__label'; fileLabel.textContent='원본 파일';
      fileField.append(fileLabel, createUpload({
        dense:true, accept:'image/png,image/jpeg,image/webp', aria:(i+1)+'번째 원본 파일', icon:'image', allowRemove:false,
        hint:'이 곳에 이미지 파일을 드래그 하세요, 또는', ext:'PNG, JPG, WebP', file:block.file||null, storedName:block.file?'':(block.src?block.name||'':''),
        onFile:function(picked){if(!fileAllowed(picked,false)){status('본문·표에는 PNG·JPG·WebP 이미지를 선택해 주세요.',true);return false;}block.file=picked;delete block.src;delete block.fragments;delete block.width;block.name=picked.name;dirty=true;renderBlocks();status('파일을 선택했습니다. 저장 후 이 브라우저에 보관합니다.');return false;}
      }));
      var altField=document.createElement('div'); altField.className='orchard-card__col';
      var altLabel=document.createElement('label'); altLabel.className='orchard-card__label'; altLabel.htmlFor='resource-alt-'+i; altLabel.textContent='대체 설명';
      var alt=document.createElement('input'); alt.className='input input--block'; alt.id='resource-alt-'+i; alt.type='text'; alt.value=block.alt||''; alt.oninput=function(){block.alt=alt.value;dirty=true;};
      altField.append(altLabel, alt);
      body.append(fileField, altField); card.append(head, body); root.append(card);
    });
  }
  function renderBlocks(){revoke(urls);if(orchardEdit()){renderOrchardCards();return;}var root=q('#resource-blocks');root.replaceChildren();record.blocks.forEach(function(block,i){var row=document.createElement('div');row.className='flow-block';var select=document.createElement('select');select.setAttribute('aria-label',(i+1)+'번째 구성 유형');select.innerHTML='<option value="title">제목</option><option value="body">본문·단</option><option value="table">가로표</option>';select.value=block.kind;select.disabled=kind==='calendar';select.onchange=function(){block.kind=select.value;dirty=true;};row.append(select);
      var upload=document.createElement('div');var file=document.createElement('input');file.type='file';file.accept=kind==='calendar'?'.pdf,image/png,image/jpeg,image/webp':'image/png,image/jpeg,image/webp';file.setAttribute('aria-label',(i+1)+'번째 원본 파일');var name=document.createElement('p');name.className='flow-file';name.textContent=block.name || '원본 파일 선택';file.onchange=function(){var picked=file.files[0];if(!picked)return;var allowed=/^image\/(png|jpeg|webp)$/.test(picked.type)||kind==='calendar'&&(picked.type==='application/pdf'||/\.pdf$/i.test(picked.name));if(!allowed){status(kind==='calendar'?'PDF 또는 PNG·JPG·WebP 파일을 선택해 주세요.':'본문·표에는 PNG·JPG·WebP 이미지를 선택해 주세요.',true);file.value='';return;}block.file=picked;delete block.src;delete block.fragments;delete block.width;block.name=picked.name;dirty=true;renderBlocks();status('파일을 선택했습니다. 저장 후 이 브라우저에 보관합니다.');};upload.append(file,name);row.append(upload);
      var alt=document.createElement('input');alt.type='text';alt.value=block.alt || '';alt.placeholder='대체 설명';alt.setAttribute('aria-label',(i+1)+'번째 대체 설명');alt.oninput=function(){block.alt=alt.value;dirty=true;};row.append(alt);
      var actions=document.createElement('div');actions.className='flow-block__actions';[['위',-1],['아래',1]].forEach(function(a){var btn=document.createElement('button');btn.type='button';btn.className='btn';btn.textContent=a[0];btn.disabled=kind==='calendar'||i+a[1]<0||i+a[1]>=record.blocks.length;btn.onclick=function(){var j=i+a[1];[record.blocks[i],record.blocks[j]]=[record.blocks[j],record.blocks[i]];dirty=true;renderBlocks();};actions.append(btn);});var remove=document.createElement('button');remove.type='button';remove.className='btn';remove.textContent='제거';remove.disabled=kind==='calendar';remove.onclick=function(){record.blocks.splice(i,1);dirty=true;renderBlocks();};actions.append(remove);row.append(actions);root.append(row);
    });}
  function addImage(root,block,wide){var src=fileSource(block,true);if(!src)return;var pdf=block.file&&(block.file.type==='application/pdf'||/\.pdf$/i.test(block.file.name));if(pdf){var link=document.createElement('a');link.href=src;link.target='_blank';link.rel='noopener';link.className='btn';link.textContent='선택한 재배력 PDF 열기';root.append(link);return;}var im=document.createElement('img');im.src=src;im.alt=block.alt || block.name || '원본';if(wide){im.style.width=(block.width || 800)+'px';root.append(im);}else if(block.kind==='title'){var heading=document.createElement('div');heading.className='flow-orchard-title';heading.append(im);root.append(heading);}else{var button=document.createElement('button');button.type='button';button.className='flow-phone__image';button.setAttribute('aria-label',(block.alt||block.name||'원본')+' 확대');button.append(im);button.onclick=function(){zoom(block);};root.append(button);}}
  function phoneRoot(title){var phone=document.createElement('div');phone.className='flow-phone';var header=document.createElement('div');header.className='flow-phone__header';header.textContent='‹  '+title;var body=document.createElement('div');body.className='flow-phone__body';var nav=document.createElement('div');nav.className='flow-phone__nav';nav.textContent='홈　 납부현황　 공지·게시글　 교육영상　 알림';phone.append(header,body,nav);return {phone:phone,body:body};}
  function previewCalendar(){
    var root=q('#resource-preview-body');
    root.replaceChildren();
    var phone=phoneRoot('복숭아 재배력');
    var paper=document.createElement('div');
    paper.className='flow-phone__paper';
    var title=document.createElement('h3');
    title.className='flow-phone__title';
    var titleText=q('#resource-title').value.trim();
    title.textContent=titleText || '제목이 입력되지 않았습니다.';
    paper.append(title);
    if(!q('#resource-app').checked){
      var channelNote=document.createElement('p');
      channelNote.className='flow-phone__empty';
      channelNote.textContent='App 노출채널이 선택되지 않았습니다. 입력한 내용과 첨부 이미지는 그대로 유지됩니다.';
      paper.append(channelNote);
    }else{
      var items=calendarGalleries && calendarGalleries.app || [];
      if(!items.length){
        var empty=document.createElement('p');
        empty.className='flow-phone__empty';
        empty.textContent='첨부한 App 이미지가 없습니다.';
        paper.append(empty);
      }else{
        items.forEach(function(item){
          var figure=document.createElement('div');
          figure.className='flow-phone__image';
          var image=document.createElement('img');
          image.src=item.url;
          image.alt=item.name || '';
          figure.append(image);
          paper.append(figure);
        });
      }
    }
    phone.body.append(paper);
    root.append(phone.phone);
    q('#resource-preview-dialog').showModal();
  }
  function preview(value){revoke(previewUrls);var root=q('#resource-preview-body');root.replaceChildren();var phone=phoneRoot(kind==='calendar'?'복숭아 재배력':'월별 과원관리');if(kind==='orchard'){var bar=document.createElement('div');bar.className='flow-phone__month';bar.textContent=year+'년 '+month+'월　　월 선택은 앱에서 검수';phone.body.append(bar);phone.body.style.background=value.bg || '#f4f6f0';phone.body.style.setProperty('--flow-accent',value.accent || '#245d46');}
    var paper=document.createElement('div');paper.className='flow-phone__paper';if(value.spiral){var spiral=document.createElement('img');spiral.src=value.spiral;spiral.alt='';paper.append(spiral);}value.blocks.forEach(function(block){if(block.kind==='table'){var wide=document.createElement('div');wide.className='flow-wide';addImage(wide,block,true);paper.append(wide);}else if(block.fragments&&block.fragments.length){var button=document.createElement('button');button.type='button';button.className='flow-phone__image';button.setAttribute('aria-label',(block.alt||'본문')+' 확대');block.fragments.forEach(function(f){var im=document.createElement('img');im.src=f.src;im.alt=block.alt || '';button.append(im);});button.onclick=function(){zoom(block);};paper.append(button);}else addImage(paper,block,false);});phone.body.append(paper);root.append(phone.phone);var actual=document.createElement('a');actual.className='btn';actual.textContent='저장한 자료를 실제 앱에서 검수';actual.href='../../퍼블리싱_v3/복숭아자조금_앱/index.html?connected=1&review=1&target='+encodeURIComponent(JSON.stringify(kind==='calendar'?{kind:'calendar'}:{kind:'orchard',year:year,month:month}));actual.target='_blank';actual.rel='noopener';root.append(actual);var note=document.createElement('p');note.className='flow-guide';note.textContent='통합 검수 실행 주소에서 이용합니다. 저장 전 입력값은 위 미리보기에서 확인하고, 실제 앱에는 마지막 저장값·공개 상태·App 채널을 적용합니다.';root.append(note);q('#resource-preview-dialog').showModal();}
  function zoom(block){var dialog=q('#resource-zoom'),viewport=q('.flow-zoom__viewport',dialog);viewport.replaceChildren();viewport.classList.remove('is-zoomed');var images=block.fragments&&block.fragments.length?block.fragments:[block];images.forEach(function(b){var im=document.createElement('img');im.src=fileSource(b,true);im.alt=block.alt || '원본 확대';viewport.append(im);});q('#resource-zoom-title').textContent=block.alt || block.name || '원본 확대';dialog.showModal();}
  function previewDbAppRecord(headerTitle, rec){
    var root=q('#resource-preview-body');
    if(!root)return;
    root.replaceChildren();
    var phone=phoneRoot(headerTitle);
    var paper=document.createElement('div');
    paper.className='flow-phone__paper';
    var title=document.createElement('h3');
    title.className='flow-phone__title';
    title.textContent=(rec && rec.title) ? rec.title : '제목이 입력되지 않았습니다.';
    paper.append(title);
    var items=(rec && rec.appImages) || [];
    if(!items.length){
      var empty=document.createElement('p');
      empty.className='flow-phone__empty';
      empty.textContent='첨부한 App 이미지가 없습니다.';
      paper.append(empty);
    }else{
      items.forEach(function(item){
        var figure=document.createElement('div');
        figure.className='flow-phone__image';
        var image=document.createElement('img');
        image.src=item.path || item.url || '';
        image.alt=item.name || '';
        figure.append(image);
        paper.append(figure);
      });
    }
    phone.body.append(paper);
    root.append(phone.phone);
    var dlg=q('#resource-preview-dialog');
    if(dlg && dlg.showModal) dlg.showModal();
  }
  async function fetchDbOrchard(yy, mm){
    try{
      var res=await fetch('proc/orchard_proc.asp?action=get&year='+yy+'&month='+mm);
      var json=await res.json();
      if(json && json.success && json.item){
        var it=json.item;
        var imgs=Array.isArray(json.images)?json.images:[];
        var appImgs=imgs.filter(function(img){return String(img.channel).toUpperCase()==='APP';});
        return {
          id:it.id,
          year:it.year,
          month:it.month,
          title:it.title,
          visibility:it.visibility,
          channels:it.channels||[],
          appImages:appImgs
        };
      }
    }catch(e){}
    return null;
  }
  async function fetchDbCalendar(yy){
    try{
      var res=await fetch('proc/calendar_proc.asp?action=get&year='+yy);
      var json=await res.json();
      if(json && json.success && json.item){
        var it=json.item;
        var imgs=Array.isArray(json.images)?json.images:[];
        var appImgs=imgs.filter(function(img){return String(img.channel).toUpperCase()==='APP';});
        return {
          id:it.id,
          year:it.year,
          title:it.title,
          visibility:it.visibility,
          channels:it.channels||[],
          appImages:appImgs
        };
      }
    }catch(e){}
    return null;
  }
  async function homePreview(){
    var current=new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'}),y=Number(current.slice(0,4)),m=Number(current.slice(5,7));
    var isPublicApp=function(r){return !!(r && r.visibility==='public' && Array.isArray(r.channels) && r.channels.includes('App'));};
    async function loadAppMonthly(yy, mm){
      var cur=await fetchDbOrchard(yy, mm);
      if(isPublicApp(cur)) return cur;
      var prev=await fetchDbOrchard(yy-1, mm);
      if(isPublicApp(prev)) return prev;
      return null;
    }
    var monthly=await loadAppMonthly(y, m);
    var calendar=await fetchDbCalendar(y);
    var selected=0;
    var root=q('#home-preview-body');
    function render(){
      root.replaceChildren();
      var phone=phoneRoot('앱 홈 영역 미리보기'),card=document.createElement('div');
      card.className='flow-home-card';
      var r=selected===0?monthly:calendar;
      var avail=isPublicApp(r);
      var title=document.createElement('strong');
      title.textContent=selected===0?m+'월의 복숭아 과원관리':'복숭아 재배력';
      card.append(title);
      var p=document.createElement('p');
      p.textContent=avail?r.title:'앱 공개 자료가 없습니다.';
      card.append(p);
      var btn=document.createElement('button');
      btn.type='button';
      btn.textContent=selected===0?'월별 관리 자료 보기':'재배력 보기';
      btn.disabled=!avail;
      btn.onclick=function(){
        if(!avail) return;
        previewDbAppRecord(selected===0?'월별 과원관리':'복숭아 재배력', r);
      };
      card.append(btn);
      phone.body.append(card);
      root.append(phone.phone);
      q('#home-slide-month').setAttribute('aria-pressed',String(selected===0));
      q('#home-slide-calendar').setAttribute('aria-pressed',String(selected===1));
    }
    var controls=document.createElement('div');
    controls.className='flow-row';
    controls.innerHTML='<label>검수 연도 <input id=home-review-year type=number min=2000 max=2100 value='+y+'></label><label>검수 월 <select id=home-review-month>'+Array.from({length:12},function(_,i){return '<option value='+ (i+1) +'>'+ (i+1) +'월</option>';}).join('')+'</select></label>';
    root.before(controls);
    q('#home-review-month').value=m;
    controls.onchange=async function(){
      var yy=Number(q('#home-review-year').value),mm=Number(q('#home-review-month').value);
      if(!Number.isInteger(yy)||yy<2000||yy>2100)return;
      y=yy;m=mm;
      monthly=await loadAppMonthly(y, m);
      calendar=await fetchDbCalendar(y);
      render();
    };
    q('#home-slide-month').onclick=function(){selected=0;render();};
    q('#home-slide-calendar').onclick=function(){selected=1;render();};
    render();
  }
  Admin.ready(async function(){try{records=await ResourceStore.all();var mode=document.body.dataset.resource;if(mode==='list')await list();else if(mode==='home')await homePreview();else await edit();}catch(error){status('자료를 불러오지 못했습니다. 브라우저 저장소 사용 권한을 확인한 후 새로고침해 주세요.',true);}
    document.querySelectorAll('[data-flow-close]').forEach(function(btn){btn.onclick=function(){btn.closest('dialog').close();};});document.querySelectorAll('dialog.flow-zoom,dialog.flow-preview-dialog').forEach(function(d){d.addEventListener('click',function(e){var b=d.getBoundingClientRect();if(e.target===d&&(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom))d.close();});});var toggle=q('#resource-zoom-toggle');if(toggle)toggle.onclick=function(){q('.flow-zoom__viewport').classList.toggle('is-zoomed');};
    window.addEventListener('pagehide',function(){revoke(urls);revoke(previewUrls);});
  });
})();
