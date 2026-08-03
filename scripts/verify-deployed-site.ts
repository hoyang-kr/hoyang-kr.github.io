export {};
async function main() {
  const deployedUrl = process.env.DEPLOYED_URL;
  const expectedSha = process.env.EXPECTED_SHA;
  if (!deployedUrl || !expectedSha)
    throw new Error("DEPLOYED_URL and EXPECTED_SHA are required");
  const base = deployedUrl.replace(/\/$/, "");
  const expectedHome = [
    "EssentialBathroomStorage",
    "Browse by category",
    "공간과 용도에 맞는 제품",
    "Coordinated towel bars",
    "battuta",
    "Saco",
    "면도경",
  ];
  const forbidden = [
    "Bathroom details, considered",
    "Provisional brand image",
    "Batuta",
    "Shako",
    "거울",
    "컬렉션 소개 문구는 최종 편집 검토가 필요합니다",
    "스토어 링크 준비 중",
    "미확인",
    "정보 준비 중",
  ];
  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));
  async function fetchText(path: string) {
    const response = await fetch(
      `${base}${path}${path.includes("?") ? "&" : "?"}verify=${encodeURIComponent(expectedSha!)}`,
      { headers: { "cache-control": "no-cache" } },
    );
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return response.text();
  }
  let lastError: unknown;
  for (let attempt = 1; attempt <= 12; attempt++) {
    try {
      const info = JSON.parse(await fetchText("/build-info.json")) as {
        sha?: string;
      };
      if (info.sha !== expectedSha)
        throw new Error(
          `deployed SHA ${info.sha} does not match ${expectedSha}`,
        );
      const home = await fetchText("/");
      for (const text of expectedHome)
        if (!home.includes(text)) throw new Error(`homepage missing: ${text}`);
      for (const text of forbidden)
        if (home.includes(text))
          throw new Error(`homepage contains forbidden text: ${text}`);
      const contact = await fetchText("/contact/");
      for (const text of [
        "제품과 납품에 대해 문의하세요.",
        "문의 내용을 남겨주시면 확인 후 이메일로 답변드립니다.",
        "Contact information",
        "고객지원 안내 보기",
      ])
        if (!contact.includes(text))
          throw new Error(`contact missing: ${text}`);
      if (contact.includes("launch/business.yaml"))
        throw new Error("contact contains operator instructions");
      console.log(`Verified deployment ${expectedSha}`);
      process.exit(0);
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${attempt} failed: ${String(error)}`);
      if (attempt < 12) await sleep(10_000);
    }
  }
  throw lastError;
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
