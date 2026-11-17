/* 대체산림자원조성비 계산기 — 2026-11-17
 *
 * 모든 수치는 1차 자료 대조본이다. 바꿀 때는 반드시 원문을 다시 확인하고
 * 아래 주석의 출처와 기준일을 같이 고칠 것.
 *
 *  [단가]  산림청고시 제2026-16호 「2026년도 대체산림자원조성비 부과기준」
 *          발령·시행 2026. 1. 30.  (국가법령정보센터 행정규칙 ID 2100000274292)
 *            준보전산지              8,340 원/㎡
 *            보전산지               10,840 원/㎡
 *            산지전용·일시사용제한지역 16,680 원/㎡
 *          ※ 시행령 제24조 제4항의 가산율(보전 +30%, 제한지역 +100%)로 역산하면
 *            보전산지가 10,842가 되어 고시값 10,840과 2원 어긋난다. 고시값을 그대로 쓴다.
 *
 *  [계산식] 고시 본문 그대로
 *            부과금액 = 산지전용허가·산지일시사용허가 면적 × 단위면적당 금액
 *            단위면적당 금액 = 산지별·지역별 단위면적당 산출금액
 *                              + 해당 산지 개별공시지가의 1000분의 1
 *            개별공시지가의 1000분의 1에 해당하는 금액은 최대 8,340원/㎡으로 한정
 *          ※ 반영비율은 2025년도 고시부터 1000분의 1이다. 2024년도까지는 1000분의 10이었고
 *            인터넷에 도는 "공시지가의 1%"는 그 옛 기준이다. 쓰면 10배 과대계상된다.
 *
 *  [감면]  산지관리법 시행령 [별표 5] (대통령령 제36587호, 시행 2026. 9. 18.)
 *          보전산지와 준보전산지의 비율이 다르다. 아래 목록은 일반 지주가 실제로
 *          해당될 수 있는 제3호 항목 위주로 추렸다 — 전체 목록이 아니다.
 *
 *  [근거]  산지관리법 제19조 제1항·제8항·제10항, 시행령 제23조 제1항·제24조
 */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  if (!$("dsRun")) return;

  // 산림청고시 제2026-16호 (2026-01-30 시행)
  var GOSI = {
    no: "산림청고시 제2026-16호",
    since: "2026. 1. 30.",
    rate: { jun: 8340, bo: 10840, limit: 16680 },
    gongsiRatio: 0.001,   // 개별공시지가의 1000분의 1
    gongsiCap: 8340       // 가산액 상한 (원/㎡)
  };

  // 시행령 별표 5 — [값] = {보전 감면율, 준보전 감면율}
  var EXEMPT = [
    { v: "none",    t: "해당 없음 (감면 대상 아님)",                                   bo: 0,   jun: 0 },
    { v: "house",   t: "농림어업인이 자기 소유 산지에 660㎡ 미만으로 짓는 주택·부대시설", bo: 100, jun: 100,
      note: "별표 5 제3호 가목. 비고 3 — 농림어업을 직접 경영하면서 실제 거주하기 위한 것이어야 하고, 부대시설은 창고·축사·차고·화장실·탈곡장·퇴비저장시설을 말합니다." },
    { v: "farm",    t: "농림어업인등의 축사·온실·버섯재배시설·양어장·양식장·실외낚시터",  bo: 100, jun: 100,
      note: "별표 5 제3호 마목. 축사는 축산법 시행령 제3조 제1호·제3호·제4호에 해당하는 시설입니다." },
    { v: "school",  t: "유아교육법·초중등교육법·고등교육법상 각급 학교 시설용지",          bo: 100, jun: 100,
      note: "별표 5 제3호 나목." },
    { v: "mining",  t: "광물의 채굴",                                                bo: 100, jun: 100,
      note: "별표 5 제3호 자목." },
    { v: "disaster",t: "특별재난지역의 재해 단독주택 복구 (산지면적 660㎡ 미만)",         bo: 100, jun: 100,
      note: "별표 5 제3호 저목. 신축·증축·이축과 그 부대시설이 포함됩니다." },
    { v: "cho",     t: "초지법에 따라 조성된 초지",                                    bo: 50,  jun: 100,
      note: "별표 5 제3호 아목. 보전산지와 준보전산지의 비율이 다른 대표 항목입니다." },
    { v: "welfare", t: "비영리법인의 사회복지시설",                                    bo: 0,   jun: 100,
      note: "별표 5 제3호 카목. 보전산지는 감면이 없습니다." },
    { v: "rental",  t: "공공주택 특별법상 임대주택",                                   bo: 0,   jun: 100,
      note: "별표 5 제3호 타목. 보전산지는 감면이 없습니다." },
    { v: "youth",   t: "청소년수련시설",                                              bo: 50,  jun: 50,
      note: "별표 5 제3호 하목." },
    { v: "publicfac", t: "국가·지방자치단체에 기부채납하는 공용·공공용시설",              bo: 100, jun: 100,
      note: "별표 5 제3호 사목. 무상귀속되는 경우를 포함합니다." }
  ];

  function won(n) { return Math.round(n).toLocaleString("ko-KR"); }

  // 감면 선택지 채우기
  var sel = $("dsExempt");
  EXEMPT.forEach(function (e) {
    var o = document.createElement("option");
    o.value = e.v; o.textContent = e.t;
    sel.appendChild(o);
  });

  function findExempt(v) {
    for (var i = 0; i < EXEMPT.length; i++) if (EXEMPT[i].v === v) return EXEMPT[i];
    return EXEMPT[0];
  }

  sel.addEventListener("change", function () {
    var e = findExempt(sel.value);
    var box = $("dsExemptNote");
    if (e.note) { box.innerHTML = e.note; box.hidden = false; }
    else { box.hidden = true; }
  });

  $("dsRun").addEventListener("click", function () {
    var kind = $("dsKind").value;                       // jun | bo | limit
    var area = parseFloat($("dsArea").value);
    var unit = $("dsUnit").value;                       // m2 | pyeong
    var gongsi = parseFloat($("dsGongsi").value);
    var ex = findExempt($("dsExempt").value);
    var out = $("dsResult");

    if (isNaN(area) || area <= 0) {
      out.innerHTML = '<div class="tool-verdict warn">전용하려는 산지의 면적을 입력하십시오.</div>';
      out.hidden = false;
      return;
    }
    var m2 = (unit === "pyeong") ? area * 3.305785 : area;

    var baseRate = GOSI.rate[kind];
    var add = 0, addCapped = false;
    if (!isNaN(gongsi) && gongsi > 0) {
      add = gongsi * GOSI.gongsiRatio;
      if (add > GOSI.gongsiCap) { add = GOSI.gongsiCap; addCapped = true; }
    }
    var unitAmount = baseRate + add;
    var gross = m2 * unitAmount;
    var rate = (kind === "jun") ? ex.jun : ex.bo;       // 제한지역은 보전산지 비율을 따른다고 단정하지 않는다
    var rateKnown = (kind !== "limit");
    var cut = rateKnown ? gross * rate / 100 : 0;
    var net = gross - cut;

    var kindLabel = { jun: "준보전산지", bo: "보전산지", limit: "산지전용·일시사용제한지역" }[kind];

    var h = '';
    h += '<div class="tool-verdict ' + (net === 0 ? 'good' : 'neutral') + '">'
       + '예상 부과금액 <b>' + won(net) + '원</b></div>';

    h += '<h3>계산 과정</h3><div class="table-scroll"><table><tbody>';
    h += '<tr><td>산지 구분</td><td><b>' + kindLabel + '</b></td></tr>';
    h += '<tr><td>단위면적당 산출금액</td><td><b>' + won(baseRate) + '원/㎡</b> '
       + '<span class="law-cell">' + GOSI.no + '</span></td></tr>';
    if (add > 0) {
      h += '<tr><td>개별공시지가 가산<br><span class="law-cell">공시지가 × 1/1000</span></td><td><b>+ '
         + won(add) + '원/㎡</b>' + (addCapped ? ' <span class="law-cell">(상한 ' + won(GOSI.gongsiCap) + '원 적용)</span>' : '') + '</td></tr>';
    } else {
      h += '<tr><td>개별공시지가 가산</td><td>미입력 — 실제 고지서는 이 금액이 더해집니다</td></tr>';
    }
    h += '<tr><td>단위면적당 금액</td><td><b>' + won(unitAmount) + '원/㎡</b></td></tr>';
    h += '<tr><td>전용 면적</td><td><b>' + won(m2) + '㎡</b>'
       + (unit === "pyeong" ? ' <span class="law-cell">(' + area + '평 환산)</span>' : '') + '</td></tr>';
    h += '<tr><td>감면 전 금액</td><td><b>' + won(gross) + '원</b></td></tr>';
    if (rateKnown) {
      h += '<tr><td>감면</td><td>' + (rate > 0
          ? '<b>' + rate + '%</b> 감면 → − ' + won(cut) + '원'
          : '해당 없음 (0% — 감면 없이 전액 부과)') + '</td></tr>';
    }
    h += '<tr><td><b>부과금액</b></td><td><b>' + won(net) + '원</b></td></tr>';
    h += '</tbody></table></div>';

    var next = [];
    if (!rateKnown) {
      next.push('<b>산지전용·일시사용제한지역</b>은 별표 5의 감면 비율이 항목마다 '
        + '보전산지 기준으로 적용되는지 따로 확인해야 하므로, 이 계산기는 감면을 '
        + '적용하지 않은 금액을 보여줍니다. 관할 산림부서에 확인하십시오.');
    }
    if (ex.note) next.push(ex.note);
    if (add === 0) {
      next.push('개별공시지가는 <b>부동산공시가격 알리미</b> 또는 해당 시·군·구에서 확인할 수 있습니다. '
        + '넣지 않으면 실제 고지액보다 적게 나옵니다.');
    }
    next.push('납부는 <b>선납이 원칙</b>입니다(산지관리법 제19조 제1항). 금액에 따라 조건부 후납(20~90일)이나 '
      + '1억원 이상 4년 이내 분할납부가 가능합니다(제19조 제2항·시행령 제21조).');
    next.push('이 금액은 <b>대체산림자원조성비만</b>입니다. 산지복구비 예치, 개발행위허가·건축허가 비용은 별도입니다.');

    h += '<h3>확인할 것</h3><ul>' + next.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ul>';
    h += '<p class="tool-foot">기준: ' + GOSI.no + ' (' + GOSI.since + ' 시행) · '
       + '감면: 산지관리법 시행령 [별표 5] (2026. 9. 18. 시행). '
       + '단가 고시는 해마다 개정되므로 납부 시점의 고시를 확인하십시오. '
       + '실제 부과액은 관할 행정청이 결정합니다.</p>';

    out.innerHTML = h;
    out.hidden = false;
  });
})();
