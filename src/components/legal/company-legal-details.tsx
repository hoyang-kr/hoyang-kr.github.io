import { siteConfig } from "@/config/site";

export function CompanyLegalDetails() {
  return (
    <section>
      <h2>사업자 및 문의 정보</h2>
      <dl className="space-y-2 text-sm leading-7">
        <div>
          <dt className="inline font-medium">회사명: </dt>
          <dd className="inline">{siteConfig.business.companyName}</dd>
        </div>
        <div>
          <dt className="inline font-medium">대표자: </dt>
          <dd className="inline">{siteConfig.business.representative}</dd>
        </div>
        <div>
          <dt className="inline font-medium">사업자등록번호: </dt>
          <dd className="inline">{siteConfig.business.registrationNumber}</dd>
        </div>
        {siteConfig.business.mailOrderRegistrationRequired ? (
          <div>
            <dt className="inline font-medium">통신판매업 신고번호: </dt>
            <dd className="inline">
              {siteConfig.business.mailOrderRegistrationNumber}
            </dd>
          </div>
        ) : null}
        <div>
          <dt className="inline font-medium">사업장 주소: </dt>
          <dd className="inline">{siteConfig.address}</dd>
        </div>
        <div>
          <dt className="inline font-medium">고객센터: </dt>
          <dd className="inline">{siteConfig.telephone}</dd>
        </div>
        <div>
          <dt className="inline font-medium">이메일: </dt>
          <dd className="inline">{siteConfig.email}</dd>
        </div>
        <div>
          <dt className="inline font-medium">개인정보 보호책임자: </dt>
          <dd className="inline">{siteConfig.business.privacyOfficer}</dd>
        </div>
      </dl>
    </section>
  );
}
