import { categories } from "../src/data/categories";
import { collections } from "../src/data/collections";
import { homepageFeaturedProductConfigs } from "../src/data/homepage-products";
import { products } from "../src/data/products";
import { productBelongsToCollection } from "../src/lib/catalog";
import { sortProductsFeaturedFirst } from "../src/lib/product-sort";

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const byId = new Map(products.map((product) => [product.id, product]));
const ids = products.map((product) => product.id);
const slugs = products.map((product) => product.slug);
invariant(new Set(ids).size === ids.length, "Product IDs must be unique.");
invariant(
  new Set(slugs).size === slugs.length,
  "Product slugs must be unique.",
);
invariant(
  !byId.has("hg822"),
  "The combined HG822 product must not remain active.",
);
invariant(
  !slugs.includes("hg822-double-towel-shelf"),
  "The combined HG822 slug must not remain canonical.",
);

const batutaTowel = byId.get("batuta-towel-bar");
invariant(batutaTowel, "Batuta towel bar must exist.");
invariant(
  batutaTowel.variants.length === 1 &&
    batutaTowel.variants[0].finish === "사틴" &&
    batutaTowel.variants[0].image ===
      "/images/products/batuta/batuta-towel-bar-satin.jpg",
  "Batuta towel bar satin must use its real normalized source image.",
);

const belairTowel = byId.get("belair-towel-bar");
invariant(belairTowel, "Belair towel bar must exist.");
invariant(
  belairTowel.variants.length === 1 &&
    belairTowel.variants[0].finish === "사틴",
  "Belair towel bar must only expose satin.",
);

const hg822c = byId.get("hg822c");
const hg822s = byId.get("hg822s");
invariant(hg822c && hg822s, "HG822C and HG822S must exist independently.");
invariant(
  hg822c.slug !== hg822s.slug,
  "HG822 models need distinct canonical slugs.",
);
invariant(
  hg822c.variants.length === 1 &&
    hg822c.variants[0].modelNumber === "HG822C" &&
    hg822c.variants[0].finish === "크롬",
  "HG822C must be the chrome model.",
);
invariant(
  hg822s.variants.length === 1 &&
    hg822s.variants[0].modelNumber === "HG822S" &&
    hg822s.variants[0].finish === "사틴",
  "HG822S must be the satin model.",
);
invariant(
  hg822c.variants[0].image !== hg822s.variants[0].image,
  "HG822C and HG822S must use distinct finish images.",
);

const expectedTowelBarIds = [
  "batuta-towel-bar",
  "belair-towel-bar",
  "saco-towel-bar",
  "concord-towel-bar",
  "brio-towel-bar",
];
const towelBarIds = products
  .filter((product) => product.category === "towel-bars")
  .map((product) => product.id);
invariant(
  JSON.stringify(towelBarIds) === JSON.stringify(expectedTowelBarIds),
  "The towel-bars category contains incorrect products.",
);

const expectedTowelShelfIds = ["hg822c", "hg822s", "hg820"];
const towelShelfIds = products
  .filter((product) => product.category === "towel-shelves")
  .map((product) => product.id);
invariant(
  JSON.stringify(towelShelfIds) === JSON.stringify(expectedTowelShelfIds),
  "The towel-shelves category contains incorrect products.",
);

const featuredFirstTowelBars = sortProductsFeaturedFirst(
  products.filter((product) => product.category === "towel-bars"),
);
invariant(
  featuredFirstTowelBars[0]?.id === "belair-towel-bar" &&
    featuredFirstTowelBars[1]?.id === "concord-towel-bar",
  "Featured towel bars must begin with Belair and Concord.",
);

const featuredFirstTowelShelves = sortProductsFeaturedFirst(
  products.filter((product) => product.category === "towel-shelves"),
);
invariant(
  featuredFirstTowelShelves[0]?.id === "hg822s",
  "HG822S must be the first towel shelf because it is Featured.",
);

const sharedPaperHolder = byId.get("batuta-paper-holder");
invariant(
  sharedPaperHolder,
  "Shared Batuta and Belair paper holder must exist.",
);
invariant(
  sharedPaperHolder.nameKo === "바투타/벨레어 휴지걸이" &&
    sharedPaperHolder.variants.length === 1 &&
    sharedPaperHolder.variants[0].finish === "사틴" &&
    productBelongsToCollection(sharedPaperHolder, "batuta") &&
    productBelongsToCollection(sharedPaperHolder, "belair"),
  "Shared paper holder must expose one satin variant in both collections.",
);

const brioPaperHolder = byId.get("brio-paper-holder");
invariant(brioPaperHolder, "Brio paper holder must exist.");
invariant(
  brioPaperHolder.variants[0].finish === "사틴",
  "Brio paper holder must display satin by default.",
);

const brioChrome = brioPaperHolder.variants.find(
  (variant) => variant.finish === "크롬",
);
invariant(
  brioChrome?.image ===
    "/images/products/brio/brio-toilet-paper-holder-chrome.jpg",
  "Brio chrome must use the original 브리오/4.브리오휴지걸이(크롬).jpg image.",
);

const brioBpPaperHolder = byId.get("brio-bp-paper-holder");
invariant(brioBpPaperHolder, "BrioBP paper holder must exist.");
invariant(
  brioBpPaperHolder.nameKo === "브리오BP 휴지걸이" &&
    brioBpPaperHolder.slug === "brio-bp-toilet-paper-holder" &&
    brioBpPaperHolder.variants.length === 1 &&
    brioBpPaperHolder.variants[0].finish === "크롬" &&
    brioBpPaperHolder.variants[0].image ===
      "/images/products/brio/brio-bp-toilet-paper-holder-chrome.png",
  "BrioBP must be a separate chrome product using the BP PNG image.",
);

const expectedCategoryNames = new Map([
  ["towel-bars", "수건걸이"],
  ["towel-shelves", "수건선반"],
  ["bath-accessories", "옷걸이 및 슬리퍼 걸이"],
  ["shower-accessories", "슬라이드바"],
  ["cleaning", "청소솔"],
]);
for (const [categoryId, expectedName] of expectedCategoryNames) {
  const category = categories.find((candidate) => candidate.id === categoryId);
  invariant(
    category?.name === expectedName && category.shortName === expectedName,
    `${categoryId} must display ${expectedName}.`,
  );
}

const expectedProductFinishes = new Map([
  ["hg120", ["크롬"]],
  ["hg240", ["크롬"]],
  ["hg513", ["사틴", "크롬"]],
  ["hg999", ["크롬"]],
]);
for (const [productId, expectedFinishes] of expectedProductFinishes) {
  invariant(
    JSON.stringify(
      byId.get(productId)?.variants.map((variant) => variant.finish),
    ) === JSON.stringify(expectedFinishes),
    `${productId} finishes do not match the confirmed catalog data.`,
  );
}

const hg240 = byId.get("hg240");
const hg820 = byId.get("hg820");
const hg05 = byId.get("hg05");
invariant(
  hg240?.nameKo === "HG240 폰&트레이 매립휴지걸이",
  "HG240 name mismatch.",
);
invariant(
  hg820?.nameKo === "HG820C 이단수건선반" &&
    hg820.variants[0]?.modelNumber === "HG820C",
  "HG820 public model must be HG820C.",
);
invariant(
  hg05?.nameKo === "HG05S 옷걸이" && hg05.variants[0]?.modelNumber === "HG05S",
  "HG05 public model must be HG05S.",
);

const expectedHomepageFeaturedIds = [
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
];
const actualHomepageFeaturedIds = homepageFeaturedProductConfigs.map(
  (config) => config.id,
);
invariant(
  JSON.stringify(actualHomepageFeaturedIds) ===
    JSON.stringify(expectedHomepageFeaturedIds),
  "Homepage featured product order does not match the approved configuration.",
);
invariant(
  new Set(actualHomepageFeaturedIds).size === actualHomepageFeaturedIds.length,
  "Homepage featured products must not contain duplicates.",
);
const actualFeaturedIds = products
  .filter((product) => product.featured)
  .map((product) => product.id);
invariant(
  actualFeaturedIds.length === expectedHomepageFeaturedIds.length &&
    expectedHomepageFeaturedIds.every((id) => actualFeaturedIds.includes(id)),
  "Product Featured badges must exactly match the homepage Featured configuration.",
);
for (const id of expectedHomepageFeaturedIds) {
  const product = byId.get(id);
  invariant(product, `Homepage featured product does not exist: ${id}`);
  invariant(
    product.featured,
    `Homepage featured product is missing its Featured badge: ${id}`,
  );
}
for (const product of products) {
  invariant(
    product.featured === expectedHomepageFeaturedIds.includes(product.id),
    `Unexpected Featured state for product: ${product.id}`,
  );
}

const excludedHomepageFeaturedIds = [
  "batuta-towel-bar",
  "saco-towel-bar",
  "hg822c",
];
for (const id of excludedHomepageFeaturedIds) {
  invariant(
    !actualHomepageFeaturedIds.includes(id),
    `Excluded homepage featured product is configured: ${id}`,
  );
}
invariant(
  homepageFeaturedProductConfigs.find(
    (config) => config.id === "batuta-paper-holder",
  )?.displayName === "벨레어 휴지걸이",
  "Homepage shared holder must use its approved homepage-only display name.",
);
const hg513 = byId.get("hg513");
invariant(
  JSON.stringify(hg513?.variants.map((variant) => variant.finish)) ===
    JSON.stringify(["사틴", "크롬"]),
  "HG513 must display satin before chrome.",
);
const expectedCollectionImages = new Map([
  ["belair", "/images/products/belair/belair-towel-bar-satin.jpg"],
  ["saco", "/images/products/saco/saco-towel-bar-black.jpg"],
]);
for (const [collectionId, expectedImage] of expectedCollectionImages) {
  invariant(
    collections.find((collection) => collection.id === collectionId)?.image ===
      expectedImage,
    `${collectionId} must use its towel-bar collection cover.`,
  );
}

const shavingMirrors = categories.find((category) => category.id === "mirrors");
invariant(
  shavingMirrors?.shortName === "면도경",
  "The stable mirrors key must display 면도경.",
);
invariant(
  products
    .filter((product) => product.category === "mirrors")
    .every((product) => product.nameKo.includes("면도경")),
  "The mirrors filter must only return shaving mirrors.",
);

for (const product of products) {
  for (const relatedId of product.relatedProductIds)
    invariant(
      byId.has(relatedId),
      "Unknown related product " +
        relatedId +
        " referenced by " +
        product.id +
        ".",
    );
}

const variantCount = products.reduce(
  (sum, product) => sum + product.variants.length,
  0,
);
console.log(
  JSON.stringify(
    {
      products: products.length,
      variants: variantCount,
      canonicalProductRoutes: products.length,
    },
    null,
    2,
  ),
);
