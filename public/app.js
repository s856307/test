let table;

async function init() {
  const res = await fetch("data/latest.json");
  const data = await res.json();

  initTypeFilter(data);

  table = $('#stockTable').DataTable({
    data: data,
    columns: [
      { data: 'id' },
      { data: 'name' },
      { data: 'type' },
      { data: 'close_price' },
      { data: 'spread' },
      { data: 'spread_per' },
      { data: 'spread_summary' },
      { data: 'spread_summary_5days' },
      { data: 'limit_up_20days' },
      { data: 'trade_shares' },
      { data: 'turnover_rate' },
      { data: 'ma5' },
      { data: 'ma10' },
      { data: 'ma20' },
      { data: 'foreign_shares' },
      { data: 'foreign_summary' },
      { data: 'invest_shares' },
      { data: 'dealer_shares' },
      { data: 'dayer_shares' },
      { data: 'dayer_ratio' }
    ],
    order: [[5, 'desc']], // 預設依漲幅排序
    pageLength: 50
  });

  bindFilters();
}

function initTypeFilter(data) {
  const types = [...new Set(data.map(d => d.type).filter(Boolean))];
  const select = document.getElementById("typeFilter");

  types.sort();

  types.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    select.appendChild(opt);
  });
}

function bindFilters() {

  $.fn.dataTable.ext.search.push(function(settings, rowData) {

    // rowData 是 array（不是 object）
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

  // 所有 input 變動 → redraw
  $('input').on('keyup change', function () {
    table.draw();
  });

  $('#typeFilter').on('change', function () {
    table.draw();
  });
}

init();