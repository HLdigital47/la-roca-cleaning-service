(()=>{
 const page=document.querySelector('.dk-page');if(!page)return;
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 const frames=[...page.querySelectorAll('.dk-frame')],slides=[...page.querySelectorAll('[data-dk-slide]')],pause=page.querySelector('.dk-pause'),visual=page.querySelector('.dk-visual');
 let current=0,timer=null,playing=false;
 function show(i){current=i;frames.forEach((f,n)=>{f.classList.toggle('is-active',n===i);f.setAttribute('aria-hidden',String(n!==i));});slides.forEach((b,n)=>b.setAttribute('aria-pressed',String(n===i)));}
 function stop(){clearInterval(timer);timer=null;playing=false;visual.classList.remove('dk-playing');pause.textContent=pause.dataset.play;}
 function start(){stop();if(document.hidden)return;playing=true;visual.classList.add('dk-playing');pause.textContent=pause.dataset.pause;timer=setInterval(()=>show((current+1)%frames.length),6500);}
 page.querySelector('.dk-stage-controls').hidden=false;
 slides.forEach((b,i)=>b.addEventListener('click',()=>{stop();show(i);}));
 pause.addEventListener('click',()=>playing?stop():start());
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
 reduced.addEventListener('change',()=>{if(reduced.matches)stop();});
 if(!reduced.matches)start();else stop();
 const tabs=page.querySelector('.dk-room-tabs'),buttons=[...tabs.querySelectorAll('button')],panels=[...page.querySelectorAll('.lr-scope-row')];
 tabs.hidden=false;tabs.setAttribute('role','tablist');
 function choose(i,focus=false){buttons.forEach((b,n)=>{b.setAttribute('aria-selected',String(n===i));b.tabIndex=n===i?0:-1;panels[n].hidden=n!==i;});if(focus)buttons[i].focus();}
 buttons.forEach((b,i)=>{b.id='dk-tab-'+i;b.setAttribute('role','tab');b.setAttribute('aria-controls','dk-panel-'+i);const p=panels[i];p.id='dk-panel-'+i;p.setAttribute('role','tabpanel');p.setAttribute('aria-labelledby',b.id);p.tabIndex=0;b.addEventListener('click',()=>choose(i));b.addEventListener('keydown',e=>{let next;if(e.key==='ArrowRight')next=(i+1)%buttons.length;if(e.key==='ArrowLeft')next=(i+buttons.length-1)%buttons.length;if(e.key==='Home')next=0;if(e.key==='End')next=buttons.length-1;if(next!==undefined){e.preventDefault();choose(next,true);}});});
 choose(0);page.classList.add('dk-enhanced');
})();
