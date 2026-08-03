"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { InquiryImageUploader } from "@/components/contact/inquiry-image-uploader";
import {
  catalogProducts,
  collections,
  prefillInquiry,
  purchaseRequiredTypes,
  validVariants,
  validateInquiry,
} from "@/lib/inquiry-form";
import { siteConfig } from "@/config/site";
import { productBelongsToCollection } from "@/lib/catalog";
import {
  deduplicateInquiryImages,
  validateInquiryImages,
} from "@/lib/inquiry-images";
import { inquiryTypes, type InquiryValues } from "@/types/inquiry";

const endpoint = process.env.NEXT_PUBLIC_INQUIRY_ENDPOINT;
const endpointValid = (() => {
  try {
    return endpoint ? new URL(endpoint).protocol === "https:" : false;
  } catch {
    return false;
  }
})();
const formEnabled =
  endpointValid && siteConfig.legal.privacyPolicyStatus === "final";
const empty: InquiryValues = {
  inquiryType: "",
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  purchaseSource: "",
  purchaseId: "",
  purchaseDate: "",
  collectionId: "",
  productId: "",
  variantId: "",
  message: "",
  privacyConsent: false,
  website: "",
};
const control =
  "mt-2 min-h-11 w-full border border-line bg-white px-3 py-2 text-sm focus-visible:outline";
const validationFieldOrder: (keyof InquiryValues)[] = [
  "inquiryType",
  "customerName",
  "customerEmail",
  "productId",
  "purchaseSource",
  "purchaseId",
  "purchaseDate",
  "message",
];

export function InquiryForm() {
  const params = useSearchParams();
  const started = useRef(0);
  useEffect(() => {
    started.current = window.performance.now();
  }, []);
  const [values, setValues] = useState<InquiryValues>(() => ({
    ...(empty as InquiryValues),
    ...prefillInquiry(params.get("topic"), params.get("product")),
  }));
  const [errors, setErrors] = useState<
    Partial<Record<keyof InquiryValues, string>>
  >({});
  const [images, setImages] = useState<File[]>([]);
  const [imageError, setImageError] = useState("");
  const [state, setState] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const matchingProducts = useMemo(
    () =>
      catalogProducts.filter((product) =>
        productBelongsToCollection(product, values.collectionId),
      ),
    [values.collectionId],
  );
  const variants = validVariants(values.productId);
  const set = (key: keyof InquiryValues, value: string | boolean) =>
    setValues((v) => ({ ...v, [key]: value }));
  const field = (key: keyof InquiryValues) =>
    errors[key]
      ? { "aria-describedby": `${key}-error`, "aria-invalid": true }
      : {};
  const error = (key: keyof InquiryValues) =>
    errors[key] ? (
      <p className="mt-1 text-xs text-brand" id={`${key}-error`}>
        {errors[key]}
      </p>
    ) : null;
  const updateImages = (nextFiles: File[]) => {
    const deduplicated = deduplicateInquiryImages(nextFiles);
    const validation = validateInquiryImages(deduplicated.files);

    if (!validation.valid) {
      setImageError(validation.message);
      return;
    }

    setImages(deduplicated.files);
    setImageError(
      deduplicated.duplicateCount > 0
        ? "이미 선택한 이미지는 다시 추가되지 않습니다."
        : "",
    );
  };
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (state === "submitting") return;
    const nextErrors = validateInquiry(values);
    const nextImageValidation = validateInquiryImages(images);
    setErrors(nextErrors);
    setImageError(nextImageValidation.valid ? "" : nextImageValidation.message);
    const firstFormError = validationFieldOrder.find((key) => nextErrors[key]);
    if (firstFormError) {
      document.getElementById(firstFormError)?.focus();
      return;
    }
    if (!nextImageValidation.valid) {
      document.getElementById("inquiry-images-control")?.focus();
      document
        .getElementById("inquiry-images-control")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (nextErrors.privacyConsent) {
      document.getElementById("privacyConsent")?.focus();
      return;
    }
    if (
      !endpointValid ||
      window.performance.now() - started.current < 1200 ||
      values.website
    ) {
      setState("error");
      return;
    }
    const product = catalogProducts.find((p) => p.id === values.productId);
    const collection = collections.find((c) => c.id === values.collectionId);
    const variantsForProduct = validVariants(values.productId);
    const variant =
      variantsForProduct.find((v) => v.id === values.variantId) ??
      (variantsForProduct.length === 1 ? variantsForProduct[0] : undefined);
    const submissionId = crypto.randomUUID();
    const payload = {
      subject: `[HOYANG 문의] ${values.inquiryType}${product ? ` · ${product.nameKo}` : ""}`,
      inquiryType: values.inquiryType,
      customerName: values.customerName.trim(),
      customerEmail: values.customerEmail.trim(),
      customerPhone: values.customerPhone.trim(),
      purchaseSource: values.purchaseSource,
      purchaseId: values.purchaseId.trim(),
      purchaseDate: values.purchaseDate,
      collectionId: collection?.id ?? "",
      collectionName: collection?.nameKo ?? "",
      productId: product?.id ?? "",
      productName: product?.nameKo ?? "",
      variantId: variant?.id ?? "",
      modelNumber: variant?.modelNumber ?? "",
      finish: variant?.finish ?? "",
      message: values.message.trim(),
      submittedAt: new Date().toISOString(),
      pageUrl: window.location.href,
      privacyConsent: values.privacyConsent,
    };
    const formData = new FormData();
    formData.append(
      "payload",
      JSON.stringify({ ...payload, submissionId, website: values.website }),
    );
    images.forEach((file) => {
      formData.append("images", file, file.name);
    });
    setState("submitting");
    try {
      const response = await fetch(endpoint!, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: formData,
      });
      if (!response.ok) throw new Error();
      setState("success");
      setImages([]);
      setImageError("");
      setValues((v) => ({
        ...empty,
        inquiryType: v.inquiryType,
        collectionId: v.collectionId,
        productId: v.productId,
      }));
    } catch {
      setState("error");
    }
  }
  const purchaseRequired =
    values.inquiryType && purchaseRequiredTypes.includes(values.inquiryType);
  return (
    <form className="space-y-6" noValidate onSubmit={submit}>
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="website">웹사이트</label>
        <input
          id="website"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={(e) => set("website", e.target.value)}
        />
      </div>
      <Select
        id="inquiryType"
        label="문의 유형"
        required
        value={values.inquiryType}
        onChange={(v) => set("inquiryType", v)}
        options={inquiryTypes.map((x) => [x, x])}
        props={field("inquiryType")}
      />
      {error("inquiryType")}
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          id="customerName"
          label="이름"
          required
          maxLength={80}
          value={values.customerName}
          onChange={(v) => set("customerName", v)}
          props={field("customerName")}
        />
        <Input
          id="customerEmail"
          label="답변받을 이메일"
          type="email"
          required
          maxLength={254}
          value={values.customerEmail}
          onChange={(v) => set("customerEmail", v)}
          props={field("customerEmail")}
        />
      </div>
      {error("customerName")}
      {error("customerEmail")}
      <Input
        id="customerPhone"
        label="전화번호"
        type="tel"
        maxLength={30}
        value={values.customerPhone}
        onChange={(v) => set("customerPhone", v)}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Select
          id="collectionId"
          label="컬렉션"
          value={values.collectionId}
          onChange={(v) =>
            setValues((old) => ({
              ...old,
              collectionId: v,
              productId: "",
              variantId: "",
            }))
          }
          options={collections.map((c) => [c.id, c.nameKo])}
        />
        <Select
          id="productId"
          label="제품"
          required={!!values.inquiryType}
          disabled={!values.collectionId}
          value={values.productId}
          onChange={(v) =>
            setValues((old) => ({ ...old, productId: v, variantId: "" }))
          }
          options={matchingProducts.map((p) => [p.id, p.nameKo])}
          props={field("productId")}
        />
      </div>
      {error("productId")}
      {variants.length > 1 && (
        <Select
          id="variantId"
          label="마감 / 모델"
          value={values.variantId}
          onChange={(v) => set("variantId", v)}
          options={variants.map((v) => [
            v.id,
            `${v.finish}${v.modelNumber ? ` · ${v.modelNumber}` : ""}`,
          ])}
        />
      )}
      <fieldset className="grid gap-5 border-t border-line pt-5 sm:grid-cols-3">
        <legend className="px-1 text-sm font-medium">
          구매 정보 {purchaseRequired ? "(필수)" : "(선택)"}
        </legend>
        <Select
          id="purchaseSource"
          label="구매처"
          required={!!purchaseRequired}
          value={values.purchaseSource}
          onChange={(v) => set("purchaseSource", v)}
          options={[
            "네이버 스마트스토어",
            "직접 구매",
            "대리점 또는 납품",
            "기타",
          ].map((x) => [x, x])}
          props={field("purchaseSource")}
        />
        <Input
          id="purchaseId"
          label="구매번호 / 주문번호"
          required={!!purchaseRequired}
          maxLength={100}
          value={values.purchaseId}
          onChange={(v) => set("purchaseId", v)}
          props={field("purchaseId")}
        />
        <Input
          id="purchaseDate"
          label="구매일"
          type="date"
          required={!!purchaseRequired}
          value={values.purchaseDate}
          onChange={(v) => set("purchaseDate", v)}
          props={field("purchaseDate")}
        />
      </fieldset>
      {error("purchaseSource")}
      {error("purchaseId")}
      {error("purchaseDate")}
      <div>
        <label className="text-sm font-medium" htmlFor="message">
          문의 내용 <span aria-hidden="true">*</span>
        </label>
        <textarea
          {...field("message")}
          className={`${control} min-h-40 resize-y`}
          id="message"
          maxLength={3000}
          required
          value={values.message}
          onChange={(e) => set("message", e.target.value)}
        />
        {error("message")}
      </div>
      <InquiryImageUploader
        disabled={!formEnabled || state === "submitting"}
        error={imageError}
        files={images}
        onChange={updateImages}
      />
      <div>
        <label className="flex items-start gap-3 text-sm">
          <input
            {...field("privacyConsent")}
            checked={values.privacyConsent}
            className="mt-1 size-4"
            id="privacyConsent"
            onChange={(e) => set("privacyConsent", e.target.checked)}
            type="checkbox"
          />
          <span>
            <Link className="underline" href="/privacy">
              개인정보 수집 및 이용
            </Link>
            에 동의합니다.
          </span>
        </label>
        {error("privacyConsent")}
      </div>
      <div aria-live="polite" className="text-sm">
        {state === "success" && (
          <p>
            문의가 정상적으로 접수되었습니다.
            <br />
            확인 후 입력하신 이메일로 답변드리겠습니다.
          </p>
        )}
        {state === "error" && (
          <p className="text-brand">
            문의 접수에 실패했습니다.
            <br />
            잠시 후 다시 시도해 주세요.
          </p>
        )}
        {!formEnabled && (
          <p className="text-muted">
            죄송합니다. 현재 온라인 문의 접수를 이용할 수 없습니다.
          </p>
        )}
      </div>
      <button
        className="min-h-11 bg-ink px-6 py-3 text-sm text-white disabled:opacity-50"
        disabled={!formEnabled || state === "submitting"}
        type="submit"
      >
        {state === "submitting" ? "전송 중..." : "문의 보내기"}
      </button>
    </form>
  );
}
function Input({
  id,
  label,
  onChange,
  value,
  required,
  type = "text",
  maxLength,
  props = {},
}: {
  id: string;
  label: string;
  onChange: (v: string) => void;
  value: string;
  required?: boolean;
  type?: string;
  maxLength?: number;
  props?: object;
}) {
  return (
    <div>
      <label className="text-sm font-medium" htmlFor={id}>
        {label} {required && <span aria-hidden="true">*</span>}
      </label>
      <input
        {...props}
        className={control}
        id={id}
        maxLength={maxLength}
        required={required}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
function Select({
  id,
  label,
  onChange,
  options,
  value,
  required,
  disabled,
  props = {},
}: {
  id: string;
  label: string;
  onChange: (v: string) => void;
  options: readonly (readonly [string, string])[];
  value: string;
  required?: boolean;
  disabled?: boolean;
  props?: object;
}) {
  return (
    <div>
      <label className="text-sm font-medium" htmlFor={id}>
        {label} {required && <span aria-hidden="true">*</span>}
      </label>
      <select
        {...props}
        className={control}
        disabled={disabled}
        id={id}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">선택해 주세요</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}
