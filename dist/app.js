import {destinations,trips,createPlan,planFromTrip,planText} from './data.mjs';
const $=(s)=>document.querySelector(s);
const escapeHtml=(s)=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let currentPlan=[];
let selectedTrip=null;
const tripDialog=$('#trip-dialog');
const planDialog=$('#plan-dialog');
function openDialog(dialog){dialog.showModal();document.body.classList.add('modal-open');}
for(const dialog of document.querySelectorAll('dialog')){
  dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{if(!document.querySelector('dialog[open]'))document.body.classList.remove('modal-open');});
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
}
function renderTrips(filter='all'){
  const shown=trips.filter(t=>filter==='all'||t.kind===filter);
  $('#journey-count').textContent=`${String(shown.length).padStart(2,'0')} journeys to inspire you`;
  $('#trip-grid').innerHTML=shown.map(t=>`<article class="trip-card"><button class="trip-image" data-trip="${t.id}" aria-label="Explore ${t.name}"><img src="assets/${t.image}.jpg" alt="${t.image==='alexandria'?'Qaitbay Citadel in Alexandria':t.image==='nile'?'Sailboats on the Nile':t.image==='giza'?'Pyramids of Giza at sunset':t.image==='luxor'?'Ancient Egyptian temple columns and statues':t.image==='cairo'?'Lanterns in Khan el-Khalili, Cairo':t.image==='desert'?'Chalk formations in Egypt’s White Desert':'Egypt’s Red Sea coast'}" loading="lazy"><span class="trip-badge">${t.tag}</span><span class="trip-arrow" aria-hidden="true">↗</span></button><p class="trip-meta">${t.location}</p><h3><button data-trip="${t.id}">${t.name}</button></h3><p class="trip-description">${t.description}</p><div class="trip-footer"><span>${t.days} ${t.days===1?'day':'days'} · ${t.kind==='multi'?'Multi-day journey':'Day experience'}</span><span>Make it yours</span></div></article>`).join('');
}
$('#trip-grid').addEventListener('click',event=>{
  const button=event.target.closest('[data-trip]');if(!button)return;
  const trip=trips.find(t=>t.id===button.dataset.trip);selectedTrip=trip;
  $('#trip-detail').innerHTML=`<img class="detail-image" src="assets/${trip.image}.jpg" alt=""><div class="detail-copy"><p class="eyebrow burgundy">${trip.days} ${trip.days===1?'DAY':'DAYS'} · ${trip.location}</p><h2 id="dialog-title">${trip.name}</h2><p>${trip.detail}</p><ul class="detail-route">${trip.highlights.map(h=>{const [time,text]=h.split('|');return `<li><span>${time}</span><p>${text}</p></li>`;}).join('')}</ul><button class="button" id="use-trip">Make this itinerary mine <span aria-hidden="true">↗</span></button><p class="detail-disclaimer">An itinerary idea to personalize. Transport, stays and experiences are subject to arrangement and availability.</p></div>`;
  openDialog(tripDialog);
});
$('#trip-detail').addEventListener('click',event=>{if(event.target.closest('#use-trip')){currentPlan=planFromTrip(selectedTrip);tripDialog.close();renderPlan();openDialog(planDialog);}});
for(const button of document.querySelectorAll('[data-filter]'))button.addEventListener('click',()=>{
  for(const other of document.querySelectorAll('[data-filter]')){other.classList.toggle('active',other===button);other.setAttribute('aria-pressed',String(other===button));}renderTrips(button.dataset.filter);
});
$('#destination-options').innerHTML=Object.entries(destinations).map(([id,d])=>`<label><input type="checkbox" name="destination" value="${id}" ${['cairo','luxor','aswan'].includes(id)?'checked':''}><span>${d.name}</span></label>`).join('');
$('#builder-form').addEventListener('submit',event=>{
  event.preventDefault();
  const routeOrder=['cairo','alexandria','desert','luxor','aswan','redsea'];
  const places=[...document.querySelectorAll('[name="destination"]:checked')].map(input=>input.value).sort((a,b)=>routeOrder.indexOf(a)-routeOrder.indexOf(b));
  const interests=[...document.querySelectorAll('.interest-options input:checked')].map(input=>input.value);
  try{currentPlan=createPlan({places,days:Number($('#duration').value),pace:$('#pace').value,interests});$('#builder-error').textContent='';renderPlan();openDialog(planDialog);}catch(error){$('#builder-error').textContent=error.message;}
});
function renderPlan(){
  $('#plan-summary').textContent=`${currentPlan.length} ${currentPlan.length===1?'day':'days'} · ${[...new Set(currentPlan.map(d=>destinations[d.place].name))].join(' → ')}`;
  $('#plan-days').innerHTML=currentPlan.map((day,di)=>`<section class="plan-day"><div class="day-heading"><span>DAY ${String(di+1).padStart(2,'0')}</span><h3>${escapeHtml(day.title)}</h3></div><ol class="activities">${day.activities.map((activity,ai)=>`<li class="activity"><textarea rows="2" aria-label="Day ${di+1}, experience ${ai+1}" data-day="${di}" data-activity="${ai}" maxlength="1000">${escapeHtml(activity)}</textarea><div class="activity-actions"><button data-action="up" data-day="${di}" data-activity="${ai}" aria-label="Move experience ${ai+1} up in day ${di+1}" ${ai===0?'disabled':''}>↑</button><button data-action="down" data-day="${di}" data-activity="${ai}" aria-label="Move experience ${ai+1} down in day ${di+1}" ${ai===day.activities.length-1?'disabled':''}>↓</button><button data-action="remove" data-day="${di}" data-activity="${ai}" aria-label="Remove experience ${ai+1} from day ${di+1}">×</button></div></li>`).join('')}</ol><button class="add-activity" data-action="add" data-day="${di}">+ Add an experience</button></section>`).join('');
}
$('#plan-days').addEventListener('input',event=>{if(event.target.matches('textarea'))currentPlan[Number(event.target.dataset.day)].activities[Number(event.target.dataset.activity)]=event.target.value;});
$('#plan-days').addEventListener('click',event=>{
  const button=event.target.closest('[data-action]');if(!button)return;
  const di=Number(button.dataset.day),ai=Number(button.dataset.activity);const list=currentPlan[di].activities;let focusIndex=ai;
  if(button.dataset.action==='add'){list.push('');focusIndex=list.length-1;}
  else if(button.dataset.action==='remove'){list.splice(ai,1);focusIndex=Math.min(ai,list.length-1);}
  else{const other=button.dataset.action==='up'?ai-1:ai+1;[list[ai],list[other]]=[list[other],list[ai]];focusIndex=other;}
  renderPlan();const target=$(`#plan-days textarea[data-day="${di}"][data-activity="${focusIndex}"]`)||$(`#plan-days [data-action="add"][data-day="${di}"]`);target.focus();
});
$('#download-plan').addEventListener('click',()=>{
  const blob=new Blob([planText(currentPlan)],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='My-Egyphoria-Itinerary.txt';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
$('#refine-plan').addEventListener('click',()=>{planDialog.close();$('#builder').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});$('#duration').focus({preventScroll:true});});
const menu=$('.menu-button');menu.addEventListener('click',()=>{const expanded=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded',String(!expanded));menu.setAttribute('aria-label',expanded?'Open menu':'Close menu');$('#main-nav').classList.toggle('open',!expanded);});
for(const link of document.querySelectorAll('#main-nav a'))link.addEventListener('click',()=>{menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open menu');$('#main-nav').classList.remove('open');});
$('#year').textContent=new Date().getFullYear();renderTrips();
