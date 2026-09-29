# Reverb Cursor Plugin

Public marketplace search plus authenticated seller listing management for [Reverb](https://reverb.com).

## Personal access token

1. Sign in to Reverb and open your profile.
2. Go to **API & Integrations**.
3. Click **Generate New Token**.
4. Select at least: `public`, `read_listings`, `write_listings`.
5. In Cursor: **Plugins → Configure** on this plugin and set `REVERB_TOKEN` to that token.

Do not commit tokens. The plugin only declares the variable name; `mcp.json` uses `${REVERB_TOKEN}`.

## Tools

- Public (no token): `search_listings`, `get_listing`, `list_categories`, `list_conditions`
- Seller (token required): `list_my_listings`, `get_my_listing`, `create_listing`, `update_listing`, `publish_listing`, `end_listing`, `get_shop`

`create_listing` defaults to a draft unless you pass `publish`. Ask before publish or end.
