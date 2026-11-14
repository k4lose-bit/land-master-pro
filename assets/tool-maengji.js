/* 맹지·접도 요건 1차 판정기 — 2026-11-14
 * 분기 근거는 모두 건축법 조문이며 2026-10-14 국가법령정보센터 원문과 대조한 내용이다.
 *   제2조 제1항 제11호  도로 = 너비 4m 이상 + 가목(고시) 또는 나목(지정·공고)
 *   제44조 제1항        대지는 2m 이상이 도로에 접할 것
 *   시행령 제28조 제2항  연면적 2,000㎡(공장 3,000㎡) 이상은 너비 6m 도로에 4m 이상
 *   시행령 제3조의3     지형조건·막다른 도로 예외 너비 2m / 3m / 6m (읍·면 4m)
 *   제45조 제1항        도로 지정 — 제2호는 조례로 정한 '사실상의 통로'
 *   제46조 제1항        소요 너비 미달 시 중심선에서 1/2 후퇴한 선이 건축선
 *   제3조 제2항         도시지역·지구단위계획구역 밖 + 동·읍 아닌 지역은 제44조~제47조 적용 제외
 * 새 분기를 넣을 때는 원문을 다시 대조하고 위 목록에 함께 적을 것.
 */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var btn = $("tmRun");
  if (!btn) return;

  function num(id) {
    var v = parseFloat(($(id) || {}).value);
    return isNaN(v) ? null : v;
  }

  function li(items) {
    return "<ul>" + items.map(function (s) { return "<li>" + s + "</li>"; }).join("") + "</ul>";
  }

  function render(verdict, cls, lead, findings, next) {
    var h = '<div class="tool-verdict ' + cls + '">' + verdict + "</div>";
    if (lead) h += "<p class=\"tool-lead\">" + lead + "</p>";
    if (findings && findings.length) h += "<h3>확인된 내용</h3>" + li(findings);
    if (next && next.length) h += "<h3>다음에 확인할 것</h3>" + li(next);
    h += '<p class="tool-foot">이 결과는 입력값만으로 조문을 대조한 <b>1차 판정</b>입니다. ' +
         '조례로 달라지는 항목과 현장 조건(경사·구거·배수)은 반영되지 않습니다. ' +
         '최종 확인은 관할 시·군·구 건축과에서 받으십시오.</p>';
    var box = $("tmResult");
    box.innerHTML = h;
    box.hidden = false;
  }

  btn.addEventListener("click", function () {
    var area = $("tmArea").value;
    var road = $("tmRoad").value;
    var width = num("tmWidth");
    var front = num("tmFront");
    var floor = num("tmFloor");
    var factory = $("tmFactory").checked;

    // ── 면 지역: 접도 규정 자체가 적용되지 않는다 (제3조 제2항)
    if (area === "myeon") {
      render(
        "접도 규정이 적용되지 않는 구간입니다",
        "neutral",
        "도시지역·지구단위계획구역 밖이면서 동·읍이 아닌 <b>면 지역</b>이므로, " +
        "건축법 제44조부터 제47조까지가 적용되지 않습니다(건축법 제3조 제2항).",
        [
          "접도 요건(2m)·도로 너비(4m)·건축선 후퇴 규정이 이 땅에는 적용되지 않습니다.",
          "다만 <b>건축법의 접도 규정이 빠지는 것일 뿐</b>이며, 건축 자체가 자유롭다는 뜻은 아닙니다."
        ],
        [
          "국토계획법상 <b>개발행위허가</b> 기준(진입로 확보 포함)은 그대로 남습니다. 관할 허가부서에 진입로 요건을 확인하십시오.",
          "현장에 실제로 차량이 진입할 수 있는 길이 있는지, 그 길의 소유자가 누구인지 등기로 확인하십시오.",
          "읍 지역은 적용 제외 대상이 <b>아닙니다</b>. 행정구역이 읍인지 면인지 다시 확인하십시오."
        ]
      );
      return;
    }

    var findings = [];
    var next = [];
    var blocking = false;   // 요건 미달이 확정된 항목이 있는가
    var unresolved = false; // 추가 확인이 필요한 항목이 있는가

    // ── 1) 접한 길이 건축법상 '도로'인가 (제2조 제1항 제11호)
    if (road === "none") {
      blocking = true;
      findings.push("접한 길이 없으므로 건축법 제44조 제1항의 접도 요건을 충족하지 못합니다. " +
        "거래 현장에서 말하는 <b>맹지</b>가 이 상태입니다.");
      next.push("건축법 제45조 제1항에 따라 도로를 지정받을 수 있는지(이해관계인 동의 또는 " +
        "제2호의 조례상 '사실상의 통로' 해당 여부) 관할 건축과에 확인하십시오.");
      next.push("인접 토지에 민법 제219조의 주위토지통행권을 주장할 수 있는지 검토하십시오. " +
        "통행권이 인정돼도 건축허가가 자동으로 나오는 것은 아닙니다.");
    } else if (road === "sasil") {
      unresolved = true;
      findings.push("접한 길이 고시·지정·공고된 적이 없으므로, 현재 상태로는 " +
        "건축법 제2조 제1항 제11호의 '도로'에 해당하지 않습니다. " +
        "거래 현장에서 <b>'현황도로'</b>라고 부르는 상태입니다(법령 용어가 아닙니다).");
      next.push("건축법 제45조 제1항 제2호의 <b>'사실상의 통로'</b>로 지정할 수 있는지, " +
        "해당 시·군 조례 몇 조에 근거가 있는지를 콕 집어 질의하십시오. " +
        "이 표현으로 물어야 담당자마다 답이 달라지지 않습니다.");
      next.push("지정 가능하다면 건축위원회 심의를 거쳐야 하고, 지정된 도로는 " +
        "도로관리대장에 기재·관리됩니다(제45조 제3항).");
    } else {
      findings.push("접한 길이 " + (road === "gosi" ? "법령에 따라 고시된 도로(가목)" :
        "위치를 지정·공고한 도로(나목)") + "에 해당합니다(제2조 제1항 제11호).");
    }

    // ── 2) 도로 너비 (제2조 제1항 제11호 / 시행령 제3조의3 / 제46조 제1항)
    if (width === null) {
      unresolved = true;
      next.push("길의 너비를 확인해 다시 판정해 보십시오. 4m가 기준입니다(제2조 제1항 제11호).");
    } else if (road !== "none") {
      if (width >= 4) {
        findings.push("길의 너비가 " + width + "m로 4m 이상입니다 — 너비 요건 충족(제2조 제1항 제11호).");
      } else {
        unresolved = true;
        findings.push("길의 너비가 " + width + "m로 <b>4m에 못 미칩니다</b>. " +
          "원칙적으로 건축법상 도로에 해당하지 않습니다(제2조 제1항 제11호).");
        next.push("건축법 시행령 제3조의3의 예외(지형 조건상 부득이한 경우, 막다른 도로)에 " +
          "해당하는지 확인하십시오. 예외 너비는 <b>2m / 3m / 6m</b>이고, " +
          "읍·면 지역은 4m입니다.");
        next.push("예외에 해당해 건축이 가능해지더라도, 소요 너비에 못 미치는 도로는 " +
          "중심선에서 <b>1/2 물러난 선이 건축선</b>이 됩니다(제46조 제1항). " +
          "반대쪽이 하천·철도·경사지라면 그쪽 경계선에서 소요 너비만큼 물러납니다. " +
          "실제로 쓸 수 있는 대지가 줄어듭니다.");
      }
    }

    // ── 3) 접한 길이 (제44조 제1항 / 시행령 제28조 제2항)
    var bigThreshold = factory ? 3000 : 2000;
    var isBig = (floor !== null && floor >= bigThreshold);

    if (isBig) {
      findings.push("연면적 " + floor + "㎡는 " + (factory ? "공장 " : "") + bigThreshold +
        "㎡ 이상이므로, <b>너비 6m 도로에 4m 이상</b> 접해야 합니다(시행령 제28조 제2항).");
      if (width !== null && width < 6) {
        blocking = true;
        findings.push("길의 너비 " + width + "m는 6m에 못 미칩니다 — 이 규모로는 요건 미달입니다.");
      }
      if (front !== null && front < 4) {
        blocking = true;
        findings.push("접한 길이 " + front + "m는 4m에 못 미칩니다 — 이 규모로는 요건 미달입니다.");
      } else if (front !== null) {
        findings.push("접한 길이가 " + front + "m로 4m 이상입니다 — 이 규모의 접도 길이 요건 충족.");
      }
      next.push("축사 등 일부 용도는 시행령 제28조 제2항의 적용에서 제외될 수 있고, " +
        "그 범위는 조례로 정해집니다. 해당 여부를 확인하십시오.");
    } else {
      if (front === null) {
        unresolved = true;
        next.push("땅이 길에 접한 길이를 확인해 다시 판정해 보십시오. 2m가 기준입니다(제44조 제1항).");
      } else if (front >= 2) {
        findings.push("접한 길이가 " + front + "m로 2m 이상입니다 — 접도 길이 요건 충족(제44조 제1항).");
      } else {
        blocking = true;
        findings.push("접한 길이가 " + front + "m로 <b>2m에 못 미칩니다</b> — " +
          "접도 요건 미달(제44조 제1항).");
        next.push("제44조 제1항의 단서 3가지(출입에 지장이 없는 경우, 대지가 광장·공원 등 " +
          "공지에 접한 경우, 농막)에 해당하는지 확인하십시오.");
      }
      if (floor === null) {
        next.push("연면적을 넣으면 2,000㎡(공장 3,000㎡) 이상일 때의 가중 요건까지 함께 봅니다.");
      }
    }

    // ── 4) 읍 지역 주의 (제3조 제2항의 적용 제외는 면 지역만)
    if (area === "eup") {
      next.push("읍 지역은 건축법 제3조 제2항의 적용 제외 대상이 <b>아닙니다</b>. " +
        "\"비도시지역이라 접도 규정이 없다\"는 설명은 이 땅에는 해당되지 않습니다.");
    }

    // ── 종합
    if (blocking) {
      render("접도 요건 미달 — 현재 조건으로는 건축허가가 어렵습니다", "bad",
        "아래 항목 중 하나 이상이 건축법 기준에 미달합니다. 조문 단서나 도로 지정으로 " +
        "풀 수 있는 경우가 있으니 '다음에 확인할 것'을 순서대로 확인하십시오.",
        findings, next);
    } else if (unresolved) {
      render("추가 확인이 필요합니다", "warn",
        "기준에 미달한다고 단정할 수는 없지만, 조례나 예외 조항을 확인해야 결론이 나는 " +
        "항목이 있습니다.", findings, next);
    } else {
      next.push("접도 요건은 건축 가능성의 <b>한 가지 조건</b>일 뿐입니다. " +
        "용도지역에서 그 건축물이 허용되는지(토지이음 '행위제한내용'), " +
        "농지·산지라면 전용 절차가 필요한지도 함께 확인하십시오.");
      render("접도 요건 충족 (1차 판정)", "good",
        "입력한 조건만으로는 건축법 제2조 제1항 제11호의 도로 요건과 " +
        "제44조 제1항의 접도 요건을 모두 충족합니다.", findings, next);
    }
  });
})();
