---
name: reverb
description: Use for public Reverb listing search or managing the user's own seller listings (list, get, create draft, update, publish, end). Public search needs no token; seller tools need REVERB_TOKEN. Ask the user before publish_listing or end_listing. Never invent titles, prices, SKUs, or other listing fields.
---

# Reverb listings

## Public (no token)

- `search_listings` — marketplace search. Pass `query`; optional `page`, `per_page`.
- `get_listing` — one public listing by numeric `id`.
- `list_categories` — flat category list (`uuid` values for create/update).
- `list_conditions` — condition list (`uuid` values). Prefer calling with token when available so account-specific conditions appear.

## Seller (REVERB_TOKEN required)

Configure `REVERB_TOKEN` in Cursor Plugins → Configure (scopes: `public`, `read_listings`, `write_listings`).

- `list_my_listings` — GET my listings. Defaults `state` to `all` so drafts appear. Optional `sku`, `page`, `per_page`.
- `get_my_listing` — seller view of one listing by `id`.
- `create_listing` — POST a listing. **Draft by default** unless `publish` is set. Prefer `make` + `model`. Only send documented fields the user provided.
- `update_listing` — PUT same documented fields (partial ok).
- `publish_listing` — publish an existing draft. **Ask the user first.**
- `end_listing` — end a live listing with `reason` `not_sold` or `reverb_sale`. **Ask the user first.**
- `get_shop` — shop info including `shipping_profiles` for `shipping_profile_id`.

## Rules

- Never invent listing data. Report only tool results.
- A listing `url` is the HAL `web` link when present, else `self`.
- Do not use this plugin for orders, payouts, or shipping fulfillment.
