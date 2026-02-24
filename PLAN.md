# Dual Pricing System — Implementation Plan

## Overview
Add support for items with two price points (single/double for coffees, glass/bottle for wines & spirits). The admin can choose the pricing type per item, and the customer menu displays both prices elegantly.

---

## 1. Backend — Model (`menu_item.rb`)

Add two new fields to the Mongoid model:
- `pricing_type` (String, default: `"single"`) — values: `"single"`, `"single_double"`, `"glass_bottle"`
- `price_secondary` (Float, optional) — the second price (double or bottle price)

Existing `price` field stays as the primary price. No migration needed (MongoDB). Fully backward compatible — all existing items default to `pricing_type: "single"`.

## 2. Backend — Controller (`menu_items_controller.rb`)

- **Permit** `pricing_type` and `price_secondary` in strong params
- **Assign** them in `assign_localized_fields`
- **Serialize** them in `serialize_item` — always return `pricing_type` and `price_secondary`
- When `pricing_type` is `"single"`, `price_secondary` is ignored/null

## 3. Frontend — TypeScript Interfaces

Update `MenuItemData` in both `AdminPanel.tsx` and `MenuSection.tsx` to add:
```ts
pricing_type?: "single" | "single_double" | "glass_bottle";
price_secondary?: number | null;
```

## 4. Frontend — AdminPanel Form Changes

**Pricing type selector** — a clean segmented control in the item form:
- `Single Price` (default)
- `Single / Double` (for coffees)
- `Glass / Bottle` (for wines & spirits)

**Conditional price inputs:**
- When "Single Price" selected: show one price input labeled "Price (€)" (current behavior)
- When "Single / Double" selected: show two side-by-side inputs — "Single (€)" and "Double (€)"
- When "Glass / Bottle" selected: show two side-by-side inputs — "Glass (€)" and "Bottle (€)"

**Admin item list row:** show price as:
- Single: `4.00€`
- Dual: `4.00€ / 4.50€`

## 5. Frontend — MenuSection (Customer Menu) Changes

**Item row** — display dual prices inline next to each other:
- Single: `4.00€` (unchanged)
- Single/Double: show both prices with small S/D labels
- Glass/Bottle: show both prices with small Glass/Bottle labels

**Item detail modal** — show both prices clearly with descriptive labels.

Both support bilingual labels (EN: "Single/Double", EL: "Μονός/Διπλός", EN: "Glass/Bottle", EL: "Ποτήρι/Μπουκάλι").

## 6. CSS Additions

- **AdminPanel.css**: `.pricing-type-selector` segmented control, dual price input layout
- **MenuSection.css**: `.menu-item__price-dual` container, `.menu-item__price-label` tiny labels, modal dual pricing styles

## 7. Seeds Update

Update select items to showcase the feature:
- Espresso, Cappuccino, etc. → `pricing_type: "single_double"`
- Wine items → `pricing_type: "glass_bottle"`

---

## Files Modified (7 files)
1. `backend/app/models/menu_item.rb` — add 2 fields
2. `backend/app/controllers/menu_items_controller.rb` — permit, assign, serialize new fields
3. `backend/db/seeds.rb` — add dual pricing to sample items
4. `frontend/src/components/AdminPanel.tsx` — pricing type selector + dual price inputs in form, dual price display in list
5. `frontend/src/components/MenuSection.tsx` — dual price display in menu rows + detail modal
6. `frontend/src/styles/AdminPanel.css` — pricing type selector styles
7. `frontend/src/styles/MenuSection.css` — dual price display styles
