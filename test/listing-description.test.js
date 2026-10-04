"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

process.env.REVERB_TOKEN = "test-token";

const {
  toListing,
  collectionResult,
  updateListing,
  createListing,
  listMyListings,
} = require("../server.js");

const LONG_DESCRIPTION = "Avalon Bassline draft. ".repeat(80) + "End of the full description.";
const HTML_WITH_LINK =
  '<p>Avalon Bassline</p><p>See <a href="https://reverb.com/item/102359892">the draft</a>.</p>';

function responseFrom(body, status) {
  const code = status || 200;
  const text = body === null || body === undefined ? "" : JSON.stringify(body);
  return {
    ok: code >= 200 && code < 300,
    status: code,
    text: async () => text,
  };
}

function listingFixture(overrides) {
  return Object.assign(
    {
      id: 102359892,
      title: "Avalon Bassline",
      make: "Avalon",
      model: "Bassline",
      finish: "Black",
      year: "2024",
      sku: "ABL-1",
      description: LONG_DESCRIPTION,
      price: { amount: "499.00", currency: "USD", display: "$499" },
      condition: {
        display_name: "Excellent",
        slug: "excellent",
        description: "Condition blurb that is not the listing description.",
      },
      shop_name: "Example Shop",
      state: { slug: "draft", description: "Draft" },
      inventory: 1,
      _links: {
        web: { href: "https://reverb.com/item/102359892-avalon-bassline" },
        self: { href: "https://api.reverb.com/api/listings/102359892" },
      },
    },
    overrides || {}
  );
}

test("toListing keeps the full description string Reverb sends", () => {
  const listing = toListing(listingFixture());
  assert.equal(listing.description, LONG_DESCRIPTION);
  assert.equal(listing.id, 102359892);
  assert.equal(listing.state.description, "Draft");
  assert.equal(listing.condition.display_name, "Excellent");
  assert.equal(Object.prototype.hasOwnProperty.call(listing.condition, "description"), false);
});

test("toListing omits description when Reverb does not send one", () => {
  const fixture = listingFixture();
  delete fixture.description;
  const listing = toListing(fixture);
  assert.equal(Object.prototype.hasOwnProperty.call(listing, "description"), false);
});

test("toListing keeps an empty description string", () => {
  const listing = toListing(listingFixture({ description: "" }));
  assert.equal(listing.description, "");
});

test("HTML description is returned in full when it is the only description field", () => {
  const listing = toListing(listingFixture({ description: HTML_WITH_LINK }));
  assert.equal(listing.description, HTML_WITH_LINK);
});

test("plain text is kept when it already contains the HTML content", () => {
  const plain = "Avalon Bassline. Includes the case.";
  const listing = toListing(
    listingFixture({
      description: plain,
      description_html: "<p>Avalon Bassline.</p><p>Includes the case.</p>",
    })
  );
  assert.equal(listing.description, plain);
});

test("HTML is kept when the plain field drops a link", () => {
  const listing = toListing(
    listingFixture({
      description: "Avalon Bassline",
      description_html: HTML_WITH_LINK,
    })
  );
  assert.equal(listing.description, HTML_WITH_LINK);
});

test("plain_text_description is used when description itself is HTML and the plain text covers it", () => {
  const plain = "Avalon Bassline includes the case.";
  const listing = toListing(
    listingFixture({
      description: "<p>Avalon Bassline includes the case.</p>",
      plain_text_description: plain,
    })
  );
  assert.equal(listing.description, plain);
});

test("description object prefers plain text unless HTML has extra content", () => {
  const plain = "Seller readable description.";
  const covered = toListing(
    listingFixture({
      description: { text: plain, html: "<p>Seller readable description.</p>" },
    })
  );
  assert.equal(covered.description, plain);

  const html = '<p>Seller readable description.</p><img src="https://example.com/photo.jpg">';
  const richer = toListing(
    listingFixture({
      description: { text: plain, html },
    })
  );
  assert.equal(richer.description, html);
});

test("collection results include each listing description", () => {
  const result = collectionResult({
    listings: [listingFixture({ id: 1, description: "First" }), listingFixture({ id: 2, description: "Second" })],
    _links: { next: { href: "https://api.reverb.com/api/listings?page=2" } },
  });
  assert.deepEqual(
    result.listings.map((row) => row.description),
    ["First", "Second"]
  );
  assert.equal(result.next, "https://api.reverb.com/api/listings?page=2");
});

test("update with an empty body reads the seller listing and returns its description", async () => {
  const calls = [];
  const original = global.fetch;
  global.fetch = async (url, init) => {
    const method = (init && init.method) || "GET";
    calls.push({ url: String(url), method });
    if (method === "PUT") return responseFrom(null);
    if (method === "GET" && String(url) === "https://api.reverb.com/api/listings/102359892") {
      return responseFrom(listingFixture({ description: LONG_DESCRIPTION }));
    }
    throw new Error("unexpected " + method + " " + url);
  };
  try {
    const listing = await updateListing({ id: 102359892, description: "ignored by this mock" });
    assert.equal(listing.id, 102359892);
    assert.equal(listing.description, LONG_DESCRIPTION);
    assert.deepEqual(
      calls.map((call) => call.method + " " + call.url),
      [
        "PUT https://api.reverb.com/api/listings/102359892",
        "GET https://api.reverb.com/api/listings/102359892",
      ]
    );
  } finally {
    global.fetch = original;
  }
});

test("update with a listing body does not read the listing again", async () => {
  const calls = [];
  const original = global.fetch;
  global.fetch = async (url, init) => {
    calls.push({ url: String(url), method: (init && init.method) || "GET" });
    return responseFrom(listingFixture({ description: "Saved from the write response." }));
  };
  try {
    const listing = await updateListing({ id: 102359892, title: "Avalon Bassline" });
    assert.equal(listing.description, "Saved from the write response.");
    assert.equal(calls.length, 1);
    assert.equal(calls[0].method, "PUT");
  } finally {
    global.fetch = original;
  }
});

test("update of an empty object does not publish or end the listing", async () => {
  const urls = [];
  const original = global.fetch;
  global.fetch = async (url, init) => {
    urls.push(String(url) + " " + ((init && init.method) || "GET"));
    if ((init && init.method) === "PUT") return responseFrom({});
    return responseFrom(listingFixture());
  };
  try {
    await updateListing({ id: 102359892, description: "text" });
    assert.equal(urls.some((entry) => entry.includes("/state/end")), false);
    assert.equal(urls.some((entry) => entry.includes("publish")), false);
    assert.equal(urls.length, 2);
  } finally {
    global.fetch = original;
  }
});

test("create and list results include description from the response body", async () => {
  const original = global.fetch;
  global.fetch = async (url, init) => {
    const method = (init && init.method) || "GET";
    if (method === "POST") return responseFrom(listingFixture({ description: "Created description." }));
    if (String(url).startsWith("https://api.reverb.com/api/my/listings")) {
      return responseFrom({ listings: [listingFixture({ description: "Draft description." })] });
    }
    throw new Error("unexpected " + method + " " + url);
  };
  try {
    const created = await createListing({ title: "Avalon Bassline", description: "Created description." });
    assert.equal(created.description, "Created description.");
    const listed = await listMyListings({});
    assert.equal(listed.listings[0].description, "Draft description.");
  } finally {
    global.fetch = original;
  }
});
