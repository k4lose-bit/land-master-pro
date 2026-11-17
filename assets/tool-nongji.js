/* 농지보전부담금 계산기 — 2026-11-17
 *
 * 1차 자료 대조 내역 (국가법령정보센터 Open API, 2026-11-17 조회)
 *
 *  [산식] 농지법 시행령 제53조 제1항
 *     "농지보전부담금의 제곱미터당 금액은 … 해당 농지의 개별공시지가에
 *      다음 각 호의 구분에 따른 비율을 곱한 금액으로 한다"
 *        1. 농업진흥지역의 농지:      100분의 30
 *        2. 농업진흥지역 밖의 농지:   100분의 20
 *      (농지법 시행령, 시행 2026. 9. 18. / MST 288811)
 *
 *  [상한] 농지법 시행규칙 — 제곱미터당 상한 금액
 *     "영 제53조제2항에서 '농림축산식품부령으로 정하는 금액'이란 각각 5만원을 말한다"
 *      (농림축산식품부령, 공포 2026. 9. 22. / MST 289987)
 *
 *  [감면] 농지법 시행령 제52조 — 감면대상 및 감면비율은 [별표 2]
 *     별표 2는 고정폭 표라 항목이 수십 개이고 시설별로 0/50/100%가 갈린다.
 *     잘못 옮기면 금액이 통째로 틀리므로 이 계산기는 감면율을 코드에 넣지 않고
 *     사용자가 별표 2에서 확인한 값을 직접 넣게 한다. 추정하지 않는다.
 *
 *  ※ 대체산림자원조성비(산지)와 달리 농지는 단가 고시가 따로 없고
 *    개별공시지가에 직접 비율을 곱한다. 두 제도를 섞지 말 것.
 */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  if (!$("njRun")) return;

  var RATE = { in: 0.30, out: 0.20 };   // 시행령 제53조 제1항 제1호·제2호
  var CAP = 50000;                      // 시행규칙 — 제곱미터당 상한 5만원

  function won(n) { return Math.round(n).toLocaleString("ko-KR"); }

  $("njRun").addEventListener("click", function () {
    var zone = $("njZone").value;                 // in | out
    var area = parseFloat($("njArea").value);
    var unit = $("njUnit").value;
    var gongsi = parseFloat($("njGongsi").value);
    var cut = parseFloat($("njCut").value);
    var out = $("njResult");

    if (isNaN(area) || area <= 0 || isNaN(gongsi) || gongsi <= 0) {
      out.innerHTML = '<div class="tool-verdict warn">전용 면적과 개별공시지가를 모두 입력하십시오. '
        + '농지보전부담금은 공시지가에 비율을 곱해 구하므로 공시지가 없이는 계산되지 않습니다.</div>';
      out.hidden = false;
      return;
    }
    if (isNaN(cut) || cut < 0) cut = 0;
    if (cut > 100) cut = 100;

    var m2 = (unit === "pyeong") ? area * 3.305785 : area;
    var ratio = RATE[zone];
    var raw = gongsi * ratio;
    var capped = raw > CAP;
    var perM2 = capped ? CAP : raw;
    var gross = m2 * perM2;
    var net = gross * (1 - cut / 100);
    var zoneLabel = (zone === "in") ? "농업진흥지역 안의 농지" : "농업진흥지역 밖의 농지";

    var h = '<div class="tool-verdict ' + (net === 0 ? 'good' : 'neutral') + '">'
          + '예상 농지보전부담금 <b>' + won(net) + '원</b></div>';

    h += '<h3>계산 과정</h3><div class="table-scroll"><table><tbody>';
    h += '<tr><td>농지 구분</td><td><b>' + zoneLabel + '</b></td></tr>';
    h += '<tr><td>개별공시지가</td><td><b>' + won(gongsi) + '원/㎡</b></td></tr>';
    h += '<tr><td>적용 비율</td><td><b>' + (ratio * 100) + '%</b> '
       + '<span class="law-cell">시행령 제53조 제1항 제' + (zone === "in" ? "1" : "2") + '호</span></td></tr>';
    h += '<tr><td>㎡당 금액</td><td><b>' + won(perM2) + '원/㎡</b>'
       + (capped ? ' <span class="law-cell">산출값 ' + won(raw) + '원이 상한 5만원을 넘어 상한 적용</span>' : '')
       + '</td></tr>';
    h += '<tr><td>전용 면적</td><td><b>' + won(m2) + '㎡</b>'
       + (unit === "pyeong" ? ' <span class="law-cell">(' + area + '평 환산)</span>' : '') + '</td></tr>';
    h += '<tr><td>감면 전 금액</td><td><b>' + won(gross) + '원</b></td></tr>';
    h += '<tr><td>감면율</td><td>' + (cut > 0 ? '<b>' + cut + '%</b> → − ' + won(gross - net) + '원'
         : '0% (입력 없음 — 전액 부과 기준)') + '</td></tr>';
    h += '<tr><td><b>농지보전부담금</b></td><td><b>' + won(net) + '원</b></td></tr>';
    h += '</tbody></table></div>';

    var next = [];
    if (capped) {
      next.push('이 농지는 공시지가가 높아 <b>상한 5만원/㎡</b>이 적용됐습니다. '
        + '공시지가가 ' + won(CAP / ratio) + '원/㎡을 넘으면 그 위로는 금액이 더 늘지 않습니다.');
    }
    if (cut === 0) {
      next.push('<b>감면 가능성을 반드시 확인하십시오.</b> 감면 대상과 비율은 '
        + '농지법 시행령 <b>[별표 2]</b>에 시설별로 정해져 있고 0% / 50% / 100%로 갈립니다. '
        + '해당 항목을 확인한 뒤 그 비율을 위 칸에 넣으면 감면 후 금액이 나옵니다.');
    }
    next.push('부과기준일은 전용허가 신청일 등 사유별로 다릅니다(시행령 제53조 제3항·제4항). '
      + '기준일 현재 <b>가장 최근에 공시된</b> 개별공시지가가 적용됩니다.');
    next.push('이 금액은 <b>농지보전부담금만</b>입니다. 농지전용허가 자체의 요건과 '
      + '개발행위허가·건축허가는 별도입니다.');
    next.push('산지(임야)는 제도가 다릅니다 — 산지는 산림청 고시 단가를 쓰는 '
      + '<b>대체산림자원조성비</b>이고, 공시지가에 비율을 곱하지 않습니다.');

    h += '<h3>확인할 것</h3><ul>' + next.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ul>';
    h += '<p class="tool-foot">근거: 농지법 제38조, 같은 법 시행령 제52조·제53조(시행 2026. 9. 18.), '
       + '같은 법 시행규칙(공포 2026. 9. 22.) 제곱미터당 상한 5만원. '
       + '2026. 11. 17. 국가법령정보센터 원문과 대조했습니다. '
       + '실제 부과액은 관할 행정청이 결정합니다.</p>';

    out.innerHTML = h;
    out.hidden = false;
  });
})();
