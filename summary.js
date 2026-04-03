async function loadSummary() {
  const res = await fetch("data/latest.json");
  const data = await res.json();

  const result = calcSummary(data);

  renderSummary(result);
  renderChart(r);
}

function calcSummary(data) {

  let up = 0, down = 0, flat = 0;
  let totalSpread = 0;
  let totalVolume = 0;

  let maxUp = -Infinity;
  let maxDown = Infinity;

  let typeMap = {};

  data.forEach(d => {
    const spread = parseFloat(d.spread) || 0;
    const spreadPer = parseFloat(d.spread_per) || 0;
    const volume = parseFloat(d.trade_shares) || 0;

    // 漲跌
    if (spread > 0) up++;
    else if (spread < 0) down++;
    else flat++;

    // 漲幅
    totalSpread += spreadPer;

    // 成交量
    totalVolume += volume;

    // 最大值
    if (spreadPer > maxUp) maxUp = spreadPer;
    if (spreadPer < maxDown) maxDown = spreadPer;

    // 類別統計
    if (d.type) {
      typeMap[d.type] = (typeMap[d.type] || 0) + 1;
    }
  });

  return {
    total: data.length,
    up,
    down,
    flat,
    upRatio: (up / data.length * 100).toFixed(1),
    avgSpread: (totalSpread / data.length).toFixed(2),
    totalVolume,
    maxUp,
    maxDown,
    typeMap
  };
}

function renderSummary(r) {
  document.getElementById("summary").innerHTML = `
    <p>總股票數: ${r.total}</p>
    <p>上漲: ${r.up} (${r.upRatio}%)</p>
    <p>下跌: ${r.down}</p>
    <p>平盤: ${r.flat}</p>
    <p>平均漲幅: ${r.avgSpread}%</p>
    <p>最大漲幅: ${r.maxUp}%</p>
    <p>最大跌幅: ${r.maxDown}%</p>
    <p>總成交量: ${r.totalVolume.toLocaleString()}</p>
  `;

  renderTypeTable(r.typeMap);
}

function renderTypeTable(typeMap) {
  let html = "<h3>類股分布</h3><ul>";

  Object.entries(typeMap)
    .sort((a,b) => b[1] - a[1])
    .forEach(([type, count]) => {
      html += `<li>${type}: ${count}</li>`;
    });

  html += "</ul>";

  document.getElementById("types").innerHTML = html;
}

function renderChart(r) {

  const ctx = document.getElementById('pieChart');

  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['上漲', '下跌', '平盤'],
      datasets: [{
        data: [r.up, r.down, r.flat],
        backgroundColor: [
          '#e74c3c',  // 紅（上漲）
          '#2ecc71',  // 綠（下跌）
          '#95a5a6'   // 灰（平盤）
        ]
      }]
    },
    options: {
      plugins: {
        legend: {
          labels: {
            color: '#eee' // 深色背景用
          }
        }
      }
    }
  });
}
loadSummary();