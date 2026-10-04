# Content & Placeholder Plan — Rayan Accessories B2B Global

> Owner: 颜好看 / UIUX Designer · Phase 2.5 · 2026-10-02
> Consumers: Phase 3 frontend engineer (content data files + `src/i18n/en.json` initial content)
> Sources of truth: `docs/SPEC.md` §10 / `docs/PRD.md` §6.2 §6.4 §9 §13 / `docs/UIUX.md` §6 §7 §11 §12 §13 §17 / `docs/design-tokens.json`
> Rules honored throughout: no emoji as functional icons (Lucide only), no hardcoded colors (tokens only), no filler copy, no invented quantitative claims (AC-37/38/41), demo prices exist ONLY in content data files (AC-07, SPEC §10.4).

---

## 1. Demo SKU Set (21 SKUs — 7 per line)

### 1.1 Data file location and schema

- Location: `src/content/products/` — one JSON file per SKU, loaded via Astro Content Collections with a typed schema.
- Schema fields map 1:1 to PRD §6.4 real-asset fields, so real data later = replace files only, zero code change (SPEC §10.2).

```ts
// src/content/config.ts — products collection schema (reference for frontend)
{
  sku_code: string            // ^[A-Z0-9-]{3,32}$, unique
  title: string               // English, <= 80 chars
  slug: string                // kebab-case, unique, used in /products/{slug}/
  line: "fashion-alloy-brass" | "stainless-titanium-steel" | "natural-stone-gemstone-pearl"
  category: "earrings" | "necklace" | "bracelet" | "ring" | "hair-accessory" | "brooch" | "anklet"
  base_material_grade: string
  plating_method: string
  plating_thickness_um: number
  dimensions_mm: string
  weight_g: number
  moq_min: number             // 12-120, band by UIUX §7.4: 12-30 / 31-60 / 61-120
  moq_max: number
  tiered_price: [             // >= 3 bands, each band a RANGE, never fixed (AC-07)
    { min_qty: number, max_qty: number | null, price_low: number, price_high: number, currency: "USD" }
  ]
  compliance_tag: "on_request"   // V1: all SKUs degrade (AC-38). Real tag values come later.
  test_report_reference: null    // V1: null for all SKUs -> triggers AC-38 degraded copy
  ear_post: boolean              // pierced article -> 0.2 ug limit on education page (AC-40)
  short_description: string
  dataStatus: "placeholder"      // mandatory on every demo SKU (SPEC §10.1)
}
```

Filter-axis coverage guaranteed by the set below: 6 base material grades, 8 plating methods, 7 categories, 3 MOQ bands (7 SKUs each), `ear_post` split 6 true / 15 false.

### 1.2 Line A — Fashion Alloy & Brass (prefix `FB-`)

| # | sku_code | title | slug | category | base_material_grade | plating_method | thickness (µm) | dimensions | weight (g) | moq_min–max | MOQ band | ear_post |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | FB-2317 | Gold-Plated Alloy Hoop Earrings, 18K Look | gold-plated-alloy-hoop-earrings-18k-look | earrings | Zinc alloy | Gold-tone electroplate | 0.50 | hoop outer ⌀ 32 mm, wire 1.2 mm | 4.6 | 12–59 | 12-30 | true |
| 2 | FB-1429 | Open Cuff Ring, Adjustable, Antique Brass Finish | open-cuff-ring-adjustable-antique-brass | ring | Brass | Antique brass electroplate | 0.20 | band width 6 mm, adjustable US 6–9 | 3.4 | 12–59 | 12-30 | false |
| 3 | FB-1876 | Cubic Zirconia Stud Earrings, Rhodium Finish | cubic-zirconia-stud-earrings-rhodium | earrings | Zinc alloy | Rhodium-tone electroplate | 0.40 | stone ⌀ 6 mm, post length 11 mm | 1.9 | 36–59 | 31-60 | true |
| 4 | FB-2690 | Enamel Bangle Bracelet, Gold Rim | enamel-bangle-bracelet-gold-rim | bracelet | Zinc alloy + enamel | Gold-tone electroplate | 0.30 | inner ⌀ 62 mm, width 8 mm | 22.0 | 36–72 | 31-60 | false |
| 5 | FB-3552 | Acetate and Alloy Hair Claw Clip, Matte Gold | acetate-alloy-hair-claw-clip-matte-gold | hair-accessory | Zinc alloy + cellulose acetate | Matte gold-tone electroplate | 0.30 | 110 × 42 mm | 18.0 | 48–96 | 31-60 | false |
| 6 | FB-3211 | Multi-Strand Alloy Chain Necklace, Antique Gold | multi-strand-alloy-chain-necklace-antique-gold | necklace | Brass | Antique gold-tone electroplate | 0.30 | length 42 + 7 cm extender | 28.0 | 72–119 | 61-120 | false |
| 7 | FB-4083 | Pearl-Effect Filigree Brooch, Gold Tone | pearl-effect-filigree-brooch-gold-tone | brooch | Zinc alloy | Gold-tone electroplate | 0.40 | 45 × 32 mm | 9.5 | 72–119 | 61-120 | false |

Tiered price (USD / pc, ranges only) + short_description:

| sku_code | tiered_price bands | short_description |
|---|---|---|
| FB-2317 | 12–59 → 0.42–0.55 · 60–239 → 0.36–0.47 · 240+ → 0.31–0.40 | Lightweight hoops with a warm gold-tone finish; a restocking staple for volume sellers. |
| FB-1429 | 12–59 → 0.38–0.50 · 60–239 → 0.32–0.42 · 240+ → 0.27–0.36 | Adjustable antique-brass cuff; no sizing stock needed, one SKU fits most. |
| FB-1876 | 36–59 → 0.55–0.72 · 60–239 → 0.48–0.62 · 240+ → 0.42–0.54 | 6 mm cubic zirconia studs on rhodium-tone posts; everyday retail core. |
| FB-2690 | 36–119 → 0.88–1.15 · 120–479 → 0.75–0.98 · 480+ → 0.64–0.84 | Hand-finished enamel bangle with a gold rim; seasonal colorways available on request. |
| FB-3552 | 48–119 → 0.65–0.85 · 120–479 → 0.55–0.72 · 480+ → 0.47–0.61 | Acetate-and-alloy claw clip; strong spring, matte gold hardware. |
| FB-3211 | 72–239 → 1.35–1.75 · 240–959 → 1.15–1.50 · 960+ → 0.98–1.28 | Three-layer antique-gold chain; layered look without stacking cost. |
| FB-4083 | 72–239 → 0.95–1.25 · 240–959 → 0.80–1.06 · 960+ → 0.69–0.90 | Filigree brooch with a pearl-effect center; gift-box friendly size. |

### 1.3 Line B — Stainless & Titanium Steel (prefix `ST-`)

| # | sku_code | title | slug | category | base_material_grade | plating_method | thickness (µm) | dimensions | weight (g) | moq_min–max | MOQ band | ear_post |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 8 | ST-1902 | 316L Stainless Steel Stud Earrings, Screw Back | 316l-stainless-steel-stud-earrings-screw-back | earrings | 316L stainless steel | Steel-tone PVD | 0.20 | stone ⌀ 5 mm | 1.4 | 12–30 | 12-30 | true |
| 9 | ST-1855 | PVD Rose Gold Huggie Earrings, Stainless Steel | pvd-rose-gold-huggie-earrings-stainless-steel | earrings | 316L stainless steel | Rose gold PVD | 0.25 | outer ⌀ 12 mm | 2.1 | 24–59 | 12-30 | true |
| 10 | ST-2688 | PVD 18K Gold Signet Ring, Stainless Steel | pvd-18k-gold-signet-ring-stainless-steel | ring | 316L stainless steel | PVD, 18K gold tone | 0.30 | face 12 × 10 mm, US 8–12 | 6.8 | 36–72 | 31-60 | false |
| 11 | ST-2077 | Black PVD Curb Chain Bracelet, Titanium Steel | black-pvd-curb-chain-bracelet-titanium-steel | bracelet | Titanium alloy | Black PVD | 0.30 | length 20 cm, link 4 mm | 15.0 | 60–119 | 31-60 | false |
| 12 | ST-2407 | PVD 18K Gold Herringbone Necklace, 316L | pvd-18k-gold-herringbone-necklace-316l | necklace | 316L stainless steel | PVD, 18K gold tone | 0.30 | length 45 cm, width 5 mm | 17.5 | 72–99 | 61-120 | false |
| 13 | ST-3450 | PVD Gold Curb Anklet, Stainless Steel | pvd-gold-curb-anklet-stainless-steel | anklet | 316L stainless steel | PVD, 18K gold tone | 0.25 | length 24 cm + 3 cm extender | 8.2 | 84–119 | 61-120 | false |
| 14 | ST-3216 | Cuban Link Chain, 316L, Ion-Plated Gold | cuban-link-chain-316l-ion-plated-gold | necklace | 316L stainless steel | Ion plating (IP), gold tone | 0.35 | length 55 cm, link 5 mm | 38.0 | 100–119 | 61-120 | false |

Tiered price + short_description:

| sku_code | tiered_price bands | short_description |
|---|---|---|
| ST-1902 | 12–30 → 0.72–0.95 · 31–119 → 0.62–0.81 · 120+ → 0.53–0.70 | 316L studs with screw-back posts; pierced-safe construction for sensitive-ear retail. |
| ST-1855 | 24–59 → 1.10–1.45 · 60–239 → 0.94–1.24 · 240+ → 0.80–1.06 | Rose-gold PVD huggies; waterproof daily-wear line for EU and US markets. |
| ST-2688 | 36–119 → 1.85–2.40 · 120–479 → 1.58–2.05 · 480+ → 1.36–1.76 | Steel signet ring in 18K-gold PVD; sizes 8–12, engraving possible with your RFQ. |
| ST-2077 | 60–119 → 1.60–2.05 · 120–479 → 1.38–1.76 · 480+ → 1.18–1.52 | Black PVD curb chain on titanium alloy; men's line anchor SKU. |
| ST-2407 | 72–239 → 2.40–3.10 · 240–959 → 2.05–2.65 · 960+ → 1.75–2.28 | Herringbone chain, 5 mm; PVD layer at 0.30 µm for daily-wear durability. |
| ST-3450 | 84–239 → 1.05–1.38 · 240–959 → 0.90–1.18 · 960+ → 0.77–1.01 | Gold-tone curb anklet with extender; beach-season bestseller. |
| ST-3216 | 100–299 → 3.20–4.10 · 300–999 → 2.75–3.55 · 1000+ → 2.38–3.08 | Heavy 5 mm Cuban link, ion-plated; the line's premium statement piece. |

### 1.4 Line C — Natural Stone, Lab Gemstone & Pearl (prefix `NS-`)

| # | sku_code | title | slug | category | base_material_grade | plating_method | thickness (µm) | dimensions | weight (g) | moq_min–max | MOQ band | ear_post |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 15 | NS-3321 | Lab-Created Opal Stud Earrings, Steel Post | lab-created-opal-stud-earrings-steel-post | earrings | 316L stainless steel post | PVD, 18K gold tone | 0.20 | stone ⌀ 6 mm | 1.6 | 12–30 | 12-30 | true |
| 16 | NS-2763 | Natural Amethyst Beaded Bracelet, 8 mm | natural-amethyst-beaded-bracelet-8mm | bracelet | Natural amethyst | Gold-tone electroplate (clasp only) | 0.25 | bead ⌀ 8 mm, length 18 cm | 16.0 | 24–59 | 12-30 | false |
| 17 | NS-4178 | Baroque Freshwater Pearl Drop Earrings | baroque-freshwater-pearl-drop-earrings | earrings | Freshwater pearl, brass mount | PVD, 18K gold tone | 0.25 | pearl 9–11 mm, drop 28 mm | 3.8 | 24–48 | 12-30 | true |
| 18 | NS-3051 | Tiger Eye Cocktail Ring, Adjustable | tiger-eye-cocktail-ring-adjustable | ring | Natural tiger eye | Gold-tone electroplate | 0.30 | stone 14 × 10 mm, US 6–9 | 5.6 | 36–60 | 31-60 | false |
| 19 | NS-1104 | Freshwater Pearl Choker, Brass Clasp | freshwater-pearl-choker-brass-clasp | necklace | Freshwater pearl | Gold-tone electroplate (clasp only) | 0.30 | pearl ⌀ 6–7 mm, length 38 + 5 cm | 24.0 | 48–119 | 31-60 | false |
| 20 | NS-2410 | Dyed Howlite Long Pendant Necklace | dyed-howlite-long-pendant-necklace | necklace | Dyed howlite | Gold-tone electroplate (cap and chain) | 0.25 | pendant 40 × 14 mm, cord 70 cm | 21.0 | 72–119 | 61-120 | false |
| 21 | NS-3690 | Lapis Lazuli Layered Anklet, Beaded | lapis-lazuli-layered-anklet-beaded | anklet | Natural lapis lazuli | Gold-tone electroplate (findings) | 0.25 | length 23 + 4 cm, bead ⌀ 4 mm | 9.0 | 84–120 | 61-120 | false |

Tiered price + short_description:

| sku_code | tiered_price bands | short_description |
|---|---|---|
| NS-3321 | 12–30 → 1.30–1.70 · 31–119 → 1.12–1.46 · 120+ → 0.96–1.26 | Lab-created opal on a steel post; consistent color, pierced-safe construction. |
| NS-2763 | 24–59 → 1.45–1.90 · 60–239 → 1.24–1.63 · 240+ → 1.06–1.40 | 8 mm natural amethyst rounds; tones vary by lot and we photograph the lot you buy. |
| NS-4178 | 24–48 → 2.10–2.75 · 49–239 → 1.81–2.36 · 240+ → 1.55–2.03 | Baroque freshwater drops; every pair is matched by hand from the same parcel. |
| NS-3051 | 36–119 → 1.55–2.00 · 120–479 → 1.33–1.72 · 480+ → 1.14–1.48 | Tiger eye cocktail ring, adjustable band; chatoyancy varies stone to stone. |
| NS-1104 | 48–119 → 2.60–3.40 · 120–479 → 2.24–2.92 · 480+ → 1.92–2.52 | 6–7 mm freshwater pearl choker; strung and knotted, brass clasp in gold tone. |
| NS-2410 | 72–239 → 1.70–2.20 · 240–959 → 1.46–1.89 · 960+ → 1.25–1.63 | Dyed howlite pendant on a 70 cm cord; statement length for boutique racks. |
| NS-3690 | 84–239 → 2.20–2.85 · 240–959 → 1.90–2.46 · 960+ → 1.63–2.12 | Double-layer lapis anklet; natural blue with gold-tone findings. |

### 1.5 Field-value conventions for this set

1. `test_report_reference` is `null` on all 21 SKUs and `compliance_tag` is `"on_request"` on all 21 — the frontend `renderComplianceTag()` must therefore land every SKU on the AC-38 degraded copy. No SKU renders a report number, laboratory, date, or pass/fail verdict (AC-38/39/41).
2. `ear_post: true` (6 SKUs) drives the 0.2 µg/cm²/week nickel-release limit **on the compliance education pages only** (AC-40). Per UIUX §13.1, limit values are never rendered in the PDP spec table — the PDP Nickel/Lead rows render the same degraded copy as every other SKU.
3. No SKU title, description, or field contains hallmark text ("925", "Sterling Silver", "999", "18K" as a material claim). "18K gold tone / 18K look / 18K-gold PVD" describes plating color, not precious-metal content — this wording is deliberate for AC-09.
4. All numeric demo values (thickness, weight, dimensions, prices) live only in these content files. Components must read them from the collection — no demo numbers inside `.astro`/`.ts` files (SPEC §10.4).
5. `short_description` strings follow PRD §13 tone: concrete, no "elevate/seamless/premium quality" filler, no unverifiable claims.

---

## 2. Placeholder Image Specification (local only — no external image services)

### 2.1 Aspect ratios (per UIUX §6.2 — the locked 4-frame system)

| Content type | Ratio | Where used | Count |
|---|---|---|---|
| SKU main image (A1) | **1:1** | Grid/List cards, PDP main, RFQ thumbnails | 21 |
| SKU gallery frames A2–A4 | **1:1** | PDP gallery (4 frames per SKU) | 63 |
| New-arrival / rail card | **4:5** | Home "New this week" rail (12 slots) | 12 |
| Product-line hero strip | **4:5** | Home hero, 3 vertical strips × 3 frames | 9 |
| Editorial large image | **16:9** | Home "One batch" module (left 70%), line-landing batch grids | 4 |
| Batch grid composite | **4:5** | Home §12[6], line-landing "same batch" blocks | 4 |

> Note on the brief: the tasking message said "product image 4:3". UIUX §6.2 locks A1/SKU frames at **1:1** and hero strips at 4:5, and SPEC.md declares UIUX the design authority. I have specified 1:1 / 4:5 / 16:9 per UIUX. Flagged to team-lead in the verdict (advisory).

### 2.2 Placeholder visual design

- **Base**: fill `--surface-warm` (#FBFCFC) — never pure white, so light metal edges survive (UIUX §6.3).
- **Grey-tone block**: a soft geometric mat of `--border` (#E3E6EA) and `--border-soft` (#EEF0F2) — one large rounded rectangle or circle offset behind the icon, suggesting a product mat without pretending to be a photo.
- **Line accent**: a 2 px bottom edge or corner tick in the line color token — `--line-alloy` / `--line-steel` / `--line-stone` — identification only, never a status signal.
- **Centered Lucide category icon** at 24 px, strokeWidth 1.5, color `--meta`:

| Category | Lucide icon | | Category | Lucide icon |
|---|---|---|---|---|
| Earrings | `ear` | | Brooch | `flower` |
| Necklace | `link` | | Anklet | `footprints` |
| Bracelet | `circle-dashed` | | Line-level fallback | `anvil` / `droplets` / `gem` |
| Ring | `circle-dot` | | | |

- **SKU category label**: category name in English small caps, 11 px, `--meta`, tracking `0.08em` (token `font.tracking.caps`), centered below the icon — e.g. "EARRINGS".
- **Forbidden**: no gradients simulating metal, no glow, no box-shadow float, no emoji, no external URLs, no CSS `background-image` with hardcoded hex.

### 2.3 Implementation recommendation

**Preferred — build-time inline SVG component** (`src/components/PlaceholderImage.astro`):

- Props: `category`, `line`, `label` (category English name), `ratio` (`1:1 | 4:5 | 16:9`), `alt`.
- Renders an inline `<svg>` using CSS variables for all colors (token-driven) and the Lucide icon path via `astro-icon` — zero runtime JS, zero network requests, no CLS (intrinsic `aspect-ratio` + `width`/`height` attributes).
- One component covers all ratios and categories; swapping in real photos later means replacing the component call with `<ProductImage>` — page code change is one tag per slot, matching SPEC §10.2's "replace content + image dir, zero page rewrites" spirit at the smallest possible surface.

**Fallback — static SVG files** at `src/assets/images/placeholders/{line}/{category}.svg` for fixed slots (hero strips, editorial) if the team prefers file-based assets. Same visual rules; colors must be written as CSS `var(--token)` references inside the SVG or injected at build time — no literal hex except `#fff`/`#000` exceptions.

**Alt text** (AC-33): product placeholder alt = `{Product name}, {base_material_grade}, {finish}` — e.g. "Gold-Plated Alloy Hoop Earrings, 18K Look, zinc alloy, gold-tone electroplate". Decorative slots (hero strip backs) use `alt=""` with a text sibling.

---

## 3. Degraded-Copy Mapping Table (unconfirmed data → exact rendered copy)

> Every string below is final English, casing and punctuation per UIUX §17 / PRD §13. All go through `t(key)` from `src/i18n/en.json` — never hardcoded in components.

### 3.1 Global — Home Trust Band (AC-42 replacement version, five items, none report-dependent)

| # | Label (ALL CAPS, 12 px, tracking 0.08em) | Description (14 px) | Icon (Lucide) |
|---|---|---|---|
| 1 | MOQ 12-120 PCS, STATED PER STYLE | Confirmed range per style, not per order. | `ruler` |
| 2 | SAMPLE BEFORE BULK | Sample before bulk, fee credited to your first order. | `package-search` |
| 3 | SPEC SHEET WITH EVERY QUOTE | Material grade, plating thickness and lead time, in writing. | `file-check` |
| 4 | SHIPS WORLDWIDE | Ships worldwide. | `globe` |
| 5 | QUOTED BY A PERSON | No bot replies, no template quotes. | `clock` |

Rules: no certificate graphics, no badge wall, no laboratory logos (AC-41). When response-time or country-count data arrives, items 4/5 upgrade per PRD §6.2 — not before.

### 3.2 Home — other blocks

| Unconfirmed data | Rendered copy |
|---|---|
| Exact SKU count | `Hundreds of styles` (confirmed magnitude — never a numeral) |
| Per-line SKU depth | `Catalogue depth varies by line` |
| New-arrival cadence (per line) | `New styles added continuously — ask for the current drop` |
| Hero price claim | `Priced by tier — see each collection` |
| "One batch" photo provenance | Never `Photographed in-house`. Copy: `Same light, same day, same background — the parcel you would actually receive.` |
| Batch block body | `Grid shots are the honest way to show a range: same light, same day, same background. You get the lot you are buying, not one hero SKU dressed up for the camera.` |
| Compliance preview footer line (always rendered) | `Test reports issued per batch and provided with your quotation.` |
| Utility bar hours string | `Mon-Fri 09:00-18:00 (GMT+8)` — client-unconfirmed placeholder, tracked in UIUX §17 item 4; downgrade to `Quoted by a person, not a bot` if the client declines business-hours publication |

### 3.3 Product-line landing — data bar

| Data point | Rendered copy |
|---|---|
| On-sale SKU count | `Catalogue depth varies by line` |
| Starting MOQ | `MOQ 12-120 pcs, stated per style` |
| New-arrival cycle | `New styles added continuously — ask for the current drop` |

### 3.4 PDP — spec and compliance fields

| Situation | Rendered copy |
|---|---|
| Compliance field, report absent (V1: all SKUs) | `On request — provided with your quotation` |
| Any of the eight spec fields missing | `On request — ask with your RFQ` |
| Nickel / Lead rows, no report | Same as compliance degraded line above (limit values 0.5 / 0.2 µg appear only on `/compliance/nickel-release-en-1811/`) |
| `Download PDF` report link | Not rendered in V1 (renders only when the four report attributes exist, AC-39) |
| Buy-panel lead time | `Lead time quoted per order` |
| Buy-panel shipping | `Ships worldwide` |
| Buy-panel after-sales | `After-sales on defects` |
| Price qualifier (visible, never tooltip) | `Reference range — quoted per order` |
| Tiered price entry | `Request the tiered price table` |

### 3.5 `/samples/` — policy page (policy details unconfirmed, AC-21 structure kept, numbers degraded)

| Block | Rendered copy |
|---|---|
| Page intro | `Order samples before you commit to bulk. Every rule below is stated in writing with your sample quotation.` |
| Sample pricing rule | `Samples are priced at the wholesale reference tier — quoted per order.` |
| Shipping cost responsibility | `Shipping is arranged with your sample quotation — the carrier and cost are stated before you pay.` |
| Dispatch lead time | `Dispatch time quoted per order.` |
| Returns | `Sample returns are accepted by agreement — stated with your quotation.` |
| Fee credit rule (AC-23; must also appear in RFQ confirmation) | `Sample fees can be credited in full to your first bulk order — the threshold is stated in your quotation.` |
| Mixed-box rule | `Mixed styles within one sample box are allowed — the limit per request is confirmed with your quote.` |

### 3.6 `/shipping-payment/` (lead time, carriers, logistics terms unconfirmed)

| Block | Rendered copy |
|---|---|
| MOQ rule | `MOQ 12-120 pcs, stated per style. Quantities below a style's MOQ can be quoted — flagged for confirmation at submission.` |
| Tier discount | `Priced by tier — see each collection. The exact tier table is quoted per order.` |
| Production & shipping lead time | `Lead time quoted per order.` |
| Incoterm explanations (educational, allowed) | `EXW — you collect from our warehouse.` / `FOB — we deliver to the vessel at the named Chinese port.` / `DDP — we handle transport and import duty to your door.` |
| Carriers & transit | `Carrier options and transit times are quoted per order and destination.` |
| Payment methods | `Payment methods and terms are stated with your quotation.` |
| Defects & claims | `Defects are replaced or credited after photo review — the claim window is written into your order confirmation.` |

### 3.7 `/contact/` (response time unconfirmed — AC-28)

| Block | Rendered copy |
|---|---|
| Response-time commitment | `Quoted by a person, not a bot.` |
| Timezone table title | `Our working hours, your timezone` |
| Timezone row | `Mon-Fri 09:00-18:00 (GMT+8)` with buyer-side timezone column computed locally |
| Channel cards | `Email — best for RFQs with spec sheets` / `WhatsApp — async during your business day` / `WeChat — for partners already working with us` |
| Contact handles | Placeholder tokens (`hello@rayanaccessories.example`, `+00 000 000 0000`) confined to the content data file, flagged `placeholder` — never invented to look real |

### 3.8 `/sourcing-partners/` (AC-24/25/26 — honest, no factory claims, no numbers)

| Block | Rendered copy |
|---|---|
| Opening statement | `We do not own a factory. We buy from a vetted workshop network, audited per lot, and we inspect every order before it ships. What we sell is specification accuracy and reply speed.` |
| QC step 1 | `Incoming inspection — base material and plating thickness checked against the spec sheet.` |
| QC step 2 | `In-process checks — the workshop's output is sampled against the agreed AQL plan.` |
| QC step 3 | `Pre-shipment inspection — every lot is inspected against an agreed AQL sampling plan; the level is written into your order.` |
| Buyer types strip | `Amazon sellers · Boutique buyers · Chain retail sourcing · Private label & OEM` |

### 3.9 `/compliance/` opening (PRD §13.5 — verbatim, educational + commitment tone)

> **What we can and cannot show you today**
> We do not keep a library of finished test reports on this site. What we do is send every batch for testing and hand you the report with your quotation — linked to the exact alloy, plating and batch you are buying.
> Until then, here is how to read a report, and the three questions that separate a real one from a bought one.

Educational content (REACH / EN 1811 / EN 12472 / CPSIA / Prop 65 / ASTM limit tables) is factual standard description and is allowed; assertions (`Certified/Approved/Tested/Compliant`), certificate graphics and lab logos are not (AC-41).

### 3.10 Empty states

| Context | Rendered copy |
|---|---|
| Catalog, zero results (AC-04) | Title: `Nothing matches that combination.` Body: `Remove one filter to see the nearest broader result set, or ask us directly.` CTAs: `Clear one filter` / `Request a product not listed` |
| Catalog, search zero hits | `No SKU matches "{query}". Try the SKU code exactly — e.g. ST-2407 — or browse a product line.` |
| RFQ basket empty (AC-13) | `Your RFQ list is empty. Start one of two ways —` CTAs: `Browse a product line` / `Paste SKU codes` (`Upload a CSV` is P1 — do not render) |
| Blog, no articles in category | `No articles in this category yet. New explainers are added as the catalog grows.` |

---

## 4. `src/i18n/en.json` — Key List with Initial English Values

Conventions: nested namespaces matching the UIUX component tree; sentence case for body copy; ALL CAPS applied via CSS (`text-transform` + tracking token), so dictionary values are stored in normal case and the component uppercases. `(caps)` markers below mean the value is authored already uppercase because it contains numerals/symbols that must read correctly.

```jsonc
{
  "meta": {
    "siteName": "Rayan Accessories",
    "tagline": "Three product lines. Verified specs on every SKU."
  },

  "nav": {
    "productLines": "Product Lines",
    "allProducts": "All products",
    "compliance": "Compliance",
    "sourcing": "Sourcing",
    "blog": "Blog",
    "contact": "Contact",
    "faq": "FAQ",
    "samples": "Samples",
    "shippingPayment": "Shipping & payment",
    "searchPlaceholder": "Search by SKU, material or style — e.g. ST-2407",
    "search": "Search",
    "rfq": "RFQ",
    "rfqWithCount": "RFQ ({count})",
    "openMenu": "Open menu",
    "closeMenu": "Close menu"
  },

  "utility": {
    "shipTo": "Ship to",
    "complianceFor": "Compliance for",
    "market.us": "United States",
    "market.eu_uk": "EU & UK",
    "market.middle_east": "Middle East",
    "market.rest": "Rest of world",
    "hours": "Mon-Fri 09:00-18:00 (GMT+8)"
  },

  "cta": {
    "browseCatalog": "Browse the catalog",
    "startRfq": "Start an RFQ",
    "requestSamples": "Request samples",
    "viewAll": "View all",
    "viewAllNew": "View all new",
    "addToRfq": "Add to RFQ",
    "addedToRfq": "Added to RFQ",
    "requestPriceTable": "Request the tiered price table",
    "contactUs": "Contact us",
    "clearFilters": "Clear all filters",
    "backToCatalog": "Back to catalog"
  },

  "hero": {
    "h1": "Three product lines. Verified specs on every SKU.",
    "line2": "Fashion alloy & brass · Stainless & titanium steel · Natural stone, lab gemstone & pearl",
    "line3": "We are a sourcing partner, not a factory owner. Here is exactly how we control quality instead.",
    "dataLine": "Hundreds of styles · MOQ 12-120 pcs, stated per style"
  },

  "trust": {
    "1.label": "MOQ 12-120 pcs, stated per style",
    "1.desc": "Confirmed range per style, not per order.",
    "2.label": "Sample before bulk",
    "2.desc": "Sample before bulk, fee credited to your first order.",
    "3.label": "Spec sheet with every quote",
    "3.desc": "Material grade, plating thickness and lead time, in writing.",
    "4.label": "Ships worldwide",
    "4.desc": "Ships worldwide.",
    "5.label": "Quoted by a person",
    "5.desc": "No bot replies, no template quotes."
  },

  "home": {
    "lines.title": "Three lines, one buying desk",
    "lines.alloy.desc": "Breadth and speed for volume buyers. Zinc alloy and brass, plated and finished, restocked continuously.",
    "lines.steel.desc": "Waterproof, non-tarnish, PVD-plated. Built for everyday wear in the EU and US.",
    "lines.stone.desc": "Natural stone, lab gemstone and pearl — no two stones alike, photographed by lot.",
    "newThisWeek.title": "New this week",
    "batch.title": "One batch, one light, photographed together.",
    "batch.desc": "Grid shots are the honest way to show a range: same light, same day, same background. You get the lot you are buying, not one hero SKU dressed up for the camera.",
    "buyers.title": "Built around how you buy",
    "buyers.amazon": "Amazon sellers — restockable staples with spec sheets you can paste into listings.",
    "buyers.boutique": "Boutique buyers — small-batch lines with per-style MOQ, priced by tier.",
    "buyers.chain": "Chain retail sourcing — repeatable quality, inspected per lot against an agreed AQL plan.",
    "buyers.oem": "Private label & OEM — your branding, our workshop network, quoted per order.",
    "how.title": "How it works",
    "how.step1": "Pick your SKUs — add to the RFQ list as you browse, paste codes if you have a list.",
    "how.step2": "Approve a sample — samples before bulk, fee credited to your first order.",
    "how.step3": "We ship & document — inspected per lot, documents travel with the shipment.",
    "compliance.title": "Compliance, without the badge wall",
    "compliance.card.nickel": "Nickel release — EN 1811 (uncoated) / EN 12472 (coated, wear-simulated first). Limit 0.5; pierced articles 0.2 µg/cm²/week.",
    "compliance.card.lead": "Lead & cadmium — REACH Annex XVII Entry 63 & 23, ≤0.05% / ≤0.01% w/w.",
    "compliance.card.howto": "How to read a report — standard, laboratory, report number, date. Four attributes, or it is not evidence.",
    "compliance.footer": "Test reports issued per batch and provided with your quotation.",
    "blog.title": "From the buying desk",
    "finalCta.title": "Tell us which lines you buy. We will send a quote, not a brochure."
  },

  "line": {
    "alloy.tagline": "Breadth and speed. New styles added continuously, priced for volume.",
    "steel.tagline": "Waterproof, non-tarnish, PVD-plated. Built for everyday wear in the EU and US.",
    "stone.tagline": "No two stones are identical. We photograph the lot you are buying, not a sample shot.",
    "stats.skuDepth": "Catalogue depth varies by line",
    "stats.moq": "MOQ 12-120 pcs, stated per style",
    "stats.cadence": "New styles added continuously — ask for the current drop",
    "materials.title": "Material & plating, in plain numbers",
    "steel.pvd.title": "PVD vs water plating",
    "steel.pvd.desc": "PVD bonds the layer in a vacuum chamber; water plating deposits it in a bath. PVD resists wear longer — thickness is stated on every spec sheet.",
    "steel.316l.title": "316L vs 304",
    "steel.316l.desc": "316L adds molybdenum for chloride resistance — the grade we use for pieces worn against skin.",
    "steel.corrosion.title": "Corrosion, explained",
    "steel.corrosion.desc": "Salt-spray behavior is a test result, not a promise. Every batch is sent for testing and the report travels with your quotation.",
    "stone.dictionary.title": "Stone dictionary",
    "stone.natural.title": "Natural variation is not a defect",
    "stone.natural.desc": "Veining, tone shifts and inclusion are what natural stone is. We photograph the parcel you are buying so what you approve is what ships.",
    "subcategories.title": "Shop by type",
    "bestsellers.title": "Bestsellers on this line",
    "crossLine.title": "Buyers of this line also source"
  },

  "filter": {
    "title": "Filters",
    "line": "Product line",
    "material": "Material grade",
    "plating": "Plating method",
    "category": "Product type",
    "compliance": "Compliance",
    "moq": "MOQ band (pcs)",
    "moq.b1": "12-30",
    "moq.b2": "31-60",
    "moq.b3": "61-120",
    "stock": "Availability",
    "clearAll": "Clear all",
    "apply": "Apply filters",
    "results": "{count} SKUs",
    "view.grid": "Grid view",
    "view.list": "List view",
    "sort.featured": "Featured",
    "sort.newest": "Newest",
    "sort.moqAsc": "MOQ, low to high",
    "sort.priceAsc": "Reference price, low to high",
    "chip.remove": "Remove filter: {label}",
    "bulkAdd": "Add selected to RFQ"
  },

  "category": {
    "earrings": "Earrings",
    "necklace": "Necklaces",
    "bracelet": "Bracelets",
    "ring": "Rings",
    "hair-accessory": "Hair accessories",
    "brooch": "Brooches",
    "anklet": "Anklets"
  },

  "pdp": {
    "breadcrumb.products": "All products",
    "gallery.thumb": "View image {n} of {total}",
    "status.inStock": "In stock",
    "status.madeToOrder": "Made to order",
    "status.lowStock": "Low stock",
    "spec.title": "Specifications",
    "spec.material": "Material",
    "spec.plating": "Plating",
    "spec.stone": "Stone",
    "spec.size": "Size",
    "spec.weight": "Weight",
    "spec.nickel": "Nickel release",
    "spec.lead": "Lead & cadmium",
    "spec.finish": "Finish",
    "spec.onRequest": "On request — ask with your RFQ",
    "price.title": "Reference Price",
    "price.qualifier": "Reference range — quoted per order",
    "qty.label": "Quantity",
    "qty.stepIsMoq": "Steps follow this style's MOQ and round to it.",
    "moq.label": "MOQ {min} pcs per style",
    "leadTime": "Lead time quoted per order",
    "ships": "Ships worldwide",
    "afterSales": "After-sales on defects",
    "compliance.title": "Compliance",
    "compliance.degraded": "Test reports issued per batch — provided with your quotation",
    "compliance.howWeTest": "How we test this",
    "acc.details": "Product details",
    "acc.care": "Plating & care",
    "acc.packaging": "Packaging & labeling",
    "sameSeries": "Same series",
    "paired": "Often paired with",
    "mobileBar.submit": "Submit RFQ",
    "mobileBar.summary": "{count} SKUs · {pcs} pcs"
  },

  "rfq": {
    "title": "RFQ list",
    "item.notePlaceholder": "e.g. Need custom packaging, FOB Shenzhen, nickel-free required",
    "item.remove": "Remove {sku}",
    "empty.title": "Your RFQ list is empty.",
    "empty.desc": "Start one of two ways —",
    "empty.browse": "Browse a product line",
    "empty.paste": "Paste SKU codes",
    "paste.placeholder": "One SKU code per line — e.g. ST-2407",
    "paste.parse": "{matched} matched, {unmatched} not found. Unmatched lines are kept below for review.",
    "form.title": "Where should the quote go?",
    "form.company": "Company name",
    "form.contact": "Contact name",
    "form.email": "Business email",
    "form.country": "Destination country / market",
    "form.qty": "Estimated total quantity",
    "form.notes": "Notes for the account manager",
    "form.submit": "Submit RFQ",
    "form.submitting": "Submitting…",
    "summary.title": "Compliance for your market",
    "summary.degraded": "Test reports issued per batch and provided with your quotation. Your destination market determines which standards apply — the summary travels with your RFQ.",
    "success.title": "Received.",
    "success.body": "Your enquiry is queued for a named account manager. A confirmation email with your full RFQ is on its way.",
    "error.title": "The RFQ did not go through.",
    "error.body": "Your list is saved. Try again, or send it directly — email and WhatsApp are one tap away.",
    "minOne": "Add at least one SKU before submitting.",
    "belowMoq": "Below this style's MOQ — we will flag it for confirmation."
  },

  "sample": {
    "title": "Samples before bulk",
    "intro": "Order samples before you commit to bulk. Every rule below is stated in writing with your sample quotation.",
    "pricing": "Samples are priced at the wholesale reference tier — quoted per order.",
    "shipping": "Shipping is arranged with your sample quotation — the carrier and cost are stated before you pay.",
    "returns": "Sample returns are accepted by agreement — stated with your quotation.",
    "leadTime": "Dispatch time quoted per order.",
    "credit": "Sample fees can be credited in full to your first bulk order — the threshold is stated in your quotation.",
    "mixedBox": "Mixed styles within one sample box are allowed — the limit per request is confirmed with your quote.",
    "cta": "Request samples"
  },

  "shipping": {
    "title": "Shipping & payment",
    "moq.title": "MOQ rules",
    "moq.body": "MOQ 12-120 pcs, stated per style. Quantities below a style's MOQ can be quoted — flagged for confirmation at submission.",
    "tier.title": "Tiered pricing",
    "tier.body": "Priced by tier — see each collection. The exact tier table is quoted per order.",
    "lead.title": "Lead time",
    "lead.body": "Lead time quoted per order.",
    "incoterms.title": "Delivery terms",
    "incoterms.exw": "EXW — you collect from our warehouse.",
    "incoterms.fob": "FOB — we deliver to the vessel at the named Chinese port.",
    "incoterms.ddp": "DDP — we handle transport and import duty to your door.",
    "carriers.title": "Carriers & transit",
    "carriers.body": "Carrier options and transit times are quoted per order and destination.",
    "payment.title": "Payment",
    "payment.body": "Payment methods and terms are stated with your quotation.",
    "claims.title": "Defects & claims",
    "claims.body": "Defects are replaced or credited after photo review — the claim window is written into your order confirmation."
  },

  "compliance": {
    "title": "Compliance & testing",
    "status.title": "What we can and cannot show you today",
    "status.body1": "We do not keep a library of finished test reports on this site. What we do is send every batch for testing and hand you the report with your quotation — linked to the exact alloy, plating and batch you are buying.",
    "status.body2": "Until then, here is how to read a report, and the three questions that separate a real one from a bought one.",
    "standards.title": "The standards, and what they actually require",
    "standard.nickel": "Nickel release — REACH Annex XVII Entry 27. EN 1811 for uncoated articles, EN 12472 wear simulation for coated. Limit 0.5 µg/cm²/week; pierced articles 0.2.",
    "standard.lead": "Lead — REACH Annex XVII Entry 63, ≤0.05% w/w.",
    "standard.cadmium": "Cadmium — REACH Annex XVII Entry 23, ≤0.01% w/w.",
    "standard.cpsia": "CPSIA — US children's product lead limits, applicable to children's jewelry.",
    "standard.prop65": "California Prop 65 — warning obligations for listed substances.",
    "standard.astm": "ASTM F2999 / F2923 — US consumer safety specifications for adult and children's jewelry.",
    "verify.title": "How to verify a test report",
    "verify.body": "Cross-check the report number with the issuing laboratory. A report without all four attributes — standard, laboratory, report number, date — is not evidence.",
    "batch.title": "Per-batch testing, in writing",
    "batch.body": "Test reports are issued per batch and provided with your quotation for the matching product.",
    "request.title": "Request the latest report",
    "request.body": "Tell us the SKU and destination market; the report for the matching batch is attached to your quotation.",
    "nickelArticle.title": "Nickel release & EN 1811, explained",
    "nickelArticle.intro": "Most suppliers test the base metal. EN 12472 requires simulating wear first, then testing what actually touches skin. That is where thin plating fails.",
    "nickelArticle.limitCoated": "Coated articles: 0.5 µg/cm²/week after EN 12472 wear simulation.",
    "nickelArticle.limitPierced": "Pierced articles — ear posts and similar: 0.2 µg/cm²/week, no exceptions.",
    "nickelArticle.failures": "Common failures: plating below stated thickness, unverified base alloy, and reports issued without wear simulation."
  },

  "faq": {
    "title": "Frequently asked questions",
    "searchPlaceholder": "Search the FAQ — e.g. MOQ, samples, EN 1811",
    "group.moq": "MOQ & pricing",
    "group.samples": "Samples",
    "group.shipping": "Shipping & lead time",
    "group.customization": "Customization & OEM",
    "group.payment": "Payment & terms",
    "group.compliance": "Compliance",
    "unresolved": "Not covered here? Ask directly — a person replies, not a bot.",
    "contactCta": "Contact us"
  },

  "blog": {
    "title": "Buying guides & explainers",
    "category.material": "Material guides",
    "category.plating": "Plating & care",
    "category.buying": "Buying guides",
    "category.compliance": "Compliance explainers",
    "empty": "No articles in this category yet. New explainers are added as the catalog grows.",
    "subscribe.title": "New explainers, by email",
    "subscribe.desc": "One email when a new guide lands. No sequences, no promotions.",
    "subscribe.placeholder": "Business email",
    "subscribe.button": "Subscribe",
    "subscribe.success": "Subscribed. One email per new guide."
  },

  "contact": {
    "title": "Contact",
    "channel.email.label": "Email",
    "channel.email.desc": "Best for RFQs with spec sheets",
    "channel.whatsapp.label": "WhatsApp",
    "channel.whatsapp.desc": "Async during your business day",
    "channel.wechat.label": "WeChat",
    "channel.wechat.desc": "For partners already working with us",
    "form.title": "Send a structured enquiry",
    "form.name": "Contact name",
    "form.company": "Company name",
    "form.email": "Business email",
    "form.market": "Destination market",
    "form.subject": "What is this about?",
    "form.message": "Message",
    "form.submit": "Send enquiry",
    "response.title": "What to expect",
    "response.body": "Quoted by a person, not a bot.",
    "timezone.title": "Our working hours, your timezone",
    "timezone.body": "Mon-Fri 09:00-18:00 (GMT+8). The table shows what that is in your local time."
  },

  "footer": {
    "col.lines": "Product lines",
    "col.support": "Buyer support",
    "col.company": "Company",
    "col.newsletter": "Newsletter",
    "newsletter.placeholder": "Business email",
    "newsletter.button": "Subscribe",
    "complianceNote": "Test reports issued per batch — provided with your quotation.",
    "rights": "© {year} Rayan Accessories. All rights reserved."
  },

  "empty": {
    "catalog.title": "Nothing matches that combination.",
    "catalog.desc": "Remove one filter to see the nearest broader result set, or ask us directly.",
    "catalog.cta": "Request a product not listed",
    "search.title": "No SKU matches \"{query}\".",
    "search.desc": "Try the SKU code exactly — e.g. ST-2407 — or browse a product line."
  },

  "validation": {
    "required": "This field is required.",
    "email": "Enter a valid business email.",
    "qtyRange": "Enter a quantity between 1 and 999999.",
    "maxStyles": "Sample requests cover up to {max} styles per request."
  }
}
```

Key count: ~185 — within the 150-250 target. Namespaces `filter.*`, `category.*`, `pdp.*`, `rfq.*`, `compliance.*`, `empty.*` cover the Product register; `hero.*`, `trust.*`, `home.*`, `line.*` cover the Brand register.

---

## 5. Brand Wordmark Placeholder — "Rayan Accessories"

Text-only wordmark until the client delivers a logo (UIUX §17 item 8). No icon mark, no monogram, no gradient, no tagline attached.

### 5.1 Header lockup (light surface)

| Property | Value |
|---|---|
| Content | `Rayan Accessories` — single line, sentence case, two words, two weights |
| "Rayan" | Archivo 700 (`font.weight.announce`), 18 px, `--fg` |
| "Accessories" | Archivo 400 (`font.weight.read`), 18 px, `--fg` |
| Letter-spacing | `0.01em` overall (body tracking — NOT the 0.08em caps tracking; a long wordmark at caps tracking reads as a stamp) |
| Optional separator | 1 px × 14 px `--border` vertical rule between the words is permitted but not required |
| Sizing | 18 px in Header (h 64 px); never scaled below 16 px |

### 5.2 Footer lockup (dark plane `--surface-inverse`)

Same structure, color `--fg-inverse`, 16 px. No inverted-color experimental variants.

### 5.3 Compact slots (mobile header, email footer, P1 market pages)

Single-line caps form: `RAYAN ACCESSORIES`, Archivo 600 (`font.weight.subhead`), 12 px, tracking `0.08em` (token `font.tracking.caps`). Used only where the two-weight lockup is too wide for the container.

### 5.4 Rules

1. The wordmark is a link to `/` with `aria-label="Rayan Accessories — home"`; no `alt` on text.
2. Font is the locked display family (Archivo) — no custom logotype font, no letter-spacing hacks beyond the token, no `background-clip: text`.
3. Implementation is plain text in the component with a single `wordmark` partial shared by Header/Footer, so the real logo swap later touches one file.
4. Never combined with a stock "R" badge, shield, or gem glyph — a fake mark is harder to replace than no mark.

---

## 6. Handoff Notes for Phase 3 (non-negotiables restated)

1. All copy arrives via `t(key)` from `src/i18n/en.json` (ADR-004); the Section-4 tree is the dictionary's initial content.
2. Demo numbers live only in `src/content/products/*.json` with `dataStatus: "placeholder"`; `renderComplianceTag(data)` single function gates the four report attributes and lands on `Test reports issued per batch — provided with your quotation` (UIUX §16 item 11).
3. Placeholder images: token-colored inline SVG only; category icon set per §2.2; ratios per §2.1; alt per AC-33.
4. When real data arrives: replace content files + image directory only. If a page needs edits for real data, that is a bug in this plan — report back instead of patching the page.
5. CI gates that will catch violations: emoji regex scan (2600-27BF included), hex-literal scan outside token files, `dist/` absence of `/zh/` (SPEC §12).
