#!/usr/bin/env python3
"""Render the bilingual researched FAQ content without changing other sections."""
import json
import re
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / 'content/faqs.json').read_text())


def english_path(html):
    match = re.search(r'hreflang="en-US" href="https://larocacleaningservices.com([^"]*)"', html)
    if not match:
        raise ValueError('Missing English alternate')
    return match.group(1) or '/'


def render(entry, lang):
    title = escape(entry['heading'][lang])
    items = ''.join('<details><summary>' + escape(item[lang]['question']) +
                    '</summary><p>' + escape(item[lang]['answer']) + '</p></details>'
                    for item in entry['items'])
    return ('<section class="section" id="cleaning-faq" aria-labelledby="cleaning-faq-title">'
            '<div class="wrap"><div class="center"><h2 id="cleaning-faq-title">' + title +
            '</h2></div><div class="faq">' + items + '</div></div></section>')


def main():
    count = 0
    for path in sorted(ROOT.rglob('*.html')):
        if '.git' in path.parts:
            continue
        html = path.read_text()
        if 'id="quoteform"' not in html:
            continue  # Excludes the links page and 404.
        key = english_path(html)
        entry = DATA['pages'][key]
        lang = 'es' if re.search(r'<html\b[^>]*lang="es(?:-[^"]*)?"', html) else 'en'
        block = render(entry, lang)
        sections = list(re.finditer(r'<section\b[^>]*>.*?</section>', html, re.S))
        old = [m for m in sections if 'class="faq"' in m.group()]
        if len(old) > 1:
            raise ValueError(f'Multiple FAQ sections: {path}')
        if old:
            match = old[0]
            updated = html[:match.start()] + block + html[match.end():]
        else:
            contact = re.search(r'<section\b[^>]*id="contact"[^>]*>', html)
            if not contact:
                raise ValueError(f'Missing contact section: {path}')
            updated = html[:contact.start()] + block + html[contact.start():]
        path.write_text(updated)
        count += 1
    if count != 88:
        raise ValueError(f'Expected 88 pages, found {count}')
    print(f'Rendered FAQs on {count} pages; four questions per page.')


if __name__ == '__main__':
    main()
