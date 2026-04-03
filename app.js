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