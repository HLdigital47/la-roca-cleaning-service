#!/usr/bin/env python3
"""Consolidate legacy city sections and normalize the content-page hierarchy."""
from pathlib import Path
import re
from html import escape, unescape
ROOT=Path(__file__).resolve().parents[1]
SECTION=re.compile(r'<section\b[^>]*>.*?</section>',re.S)

def text(s):return unescape(re.sub('<[^>]*>','',s)).strip()
def paragraphs(s):return re.findall(r'<p\b[^>]*>.*?</p>',s,re.S)
def links(s):return re.findall(r'<a\b[^>]*href="([^"]+)"[^>]*>(.*?)</a>',s,re.S)

planning={
 'katy':('Katy',
 'Tell us which rooms and floors need cleaning, whether pets live in the home and which kitchen or bathroom details matter most. For a move, have the handover checklist and access date ready.',
 'Indica qué habitaciones y niveles quieres limpiar, si hay mascotas y qué detalles de cocina o baño son prioritarios. Para una mudanza, ten a mano la lista de entrega y la fecha de acceso.'),
 'pearland':('Pearland',
 'For a first visit, explain whether the home needs a detailed reset or ongoing maintenance. Identify pet hair, appliance interiors and rooms that should be left closed before reviewing the estimate.',
 'Para la primera visita, aclara si necesitas una limpieza a fondo o mantenimiento. Identifica pelo de mascotas, interiores de electrodomésticos y habitaciones que deben permanecer cerradas antes de revisar el estimado.'),
 'sugar-land':('Sugar Land',
 'List the rooms and floors you actually want cleaned, along with bathrooms, stairs and any delicate surfaces. Compare estimates using the same task list and frequency, rather than the number of bedrooms alone.',
 'Define las habitaciones y niveles que sí quieres limpiar, además de baños, escaleras y superficies delicadas. Compara cotizaciones con la misma lista de tareas y frecuencia, no solo por número de recámaras.'),
 'stafford':('Stafford',
 'For a workplace, identify reception, work areas, restrooms and shared rooms. Confirm permitted entry hours, restricted areas and who opens and secures the building. For a home, describe the rooms and priority tasks.',
 'Para un negocio, identifica recepción, áreas de trabajo, baños y espacios comunes. Confirma horarios de entrada, áreas restringidas y quién abre y cierra. Para una casa, describe las habitaciones y tareas prioritarias.')}

for p in sorted(ROOT.rglob('*.html')):
 if '.git' in p.parts:continue
 s=p.read_text()
 if 'id="quoteform"' not in s:continue
 if 'data-layout-version="20261125"' in s:continue
 es=bool(re.search(r'<html\b[^>]*lang="es',s))
 url=re.search(r'hreflang="en-US" href="https://larocacleaningservices.com([^"]*)"',s)[1]
 kind='home' if url=='/' else 'area' if url.startswith('/service-areas/') else 'guide' if url.startswith('/blog/') else 'checklist' if url=='/cleaning-checklist/' else 'service'
 s=re.sub(r'<body\b([^>]*)>',lambda m:'<body'+re.sub(r'class="([^"]*)"',lambda c:'class="'+c[1]+' lr-layout"',m[1])+' data-page-type="'+kind+'" data-layout-version="20261125">' if 'class="' in m[1] else '<body'+m[1]+' class="lr-layout" data-page-type="'+kind+'" data-layout-version="20261125">',s,count=1)
 s=s.replace('</head>','<link rel="stylesheet" href="/assets/css/layout.css?v=20261125"></head>',1)
 s=re.sub(r'/assets/js/app.js\?v=[^"\s]+','/assets/js/app.js?v=layout-20261125',s)
 resource_groups=[]
 # Legacy city pages duplicate the home-page presentation several times.
 citykey=url.split('/')[-2].removesuffix('-tx') if kind=='area' else ''
 legacy=kind=='area' and 'class="local-focus"' in s
 coverage=[];anchor_ids=[]
 if legacy:
  city,en,sp=planning[citykey]
  for m in list(SECTION.finditer(s)):
   block=m[0];tag=block.split('>')[0]
   if 'local-focus' in tag or re.search(r'id="'+citykey+r'-(?:visit|cleaning-options|coverage|neighborhoods|commercial-scope)"',tag):
    idm=re.search(r'id="([^"]+)"',tag)
    if idm:anchor_ids.append(idm[1])
    if '-coverage"' in tag or '-neighborhoods"' in tag:coverage=paragraphs(block)
    s=s.replace(block,'',1)
  # Single useful local guide replaces repeated image/text introductions.
  anchors=''.join('<span id="'+i+'" class="lr-anchor" aria-hidden="true"></span>' for i in anchor_ids)
  title=('Planifica tu limpieza en ' if es else 'Plan your cleaning in ')+city
  coverage_title='Cobertura y disponibilidad' if es else 'Coverage and availability'
  aside='<aside class="lr-area-coverage"><h3>'+coverage_title+'</h3>'+''.join(coverage)+'</aside>' if coverage else ''
  guide='<section class="section lr-area-guide"><div class="wrap">'+anchors+'<div class="lr-area-plan"><div><h2>'+title+'</h2><p>'+escape(sp if es else en)+'</p></div>'+aside+'</div></div></section>'
  services=next(m for m in SECTION.finditer(s) if 'id="services"' in m[0].split('>')[0])
  s=s[:services.end()]+guide+s[services.end():]
  # Keep the city page focused; trust/process information remains on the home page.
  for m in list(SECTION.finditer(s)):
   block=m[0];tag=block.split('>')[0]
   if 'id="about"' in tag or 'class="steps"' in block:s=s.replace(block,'',1)
  # Improve the empty one-line hero description without adding another hero.
  hero=next(m[0] for m in SECTION.finditer(s) if 'class="hero"' in m[0].split('>')[0])
  intro=('Limpieza de casas, apartamentos y negocios en '+city+'. Encuentra el servicio que necesitas y solicita una cotización según tu espacio.' if es else 'Cleaning for homes, apartments and businesses in '+city+'. Find the service you need and request an estimate for your space.')
  updated=re.sub(r'<p class="intro">.*?</p>','<p class="intro">'+intro+'</p>',hero,flags=re.S)
  s=s.replace(hero,updated,1)
 # Consolidate scattered link sections into one resource area, retaining destinations.
 for m in list(SECTION.finditer(s)):
  block=m[0];tag=block.split('>')[0]
  hs=re.findall(r'<h2\b[^>]*>(.*?)</h2>',block,re.S)
  heading=text(hs[0]) if hs else ''
  is_resources=('lr-service-links' in block or ('id="services"' in tag and 'class="servicecard"' not in block))
  is_nearby=(legacy and 'id="areas"' in tag)
  is_repeat=heading.startswith(('Looking for ','¿Buscas '))
  is_cta=not hs and re.fullmatch(r'<section\b[^>]*>\s*<div class="wrap">\s*<a\b.*?</a>\s*</div>\s*</section>',block,re.S)
  if is_resources or is_nearby or is_repeat:
   pairs=[(href,text(label)) for href,label in links(block) if href.startswith('/') and not href.startswith('/#')]
   # Repeated "near you" copy adds no unique guidance, but its service link stays.
   if is_nearby:
    city_names={'pearland-tx':'Pearland','sugar-land-tx':'Sugar Land','katy-tx':'Katy','stafford-tx':'Stafford'}
    pairs=[(href,city_names.get(href.rstrip('/').split('/')[-1], 'Houston' if href in ['/','/es/'] else label)) for href,label in pairs]
   if pairs:resource_groups.append((heading,pairs,'services' if 'id="services"' in tag else 'areas' if is_nearby else ''))
   s=s.replace(block,'',1)
  elif is_cta:s=s.replace(block,'',1)
 # Remove standalone full-width call-to-action blocks repeated just before the estimate.
 s=re.sub(r'<div class="endcta">.*?</div></div>','',s,flags=re.S)
 if resource_groups:
  seen=set();groups=[]
  for title,pairs,anchor in resource_groups:
   unique=[]
   for href,label in pairs:
    if href in seen or href==url:continue
    seen.add(href);unique.append((href,label))
   if not unique:continue
   if title.startswith(('Looking for ','¿Buscas ')):title='Servicio relacionado' if es else 'Related service'
   if anchor=='areas':title='Otras áreas de servicio' if es else 'Other service areas'
   ul=''.join('<li><a href="'+escape(href,quote=True)+'">'+escape(label)+'</a></li>' for href,label in unique)
   groups.append('<div class="lr-resource-group"'+(' id="'+anchor+'"' if anchor else '')+'><h3>'+escape(title)+'</h3><ul>'+ul+'</ul></div>')
  if groups:
   resources='<section class="section lr-resources"><div class="wrap"><h2>'+('Explora servicios y guías' if es else 'Explore services and guides')+'</h2><div class="lr-resource-grid">'+''.join(groups)+'</div></div></section>'
   contact=re.search(r'<section\b[^>]*id="contact"[^>]*>',s)
   s=s[:contact.start()]+resources+s[contact.start():]
 p.write_text(s)
print('Organized all 88 content pages.')
