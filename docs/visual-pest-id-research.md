# Visual Pest Identification — Research & Recommendations

**Date:** 2026-03-22  
**For:** David / Forterra Quote Tool  
**Status:** Research only — no code changes

---

## 1. Recommended Approach: Illustrated Icons (Not Photos)

**Use stylized illustrations, not real bug photos.** Here's why:

- **Consistency:** The quote tool already uses SVG pest tile icons (line-art style, earthy brown `#986D4F`). Visual ID cards should match this aesthetic.
- **Ick factor:** Real cockroach photos make people physically recoil. Multiple pest control UX analyses confirm that stylized images get better engagement than gross-out photos in consumer-facing tools.
- **Clarity:** Illustrations can exaggerate the *key distinguishing features* (size, color, markings) better than photos where lighting/angle vary.
- **Mobile:** Clean illustrations render crisply at small sizes; photos can be muddy on phones.
- **Licensing:** No attribution headaches. AI-generated or custom SVG illustrations are fully owned.

**Recommended format:** Side-by-side comparison cards with illustration + 2-3 bullet cues + short label. Keep the existing `.followup-option` card pattern but wider, with image on top or left.

---

## 2. Cockroach Follow-Up: What to Show

### Current (line 2282):
```
"What kind of cockroaches are you seeing?"
- Large roaches (American / smoky brown — usually near doors/garage)
- Small roaches in kitchen or bathroom (German cockroaches)  
- I'm not sure
```

### Recommended Visual Version:

**Option A — "Big Roach" card:**
- **Illustration:** Large reddish-brown roach, ~1.5" scale indicator
- **Label:** "Big reddish-brown roach"
- **Bullets:** "1-2 inches long · Reddish-brown · Found near doors, garage, or outside"
- **Subtext:** "Common outdoor roach — covered by general treatment"

**Option B — "Small Roach" card:**
- **Illustration:** Small tan roach with two dark parallel stripes on head/thorax, ~½" scale
- **Label:** "Small tan roach with stripes"  
- **Bullets:** "About ½ inch · Tan/light brown · Two dark stripes behind head · Found in kitchen or bathroom"
- **Subtext:** "German cockroach — requires specialized treatment (+$200)"

**Option C — "Not Sure" card:**
- **Illustration:** Question mark icon or magnifying glass over generic roach silhouette
- **Label:** "I'm not sure"
- **Subtext:** "No worries — we'll identify them during your service"

### Key Visual Cues (from Orkin/pest ID research):
1. **Size comparison** is the #1 differentiator for homeowners. Show a coin or finger for scale.
2. **The two dark stripes** on the German cockroach's pronotum (shield behind head) are the easiest ID marker.
3. **Location found** reinforces: German = kitchen/bathroom, American = garage/entry/outdoors.
4. Color difference: reddish-brown vs tan/light brown.

---

## 3. Ant Follow-Up: What to Show

### Current (line 2281):
```
"What kind of ants are you seeing?"
- Small ants (sugar ants, pavement ants, etc.)
- Large ants that may be damaging wood (carpenter ants)
- I'm not sure
```

### Recommended Visual Version:

**Option A — "Small Ants" card:**
- **Illustration:** Cluster of tiny ants (⅛") on a kitchen counter or trailing along a baseboard
- **Label:** "Small household ants"
- **Bullets:** "Tiny (⅛ inch) · Trail in lines · Found near food or water"
- **Subtext:** "Sugar ants, pavement ants — covered by general treatment"

**Option B — "Carpenter Ants" card:**
- **Illustration:** Large black ant (½-¾") + a small inset showing frass (sawdust pile near wood)
- **Label:** "Large black ants (carpenter ants)"
- **Bullets:** "½ to ¾ inch · Black or dark brown · Sawdust-like debris (frass) near wood"
- **Subtext:** "Carpenter ants can damage wood — specialized add-on (+$100)"

**David specifically asked about showing FRASS.** Recommend a two-part illustration:
1. The ant itself (large, black, single-node waist)
2. A small "evidence" image showing frass piles near a baseboard or window frame

This is more useful than just showing the ant, because many homeowners see the frass before they see the ant.

**Option C — "Not Sure" card:**
- Same pattern as cockroach "not sure" option

---

## 4. "I Don't Know" Flow

Current behavior: `v:'unsure'` — treats as standard pest (no add-on charge).

**Recommended enhancement:**
- Keep the current behavior (no upcharge for "unsure")
- Add a subtle note below the "not sure" card: *"Our technician will identify the species during your visit and recommend the right treatment."*
- **Do NOT route to a phone call** for this — it adds friction and kills conversion. The whole point of the tool is self-service quoting. Let the tech handle ID on-site.
- If David wants a phone option, add it as a *fourth* option: "I'd rather talk to someone" → routes to call flow (like the rodent/termite inspection flows already do).

---

## 5. Layout Recommendation

### Desktop (>600px):
```
┌─────────────────────────────────────────────┐
│  "What kind of cockroaches are you seeing?" │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  [img]   │  │  [img]   │  │   [?]    │  │
│  │ Big      │  │ Small    │  │ Not sure │  │
│  │ roach    │  │ roach    │  │          │  │
│  │ 1-2"     │  │ ½"       │  │          │  │
│  │ reddish  │  │ tan/     │  │          │  │
│  │ brown    │  │ striped  │  │          │  │
│  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────┘
```

### Mobile (<600px):
Stack vertically — each card is full-width with image on left (small, ~80px) and text on right. This is essentially the current `.followup-option` layout but with an image added.

### CSS approach:
- Add an optional `.followup-option-img` element inside existing `.followup-option`
- Use `display: grid; grid-template-columns: 80px 1fr;` on options that have images
- Desktop: switch to horizontal card grid `grid-template-columns: repeat(3, 1fr)` for the options container
- Images: inline SVG or small PNG/WebP (~200px wide, optimized)

---

## 6. Image Sourcing Options (Ranked)

### Option 1: AI-Generated Illustrations (Recommended ⭐)
- Use DALL-E, Midjourney, or similar to generate clean, stylized pest illustrations
- Match the existing SVG line-art style (brown strokes on white/cream)
- **Pros:** Fully owned, no licensing, can match exact brand style, can emphasize distinguishing features
- **Cons:** Need to prompt carefully for accuracy
- Generate as SVG-style or flat illustration, then trace/clean up if needed

### Option 2: Custom SVG Icons (hand-drawn)
- Extend the existing pest tile SVG style to show species differences
- Could be as simple as: big roach SVG (larger, darker fill) vs small roach SVG (smaller, lighter fill, two stripes)
- **Pros:** Perfect brand consistency, tiny file size, scales perfectly
- **Cons:** More effort, may not show enough detail for ID

### Option 3: Royalty-Free Illustrations
- **Vecteezy** (vecteezy.com/free-vector/cockroach) — 7,000+ cockroach vectors, free with attribution
- **Flaticon** — pest control icon packs
- **Pros:** Quick, professional
- **Cons:** Attribution required for free tier; may not match brand; generic

### Option 4: Real Photos (Not Recommended)
- Unsplash, Pexels, Wikimedia Commons have CC0 pest photos
- **Pros:** Most accurate for identification
- **Cons:** Gross, inconsistent quality, doesn't match brand, may scare customers away from completing the quote

---

## 7. Competitor Examples

### Orkin (orkin.com/pests/cockroaches/how-to-identify-different-cockroach-species)
- Full pest ID guide with real photos, detailed descriptions
- Good *educational* content but too detailed for a quote wizard
- Key takeaway: They emphasize size + color + location as the three differentiators

### ABC Home & Commercial
- Uses illustrated icons for pest selection, photos only in educational content
- Clean card-based layout

### Enviropest (enviropest.com)
- Side-by-side comparison format with clear headers
- Uses real photos but in an educational context, not during quoting

### Key Pattern:
No major pest control company uses visual ID *during the quoting flow* — this would be a competitive advantage for Forterra. Most just ask text questions or skip species identification entirely (leaving it for the tech). Showing images during quoting is a smart UX improvement.

---

## 8. Summary: Implementation Checklist

1. **Generate/create 6 illustrations:**
   - Large roach (American/smoky brown) — reddish-brown, ~1.5", side view
   - Small roach (German) — tan, ~½", showing two dark pronotal stripes
   - Small ants — cluster of tiny ants trailing
   - Carpenter ant — single large black ant, ½-¾"
   - Carpenter ant frass — sawdust pile near wood/baseboard
   - "Not sure" — question mark icon (can reuse existing style)

2. **Update followup card layout** to support image + text side-by-side (mobile) or image-on-top cards (desktop)

3. **Update copy** per sections 2-3 above (shorter, punchier labels + bullet cues)

4. **Keep "not sure" as default safe path** — no upcharge, tech IDs on-site

5. **Estimated effort:** 2-3 hours for illustrations (AI-generated + cleanup), 1-2 hours for CSS/HTML changes
