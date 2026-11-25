# La Roca — Page organization correction

## Cause

Legacy city pages repeated the main hero with a second local image/text section, several large standalone text sections, and an additional city feature injected by app.js. Many section headings inherited near-hero typography. Reused home-page trust/process/area sections and isolated CTA/link blocks made local pages much longer and obscured the useful content.

## Changes

- Shared hierarchy stylesheet on 88 EN/ES pages: one primary heading, smaller section headings, balanced line wrapping, controlled hero images, consistent spacing, readable article widths and compact responsive navigation.
- Removed JavaScript-generated city introductions and the empty credential heading container.
- Consolidated the four legacy city templates (EN/ES): hero, service choices, one planning/coverage block, reviews, FAQs, related navigation, estimate and contact. Preserved the actual neighborhood lists and former anchor IDs.
- Collected scattered service/area/guide links into one resource section with descriptive city labels; removed generic repeated near-you paragraphs and standalone repeated CTA sections.
- Kept the researched FAQ blocks byte-identical. Preserved titles, descriptions, canonical URLs, hreflang, JSON-LD, analytics configuration, form transport and pricing logic.

## Verification

- All 88 content pages checked for one H1, unique IDs, one layout stylesheet, valid local destinations and valid static/internal app anchors.
- FAQ blocks, form HTML, titles, descriptions, canonical links and JSON-LD compared with the preceding published commit.
- Browser: 8 representative pages at iframe widths 320, 390, 768 and 1024 px (32 responsive checks). Content width did not exceed the frame's viewport. No duplicate injected city panels remained. Home form checks repeated after deferred scripts initialized: name/phone/service only.
- Visual checks: Katy ES hero and service continuity, planning/coverage, FAQ anchor; Bellaire ES mobile; deep-cleaning EN tablet/desktop; Spanish pricing article desktop. Preview frames use desktop scrollbars, so their CSS viewport is 15 px narrower than the stated outer frame width.
- No real lead submissions were made. This is layout/content organization QA, not proof of downstream Sheets/Gmail delivery.
