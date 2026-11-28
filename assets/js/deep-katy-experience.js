(()=>{
 const page=document.querySelector('.dk-page');if(!page)return;
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 const frames=[...page.querySelectorAll('.dk-frame')],slides=[...page.querySelectorAll('[data-dk-slide]')],visual=page.querySelector('.dk-visual');
 let current=0,timer=null;
 function show(i){current=i;frames.forEach((f,n)=>{f.classList.toggle('is-active',n===i);f.setAttribute('aria-hidden',String(n!==i));});slides.forEach((b,n)=>b.setAttribute('aria-pressed',String(n===i)));}
 function stop(){clearInterval(timer);timer=null;visual.classList.remove('dk-playing');}
 function start(){stop();if(document.hidden)return;visual.classList.add('dk-playing');timer=setInterval(()=>show((current+1)%frames.length),6500);}
 page.querySelector('.dk-stage-controls').hidden=false;
 slides.forEach((b,i)=>b.addEventListener('click',()=>{stop();show(i);}));
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
 reduced.addEventListener('change',()=>{if(reduced.matches)stop();});
 if(!reduced.matches)start();else stop();
 page.classList.add('dk-enhanced');
})();
