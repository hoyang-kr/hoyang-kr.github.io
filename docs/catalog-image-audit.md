# 카탈로그 이미지 감사

이 문서는 `npm run import:images` 실행 시 실제 소스 파일을 기준으로 다시 생성됩니다.
원본 디렉터리는 `assets\images\products\originals/`이며 가져오기 과정에서 원본을 수정하거나 이동하지 않습니다.

## 요약

- 발견한 원본 이미지: 38개
- 새로 복사한 이미지: 0개
- 동일하여 건너뛴 이미지: 35개
- 비활성 매핑으로 복사하지 않은 이미지: 3개
- confirmed-from-filename: 30개
- probable: 8개
- ambiguous: 0개
- unmapped: 0개
- 매니페스트 기준 누락: 0개

신뢰도는 사업 확인 상태가 아니라 파일명과 이미지로 판단한 매핑 확실성을 뜻합니다.
`confirmed-from-filename`도 사업자가 검증했다는 뜻은 아닙니다.

## 파일 형식 및 크기

| 원본 파일                              |      픽셀 | 형식        |     크기 | 매핑 신뢰도             | 대상                                                            |
| -------------------------------------- | --------: | ----------- | -------: | ----------------------- | --------------------------------------------------------------- |
| 바투타/1.바투타수건걸이(사틴).jpg      | 6000×4000 | .jpg / jpeg |   2.1 MB | confirmed-from-filename | /images/products/batuta/batuta-towel-bar-satin.jpg              |
| 바투타/2.바투타휴지걸이(사틴).jpg      | 6000×4000 | .jpg / jpeg |   3.6 MB | confirmed-from-filename | /images/products/batuta/batuta-toilet-paper-holder-satin.jpg    |
| 벨레어/1.벨레어수건걸이(사틴).jpg      | 6000×4000 | .jpg / jpeg |   2.0 MB | confirmed-from-filename | /images/products/belair/belair-towel-bar-satin.jpg              |
| 벨레어/2.벨레어휴지걸이(사틴).jpg      | 6000×4000 | .jpg / jpeg |   3.6 MB | confirmed-from-filename | /images/products/belair/belair-toilet-paper-holder-satin.jpg    |
| 벨레어/3.벨레어수건걸이(크롬).jpg      | 6960×4640 | .jpg / jpeg |   2.7 MB | confirmed-from-filename | /images/products/belair/belair-towel-bar-chrome.jpg             |
| 벨레어/4.벨레어휴지걸이(크롬).jpg      | 5344×4520 | .jpg / jpeg |   5.3 MB | confirmed-from-filename | /images/products/belair/belair-toilet-paper-holder-chrome.jpg   |
| 브리오/1.브리오수건걸이(사틴).jpg      | 6000×4000 | .jpg / jpeg |   2.1 MB | confirmed-from-filename | /images/products/brio/brio-towel-bar-satin.jpg                  |
| 브리오/2.브리오휴지걸이(사틴).jpg      | 5304×5304 | .jpg / jpeg |   4.6 MB | confirmed-from-filename | /images/products/brio/brio-toilet-paper-holder-satin.jpg        |
| 브리오/3.브리오수건걸이(크롬).jpg      | 6000×4000 | .jpg / jpeg |   2.2 MB | confirmed-from-filename | /images/products/brio/brio-towel-bar-chrome.jpg                 |
| 브리오/4.브리오휴지걸이(크롬).jpg      | 5304×5304 | .jpg / jpeg |   4.8 MB | confirmed-from-filename | /images/products/brio/brio-toilet-paper-holder-chrome.jpg       |
| 브리오/5.브리오BP휴지걸이(크롬).png    | 1448×1086 | .png / png  | 771.7 KB | confirmed-from-filename | /images/products/brio/brio-bp-toilet-paper-holder-chrome.png    |
| 사코/1.사코수건걸이(블랙).jpg          | 6000×4000 | .jpg / jpeg |   2.0 MB | probable                | /images/products/saco/saco-towel-bar-black.jpg                  |
| 사코/2.사코휴지걸이(블랙).jpg          | 3134×3194 | .jpg / jpeg |   1.3 MB | probable                | /images/products/saco/saco-toilet-paper-holder-black.jpg        |
| 사코/3.사코수건걸이(크롬).jpg          | 6000×4000 | .jpg / jpeg |   1.9 MB | probable                | /images/products/saco/saco-towel-bar-chrome.jpg                 |
| 사코/4.사코휴지걸이(크롬).jpg          | 5304×5304 | .jpg / jpeg |   4.9 MB | probable                | /images/products/saco/saco-toilet-paper-holder-chrome.jpg       |
| 콩코드/1.콩코드수건걸이(사틴).jpg      | 5791×3786 | .jpg / jpeg |   2.3 MB | confirmed-from-filename | /images/products/concord/concord-towel-bar-satin.jpg            |
| 콩코드/2.콩코드휴지걸이(사틴).jpg      | 5304×5304 | .jpg / jpeg |   4.6 MB | confirmed-from-filename | /images/products/concord/concord-toilet-paper-holder-satin.jpg  |
| 콩코드/3.콩코드수건걸이(크롬).jpg      | 6000×4000 | .jpg / jpeg |   2.4 MB | confirmed-from-filename | /images/products/concord/concord-towel-bar-chrome.jpg           |
| 콩코드/4.콩코드휴지걸이(크롬).jpg      | 5304×5304 | .jpg / jpeg |   4.8 MB | confirmed-from-filename | /images/products/concord/concord-toilet-paper-holder-chrome.jpg |
| HG/HG01MS 슬라이드바(무광).png         |   447×548 | .png / png  |  26.0 KB | confirmed-from-filename | /images/products/hg/hg01ms-slide-bar-matte.png                  |
| HG/HG05 옷걸이(사틴).jpg               |   498×500 | .jpg / jpeg |  13.1 KB | confirmed-from-filename | /images/products/hg/hg05-robe-hook-satin.jpg                    |
| HG/HG55S 슬리퍼걸이(사틴).jpg          |   795×530 | .jpg / jpeg |  21.6 KB | confirmed-from-filename | /images/products/hg/hg55s-slipper-rack-satin.jpg                |
| HG/HG100MS 코너선반(무광).jpg          |   498×500 | .jpg / jpeg |  14.3 KB | confirmed-from-filename | /images/products/hg/hg100ms-corner-shelf-matte.jpg              |
| HG/HG110-1 매립휴지걸이(크롬).jpg      |   498×500 | .jpg / jpeg |  17.7 KB | confirmed-from-filename | /images/products/hg/hg110-1-recessed-holder-chrome.jpg          |
| HG/HG110C 매립휴지걸이(크롬).png       |   490×482 | .png / png  |  33.7 KB | confirmed-from-filename | /images/products/hg/hg110c-recessed-holder-chrome.png           |
| HG/HG110S 매립휴지걸이(사틴).png       |   498×492 | .png / png  |  38.8 KB | confirmed-from-filename | /images/products/hg/hg110s-recessed-holder-satin.png            |
| HG/HG112C 트레이겸용매립휴지(크롬).jpg |   498×500 | .jpg / jpeg |  17.0 KB | confirmed-from-filename | /images/products/hg/hg112c-tray-recessed-holder-chrome.jpg      |
| HG/HG112S 트레이겸용매립휴지(사틴).png |   498×500 | .png / png  |  45.4 KB | confirmed-from-filename | /images/products/hg/hg112s-tray-recessed-holder-satin.png       |
| HG/HG120 일단휴지걸이.jpg              |   498×500 | .jpg / jpeg |  14.0 KB | probable                | /images/products/hg/hg120-single-paper-holder.jpg               |
| HG/HG240 폰트레이매립휴지걸이.jpg      |   498×500 | .jpg / jpeg |  16.4 KB | probable                | /images/products/hg/hg240-phone-tray-recessed-holder.jpg        |
| HG/HG392MS 고급형선반(무광).png        |   541×364 | .png / png  |  80.1 KB | confirmed-from-filename | /images/products/hg/hg392ms-premium-shelf-matte.png             |
| HG/HG513 청소솔.png                    |   500×499 | .png / png  |  21.2 KB | probable                | /images/products/hg/hg513-cleaning-brush-chrome.png             |
| HG/HG513 청소솔(사틴).png              |   500×500 | .png / png  |  25.5 KB | confirmed-from-filename | /images/products/hg/hg513-cleaning-brush-satin.png              |
| HG/HG820 이단수건선반(크롬).jpg        |   598×388 | .jpg / png  |  27.7 KB | confirmed-from-filename | /images/products/hg/hg820-double-towel-shelf-chrome.png         |
| HG/HG822C 이단수건선반(크롬).jpg       |   598×388 | .jpg / jpeg |  12.9 KB | confirmed-from-filename | /images/products/hg/hg822-double-towel-shelf-chrome.jpg         |
| HG/HG822S 이단수건선반(사틴).jpg       |   600×395 | .jpg / jpeg |  13.1 KB | confirmed-from-filename | /images/products/hg/hg822-double-towel-shelf-satin.jpg          |
| HG/HG999 면도경.jpg                    |   498×500 | .jpg / jpeg |  13.9 KB | probable                | /images/products/hg/hg999-shaving-mirror.jpg                    |
| HG/HG999-2 면도경(사틴).jpg            |   498×500 | .jpg / jpeg |  15.9 KB | confirmed-from-filename | /images/products/hg/hg999-2-shaving-mirror-satin.jpg            |

## 완전히 동일한 원본

- `바투타/2.바투타휴지걸이(사틴).jpg` = `벨레어/2.벨레어휴지걸이(사틴).jpg`
- `브리오/2.브리오휴지걸이(사틴).jpg` = `콩코드/2.콩코드휴지걸이(사틴).jpg`
- `브리오/4.브리오휴지걸이(크롬).jpg` = `콩코드/4.콩코드휴지걸이(크롬).jpg`

동일 파일이라도 서로 다른 제품명으로 제공된 경우 파일명대로 연결했으며 제품 관계를 변경하지 않았습니다.
출시 전 공급 자산이 올바른지 사업 확인이 필요합니다.

## 처리 정책

- EXIF 방향값이 있는 경우에만 자동 회전합니다.
- 방향과 실제 형식이 정상인 파일은 재인코딩하지 않고 바이트 그대로 복사합니다.
- 확장자와 실제 형식이 다른 파일은 감지된 형식과 일치하는 ASCII 대상 확장자를 사용합니다.
- 업스케일, 공격적 압축, 그림자, 배경 합성, 제품 형상 변경은 하지 않습니다.
- 기존 대상과 내용이 다르면 덮어쓰지 않고 충돌로 실패합니다.
