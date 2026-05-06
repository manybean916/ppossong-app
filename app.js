// ─────────────────────────────────────────────
//  뽀송퇴근 — app.js
//  기상청 API 키를 받으면 KMA_API_KEY에 입력하세요.
// ─────────────────────────────────────────────

const KMA_API_KEY = ''; // ← 기상청 API 키 입력
const STATION_ID  = ''; // ← 관측소 ID (예: 108 = 서울)

let hasDryer = null;
let humidity = null;

// ── 기상청 API 호출 ────────────────────────────
async function fetchHumidity() {
  if (!KMA_API_KEY) {
    // API 키 없을 때 mock 데이터 사용
    applyHumidity(65);
    return;
  }
  try {
    const now    = new Date();
    const date   = now.toISOString().slice(0,10).replace(/-/g,'');
    const hour   = String(now.getHours()).padStart(2,'0') + '00';
    const url    = `https://apis.data.go.kr/1360000/AsosHourlyInfoService/getWthrDataList`
                 + `?serviceKey=${KMA_API_KEY}&numOfRows=1&pageNo=1`
                 + `&dataCd=ASOS&dateCd=HR&startDt=${date}&startHh=${hour}`
                 + `&endDt=${date}&endHh=${hour}&stnIds=${STATION_ID}&dataType=JSON`;
    const res    = await fetch(url);
    const json   = await res.json();
    const item   = json?.response?.body?.items?.item?.[0];
    const hm     = item?.hm ?? item?.humidity;
    if (hm !== undefined) applyHumidity(Number(hm));
    else throw new Error('습도 데이터 없음');
  } catch (e) {
    console.warn('기상청 API 오류, mock 사용:', e.message);
    applyHumidity(65);
  }
}

// ── 습도 UI 반영 ───────────────────────────────
function applyHumidity(h) {
  humidity = h;

  document.getElementById('humidityNum').innerHTML = h + '<span>%</span>';
  document.getElementById('humidityBar').style.width = Math.min(h, 100) + '%';

  if (h >= 70) {
    document.getElementById('page').classList.add('damp');
    document.getElementById('statusBadge').className = 'status-badge nope';
    document.getElementById('statusIcon').textContent  = '🚫';
    document.getElementById('statusText').textContent  = '절대 금지, 쉰내 납니다';
    document.getElementById('humidityDesc').textContent = '눅눅한 상태 · 세탁 비권장';
  } else {
    document.getElementById('page').classList.remove('damp');
    document.getElementById('statusBadge').className = 'status-badge ok';
    document.getElementById('statusIcon').textContent  = '✅';
    document.getElementById('statusText').textContent  = '오늘 퇴근 후 빨래해도 돼요!';
    document.getElementById('humidityDesc').textContent = '쾌적한 상태 · 세탁 적합';
  }

  updateDryerResult();
}

// ── 건조기 토글 ────────────────────────────────
function setDryer(has) {
  hasDryer = has;
  document.getElementById('btnYes').className = 'toggle-btn' + (has  ? ' active-yes' : '');
  document.getElementById('btnNo').className  = 'toggle-btn' + (!has ? ' active-no'  : '');
  updateDryerResult();
}

function updateDryerResult() {
  if (hasDryer === null || humidity === null) return;
  const el = document.getElementById('dryerResult');
  el.classList.add('visible');

  if      ( hasDryer && humidity >= 70) el.textContent = '🌀 건조기가 있으시군요! 습도가 높아도 건조기로 완전 건조 가능해요.';
  else if ( hasDryer && humidity <  70) el.textContent = '✨ 건조기 + 쾌적한 날씨 조합! 오늘은 특히 뽀송뽀송하게 건조될 거예요.';
  else if (!hasDryer && humidity >= 70) el.textContent = '⚠️ 건조기도 없고 습도도 높아요. 오늘은 세탁을 미루세요. 쉰내 주의!';
  else                                  el.textContent = '👍 건조기 없어도 괜찮아요! 오늘 날씨에 자연 건조하면 충분해요.';
}

// ── 시작 ──────────────────────────────────────
fetchHumidity();
