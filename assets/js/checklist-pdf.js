/* Small self-contained PDF export. Helvetica / WinAnsi; no remote libraries. */
(function(root){
 function createPDF(lines){
  const safe=s=>String(s).replace(/[–—]/g,'-').replace(/[“”]/g,'"').replace(/[’]/g,"'").replace(/[^\x20-\x7e\xa0-\xff]/g,'?');
  const wrapped=[];
  for(const raw of lines){let line='';for(const word of safe(raw).split(/\s+/)){if((line+' '+word).trim().length>80){wrapped.push(line);line='';}if(word.length>80){if(line)wrapped.push(line);for(let i=0;i<word.length;i+=80)wrapped.push(word.slice(i,i+80));line='';}else line+=(line?' ':'')+word;}wrapped.push(line);}
  const pages=[];for(let i=0;i<wrapped.length;i+=43)pages.push(wrapped.slice(i,i+43));if(!pages.length)pages.push([]);
  const objs=[null,'<< /Type /Catalog /Pages 2 0 R >>','', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'];
  const kids=[];const esc=s=>s.replace(/([\\()])/g,'\\$1');
  pages.forEach((page,i)=>{const id=objs.length;const stream='BT /F1 11 Tf 48 790 Td 16 TL '+page.map((l,j)=>(j?'T* ':'')+'('+esc(l)+') Tj').join('\n')+'\nET';kids.push(id+' 0 R');objs.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents '+(id+1)+' 0 R >>');objs.push('<< /Length '+stream.length+' >>\nstream\n'+stream+'\nendstream');});
  objs[2]='<< /Type /Pages /Count '+pages.length+' /Kids ['+kids.join(' ')+'] >>';let pdf='%PDF-1.4\n',offsets=[0];for(let i=1;i<objs.length;i++){offsets.push(pdf.length);pdf+=i+' 0 obj\n'+objs[i]+'\nendobj\n';}const start=pdf.length;pdf+='xref\n0 '+objs.length+'\n0000000000 65535 f \n';for(let i=1;i<objs.length;i++)pdf+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';pdf+='trailer\n<< /Size '+objs.length+' /Root 1 0 R >>\nstartxref\n'+start+'\n%%EOF';return Uint8Array.from(pdf,c=>c.charCodeAt(0));
 }
 root.LaRocaChecklistPDF=createPDF;
})(typeof window==='undefined'?globalThis:window);
