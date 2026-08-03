import assert from "node:assert/strict";
import test from "node:test";

import { categories } from "@/data/categories";
import { collections } from "@/data/collections";
import {
  homepageFeaturedProductConfigs,
  homepageSelectedProductConfigs,
} from "@/data/homepage-products";
import { finishes, getProductBySlug, products } from "@/data/products";
import {
  productBelongsToCollection,
  productCollectionNames,
} from "@/lib/catalog";
import { getPublicRouteDefinitions } from "@/lib/public-routes";
import {
  compactSearchText,
  normalizeSearchText,
  searchCatalog,
} from "@/lib/catalog-search";
import { sortProductsFeaturedFirst } from "@/lib/product-sort";

function result(query: string) {
  return searchCatalog(query, products, categories, collections, finishes);
}

function ids(query: string) {
  return result(query).products.map(({ product }) => product.id);
}

test("normalizes case, whitespace, Korean spacing, and model punctuation", () => {
  assert.equal(normalizeSearchText("  BeLAir   Towel "), "belair towel");
  assert.equal(compactSearchText("HG110-1"), "hg1101");
  assert.equal(compactSearchText("매립 휴지걸이"), "매립휴지걸이");
});

test("finds exact and partial model numbers with or without hyphens", () => {
  assert.equal(ids("HG822C")[0], "hg822c");
  assert.ok(ids("HG822").includes("hg822c"));
  assert.ok(ids("HG822").includes("hg822s"));
  assert.equal(ids("HG1101")[0], "hg1101");
  assert.equal(ids("HG110-1")[0], "hg1101");
});

test("searches Korean and English collection names", () => {
  assert.ok(ids("벨레어").includes("belair-towel-bar"));
  assert.ok(ids("Belair").includes("batuta-paper-holder"));
  assert.ok(ids("바투타").includes("batuta-towel-bar"));
  assert.ok(ids("battuta").includes("batuta-paper-holder"));
  assert.equal(result("벨레어").collections[0]?.id, "belair");
});

test("matches category terms with practical Korean spacing", () => {
  assert.ok(ids("매립형 휴지걸이").includes("hg112s"));
  assert.ok(ids("매립 휴지걸이").includes("hg1101"));
  assert.ok(ids("면도경").includes("hg9992"));
  assert.equal(result("면도경").categories[0]?.id, "mirrors");
});

test("finish-specific queries resolve the synchronized product variant", () => {
  const match = result("사코 휴지걸이 크롬").products.find(
    ({ product }) => product.id === "saco-paper-holder",
  );
  assert.ok(match);
  assert.equal(match.variant.finish, "크롬");
  assert.match(match.variant.image, /chrome/);

  const satinTowelBars = result("사틴 수건걸이");
  assert.equal(satinTowelBars.preferredFinish, "사틴");
  assert.ok(satinTowelBars.products.length > 0);
  assert.ok(
    satinTowelBars.products.every(({ variant }) => variant.finish === "사틴"),
  );
});
test("shared Batuta and Belair holder is searchable through both collections", () => {
  for (const query of [
    "바투타 휴지걸이",
    "벨레어 휴지걸이",
    "Batuta",
    "Belair",
    "바투타/벨레어 휴지걸이",
  ]) {
    assert.ok(ids(query).includes("batuta-paper-holder"));
  }

  const sharedResults = ids("휴지걸이").filter(
    (id) => id === "batuta-paper-holder",
  );
  assert.equal(sharedResults.length, 1);
});

test("shared holder belongs to both collections and replaces the duplicate", () => {
  const sharedProduct = products.find(
    (product) => product.id === "batuta-paper-holder",
  );
  assert.ok(sharedProduct);
  assert.equal(productBelongsToCollection(sharedProduct, "batuta"), true);
  assert.equal(productBelongsToCollection(sharedProduct, "belair"), true);
  assert.equal(
    products.some((product) => product.id === "belair-paper-holder"),
    false,
  );
});
test("shared holder uses one record, one canonical route, and one legacy alias", () => {
  for (const collectionId of ["batuta", "belair"]) {
    const matches = products.filter((product) =>
      productBelongsToCollection(product, collectionId),
    );
    assert.equal(
      matches.filter((product) => product.id === "batuta-paper-holder").length,
      1,
    );
  }

  const canonical = getProductBySlug("batuta-toilet-paper-holder");
  const legacy = getProductBySlug("belair-toilet-paper-holder");
  assert.ok(canonical);
  assert.equal(legacy?.id, canonical.id);
  assert.deepEqual(productCollectionNames(canonical), ["바투타", "벨레어"]);

  const productRoutes = getPublicRouteDefinitions()
    .filter((route) => route.kind === "product")
    .map((route) => route.path);
  assert.ok(productRoutes.includes("/products/batuta-toilet-paper-holder"));
  assert.equal(
    productRoutes.includes("/products/belair-toilet-paper-holder"),
    false,
  );
});
test("corrected public models, categories, finishes, and Brio image are searchable", () => {
  assert.equal(ids("HG820C")[0], "hg820");
  assert.equal(ids("HG05S")[0], "hg05");
  assert.ok(ids("HG05").includes("hg05"));
  assert.ok(ids("슬라이드바").includes("hg01ms"));
  assert.ok(ids("청소솔").includes("hg513"));
  assert.ok(ids("HG120 크롬").includes("hg120"));
  assert.ok(ids("HG999 크롬").includes("hg999"));

  const brio = products.find((product) => product.id === "brio-paper-holder");
  assert.ok(brio);
  assert.deepEqual(
    brio.variants.map((variant) => variant.finish),
    ["사틴", "크롬"],
  );
  assert.equal(
    brio.variants.find((variant) => variant.finish === "크롬")?.image,
    "/images/products/brio/brio-toilet-paper-holder-chrome.jpg",
  );

  const brioBp = products.find(
    (product) => product.id === "brio-bp-paper-holder",
  );
  assert.ok(brioBp);
  assert.equal(brioBp.nameKo, "브리오BP 휴지걸이");
  assert.equal(brioBp.slug, "brio-bp-toilet-paper-holder");
  assert.deepEqual(
    brioBp.variants.map((variant) => variant.finish),
    ["크롬"],
  );
  assert.equal(
    brioBp.variants[0].image,
    "/images/products/brio/brio-bp-toilet-paper-holder-chrome.png",
  );
});
test("HG513 displays satin before chrome", () => {
  const hg513 = products.find((product) => product.id === "hg513");

  assert.ok(hg513);
  assert.deepEqual(
    hg513.variants.map((variant) => variant.finish),
    ["사틴", "크롬"],
  );
  assert.match(hg513.variants[0].image, /satin/);
});

test("homepage featured configuration has the approved unique order", () => {
  const configuredIds = homepageFeaturedProductConfigs.map(({ id }) => id);
  assert.deepEqual(configuredIds, [
    "belair-towel-bar",
    "batuta-paper-holder",
    "concord-towel-bar",
    "concord-paper-holder",
    "hg110s",
    "hg112s",
    "hg9992",
    "hg55s",
    "hg392ms",
    "hg100ms",
    "hg822s",
    "hg01ms",
    "hg513",
    "hg05",
  ]);
  assert.equal(new Set(configuredIds).size, 14);
});

test("homepage selected configuration has the approved unique order and Featured membership", () => {
  const configuredIds = homepageSelectedProductConfigs.map(({ id }) => id);
  assert.deepEqual(configuredIds, [
    "belair-towel-bar",
    "batuta-paper-holder",
    "concord-towel-bar",
    "concord-paper-holder",
    "hg110s",
    "hg112s",
    "hg822s",
    "hg9992",
  ]);
  assert.equal(new Set(configuredIds).size, 8);

  for (const id of configuredIds) {
    const product = products.find((item) => item.id === id);
    assert.ok(product, `Missing homepage selected product: ${id}`);
    assert.equal(product.featured, true, `${id} must remain globally Featured`);
  }

  const sharedHolder = homepageSelectedProductConfigs.find(
    (config) => config.id === "batuta-paper-holder",
  );
  assert.equal(sharedHolder?.displayName, "벨레어 휴지걸이");
});

test("only homepage featured products have Featured badges", () => {
  const configuredIds = new Set(
    homepageFeaturedProductConfigs.map(({ id }) => id),
  );

  for (const product of products) {
    assert.equal(product.featured, configuredIds.has(product.id));
  }
});
test("separates towel bars from towel shelves", () => {
  const towelBars = products.filter(
    (product) => product.category === "towel-bars",
  );
  const towelShelves = products.filter(
    (product) => product.category === "towel-shelves",
  );

  assert.ok(towelBars.some((product) => product.id === "belair-towel-bar"));
  assert.ok(
    towelBars.every(
      (product) => !["hg820", "hg822c", "hg822s"].includes(product.id),
    ),
  );
  assert.deepEqual(
    towelBars.map((product) => product.id),
    [
      "batuta-towel-bar",
      "belair-towel-bar",
      "saco-towel-bar",
      "concord-towel-bar",
      "brio-towel-bar",
    ],
  );
  assert.deepEqual(
    towelShelves.map((product) => product.id),
    ["hg822c", "hg822s", "hg820"],
  );
  assert.ok(ids("수건걸이").includes("belair-towel-bar"));
  assert.ok(ids("수건선반").includes("hg822s"));
});

test("sorts Featured products first while preserving group order", () => {
  const towelBars = products.filter(
    (product) => product.category === "towel-bars",
  );
  const sorted = sortProductsFeaturedFirst(towelBars);

  assert.deepEqual(
    sorted.map((product) => product.id),
    [
      "belair-towel-bar",
      "concord-towel-bar",
      "batuta-towel-bar",
      "saco-towel-bar",
      "brio-towel-bar",
    ],
  );
  assert.deepEqual(
    towelBars.map((product) => product.id),
    [
      "batuta-towel-bar",
      "belair-towel-bar",
      "saco-towel-bar",
      "concord-towel-bar",
      "brio-towel-bar",
    ],
  );

  const towelShelves = sortProductsFeaturedFirst(
    products.filter((product) => product.category === "towel-shelves"),
  );
  assert.deepEqual(
    towelShelves.map((product) => product.id),
    ["hg822s", "hg822c", "hg820"],
  );
});
