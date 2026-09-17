(function(){
  'use strict';
  var store=window.MiniStore;
  if(!store)return;
  var screen=document.querySelector('.screen');
  document.querySelectorAll('#home .space-info .meta').forEach(function(meta){
    var tags=meta.textContent.split('·').map(function(text){return node('span',text.trim())});
    meta.replaceChildren.apply(meta,tags);
  });
  var disclosure='仅保存到当前浏览器，未发送至工作人员；不代表预约、入园或维修已受理。请勿在公共设备填写真实个人信息。';
  var names={visitors:'访客记录',repairs:'报修记录',consultations:'咨询记录',feedback:'反馈记录'};
  var pages={visitors:'visitor-records',repairs:'repair-records',consultations:'consultation-records',feedback:'feedback-records'};
  var entries={visitors:'visitor',repairs:'repair'};
  function node(tag,text,className){
    var element=document.createElement(tag);
    if(text!==undefined)element.textContent=text;
    if(className)element.className=className;
    return element;
  }
  function button(text,action,className){
    var element=node('button',text,className||'chip');
    element.type='button';element.onclick=action;return element;
  }
  function go(page,title,parent){
    var isList=Object.keys(pages).some(function(kind){return pages[kind]===page});
    if(isList||page==='local-identity'||page==='local-privacy')parent='profile';
    if(window.__setMiniRoute&&(title||parent))window.__setMiniRoute(page,title,parent);
    window.__showMiniPage(page);
    if(title)document.querySelector('.navbar>span').textContent=title;
  }
  function section(id){
    var element=document.getElementById(id);
    if(!element){element=node('section');element.id=id;element.className='hidden';screen.appendChild(element)}
    return element;
  }
  function status(container){
    var text=node('p','', 'service-status');text.setAttribute('role','status');text.tabIndex=-1;container.appendChild(text);return text;
  }
  function message(target,text,input){
    target.textContent=text;
    if(input)input.focus();else target.focus();
    return false;
  }
  function consent(container,before){
    var label=node('label',undefined,'agreement');
    var input=node('input');input.type='checkbox';
    label.append(input,node('span','我同意将本次填写的信息保存在本机浏览器，仅用于演示，不会发送给园区。'));
    container.insertBefore(label,before||null);return input;
  }
  function field(container,label,type){
    var row=node('div',undefined,'form-row'),heading=node('label',label),input=node('input');
    input.id='service-field-'+store.id();heading.htmlFor=input.id;input.type=type||'text';input.placeholder='请输入'+label;
    input.maxLength=type==='tel'?11:100;row.append(heading,input);container.appendChild(row);return input;
  }
  function phoneValid(input,target){
    return /^1[3-9]\d{9}$/.test(input.value.trim())||message(target,'请填写有效的11位手机号。',input);
  }
  function required(input,target,label){
    return !!input.value.trim()||message(target,'请填写'+label+'。',input);
  }
  function save(kind,record,target){
    record.id=store.id();record.created=new Date().toISOString();record.state='本机已保存 · 未发送';
    store.data[kind].unshift(record);
    if(!store.save()){
      store.data[kind].shift();
      return message(target,'保存失败，未生成记录。请检查浏览器存储权限或空间后重试。');
    }
    renderAll();showRecord(kind,record);
    return true;
  }
  var style=node('style');
  style.textContent='.service-status{font-size:12px;line-height:1.7;color:var(--muted);margin:12px 0;overflow-wrap:anywhere}.service-status:empty{display:none}.service-record-button{width:100%;text-align:left;border:0;color:var(--text);cursor:pointer}.service-record-button p{font-size:12px;line-height:1.7;margin-top:6px;color:var(--muted)}.service-record-detail{padding:16px}.service-record-detail dl{margin:12px 0}.service-record-detail dt{font-size:12px;color:var(--muted);margin-top:16px}.service-record-detail dd{margin:6px 0;line-height:1.7;white-space:pre-wrap;overflow-wrap:anywhere}.service-record-detail .chip{min-height:40px;margin:6px 8px 6px 0}.service-notice{margin:0 0 14px;padding:12px;border-radius:12px;background:var(--soft);color:var(--brand);font-size:12px;line-height:1.7}.service-date-input{width:100%;min-height:48px;border:1px solid var(--line);border-radius:12px;padding:10px;background:white;color:var(--text)}';
  document.head.appendChild(style);
  var detail=section('service-record-detail');detail.classList.add('service-record-detail');
  function showRecord(kind,record){
    detail.replaceChildren(button('返回'+names[kind],function(){go(pages[kind],names[kind])}));
    detail.append(node('h2',record.title),node('p',record.sample?'演示样例，仅展示记录样式与流程，不代表实际提交或处理。':disclosure,'service-notice'));
    var list=node('dl');
    [['记录编号',record.id],['状态',record.state],['保存时间',new Date(record.created).toLocaleString('zh-CN')]].concat(record.fields).forEach(function(pair){list.append(node('dt',pair[0]),node('dd',pair[1]))});
    detail.appendChild(list);
    detail.append(button('查看全部'+names[kind],function(){go(pages[kind],names[kind])}));
    go(detail.id,names[kind]+'详情',pages[kind]);
  }
  function render(kind){
    var list=section(pages[kind]);list.replaceChildren();
    list.append(node('p',disclosure,'service-notice'));
    var records=store.displayRecords(kind),isExample=!store.data[kind].length&&records.length;
    var title=node('div',undefined,'field-title');title.append(node('b',(isExample?'演示样例':'本机记录')+' · '+records.length));list.appendChild(title);
    if(!records.length)list.append(node('p','暂无本机记录。填写并保存后，可在这里查看详情。','service-status'));
    records.forEach(function(record){
      var card=button('',function(){showRecord(kind,record)},'booking-record card service-record-button');
      card.append(node('b',record.title),node('p',record.state),node('p',new Date(record.created).toLocaleString('zh-CN')),node('p','查看详情 →'));list.appendChild(card);
    });
    if(entries[kind])list.append(button(kind==='visitors'?'登记访客':'填写报修',function(){go(entries[kind])},'primary-button'));
    else if(kind==='consultations')list.append(button('新增咨询留言',openContact,'primary-button'));
    else list.append(button('填写反馈',function(){go('feedback')},'primary-button'));
    var count=document.querySelector('.profile-stats [data-page="'+pages[kind]+'"] b');
    if(count){count.textContent=records.length;count.title=isExample?'演示样例数量':'本机记录数量'}
  }
  function renderAll(){Object.keys(names).forEach(render)}
  var modal=document.getElementById('contact-modal'),contactButton=document.getElementById('contact-submit');
  var contactConsent=consent(modal.querySelector('.contact-sheet'),contactButton);
  var contactStatus=status(modal.querySelector('.contact-sheet'));
  modal.querySelector('.contact-intro').textContent=disclosure;
  contactButton.textContent='保存本机留言';
  var contactSource='园区咨询',contactOpener;
  function openContact(){
    contactOpener=document.activeElement;contactSource='园区咨询';
    var space=document.getElementById('space-detail');
    if(!space.classList.contains('hidden'))contactSource=document.getElementById('space-detail-title').textContent;
    contactStatus.textContent='';contactConsent.checked=false;
    modal.classList.remove('hidden');document.getElementById('contact-name').focus();
  }
  document.getElementById('home-consult-open').onclick=openContact;
  document.getElementById('space-contact-open').onclick=openContact;
  modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','保存咨询留言');
  function closeContact(){modal.classList.add('hidden');if(contactOpener)contactOpener.focus()}
  document.getElementById('contact-close').onclick=modal.querySelector('.contact-mask').onclick=closeContact;
  modal.addEventListener('keydown',function(event){
    if(event.key==='Escape'){event.preventDefault();closeContact()}
    if(event.key==='Tab'){
      var focusable=Array.from(modal.querySelectorAll('button,input,textarea')).filter(function(item){return !item.disabled&&item.getClientRects().length});
      if(event.shiftKey&&document.activeElement===focusable[0]){event.preventDefault();focusable[focusable.length-1].focus()}
      else if(!event.shiftKey&&document.activeElement===focusable[focusable.length-1]){event.preventDefault();focusable[0].focus()}
    }
  });
  contactButton.onclick=function(){
    var name=document.getElementById('contact-name'),phone=document.getElementById('contact-phone'),email=document.getElementById('contact-email'),note=document.getElementById('contact-note');
    if(!required(name,contactStatus,'姓名')||!phoneValid(phone,contactStatus))return;
    if(email.value.trim()&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()))return message(contactStatus,'请填写有效的邮箱地址。',email);
    if(!required(note,contactStatus,'留言内容'))return;
    if(!contactConsent.checked)return message(contactStatus,'请先同意仅在本机保存信息。',contactConsent);
    if(save('consultations',{title:contactSource,fields:[['姓名',name.value.trim()],['电话',phone.value.trim()],['邮箱',email.value.trim()],['留言备注',note.value.trim()]]},contactStatus)){
      modal.classList.add('hidden');[name,phone,email,note].forEach(function(input){input.value=''});contactConsent.checked=false;
    }
  };
  ['contact-name','contact-email'].forEach(function(id){document.getElementById(id).maxLength=100});
  document.getElementById('contact-note').maxLength=2000;
  var visitor=document.getElementById('visitor'),visitorInputs=visitor.querySelectorAll('.form-card input'),visitorButton=visitor.querySelector('.primary-button');
  var visitorAgreement=visitor.querySelector('.agreement');visitorAgreement.remove();
  var visitorConsent=consent(visitor,visitorButton),visitorStatus=status(visitor);
  visitorButton.textContent='保存本机访客申请';
  visitor.querySelector('.form-card').before(node('p',disclosure,'service-notice'));
  var datePicker=document.getElementById('date-picker'),dateField=document.getElementById('visitor-date');
  var dateInput=node('input');dateInput.type='datetime-local';dateInput.className='service-date-input';dateInput.style.gridColumn='1 / -1';dateInput.style.alignSelf='center';dateInput.setAttribute('aria-label','到访日期和时间');
  datePicker.querySelector('.date-wheels').replaceChildren(dateInput);
  datePicker.querySelector('.date-picker-subtitle').textContent='请选择未来的到访时间';
  var dateStatus=status(datePicker.querySelector('.date-picker-sheet'));
  function closeDate(){datePicker.classList.add('hidden');dateField.focus()}
  document.getElementById('date-cancel').onclick=datePicker.querySelector('.date-picker-mask').onclick=closeDate;
  datePicker.setAttribute('role','dialog');datePicker.setAttribute('aria-modal','true');datePicker.setAttribute('aria-label','选择到访时间');
  datePicker.addEventListener('keydown',function(event){
    if(event.key==='Escape'){event.preventDefault();closeDate()}
    if(event.key==='Tab'){
      var items=Array.from(datePicker.querySelectorAll('button,input')).filter(function(item){return !item.disabled&&item.getClientRects().length});
      if(event.shiftKey&&document.activeElement===items[0]){event.preventDefault();items[items.length-1].focus()}
      else if(!event.shiftKey&&document.activeElement===items[items.length-1]){event.preventDefault();items[0].focus()}
    }
  });
  function localDateTime(date){return new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16)}
  dateField.onclick=function(){
    dateInput.min=localDateTime(new Date(Date.now()+60000));dateInput.value=dateField.value||dateInput.min;dateStatus.textContent='';
    datePicker.classList.remove('hidden');dateInput.focus();
  };
  document.getElementById('date-confirm').onclick=function(){
    if(!dateInput.value||!Number.isFinite(new Date(dateInput.value).getTime())||new Date(dateInput.value)<=new Date())return message(dateStatus,'请选择未来的有效到访时间。',dateInput);
    dateField.value=dateInput.value;closeDate();
  };
  visitorButton.onclick=function(){
    if(!required(visitorInputs[0],visitorStatus,'访客姓名')||!phoneValid(visitorInputs[1],visitorStatus)||!required(visitorInputs[2],visitorStatus,'到访企业或房间'))return;
    if(!dateField.value||!Number.isFinite(new Date(dateField.value).getTime())||new Date(dateField.value)<=new Date())return message(visitorStatus,'请选择未来的有效到访时间。',dateField);
    if(!visitorConsent.checked)return message(visitorStatus,'请先同意仅在本机保存信息。',visitorConsent);
    if(save('visitors',{title:'访客申请 · '+visitorInputs[0].value.trim(),fields:[['访客姓名',visitorInputs[0].value.trim()],['手机号',visitorInputs[1].value.trim()],['到访企业',visitorInputs[2].value.trim()],['到访时间',dateField.value.replace('T',' ')]]},visitorStatus)){
      visitorInputs.forEach(function(input){input.value=''});visitorConsent.checked=false;visitorStatus.textContent='';
    }
  };
  var repair=document.getElementById('repair'),repairCard=repair.querySelector('.form-card'),repairRoom=repairCard.querySelector('input'),repairNote=repairCard.querySelector('textarea'),repairSelects=repairCard.querySelectorAll('select');
  var repairName=field(repairCard,'联系人姓名'),repairPhone=field(repairCard,'联系电话','tel');
  var repairButton=repair.querySelector('.primary-button'),repairConsent=consent(repair,repairButton),repairStatus=status(repair);
  repairCard.before(node('p',disclosure,'service-notice'));repairButton.textContent='保存本机报修单';repairNote.maxLength=2000;
  repairButton.onclick=function(){
    if(!required(repairRoom,repairStatus,'具体房间')||!required(repairNote,repairStatus,'问题描述')||!required(repairName,repairStatus,'联系人姓名')||!phoneValid(repairPhone,repairStatus))return;
    if(!repairConsent.checked)return message(repairStatus,'请先同意仅在本机保存信息。',repairConsent);
    if(save('repairs',{title:repairSelects[1].value+' · '+repairRoom.value.trim(),fields:[['报修位置',repairSelects[0].value+' · '+repairRoom.value.trim()],['问题类型',repairSelects[1].value],['问题描述',repairNote.value.trim()],['联系人姓名',repairName.value.trim()],['联系电话',repairPhone.value.trim()]]},repairStatus)){
      [repairRoom,repairNote,repairName,repairPhone].forEach(function(input){input.value=''});repairConsent.checked=false;repairStatus.textContent='';
    }
  };
  var feedback=document.getElementById('feedback'),feedbackNote=feedback.querySelector('textarea'),feedbackPhone=feedback.querySelector('input'),feedbackButton=feedback.querySelector('.primary-button');
  var feedbackConsent=consent(feedback,feedbackButton),feedbackStatus=status(feedback);feedbackButton.textContent='保存本机反馈';feedbackNote.maxLength=2000;
  feedback.querySelector('.form-card').before(node('p',disclosure,'service-notice'));
  feedbackButton.onclick=function(){
    if(!required(feedbackNote,feedbackStatus,'反馈内容')||(feedbackPhone.value.trim()&&!phoneValid(feedbackPhone,feedbackStatus)))return;
    if(!feedbackConsent.checked)return message(feedbackStatus,'请先同意仅在本机保存信息。',feedbackConsent);
    if(save('feedback',{title:feedback.querySelector('select').value,fields:[['反馈内容',feedbackNote.value.trim()],['联系电话',feedbackPhone.value.trim()]]},feedbackStatus)){feedbackNote.value='';feedbackPhone.value='';feedbackConsent.checked=false;feedbackStatus.textContent=''}
  };
  var profile=document.getElementById('profile'),login=profile.querySelector('.profile-login');
  var identity=profile.querySelector('.profile-identity');
  identity.querySelector('span').textContent='无本机记录时展示样例，仅供体验';
  login.textContent='演示身份';
  login.onclick=function(){
    var identityPage=section('local-identity');identityPage.replaceChildren(node('h2','本机演示身份'),node('p','本页面未接入微信或手机号认证，不会验证身份，也不提供跨设备同步。可继续以访客身份体验全部本机记录流程。','service-notice'),button('返回我的',function(){go('profile')},'primary-button'));
    go(identityPage.id,'演示身份说明');
  };
  profile.querySelectorAll('.profile-menu-row').forEach(function(row){
    var label=row.querySelector('b').textContent;
    if(label==='园区咨询')row.onclick=openContact;
    if(label==='隐私与授权')row.onclick=function(){
      var privacy=section('local-privacy');privacy.replaceChildren(node('h2','隐私与本机保存'),node('p','本演示不进行登录认证，也不会向园区提交表单。勾选同意后，姓名、手机号、邮箱、留言及预约资料会保存在当前浏览器的本地存储中，关闭或刷新后仍可查看。同一设备的其他使用者也可能看到这些资料，请仅使用演示信息。','service-notice'),node('p','清除浏览器网站数据会删除记录。下方按钮仅清除此演示的本机记录，不影响其他网站。','service-status'));
      var result=status(privacy);
      privacy.append(button('清除本机全部记录',function(){
        if(!window.confirm('确认清除本机所有预约、访客、报修、咨询和反馈记录？此操作无法撤销。'))return;
        var previous={};['bookings','visitors','repairs','consultations','feedback'].forEach(function(key){previous[key]=store.data[key];store.data[key]=[]});
        if(!store.save()){Object.keys(previous).forEach(function(key){store.data[key]=previous[key]});message(result,'清除失败，原记录已保留。');return}
        renderAll();window.dispatchEvent(new Event('mini-records-change'));message(result,'已清除本机记录。');
      }),button('返回我的',function(){go('profile')}));
      go(privacy.id,'隐私与授权');
    };
  });
  ['consultations','feedback'].forEach(function(kind){
    var row=button('',function(){go(pages[kind],names[kind])},'profile-menu-row');
    var copy=node('span',undefined,'profile-menu-copy');copy.append(node('b',names[kind]),node('small','查看本机保存的信息 · 未发送'));row.appendChild(copy);profile.querySelectorAll('.profile-menu')[1].appendChild(row);
  });
  ['vehicle','restaurant'].forEach(function(id){
    var page=document.getElementById(id),notice=node('p','演示展示：车辆、停车及餐饮服务尚未接通，不会绑定车辆、扣费或生成真实订单。','service-notice');
    page.querySelector('.page-top').after(notice);
    var feedbackLine=status(page);
    page.querySelectorAll(id==='vehicle'?'.chip,.profile-row,.list-row':'.chip').forEach(function(control){
      control.setAttribute('role','button');if(control.tagName!=='BUTTON')control.tabIndex=0;
      control.onclick=function(event){event.preventDefault();event.stopPropagation();message(feedbackLine,'“'+control.textContent.trim()+'”尚未接通，当前仅作展示。未产生绑定、费用或订单。')};
      if(control.tagName!=='BUTTON')control.onkeydown=function(event){if(event.key==='Enter'||event.key===' '){event.preventDefault();control.click()}};
    });
  });
  // 标识与现有提交校验一致，不把预约备注变成必填项。
  var requiredStyle=node('style');
  requiredStyle.textContent='.required-mark{color:#c43d3d;margin-right:4px;font-weight:600}.required-hint{font-size:12px;color:var(--muted);margin:8px 0}.optional-mark{color:var(--muted);font-size:12px;font-weight:400}';
  document.head.appendChild(requiredStyle);
  function markRequired(label,input){
    if(!label)return;
    var star=node('span','*','required-mark');star.setAttribute('aria-hidden','true');label.prepend(star);
    if(input){
      input.required=true;input.setAttribute('aria-required','true');
      if(input.type!=='checkbox'){
        if(!input.id)input.id='required-field-'+store.id();
        label.htmlFor=input.id;
      }
    }
  }
  ['#contact-modal','#visitor','#repair','#feedback'].forEach(function(selector){
    var container=document.querySelector(selector);
    container.querySelectorAll('.form-row').forEach(function(row){
      var label=row.querySelector('label'),input=row.querySelector('input,select,textarea');
      if(input===document.getElementById('contact-email')||input===feedbackPhone){
        input.required=false;input.removeAttribute('aria-required');
        label.htmlFor=input.id||(input.id='optional-field-'+store.id());
        label.appendChild(node('span','（选填）','optional-mark'));
      }else markRequired(label,input);
    });
    container.querySelectorAll('.agreement input').forEach(function(input){input.required=true;input.setAttribute('aria-required','true')});
    container.querySelector('.form-card').before(node('p','* 为必填项','required-hint'));
  });
  var quickForm=document.getElementById('quick-booking-form');
  ['quick-name','quick-phone'].forEach(function(id){markRequired(quickForm.querySelector('label[for="'+id+'"]'),document.getElementById(id))});
  markRequired(quickForm.querySelector('label[for="quick-date-trigger"]'));
  markRequired(quickForm.querySelector('.slots').previousElementSibling);
  var quickConsent=quickForm.querySelector('input[type="checkbox"]');
  quickConsent.required=true;quickConsent.setAttribute('aria-required','true');
  quickForm.prepend(node('p','* 为必填项，时段至少选择一个','required-hint'));
  quickForm.querySelector('label[for="quick-purpose"]').appendChild(node('span','（选填）','optional-mark'));
  // 表单单选使用统一浮层；保留原 select 作为提交数据源。
  var selectStyle=node('style');
  selectStyle.textContent=`
    .service-select-trigger{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;height:40px;padding:0 12px;border:1px solid var(--line);border-radius:8px;background:var(--surface);color:var(--text);font:inherit;font-size:14px;text-align:left;transition:border-color .15s,box-shadow .15s}
    .service-select-trigger:hover{border-color:var(--brand)}
    .service-select-trigger:focus-visible,.service-select-trigger[aria-expanded="true"]{outline:0;border-color:var(--brand);box-shadow:0 0 0 2px color-mix(in srgb,var(--brand) 20%,transparent)}
    .service-select-trigger:active{background:var(--soft)}
    .service-select-trigger svg{width:16px;height:16px;color:var(--muted);transition:transform .15s}
    .service-select-trigger[aria-expanded="true"] svg{transform:rotate(180deg)}
    .service-select-panel{position:fixed;z-index:1000;box-sizing:border-box;padding:8px;overflow-y:auto;border-radius:8px;background:var(--surface);box-shadow:var(--shadow);opacity:0;visibility:hidden;transform:translateY(-4px);transition:opacity .2s,transform .2s,visibility .2s}
    .service-select-panel.open{opacity:1;visibility:visible;transform:translateY(0)}
    .service-select-option{display:flex;align-items:center;justify-content:space-between;width:100%;min-height:40px;margin:0 0 2px;padding:5px 12px;border:0;border-radius:8px;background:var(--surface);color:var(--text);font:inherit;font-size:14px;text-align:left;transition:background-color .15s,color .15s}
    .service-select-option:last-child{margin-bottom:0}
    .service-select-option:hover,.service-select-option:focus-visible,.service-select-option:active{outline:0;background:var(--soft)}
    .service-select-option[aria-selected="true"]{color:var(--brand);font-weight:600}
    .service-select-option svg{width:16px;height:16px;visibility:hidden}
    .service-select-option[aria-selected="true"] svg{visibility:visible}
    @media(prefers-reduced-motion:reduce){.service-select-panel,.service-select-trigger,.service-select-trigger svg,.service-select-option{transition:none;transform:none}}
  `;
  document.head.appendChild(selectStyle);
  var activeSelect=null;
  function closeSelect(restore){
    if(!activeSelect)return;
    var current=activeSelect;activeSelect=null;
    current.panel.classList.remove('open');current.panel.inert=true;
    current.trigger.setAttribute('aria-expanded','false');
    if(restore)current.trigger.focus();
  }
  document.querySelectorAll('#repair .form-row select,#feedback .form-row select').forEach(function(select,index){
    var label=select.parentElement.querySelector('label'),trigger=node('button',null,'service-select-trigger'),value=node('span');
    trigger.type='button';trigger.id='service-select-'+index;
    trigger.setAttribute('role','combobox');trigger.setAttribute('aria-haspopup','listbox');
    trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-required','true');
    label.id=trigger.id+'-label';label.htmlFor=trigger.id;trigger.setAttribute('aria-labelledby',label.id);
    trigger.appendChild(value);trigger.insertAdjacentHTML('beforeend','<i data-lucide="chevron-down" aria-hidden="true"></i>');
    select.hidden=true;select.tabIndex=-1;select.after(trigger);
    var panel=node('div',null,'service-select-panel');panel.id=trigger.id+'-options';panel.inert=true;
    panel.setAttribute('role','listbox');panel.setAttribute('aria-labelledby',label.id);trigger.setAttribute('aria-controls',panel.id);
    document.body.appendChild(panel);
    var items=Array.from(select.options).map(function(option,i){
      var item=node('button',option.text,'service-select-option');item.type='button';item.tabIndex=-1;
      item.setAttribute('role','option');
      item.insertAdjacentHTML('beforeend','<i data-lucide="check" aria-hidden="true"></i>');
      item.onclick=function(){select.selectedIndex=i;select.dispatchEvent(new Event('change',{bubbles:true}));closeSelect(true)};
      panel.appendChild(item);return item;
    });
    function sync(){value.textContent=select.options[select.selectedIndex].text;items.forEach(function(item,i){item.setAttribute('aria-selected',String(i===select.selectedIndex))})}
    select.addEventListener('change',sync);sync();
    function openSelect(){
      closeSelect(false);sync();
      var rect=trigger.getBoundingClientRect(),screen=document.querySelector('.screen').getBoundingClientRect();
      var below=Math.min(screen.bottom,innerHeight)-rect.bottom-8,above=rect.top-Math.max(screen.top,0)-8;
      var height=Math.min(392,items.length*42+14,Math.max(below,above));
      panel.style.width=rect.width+'px';panel.style.left=rect.left+'px';panel.style.maxHeight=height+'px';
      panel.style.top=(below>=height?rect.bottom+8:rect.top-8-height)+'px';
      activeSelect={trigger:trigger,panel:panel};panel.inert=false;panel.classList.add('open');
      trigger.setAttribute('aria-expanded','true');items[select.selectedIndex].focus({preventScroll:true});
    }
    trigger.onclick=function(){if(activeSelect&&activeSelect.trigger===trigger)closeSelect(true);else openSelect()};
    trigger.addEventListener('keydown',function(event){if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();openSelect()}});
    panel.addEventListener('keydown',function(event){
      var i=items.indexOf(document.activeElement);
      if(event.key==='Escape'){event.preventDefault();closeSelect(true)}
      else if(event.key==='Tab'){closeSelect(true)}
      else if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
        event.preventDefault();items[event.key==='Home'?0:event.key==='End'?items.length-1:(i+(event.key==='ArrowDown'?1:-1)+items.length)%items.length].focus();
      }
    });
  });
  document.addEventListener('pointerdown',function(event){if(activeSelect&&!activeSelect.panel.contains(event.target)&&!activeSelect.trigger.contains(event.target))closeSelect(false)});
  document.querySelector('.screen').addEventListener('scroll',function(){closeSelect(false)});
  window.addEventListener('resize',function(){closeSelect(false)});
  if(window.lucide)window.lucide.createIcons();
  renderAll();
})();
