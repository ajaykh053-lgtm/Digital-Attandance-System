// ============================================
// CHARTS.JS — Canvas-based charts
// ============================================

function drawBarChart(canvasId, labels, values, colors) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = (canvas.parentElement.style.height ? parseInt(canvas.parentElement.style.height) : 260) * dpr;
  canvas.style.width = rect.width + 'px';
  canvas.style.height = (canvas.parentElement.style.height || '260px');
  ctx.scale(dpr, dpr);
  const W = rect.width, H = parseInt(canvas.parentElement.style.height) || 260;
  const pad = { top: 20, right: 20, bottom: 44, left: 44 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;
  const maxVal = 100;
  const barW = Math.max(20, (chartW / labels.length) * 0.55);
  const barGap = chartW / labels.length;

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  [0, 25, 50, 75, 100].forEach(v => {
    const y = pad.top + chartH - (v / maxVal) * chartH;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + chartW, y); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText(v + '%', pad.left - 36, y + 4);
  });

  // Animate bars
  let progress = 0;
  const animate = () => {
    ctx.clearRect(0, 0, W, H);
    // Re-draw grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
    [0, 25, 50, 75, 100].forEach(v => {
      const y = pad.top + chartH - (v / maxVal) * chartH;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + chartW, y); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(v + '%', pad.left - 6, y + 4);
    });

    // 75% line
    const line75 = pad.top + chartH - (75 / maxVal) * chartH;
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(239,35,60,0.4)';
    ctx.beginPath(); ctx.moveTo(pad.left, line75); ctx.lineTo(pad.left + chartW, line75); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(239,35,60,0.6)';
    ctx.textAlign = 'left';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText('75% min', pad.left + 4, line75 - 4);

    // Bars
    values.forEach((val, i) => {
      const x = pad.left + i * barGap + (barGap - barW) / 2;
      const barH = (Math.min(val, maxVal) / maxVal) * chartH * Math.min(progress, 1);
      const y = pad.top + chartH - barH;

      // Gradient fill
      const grad = ctx.createLinearGradient(x, y, x, pad.top + chartH);
      const base = colors ? colors[i] : '#4361ee';
      grad.addColorStop(0, base);
      grad.addColorStop(1, base + '44');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, [6, 6, 0, 0]);
      ctx.fill();

      // Value label
      if (progress >= 1) {
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(val + '%', x + barW / 2, y - 8);
      }

      // X label
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(labels[i], x + barW / 2, pad.top + chartH + 18);
    });

    progress += 0.04;
    if (progress < 1.05) requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);
}

function drawLineChart(canvasId, labels, datasets) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  const H_val = parseInt(canvas.parentElement.style.height) || 240;
  canvas.width = rect.width * dpr;
  canvas.height = H_val * dpr;
  canvas.style.width = rect.width + 'px';
  canvas.style.height = H_val + 'px';
  ctx.scale(dpr, dpr);
  const W = rect.width, H = H_val;
  const pad = { top: 20, right: 20, bottom: 44, left: 44 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;
  const maxVal = 100;

  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
  [0, 25, 50, 75, 100].forEach(v => {
    const y = pad.top + chartH - (v / maxVal) * chartH;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + chartW, y); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '11px Inter, sans-serif'; ctx.textAlign = 'right';
    ctx.fillText(v + '%', pad.left - 6, y + 4);
  });

  // X labels
  labels.forEach((lbl, i) => {
    const x = pad.left + (i / (labels.length - 1)) * chartW;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '11px Inter, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(lbl, x, pad.top + chartH + 18);
  });

  let progress = 0;
  const drawDataset = (ds) => {
    const pts = ds.values.map((v, i) => ({
      x: pad.left + (i / (labels.length - 1)) * chartW,
      y: pad.top + chartH - (v / maxVal) * chartH
    }));
    const endIdx = Math.min(Math.floor(progress * (pts.length - 1)) + 1, pts.length);
    if (endIdx < 2) return;

    // Area fill
    const areaGrad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
    areaGrad.addColorStop(0, ds.color + '33');
    areaGrad.addColorStop(1, ds.color + '00');
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pad.top + chartH);
    pts.slice(0, endIdx).forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(pts[endIdx - 1].x, pad.top + chartH);
    ctx.closePath();
    ctx.fillStyle = areaGrad; ctx.fill();

    // Line
    ctx.beginPath();
    pts.slice(0, endIdx).forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = ds.color; ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round'; ctx.stroke();

    // Dots
    if (progress >= 1) {
      pts.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = ds.color; ctx.fill();
        ctx.strokeStyle = '#050816'; ctx.lineWidth = 2; ctx.stroke();
      });
    }
  };

  const animate = () => {
    ctx.clearRect(0, 0, W, H);
    // Re-draw grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
    [0, 25, 50, 75, 100].forEach(v => {
      const y = pad.top + chartH - (v / maxVal) * chartH;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + chartW, y); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '11px Inter,sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(v + '%', pad.left - 6, y + 4);
    });
    labels.forEach((lbl, i) => {
      const x = pad.left + (i / (labels.length - 1)) * chartW;
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '11px Inter,sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(lbl, x, pad.top + chartH + 18);
    });
    datasets.forEach(drawDataset);
    progress += 0.035;
    if (progress < 1.05) requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);
}

function drawDonutChart(canvasId, labels, values, colors) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const size = parseInt(canvas.getAttribute('width') || 200);
  canvas.width = size * dpr; canvas.height = size * dpr;
  canvas.style.width = size + 'px'; canvas.style.height = size + 'px';
  ctx.scale(dpr, dpr);
  const cx = size / 2, cy = size / 2, r = size * 0.38, r2 = size * 0.22;
  const total = values.reduce((a, b) => a + b, 0);
  let start = -Math.PI / 2, progress = 0;

  const animate = () => {
    ctx.clearRect(0, 0, size, size);
    let s = -Math.PI / 2;
    values.forEach((v, i) => {
      const slice = (v / total) * 2 * Math.PI * Math.min(progress, 1);
      ctx.beginPath();
      ctx.arc(cx, cy, r, s, s + slice);
      ctx.arc(cx, cy, r2, s + slice, s, true);
      ctx.closePath();
      ctx.fillStyle = colors[i];
      ctx.fill();
      s += slice;
    });
    // Center text
    if (progress >= 1) {
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.font = `bold ${size * 0.12}px Orbitron,sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(total, cx, cy - size * 0.06);
      ctx.font = `${size * 0.07}px Inter,sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillText('Total', cx, cy + size * 0.08);
    }
    progress += 0.04;
    if (progress < 1.05) requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);
}
