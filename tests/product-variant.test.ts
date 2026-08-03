import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import test from "node:test";

import { ProductCard } from "@/components/catalog/product-card";
import { getProductBySlug } from "@/data/products";
import { resolveProductVariant } from "@/lib/product-variant";
import type { Finish, Product } from "@/types/product";

function productBySlug(slug: string) {
  const product = getProductBySlug(slug);
  assert.ok(product, `Missing test product: ${slug}`);
  return product;
}

function assertPreferredFinish(product: Product, finish: Finish) {
  const variant = resolveProductVariant(product.variants, finish);
  assert.ok(variant, `Missing ${finish} variant for ${product.slug}`);
  assert.equal(variant.finish, finish);
  assert.match(
    variant.image,
    new RegExp(
      finish === "크롬" ? "chrome" : finish === "블랙" ? "black" : "satin",
    ),
  );
  return variant;
}

test("사코 휴지걸이 follows chrome, black, and cleared finish states", () => {
  const product = productBySlug("saco-toilet-paper-holder");
  const defaultVariant = resolveProductVariant(product.variants);
  const chromeVariant = assertPreferredFinish(product, "크롬");
  const blackVariant = assertPreferredFinish(product, "블랙");

  assert.equal(defaultVariant?.id, product.variants[0].id);
  assert.notEqual(chromeVariant.id, blackVariant.id);
  assert.equal(resolveProductVariant(product.variants)?.id, defaultVariant?.id);
});

test("multi-finish collection products resolve every supported preferred finish", () => {
  const slugs = [
    "brio-toilet-paper-holder",
    "concord-towel-bar",
    "concord-toilet-paper-holder",
    "saco-towel-bar",
    "saco-toilet-paper-holder",
  ];

  for (const slug of slugs) {
    const product = productBySlug(slug);
    for (const variant of product.variants) {
      assert.equal(
        resolveProductVariant(product.variants, variant.finish)?.id,
        variant.id,
        `${slug} did not resolve ${variant.finish}`,
      );
    }
  }
});

test("shared 바투타/벨레어 휴지걸이 exposes only satin and stale chrome falls back safely", () => {
  const product = productBySlug("belair-toilet-paper-holder");

  assert.equal(product.variants.length, 1);
  assert.equal(product.variants[0].finish, "사틴");
  assert.equal(resolveProductVariant(product.variants, "크롬")?.finish, "사틴");
});

test("single-finish and inconsistent data safely fall back to the first visible variant", () => {
  const product = productBySlug("hg55s-slipper-rack");
  const fallback = resolveProductVariant(product.variants, "크롬");

  assert.equal(fallback?.id, product.variants[0].id);
  assert.equal(fallback?.finish, "사틴");
  assert.equal(resolveProductVariant([], "크롬"), undefined);

  const hiddenFirst = [
    { ...product.variants[0], id: "hidden", customerVisible: false },
    { ...product.variants[0], id: "visible", customerVisible: true },
  ];
  assert.equal(resolveProductVariant(hiddenFirst)?.id, "visible");
});

test("ProductCard renders all selected variant data from the preferred finish", () => {
  const product = productBySlug("hg513-cleaning-brush");
  const satin = assertPreferredFinish(product, "사틴");
  const markup = renderToStaticMarkup(
    createElement(ProductCard, { product, preferredFinish: "사틴" }),
  );

  assert.match(markup, new RegExp(`alt="${product.nameKo} 사틴 제품 이미지"`));
  assert.ok(markup.includes(encodeURIComponent(satin.image)));
  assert.match(markup, /모델 HG513/);
  assert.match(markup, /finish=%EC%82%AC%ED%8B%B4/);
  assert.match(markup, /aria-label="마감: 사틴" aria-pressed="true"/);
});
