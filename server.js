#!/usr/bin/env node
"use strict";

const PUBLIC_API_ROOT = "https://reverb.com/api";
const SELLER_ORIGIN = "https://api.reverb.com";
const PUBLIC_ORIGIN = "https://reverb.com";

const LISTING_BODY_KEYS = [
  "title",
  "make",
  "model",
  "finish",
  "year",
  "description",
  "sku",
  "upc",
  "upc_does_not_apply",
  "price",
  "categories",
  "category_uuids",
  "condition",
  "photos",
  "videos",
  "has_inventory",
  "inventory",
  "offers_enabled",
  "handmade",
  "shipping_profile_id",
  "shipping",
  "publish",
];

const TOOLS = [
  {
    name: "search_listings",
    description:
      "Search public Reverb listings. Returns listing objects and a next URL when the API provides one. No token required.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search text sent as the listings collection query parameter.",
        },
        page: {
          type: "integer",
          minimum: 1,
          description: "Page number, as used by the collection next link.",
        },
        per_page: {
          type: "integer",
          minimum: 1,
          description: "Page size, as used by the collection next link.",
        },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    name: "get_listing",
    description: "Get one public Reverb listing by numeric id. No token required.",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "integer",
          description: "Listing id from search_listings.",
        },
      },
      required: ["id"],
      additionalProperties: false,
    },
  },
  {
    name: "list_my_listings",
    description:
      "List the authenticated seller's listings (includes drafts when state=all). Requires REVERB_TOKEN.",
    inputSchema: {
      type: "object",
      properties: {
        sku: { type: "string", description: "Filter by SKU." },
        state: {
          type: "string",
          description: "Listing state filter. Defaults to all so drafts appear.",
        },
        page: { type: "integer", minimum: 1 },
        per_page: { type: "integer", minimum: 1 },
      },
      additionalProperties: false,
    },
  },
  {
    name: "get_my_listing",
    description:
      "Get one of the seller's listings by id (authenticated). Requires REVERB_TOKEN.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "integer", description: "Listing id." },
      },
      required: ["id"],
      additionalProperties: false,
    },
  },
  {
    name: "create_listing",
    description:
      "Create a seller listing as a draft by default (omit publish or set false). Requires REVERB_TOKEN. Prefer make and model.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        make: { type: "string" },
        model: { type: "string" },
        finish: { type: "string" },
        year: { type: "string" },
        description: { type: "string" },
        sku: { type: "string" },
        upc: { type: "string" },
        upc_does_not_apply: {
          description: "String true/false per Reverb create docs, or boolean.",
        },
        price: {
          type: "object",
          properties: {
            amount: { type: "string" },
            currency: { type: "string" },
          },
          required: ["amount", "currency"],
          additionalProperties: false,
        },
        categories: {
          type: "array",
          items: {
            type: "object",
            properties: { uuid: { type: "string" } },
            required: ["uuid"],
            additionalProperties: false,
          },
        },
        category_uuids: {
          type: "array",
          items: { type: "string" },
          description: "Category UUID strings from list_categories.",
        },
        condition: {
          type: "object",
          properties: { uuid: { type: "string" } },
          required: ["uuid"],
          additionalProperties: false,
        },
        photos: { type: "array", items: { type: "string" } },
        videos: {
          type: "array",
          items: {
            type: "object",
            properties: { link: { type: "string" } },
            required: ["link"],
            additionalProperties: false,
          },
        },
        has_inventory: { type: "boolean" },
        inventory: { type: "integer" },
        offers_enabled: { type: "boolean" },
        handmade: { type: "boolean" },
        shipping_profile_id: {},
        shipping: {
          type: "object",
          properties: {
            local: { type: "boolean" },
            rates: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  region_code: { type: "string" },
                  rate: {
                    type: "object",
                    properties: {
                      amount: { type: "string" },
                      currency: { type: "string" },
                    },
                    required: ["amount", "currency"],
                    additionalProperties: false,
                  },
                },
                required: ["region_code", "rate"],
                additionalProperties: false,
              },
            },
          },
          additionalProperties: false,
        },
        publish: {
          description: "If true, publish on create. Default draft when omitted/false.",
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "update_listing",
    description:
      "Update a seller listing with the same documented fields as create (partial ok). Requires REVERB_TOKEN.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "integer", description: "Listing id to update." },
        title: { type: "string" },
        make: { type: "string" },
        model: { type: "string" },
        finish: { type: "string" },
        year: { type: "string" },
        description: { type: "string" },
        sku: { type: "string" },
        upc: { type: "string" },
        upc_does_not_apply: {},
        price: {
          type: "object",
          properties: {
            amount: { type: "string" },
            currency: { type: "string" },
          },
          required: ["amount", "currency"],
          additionalProperties: false,
        },
        categories: {
          type: "array",
          items: {
            type: "object",
            properties: { uuid: { type: "string" } },
            required: ["uuid"],
            additionalProperties: false,
          },
        },
        category_uuids: { type: "array", items: { type: "string" } },
        condition: {
          type: "object",
          properties: { uuid: { type: "string" } },
          required: ["uuid"],
          additionalProperties: false,
        },
        photos: { type: "array", items: { type: "string" } },
        videos: {
          type: "array",
          items: {
            type: "object",
            properties: { link: { type: "string" } },
            required: ["link"],
            additionalProperties: false,
          },
        },
        has_inventory: { type: "boolean" },
        inventory: { type: "integer" },
        offers_enabled: { type: "boolean" },
        handmade: { type: "boolean" },
        shipping_profile_id: {},
        shipping: {
          type: "object",
          properties: {
            local: { type: "boolean" },
            rates: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  region_code: { type: "string" },
                  rate: {
                    type: "object",
                    properties: {
                      amount: { type: "string" },
                      currency: { type: "string" },
                    },
                    required: ["amount", "currency"],
                    additionalProperties: false,
                  },
                },
                required: ["region_code", "rate"],
                additionalProperties: false,
              },
            },
          },
          additionalProperties: false,
        },
        publish: {},
      },
      required: ["id"],
      additionalProperties: false,
    },
  },
  {
    name: "publish_listing",
    description:
      "Publish an existing draft listing. Sends publish as the string true per Reverb docs. Requires REVERB_TOKEN. Ask the user before calling.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "integer", description: "Listing id to publish." },
      },
      required: ["id"],
      additionalProperties: false,
    },
  },
  {
    name: "end_listing",
    description:
      "End a live listing. reason must be not_sold or reverb_sale. Requires REVERB_TOKEN. Ask the user before calling.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "integer", description: "Listing id to end." },
        reason: {
          type: "string",
          enum: ["not_sold", "reverb_sale"],
          description: "End reason per Reverb docs.",
        },
      },
      required: ["id", "reason"],
      additionalProperties: false,
    },
  },
  {
    name: "list_categories",
    description:
      "List flat Reverb categories (uuid values for create/update). Public; no token required.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "list_conditions",
    description:
      "List listing conditions (uuid values). Public without token; with REVERB_TOKEN returns account-enabled conditions.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "get_shop",
    description:
      "Get the authenticated shop, including shipping_profiles for shipping_profile_id. Requires REVERB_TOKEN.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
];

function getToken() {
  const t = process.env.REVERB_TOKEN;
  if (typeof t === "string" && t.trim() !== "") return t.trim();
  return null;
}

function requireToken() {
  const token = getToken();
  if (!token) {
    throw new Error(
      "REVERB_TOKEN is not set. Configure it in Cursor Plugins → Configure (Profile → API & Integrations → Generate New Token; scopes public, read_listings, write_listings)."
    );
  }
  return token;
}

function apiHeaders(opts) {
  const headers = {
    Accept: "application/hal+json",
    "Accept-Version": "3.0",
  };
  if (opts && opts.contentType) headers["Content-Type"] = opts.contentType;
  if (opts && opts.auth) {
    headers.Authorization = "Bearer " + opts.auth;
  }
  return headers;
}

function resolveHref(href, origin) {
  if (typeof href !== "string" || href.length === 0) {
    throw new Error("Reverb API link missing href");
  }
  if (href.startsWith("https://") || href.startsWith("http://")) return href;
  if (href.startsWith("//")) return "https:" + href;
  if (href.startsWith("/")) return (origin || PUBLIC_ORIGIN) + href;
  return new URL(href, (origin || PUBLIC_ORIGIN) + "/").href;
}

async function apiRequest(url, options) {
  const opts = options || {};
  const headers = apiHeaders({
    auth: opts.auth,
    contentType: opts.contentType,
  });
  const init = { method: opts.method || "GET", headers };
  if (opts.body !== undefined) {
    init.body = typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body);
  }
  const res = await fetch(url, init);
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }
  if (!res.ok) {
    let detail = text.slice(0, 500);
    if (body && typeof body === "object") {
      if (typeof body.error === "string") detail = body.error;
      else if (typeof body.message === "string") detail = body.message;
      else if (body.errors) detail = JSON.stringify(body.errors).slice(0, 500);
    }
    throw new Error("Reverb API " + res.status + " for " + url + ": " + detail);
  }
  return body;
}

async function listingsCollectionUrl() {
  const root = await apiRequest(PUBLIC_API_ROOT);
  const href = root && root._links && root._links.listings && root._links.listings.href;
  if (!href) throw new Error("API root did not include a listings link");
  return resolveHref(href, PUBLIC_ORIGIN);
}

function pick(obj, keys) {
  if (!obj || typeof obj !== "object") return undefined;
  const out = {};
  for (const key of keys) {
    if (obj[key] !== undefined) out[key] = obj[key];
  }
  return Object.keys(out).length ? out : undefined;
}

const PLAIN_DESCRIPTION_KEYS = ["plain_text_description", "description_plain", "plain_description"];
const HTML_DESCRIPTION_KEYS = ["description_html", "html_description"];

function firstString(obj, keys) {
  if (!obj || typeof obj !== "object") return undefined;
  for (const key of keys) {
    if (typeof obj[key] === "string") return obj[key];
  }
  return undefined;
}

function decodeBasicEntities(value) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");
}

function normalizedText(value) {
  return decodeBasicEntities(value).replace(/\s+/g, " ").trim();
}

function looksLikeHtml(value) {
  return /<\/?[a-z][^>]*>/i.test(value);
}

function htmlAttributeValues(html, name) {
  const values = [];
  const pattern = new RegExp("\\b" + name + "\\s*=\\s*([\"'])([\\s\\S]*?)\\1", "gi");
  let match;
  while ((match = pattern.exec(html))) values.push(match[2]);
  return values;
}

function htmlVisibleText(html) {
  return normalizedText(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  );
}

function plainTextCoversHtml(plain, html) {
  const plainNorm = normalizedText(plain);
  const visible = htmlVisibleText(html);
  if (visible && plainNorm.indexOf(visible) === -1) return false;
  const extras = htmlAttributeValues(html, "href").concat(htmlAttributeValues(html, "src"));
  for (const value of extras) {
    if (plain.indexOf(value) === -1 && plainNorm.indexOf(normalizedText(value)) === -1) return false;
  }
  return true;
}

function chooseListingDescription(plain, html) {
  if (typeof plain !== "string" && typeof html !== "string") return undefined;
  if (typeof html !== "string") return plain;
  if (typeof plain !== "string") return html;
  if (plainTextCoversHtml(plain, html)) return plain;
  return html;
}

// Reverb's listing resource sends the seller description as `description`.
// When a response also includes a distinct plain-text field and an HTML field,
// keep the plain text if it already contains the HTML's visible text and URLs.
function listingDescription(item) {
  if (!item || typeof item !== "object") return undefined;
  const raw = item.description;

  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return chooseListingDescription(
      firstString(raw, ["plain_text", "plain", "text"]),
      firstString(raw, ["html", "html_text"])
    );
  }

  if (typeof raw !== "string") return undefined;

  const explicitPlain = firstString(item, PLAIN_DESCRIPTION_KEYS);
  const explicitHtml = firstString(item, HTML_DESCRIPTION_KEYS);
  if (explicitPlain === undefined && explicitHtml === undefined) return raw;

  const rawIsHtml = looksLikeHtml(raw);
  const htmlCandidates = [];
  if (rawIsHtml) htmlCandidates.push(raw);
  if (explicitHtml !== undefined && htmlCandidates.indexOf(explicitHtml) === -1) htmlCandidates.push(explicitHtml);
  if (htmlCandidates.length === 0) return raw;

  const plainCandidates = [];
  if (!rawIsHtml) plainCandidates.push(raw);
  if (explicitPlain !== undefined && plainCandidates.indexOf(explicitPlain) === -1) plainCandidates.push(explicitPlain);

  const coversAllHtml = (plain) => htmlCandidates.every((html) => plainTextCoversHtml(plain, html));
  if (plainCandidates.indexOf(raw) !== -1 && coversAllHtml(raw)) return raw;
  for (const candidate of plainCandidates) {
    if (coversAllHtml(candidate)) return candidate;
  }

  let chosen = htmlCandidates[0];
  for (const candidate of htmlCandidates) {
    const chosenCovers = plainTextCoversHtml(htmlVisibleText(chosen), candidate);
    const candidateCovers = plainTextCoversHtml(htmlVisibleText(candidate), chosen);
    if (candidateCovers && !chosenCovers) chosen = candidate;
  }
  return chosen;
}

function isListingResource(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return false;
  if (body.id !== undefined) return true;
  if (typeof body.title === "string") return true;
  if (typeof body.make === "string" || typeof body.model === "string") return true;
  if (typeof body.description === "string") return true;
  if (body.description && typeof body.description === "object") return true;
  const links = body._links;
  if (links && typeof links === "object" && (links.self || links.web)) return true;
  return false;
}

function toListing(item) {
  if (!item || typeof item !== "object") return {};
  const links = item._links && typeof item._links === "object" ? item._links : {};
  const web = links.web && links.web.href;
  const self = links.self && links.self.href;
  const listing = {};
  if (item.id !== undefined) listing.id = item.id;
  if (item.title !== undefined) listing.title = item.title;
  if (item.make !== undefined) listing.make = item.make;
  if (item.model !== undefined) listing.model = item.model;
  if (item.finish !== undefined) listing.finish = item.finish;
  if (item.year !== undefined) listing.year = item.year;
  if (item.sku !== undefined) listing.sku = item.sku;
  const description = listingDescription(item);
  if (description !== undefined) listing.description = description;
  const price = pick(item.price, ["amount", "currency", "display"]);
  if (price) listing.price = price;
  const condition = pick(item.condition, ["display_name", "slug"]);
  if (condition) listing.condition = condition;
  if (item.shop_name !== undefined) listing.shop_name = item.shop_name;
  const state = pick(item.state, ["slug", "description"]);
  if (state) listing.state = state;
  if (item.inventory !== undefined) listing.inventory = item.inventory;
  if (typeof web === "string") listing.url = web;
  else if (typeof self === "string") listing.url = self;
  return listing;
}

function collectionResult(body) {
  const rows = Array.isArray(body && body.listings) ? body.listings : [];
  const result = { listings: rows.map(toListing) };
  const next = body && body._links && body._links.next && body._links.next.href;
  if (typeof next === "string") result.next = next;
  return result;
}

function buildListingBody(args) {
  const body = {};
  for (const key of LISTING_BODY_KEYS) {
    if (args[key] !== undefined) body[key] = args[key];
  }
  return body;
}

function requireId(args) {
  const id = args && args.id;
  if (!Number.isInteger(id) || id < 0) throw new Error("id must be a non-negative integer");
  return id;
}

async function searchListings(args) {
  const query = args && args.query;
  if (typeof query !== "string" || query.trim() === "") {
    throw new Error("query must be a non-empty string");
  }
  const collection = await listingsCollectionUrl();
  const url = new URL(collection);
  url.searchParams.set("query", query);
  if (args.page !== undefined) {
    if (!Number.isInteger(args.page) || args.page < 1) throw new Error("page must be an integer >= 1");
    url.searchParams.set("page", String(args.page));
  }
  if (args.per_page !== undefined) {
    if (!Number.isInteger(args.per_page) || args.per_page < 1) {
      throw new Error("per_page must be an integer >= 1");
    }
    url.searchParams.set("per_page", String(args.per_page));
  }
  const body = await apiRequest(url.href);
  return collectionResult(body);
}

async function getListing(args) {
  const id = requireId(args);
  const collection = await listingsCollectionUrl();
  const base = new URL(collection);
  const path = base.pathname.replace(/\/$/, "") + "/" + encodeURIComponent(String(id));
  const body = await apiRequest(base.origin + path);
  return toListing(body);
}

async function listMyListings(args) {
  const token = requireToken();
  const url = new URL(SELLER_ORIGIN + "/api/my/listings");
  const state = args && args.state !== undefined ? args.state : "all";
  url.searchParams.set("state", String(state));
  if (args && args.sku !== undefined) url.searchParams.set("sku", String(args.sku));
  if (args && args.page !== undefined) {
    if (!Number.isInteger(args.page) || args.page < 1) throw new Error("page must be an integer >= 1");
    url.searchParams.set("page", String(args.page));
  }
  if (args && args.per_page !== undefined) {
    if (!Number.isInteger(args.per_page) || args.per_page < 1) {
      throw new Error("per_page must be an integer >= 1");
    }
    url.searchParams.set("per_page", String(args.per_page));
  }
  const body = await apiRequest(url.href, { auth: token });
  return collectionResult(body);
}

async function getMyListing(args) {
  const token = requireToken();
  const id = requireId(args);
  const body = await apiRequest(SELLER_ORIGIN + "/api/listings/" + encodeURIComponent(String(id)), {
    auth: token,
  });
  return toListing(body);
}

async function createListing(args) {
  const token = requireToken();
  const payload = buildListingBody(args || {});
  const body = await apiRequest(SELLER_ORIGIN + "/api/listings", {
    method: "POST",
    auth: token,
    contentType: "application/hal+json",
    body: payload,
  });
  return toListing(body);
}

async function updateListing(args) {
  const token = requireToken();
  const id = requireId(args);
  const payload = buildListingBody(args || {});
  const body = await apiRequest(SELLER_ORIGIN + "/api/listings/" + encodeURIComponent(String(id)), {
    method: "PUT",
    auth: token,
    contentType: "application/hal+json",
    body: payload,
  });
  if (!isListingResource(body)) return getMyListing({ id });
  return toListing(body);
}

async function publishListing(args) {
  const token = requireToken();
  const id = requireId(args);
  const body = await apiRequest(SELLER_ORIGIN + "/api/listings/" + encodeURIComponent(String(id)), {
    method: "PUT",
    auth: token,
    contentType: "application/json",
    body: { publish: "true" },
  });
  return toListing(body);
}

async function endListing(args) {
  const token = requireToken();
  const id = requireId(args);
  const reason = args && args.reason;
  if (reason !== "not_sold" && reason !== "reverb_sale") {
    throw new Error('reason must be "not_sold" or "reverb_sale"');
  }
  const body = await apiRequest(
    SELLER_ORIGIN + "/api/my/listings/" + encodeURIComponent(String(id)) + "/state/end",
    {
      method: "PUT",
      auth: token,
      contentType: "application/hal+json",
      body: { reason },
    }
  );
  if (body && typeof body === "object" && (body.id !== undefined || body._links)) {
    return toListing(body);
  }
  return body === null || body === undefined ? { ok: true } : body;
}

async function listCategories() {
  const token = getToken();
  const body = await apiRequest(SELLER_ORIGIN + "/api/categories/flat", {
    auth: token || undefined,
  });
  const rows = Array.isArray(body && body.categories) ? body.categories : [];
  return {
    categories: rows.map((c) =>
      pick(c, ["uuid", "full_name", "name", "slug", "root_uuid", "root_slug", "listable"])
    ),
  };
}

async function listConditions() {
  const token = getToken();
  const body = await apiRequest(SELLER_ORIGIN + "/api/listing_conditions", {
    auth: token || undefined,
  });
  const rows = Array.isArray(body && body.conditions) ? body.conditions : [];
  return {
    conditions: rows.map((c) => pick(c, ["uuid", "display_name", "description"])),
  };
}

async function getShop() {
  const token = requireToken();
  const body = await apiRequest(SELLER_ORIGIN + "/api/shop", { auth: token });
  const shop = {};
  if (body && typeof body === "object") {
    if (body.id !== undefined) shop.id = body.id;
    if (body.name !== undefined) shop.name = body.name;
    if (body.description !== undefined) shop.description = body.description;
    if (Array.isArray(body.shipping_profiles)) {
      shop.shipping_profiles = body.shipping_profiles.map((p) => pick(p, ["id", "name"]));
    }
  }
  return shop;
}

async function callTool(name, args) {
  switch (name) {
    case "search_listings":
      return searchListings(args || {});
    case "get_listing":
      return getListing(args || {});
    case "list_my_listings":
      return listMyListings(args || {});
    case "get_my_listing":
      return getMyListing(args || {});
    case "create_listing":
      return createListing(args || {});
    case "update_listing":
      return updateListing(args || {});
    case "publish_listing":
      return publishListing(args || {});
    case "end_listing":
      return endListing(args || {});
    case "list_categories":
      return listCategories();
    case "list_conditions":
      return listConditions();
    case "get_shop":
      return getShop();
    default:
      throw new Error("Unknown tool: " + name);
  }
}

let outboundFraming = "jsonl";

function send(message) {
  const json = JSON.stringify(message);
  if (outboundFraming === "content-length") {
    const body = Buffer.from(json, "utf8");
    process.stdout.write("Content-Length: " + body.length + "\r\n\r\n");
    process.stdout.write(body);
    return;
  }
  process.stdout.write(json + "\n");
}

function toolResult(id, value, isError) {
  send({
    jsonrpc: "2.0",
    id,
    result: {
      content: [{ type: "text", text: typeof value === "string" ? value : JSON.stringify(value) }],
      isError: Boolean(isError),
    },
  });
}

const SUPPORTED_PROTOCOLS = ["2024-11-05", "2025-03-26", "2025-06-18", "2025-11-25"];

function handle(message) {
  if (!message || message.jsonrpc !== "2.0" || typeof message.method !== "string") {
    if (message && Object.prototype.hasOwnProperty.call(message, "id")) {
      send({ jsonrpc: "2.0", id: message.id, error: { code: -32600, message: "Invalid Request" } });
    }
    return Promise.resolve();
  }
  const { id, method, params } = message;
  const notify = !Object.prototype.hasOwnProperty.call(message, "id");

  if (method === "notifications/initialized" || method === "initialized") {
    return Promise.resolve();
  }
  if (method === "initialize") {
    const requested = params && params.protocolVersion;
    const protocolVersion = SUPPORTED_PROTOCOLS.includes(requested) ? requested : "2024-11-05";
    send({
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "reverb", version: "0.2.0" },
      },
    });
    return Promise.resolve();
  }
  if (method === "tools/list") {
    send({ jsonrpc: "2.0", id, result: { tools: TOOLS } });
    return Promise.resolve();
  }
  if (method === "tools/call") {
    const name = params && params.name;
    const args = params && params.arguments;
    return callTool(name, args).then(
      (value) => toolResult(id, value, false),
      (err) => {
        console.error(err && err.stack ? err.stack : String(err));
        toolResult(id, err && err.message ? err.message : String(err), true);
      }
    );
  }
  if (!notify) {
    send({ jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found" } });
  }
  return Promise.resolve();
}

let buffer = Buffer.alloc(0);
const queue = [];
let draining = false;

function tryTake() {
  let i = 0;
  while (i < buffer.length && (buffer[i] === 32 || buffer[i] === 9 || buffer[i] === 10 || buffer[i] === 13)) i++;
  if (i >= buffer.length) {
    buffer = Buffer.alloc(0);
    return null;
  }
  if (i > 0) buffer = buffer.slice(i);
  const prefix = buffer.slice(0, 20).toString("utf8").toLowerCase();
  if (prefix.startsWith("content-length:")) {
    outboundFraming = "content-length";
    const sep = buffer.indexOf("\r\n\r\n");
    if (sep < 0) return null;
    const header = buffer.slice(0, sep).toString("utf8");
    const match = header.match(/content-length:\s*(\d+)/i);
    if (!match) throw new Error("stdio frame missing Content-Length");
    const len = Number(match[1]);
    const start = sep + 4;
    if (buffer.length < start + len) return null;
    const raw = buffer.slice(start, start + len).toString("utf8");
    buffer = buffer.slice(start + len);
    return JSON.parse(raw);
  }
  if (buffer[0] !== 0x7b) throw new Error("unrecognized stdio framing");
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let j = 0; j < buffer.length; j++) {
    const c = buffer[j];
    if (inStr) {
      if (esc) esc = false;
      else if (c === 0x5c) esc = true;
      else if (c === 0x22) inStr = false;
      continue;
    }
    if (c === 0x22) inStr = true;
    else if (c === 0x7b) depth++;
    else if (c === 0x7d) {
      depth--;
      if (depth === 0) {
        const raw = buffer.slice(0, j + 1).toString("utf8");
        buffer = buffer.slice(j + 1);
        return JSON.parse(raw);
      }
    }
  }
  return null;
}

function enqueue() {
  try {
    while (true) {
      const message = tryTake();
      if (!message) break;
      queue.push(message);
    }
  } catch (err) {
    console.error(err && err.stack ? err.stack : String(err));
    send({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } });
    buffer = Buffer.alloc(0);
  }
  drain();
}

function drain() {
  if (draining) return;
  const next = queue.shift();
  if (!next) return;
  draining = true;
  Promise.resolve(handle(next))
    .catch((err) => {
      console.error(err && err.stack ? err.stack : String(err));
    })
    .finally(() => {
      draining = false;
      if (queue.length) drain();
    });
}

if (require.main === module) {
  process.stdin.on("data", (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    enqueue();
  });
  process.stdin.resume();
}

module.exports = {
  toListing,
  collectionResult,
  isListingResource,
  updateListing,
  createListing,
  getListing,
  getMyListing,
  listMyListings,
};
