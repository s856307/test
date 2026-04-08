// 取得當前頁面
const page = document.body.getAttribute("data-page");

// 根據頁面初始化對應功能
if (page === "stocks") {
    initStocks();
} else if (page === "redgreen") {
    initRedGreen();
} else if (page === "summary") {
    initSummary();
} else if (page === "weekly") {
    initWeeklyPage();
}

// ===== 個股清單 =====
async function initStocks() {
    const res = await fetch("data/daily/latest.json");
    const data = await res.json();

    initTypeFilter(data);

    const tableElem = document.getElementById('stockTable');
    if (!tableElem) return;

    window.table = $('#stockTable').DataTable({
        data: data,
        columns: [
            { data: 'id' }, 
			{
				data: 'name',
				render: function (data, type, row) {
					const stockId = row.id;
					const url = `https://tw.stock.yahoo.com/quote/${stockId}.TW`;

					return `<a href="${url}" target="_blank">${data}</a>`;
				}
			}, 
			{ data: 'type' },
            { data: 'close_price' }, { data: 'spread' }, { data: 'spread_per' },
            { data: 'spread_summary' }, { data: 'spread_summary_5days' },
            { data: 'limit_up_20days' }, { data: 'trade_shares' }, { data: 'turnover_rate' },
            { data: 'ma5' }, { data: 'ma10' }, { data: 'ma20' },
            { data: 'foreign_shares' }, { data: 'foreign_summary' },
            { data: 'invest_shares' }, { data: 'dealer_shares' },
            { data: 'dayer_shares' }, { data: 'dayer_ratio' }
        ],
        order: [[5, 'desc']],
        pageLength: 50
    });

    bindFilters();
}

// ===== 初始化類別篩選器 =====
function initTypeFilter(data) {
    const select = document.getElementById("typeFilter");
    if (!select) return; // 安全檢查

    const types = [...new Set(data.map(d => d.type).filter(Boolean))].sort();
    types.forEach(t => {
        const opt = document.createElement("option");
        opt.value = t;
        opt.textContent = t;
        select.appendChild(opt);
    });
}

// ===== 綁定篩選器事件 =====
function bindFilters() {
    if (!window.table) return;

    $.fn.dataTable.ext.search.push(function (settings, rowData) {
        let price = parseFloat(rowData[3]) || 0;
        let spread = parseFloat(rowData[5]) || 0;
        let volume = parseFloat(rowData[9]) || 0;
        let turnover = parseFloat(rowData[10]) || 0;
        let type = rowData[2];

        let minPrice = parseFloat($('#minPrice').val()) || 0;
        let maxPrice = parseFloat($('#maxPrice').val()) || Infinity;
        let minSpread = parseFloat($('#minSpread').val()) || -Infinity;
        let minVolume = parseFloat($('#minVolume').val()) || 0;
        let minTurnover = parseFloat($('#minTurnover').val()) || 0;
        let selectedType = $('#typeFilter').val();

        return (
            price >= minPrice &&
            price <= maxPrice &&
            spread >= minSpread &&
            volume >= minVolume &&
            turnover >= minTurnover &&
            (!selectedType || type === selectedType)
        );
    });

    $('input, select').on('keyup change', function () {
        if (window.table) table.draw();
    });
}

// ===== 紅綠清單 =====
async function initRedGreen() {
    const res = await fetch("data/daily/latest.json");
    const data = await res.json();

    const redgreenData = data.filter(d => {
        const s = d.spread_summary || '';
        return s.endsWith('--');
    });

    const tableElem = document.getElementById('stockTable');
    if (!tableElem) return;

    window.table = $('#stockTable').DataTable({
        data: redgreenData,
        columns: [
            { data: 'id' },
			{
				data: 'name',
				render: function (data, type, row) {
					const stockId = row.id;
					const url = `https://tw.stock.yahoo.com/quote/${stockId}.TW`;

					return `<a href="${url}" target="_blank">${data}</a>`;
				}
			}, 
			{ data: 'type' },
            { data: 'close_price' }, { data: 'spread' }, { data: 'spread_per' },
            { data: 'spread_summary' }, { data: 'spread_summary_5days' },
            { data: 'limit_up_20days' }, { data: 'trade_shares' }, { data: 'turnover_rate' },
            { data: 'ma5' }, { data: 'ma10' }, { data: 'ma20' },
            { data: 'foreign_shares' }, { data: 'foreign_summary' },
            { data: 'invest_shares' }, { data: 'dealer_shares' },
            { data: 'dayer_shares' }, { data: 'dayer_ratio' }
        ],
        pageLength: 50
    });
	initTypeFilter(redgreenData);
	bindFilters();
}

// ===================== summary 功能 =====================
async function initSummary() {
    const summaryGrid = document.getElementById('summaryGrid');
    if (!summaryGrid) return;

    // ===== 1️⃣ 讀 latest.json =====
    const res = await fetch('data/daily/latest.json');
    const data = await res.json();

    const industryMap = {};
    let totalTradeAmt = 0;

    data.forEach(s => {
        const industry = s.type || '其他';

        const close = parseFloat(s.close_price) || 0;
        const volume = parseFloat(s.trade_shares) || 0;
        const tradeAmt = close * volume;

        const spread = parseFloat(s.spread) || 0;
        const up = spread > 0 ? 1 : 0;
        const down = spread < 0 ? 1 : 0;

        if (!industryMap[industry]) {
            industryMap[industry] = {
                up: 0,
                down: 0,
                tradeAmt: 0
            };
        }

        industryMap[industry].up += up;
        industryMap[industry].down += down;
        industryMap[industry].tradeAmt += tradeAmt;

        totalTradeAmt += tradeAmt;
    });

    // ===== 2️⃣ 總覽 =====
    const totalUp = Object.values(industryMap).reduce((a,b)=>a+b.up,0);
    const totalDown = Object.values(industryMap).reduce((a,b)=>a+b.down,0);

    createSummaryCard(summaryGrid, '總覽', totalUp, totalDown, 100);

    // ===== 3️⃣ 整理 + 排序 =====
    const industryList = Object.entries(industryMap).map(([industry, info]) => {

        const tradePct = (info.tradeAmt / totalTradeAmt) * 100;

        return {
            industry,
            up: info.up,
            down: info.down,
            tradePct
        };
    });

    // 👉 依成交占比排序（大 → 小）
    industryList.sort((a, b) => b.tradePct - a.tradePct);

    // ===== 4️⃣ render =====
    industryList.forEach(d => {
        createSummaryCard(
            summaryGrid,
            d.industry,
            d.up,
            d.down,
            d.tradePct.toFixed(1)
        );
    });
}

// 建立單個 summary 卡片
function createSummaryCard(container, title, upCount, downCount, tradePct) {

    const card = document.createElement('div');
    card.className = 'summary-card';

    // 左上
    const h3 = document.createElement('h3');
    h3.textContent = title;
    card.appendChild(h3);

    // 右上（只留成交占比）
    const small = document.createElement('small');
    small.textContent = `成交金額占比:${tradePct}%`;
    card.appendChild(small);

    // 圓餅圖
    const canvas = document.createElement('canvas');
    card.appendChild(canvas);
    container.appendChild(card);

    new Chart(canvas.getContext('2d'), {
        type: 'pie',
        data: {
            labels: ['上漲家數', '下跌家數'],
            datasets: [{
                data: [upCount, downCount],
                backgroundColor: ['#FF4136', '#2ECC40']
            }]
        },
        options: {
            plugins: { legend: { display: false } }
        }
    });
	
}
async function loadLatestDate() {
  try {
    const res = await fetch('/data/daily/latest.json');
    const data = await res.json();

    if (!data || data.length === 0) return;

    const dateStr = data[0].date;
    const date = new Date(dateStr);

    const formatted =
      String(date.getMonth() + 1).padStart(2, '0') + "/" +
      String(date.getDate()).padStart(2, '0');

    document.getElementById("latest-date").innerText =
      `資料更新至：${formatted}`;
  } catch (err) {
    console.error("讀取最新日期失敗", err);
  }
}

// ===== 載入 weekly =====
async function initWeeklyPage() {
  try {
    const res = await fetch('data/weekly/latest.json');
    const data = await res.json();

    const tableData = data.map(stock => {
      const latest = stock.latest || {};

      return [
        `<a href="https://tw.stock.yahoo.com/quote/${stock._id}.TW" target="_blank">
          ${stock._id} ${stock.name}
        </a>`,
        stock.type || "",
        (latest.big_ratio || 0).toFixed(2),
        `<span class="${color(stock.delta_big_ratio)}">${(stock.delta_big_ratio || 0).toFixed(2)}</span>`,
        `<span class="${color(stock.delta_mid_ratio, true)}">${(stock.delta_mid_ratio || 0).toFixed(2)}</span>`,
        `<span class="${color(stock.delta_ultra_total)}">${formatNumber(stock.delta_ultra_total || 0)}</span>`,
        `<span class="${color(stock.shift)}">${(stock.shift || 0).toFixed(2)}</span>`,
        (stock.score || 0).toFixed(2),
        stock // 👉 保留原始資料（給展開用）
      ];
    });

    const table = $('#weekly-table').DataTable({
      data: tableData,

      columns: [
        { title: "股票" },
        { title: "產業" },
        { title: "大戶持股比" },
        { title: "Δ大戶" },
        { title: "Δ中戶" },
        { title: "超大戶" },
        { title: "籌碼上移" },
        { title: "分數" },
        { title: "data", visible: false } // 隱藏原始資料
      ],

      order: [[7, "desc"]], // 預設用 score 排序

      pageLength: 50
    });

    // 👉 點擊展開
    $('#weekly-table tbody').on('click', 'tr', function () {

      const row = table.row(this);
      const rowData = row.data();

      const stock = rowData[8]; // 最後一欄

      if (row.child.isShown()) {
        row.child.hide();
        $(this).removeClass('shown');
      } else {

        const detailHtml = `
          <div class="detail-box">
            ${stock.data.map(w => `
              <div class="detail-item">
                ${formatDate(w.date)} :
                <span class="${color(w.delta_big)}">
                  ${w.delta_big.toFixed(2)}
                </span>
              </div>
            `).join("")}
          </div>
        `;

        row.child(detailHtml).show();
        $(this).addClass('shown');
      }

    });

  } catch (e) {
    console.error("weekly load error", e);
  }
}

// ===== 展開 10週資料 =====
function toggleDetail(tr, stock) {

  // 如果已經展開 → 收起
  if (tr.nextSibling && tr.nextSibling.classList.contains("detail-row")) {
    tr.nextSibling.remove();
    return;
  }

  const detail = document.createElement("tr");
  detail.className = "detail-row";

  detail.innerHTML = `
    <td colspan="8">
      <div class="detail-box">
        ${stock.data.map(w => `
          <div class="detail-item">
            <span>${formatDate(w.date)}</span>
            <span class="${color(w.delta_big)}">
              ${w.delta_big.toFixed(2)}
            </span>
          </div>
        `).join("")}
      </div>
    </td>
  `;

  tr.after(detail);
}

// ===== 顏色（台股：紅漲綠跌）=====
function color(val, reverse=false) {
  if (reverse) val = -val;

  if (val > 0) return "red";
  if (val < 0) return "green";
  return "";
}

// ===== 日期格式 =====
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getMonth()+1}/${d.getDate()}`;
}

// ===== 數字格式 =====
function formatNumber(num) {
  return num.toLocaleString();
}

async function loadNavbar() {
  try {
    const el = document.getElementById("navbar");
    if (!el) return;

    const res = await fetch("navbar.html");
    const html = await res.text();

    el.innerHTML = html;

    highlightActiveTab(); // ✅ 載入後才執行

  } catch (e) {
    console.error("navbar load error", e);
  }
}

function highlightActiveTab() {
  const links = document.querySelectorAll(".tab-link");

  const currentPage = document.body.getAttribute("data-page") + ".html";

  links.forEach(link => {
    if (link.getAttribute("href") === currentPage) {
      link.classList.add("active");
    }
  });
}

// ✅ 這段一定要有
document.addEventListener("DOMContentLoaded", () => {
  loadNavbar();
  loadLatestDate();
});