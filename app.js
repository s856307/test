// 取得當前頁面
const page = document.body.getAttribute("data-page");

// 根據頁面初始化對應功能
if (page === "stocks") {
    initStocks();
} else if (page === "redgreen") {
    initRedGreen();
} else if (page === "summary") {
    initSummary();
}

// ===== 個股清單 =====
async function initStocks() {
    const res = await fetch("data/latest.json");
    const data = await res.json();

    initTypeFilter(data);

    const tableElem = document.getElementById('stockTable');
    if (!tableElem) return;

    window.table = $('#stockTable').DataTable({
        data: data,
        columns: [
            { data: 'id' }, { data: 'name' }, { data: 'type' },
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
    const res = await fetch("data/latest.json");
    const data = await res.json();

    const redgreenData = data.filter(d => {
        const s = d.spread_summary || '';
        return s.endsWith('--');
    });

    const tableElem = document.getElementById('stockTable');
    if (!tableElem) return;

    $('#stockTable').DataTable({
        data: redgreenData,
        columns: [
            { data: 'id' }, { data: 'name' }, { data: 'type' },
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
}

/*
// ===== 總結頁 =====
async function initSummary() {
    const res = await fetch("data/latest.json");
    const data = await res.json();

    const summaryGrid = document.getElementById('summaryGrid');
    if (!summaryGrid) return;

    // 1️⃣ 全部台股總覽
    createPieCard(summaryGrid, '總覽', data);

    // 2️⃣ 按產業分類
    const types = [...new Set(data.map(d => d.type).filter(Boolean))].sort();

    types.forEach(type => {
        const typeData = data.filter(d => d.type === type);
        createPieCard(summaryGrid, type, typeData);
    });
}

// 建立單個卡片 + 圓餅圖
function createPieCard(container, title, data) {
    const card = document.createElement('div');
    card.className = 'summary-card';

    const h3 = document.createElement('h3');
    h3.textContent = title;
    card.appendChild(h3);

    const canvas = document.createElement('canvas');
    card.appendChild(canvas);

    container.appendChild(card);

    // 計算漲跌數量
    let up = 0, down = 0;
    data.forEach(d => {
        const spread = parseFloat(d.spread_per) || 0;
        if (spread > 0) up++;
        else if (spread < 0) down++;
    });

    new Chart(canvas.getContext('2d'), {
        type: 'pie',
        data: {
            labels: ['上漲', '下跌'],
            datasets: [{
                data: [up, down],
                backgroundColor: ['#FF4136','#2ECC40']
            }]
        },
        options: {
            plugins: {
                legend: { display: false } // 可以自己選擇要不要顯示圖例
            }
        }
    });
}
*/
// ===================== 股票清單 / 紅綠篩選功能保持不變 =====================

// 你的原本 init(), bindFilters(), initRedGreen() 之類的功能保持
// 這裡只示範 summary 新增部分

// ===================== summary 功能 =====================
async function initSummary() {
    const summaryGrid = document.getElementById('summaryGrid');
    if (!summaryGrid) return;

    // ===== 1️⃣ 讀 latest.json =====
    const res = await fetch('data/latest.json');
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