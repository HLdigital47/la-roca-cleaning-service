(()=>{
 const section=document.querySelector('#checklist');if(!section)return;
 const es=document.documentElement.lang.startsWith('es'),t=(sp,en)=>es?sp:en,key='la-roca-checklist-v1';
 const service=section.querySelector('#cl-service'),priority=section.querySelector('#cl-priority'),notes=section.querySelector('#cl-notes'),checks=[...section.querySelectorAll('[data-cl-id]')],feedback=section.querySelector('#cl-feedback');
 let stored=false;try{const saved=JSON.parse(localStorage.getItem(key)||'null');if(saved){service.value=[...service.options].some(o=>o.value===saved.service)?saved.service:'regular';priority.value=saved.priority||'';notes.value=String(saved.notes||'').slice(0,400);checks.forEach(c=>c.checked=Array.isArray(saved.selected)&&saved.selected.includes(c.dataset.clId));}stored=true;}catch{}
 const visible=c=>!c.closest('fieldset').hidden&&!c.closest('.cl-task').hidden;
 function showService(){
  const groups=[...section.querySelectorAll('fieldset')];groups.forEach(g=>g.hidden=g.dataset.clService!==service.value);
  const previous=priority.value;priority.replaceChildren();const empty=document.createElement('option');empty.value='';empty.textContent=t('Sin prioridad especial','No special priority');priority.append(empty);
  groups.filter(g=>!g.hidden).forEach(g=>{const o=document.createElement('option');o.value=g.dataset.clGroup;o.textContent=g.querySelector('legend').textContent;priority.append(o);});priority.value=[...priority.options].some(o=>o.value===previous)?previous:'';
 }
 function summary(){
  const selected=checks.filter(c=>c.checked&&visible(c));const lines=[t('Lista de limpieza - La Roca','Cleaning checklist - La Roca'),t('Servicio: ','Service: ')+service.selectedOptions[0].textContent];
  if(priority.value)lines.push(t('Prioridad: ','Priority: ')+priority.selectedOptions[0].textContent);
  for(const group of section.querySelectorAll('fieldset:not([hidden])')){const tasks=selected.filter(c=>c.closest('fieldset')===group);if(tasks.length){lines.push(group.querySelector('legend').textContent+':');tasks.forEach(c=>lines.push('- '+c.dataset.clLabel));}}
  if(notes.value.trim())lines.push(t('Notas: ','Notes: ')+notes.value.trim());
  lines.push(t('Tareas y precio por confirmar con La Roca.','Tasks and pricing to be confirmed with La Roca.'));return {selected,lines,text:lines.join('\n')};
 }
 function forms(){return [document.querySelector('#quoteform'),document.querySelector('#quote-modal form')].filter(Boolean);}
 function sync(){const s=summary();forms().forEach(f=>{f.dataset.quoteSummary=s.text;});return s;}
 function render(){
  showService();
  checks.forEach(c=>{const m=c.closest('.cl-task').dataset.clMode;c.closest('.cl-task').hidden=m==='moving'&&!['moving','move-in','move-out'].includes(service.value);});
  const s=sync();section.querySelector('#cl-count').textContent=s.selected.length+' '+t('tareas seleccionadas','tasks selected');section.querySelector('#cl-summary-text').textContent=s.selected.length?s.text:t('Marca las tareas que quieres consultar.','Choose the tasks you want to discuss.');
  section.querySelector('#cl-whatsapp').href='https://wa.me/17138789793?text='+encodeURIComponent(s.text);
  try{localStorage.setItem(key,JSON.stringify({service:service.value,priority:priority.value,notes:notes.value,selected:checks.filter(c=>c.checked).map(c=>c.dataset.clId)}));stored=true;}catch{stored=false;}
  section.querySelector('#cl-save').textContent=stored?t('Tu selección se guarda en este navegador.','Your selection is saved in this browser.'):t('La lista funciona, pero no se pudo guardar en este navegador.','The checklist works, but could not be saved in this browser.');
 }
 function requireTasks(e){if(!summary().selected.length){e?.preventDefault();feedback.textContent=t('Selecciona al menos una tarea para continuar.','Select at least one task to continue.');return false;}feedback.textContent='';return true;}
 section.addEventListener('change',render);notes.addEventListener('input',render);
 section.querySelector('#cl-reset').addEventListener('click',()=>{checks.forEach(c=>c.checked=false);notes.value='';priority.value='';render();feedback.textContent=t('Selección borrada.','Selection cleared.');});
 section.querySelector('#cl-whatsapp').addEventListener('click',requireTasks);
 section.querySelector('#cl-pdf').addEventListener('click',()=>{if(!requireTasks())return;const s=sync(),pdf=LaRocaChecklistPDF(['LA ROCA CLEANING SERVICES LLC','713-878-9793 | larocacleaningservices.com','',...s.lines]);const url=URL.createObjectURL(new Blob([pdf],{type:'application/pdf'}));const a=document.createElement('a');a.href=url;a.download=es?'La-Roca-Lista-de-Limpieza.pdf':'La-Roca-Cleaning-Checklist.pdf';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);feedback.textContent=t('PDF preparado para descargar.','PDF ready to download.');});
 section.querySelector('#cl-estimate').addEventListener('click',e=>{if(!requireTasks(e))return;e.preventDefault();sync();const dialog=document.querySelector('#quote-modal');const form=dialog?.querySelector('form')||document.querySelector('#quoteform');const select=form?.querySelector('[name="service"]');if(select){const label=service.selectedOptions[0].textContent;let option=[...select.options].find(o=>o.textContent===label);if(!option){option=document.createElement('option');option.textContent=label;option.value=label;select.append(option);}select.value=option.value;}if(dialog&&!dialog.open)dialog.showModal();form?.querySelector('[name="name"]')?.focus();});
 // Capture before the existing estimate transport reads its message field.
 document.addEventListener('submit',e=>{if(e.target.matches('#quoteform,#quote-modal form'))sync();},true);
 render();
})();
