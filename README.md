# 브랜드명 욕실 액세서리 카탈로그

Next.js App Router, TypeScript, Tailwind CSS로 만든 한국어 브랜드·제품
카탈로그 MVP입니다. 구매는 제품 변형별 외부 네이버 스마트스토어 링크를
통해서만 진행되며 장바구니, 결제, 회원, 재고 또는 주문 관리 기능은 포함하지
않습니다.

## 실행

Node.js 20.19 이상이 필요합니다.

```bash
npm install
npm run dev
```

검증:

```bash
npm run format:check
npm run lint
npx tsc --noEmit
npm run build
```

## GitHub Pages 배포

`main` 브랜치에 푸시하면 `.github/workflows/deploy-pages.yml`이 Next.js
정적 사이트를 빌드해 GitHub Pages에 배포합니다. 저장소의
**Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로
한 번 설정해야 합니다.

현재 공개 데이터가 운영 검증을 통과하지 않았으므로 이 워크플로는 사이트를
`preview` 모드로 배포합니다. 이에 따라 검색 엔진 색인은 차단되며, 검증되지
않은 네이버 링크는 활성화되지 않습니다. 운영 데이터와 권리 확인을 완료한
뒤에만 워크플로의 `NEXT_PUBLIC_SITE_RELEASE_MODE`를 `production`으로
변경하세요.

## 사업자 및 브랜드 설정

사이트의 릴리스 모드는 개발, 프리뷰, 프로덕션으로 명시적으로 관리되며
`NODE_ENV`만으로 운영 준비 상태를 판단하지 않습니다. `data/launch/`의
템플릿은 입력 가이드일 뿐 애플리케이션이 운영 데이터로 불러오지 않습니다.

프리뷰 검증:

```bash
npm run import:launch-data
npm run validate:preview
npm run build
```

운영 후보는 다섯 개의 비템플릿 입력 파일을 검증된 정보로 완성하고 실제
도메인과 프로덕션 릴리스 모드를 설정한 뒤 아래 명령으로 검증합니다.

```bash
npm run verify:production
```

이 명령은 사업자, 법적 문서, 카탈로그, 권리, 네이버 링크, SEO, 이미지,
사이트맵, 라우트 및 빌드를 검증하지만 자동 배포하지 않습니다.

## 제품 데이터

- 제품 패밀리와 마감 변형: `src/data/products.ts`
- 컬렉션 영문명 및 임시 slug: `src/data/collections.ts`
- 카테고리: `src/data/categories.ts`
- 이미지 원본/정규화 매핑: `src/data/image-mapping.ts`

마감은 같은 제품 패밀리의 변형으로 관리됩니다. 제품 치수, 소재, 인증,
설치법, 보증, 가격 등 확인되지 않은 정보는 입력하지 않습니다.

## 이미지 교체 절차

실제 원본 이미지는 `assets/images/products/originals/`에 보존하고 아래
명령으로 정규화 복사본과 감사 문서를 생성합니다.

```bash
npm run import:images
```

가져오기 스크립트는:

1. `src/data/image-mapping.ts`의 명시적 매핑만 사용합니다.
2. 원본을 이동하거나 수정하지 않고 ASCII 이름으로 `public/images/products/`
   아래에 복사합니다.
3. 동일 파일은 건너뛰며 내용이 다른 대상 파일은 덮어쓰지 않고 실패합니다.
4. 방향 메타데이터가 필요한 경우에만 자동 회전하고 업스케일하지 않습니다.
5. `docs/catalog-image-audit.csv`와 `docs/catalog-image-audit.md`를 다시
   생성합니다.

새 이미지를 추가할 때는 먼저 이미지 매핑에 원본명, 제품·변형 ID, 대상
경로와 검토 상태를 추가합니다. 모호한 이미지는 정규화할 수 있지만
`useInCatalog: false`를 유지해 고객 화면의 플레이스홀더를 보존합니다.

현재 HG513의 마감 미표기 변형만 중립 SVG 플레이스홀더를 유지합니다.

홈 히어로의 `public/images/hero/bathroom-architecture-placeholder.png`는
프로비저널 이미지입니다. 최종 설치 공간 촬영본으로 교체해야 합니다.

## 시각 검토

프로덕션 서버를 3100 포트에서 실행한 뒤 Playwright 스크린샷 검토를 다시
실행할 수 있습니다.

```bash
npm run build
npm start -- -p 3100
# 다른 터미널에서
npx playwright install chromium
npm run review:visual
```

결과는 `docs/screenshots/`에 저장됩니다. 검토 범위와 확인 사항은
`docs/visual-review.md`를 참고하세요.

## 운영 전 필수 확인

- 브랜드 한글/영문명과 로고
- 컬렉션 영문명과 URL slug
- 제품별 이미지, 모델, 마감, 사양과 관련 제품 관계
- 제품 변형별 네이버 스마트스토어 URL
- 사업자, 고객센터와 법적 문서
- 실제 배포 도메인과 Open Graph 이미지

상세 검토 결과는 `docs/catalog-validation.md`, 필요한 사업 데이터는
`docs/business-data-required.md`를 참고하세요.

운영 절차와 현재 차단 항목은 `docs/deployment.md` 및
`docs/launch-readiness.md`, 이미지 및 브랜드 권리는
`docs/image-and-brand-rights-checklist.md`를 참고하세요.
