/* Keep the existing editor and preview IDs, with separate app detail presentation. */
Admin.ready(function () {
  var title=document.getElementById('preview-title'),body=document.getElementById('preview-body'),image=document.getElementById('preview-image');
  if(!title||!body||!image)return;
  var phone=document.createElement('div');phone.className='flow-phone';
  var header=document.createElement('div');header.className='flow-phone__header';
  var inner=document.createElement('div');inner.className='flow-phone__body';
  var type=document.createElement('p');var attached=document.createElement('div');
  var parent=title.parentNode;parent.insertBefore(phone,title);inner.append(type,title,image,body,attached);phone.append(header,inner);
  document.getElementById('contents-preview').addEventListener('click',function(){
    var category=document.querySelector('[name="category"]').value;
    var notice=category==='공지';header.textContent='‹ 자료 상세';
    phone.dataset.appDetailKind=notice?'notice':'article';type.textContent=notice?'공지':'게시글';
    attached.replaceChildren();window.previewPostAttachment(attached);
    body.querySelectorAll('script,iframe,object,embed,style,link,meta,form,input,button,svg,math').forEach(function(el){el.remove();});
    body.querySelectorAll('*').forEach(function(el){Array.from(el.attributes).forEach(function(a){if(/^on/i.test(a.name)||a.name==='srcdoc'||(['href','src','xlink:href'].includes(a.name)&&/^\s*(?:javascript|vbscript|data:(?!image\/(?:png|jpeg|webp);base64,))/i.test(a.value)))el.removeAttribute(a.name);});});
  });
});
