const page = document.body.getAttribute("data-page");

if(page === "stocks") {
    initStocks();
} else if(page === "redgreen") {
    initRedGreen();
} else if(page === "summary") {
    initSummary();
}

// ===== 個股清單 =====
async function initStocks() {
  const res = await fetch("data/latest.json");
  const data = await res.json();

  initTypeFilter(data);

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

function initTypeFilter(data) {
  const types = [...new Set(data.map(d => d.type).filter(Boolean))].sort();
  const select = document.getElementById("typeFilter");
  types.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    select.appendChild(opt);
  });
}

function bindFilters() {
  $.fn.dataTable.ext.search.push(function(settings, rowData) {
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
    if(window.table) table.draw();
  });
}

// ===== 紅綠清單 =====
async function initRedGreen() {
  const res = await fetch("data/latest.json");
  const data = await res.json();

  const redgreenData = data.filter(d => parseFloat(d.spread_per) !== 0); // 範例條件

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

  const totalUp = data.filter(d => parseFloat(d.spread_per) > 0).length;
  const totalDown = data.filter(d => parseFloat(d.spread_per) < 0).length;
  const total = totalUp + totalDown;

  const ctx = document.getElementById('summaryChart').getContext('2d');
  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['上漲', '下跌'],
      datasets: [{
        data: [totalUp, totalDown],
        backgroundColor: ['#FF4136', '#2ECC40']
      }]
    }
  });
}