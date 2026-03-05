// Prototype B: Living Terrain
// - Temperature-driven animation energy (Open-Meteo API)
// - Gradient fills under hills
// - Time-of-day color shifting (Santa Clara / Pacific Time)
// - Night mode (dark theme after 10pm)
(function() {
  var canvas = document.getElementById('terrain');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var W, H, mx = 0.5, my = 0.5, scrollY = 0;

  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);
  document.addEventListener('mousemove', function(e) { mx = e.clientX / W; my = e.clientY / H; });
  window.addEventListener('scroll', function() { scrollY = window.scrollY; });

  // --- Color system ---
  // Time stops in Santa Clara (Pacific Time)
  // [hour, R, G, B]
  var colorStops = [
    [0,  90, 60, 160],    // midnight — dim purple
    [6,  104, 193, 195],  // 6am — teal #68C1C3
    [10, 104, 193, 195],  // 10am — still teal
    [14, 184, 137, 46],   // 2pm — gold #B8892E
    [18, 184, 137, 46],   // 6pm — still gold
    [20, 193, 111, 247],  // 8pm — purple #C16FF7
    [22, 120, 70, 180],   // 10pm — dim purple (night)
    [24, 90, 60, 160]     // midnight wrap
  ];

  function getSantaClaraHour() {
    // Get current time in America/Los_Angeles
    var now = new Date();
    var sc = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    return sc.getHours() + sc.getMinutes() / 60;
  }

  function lerpColor(h) {
    // Find the two stops we're between
    for (var i = 0; i < colorStops.length - 1; i++) {
      var a = colorStops[i], b = colorStops[i + 1];
      if (h >= a[0] && h < b[0]) {
        var t = (h - a[0]) / (b[0] - a[0]);
        return [
          Math.round(a[1] + (b[1] - a[1]) * t),
          Math.round(a[2] + (b[2] - a[2]) * t),
          Math.round(a[3] + (b[3] - a[3]) * t)
        ];
      }
    }
    return [184, 137, 46]; // fallback gold
  }

  function isNight(h) { return h >= 22 || h < 6; }

  var currentColor = [184, 137, 46];
  var nightMode = false;

  function updateTimeColor() {
    var h = getSantaClaraHour();
    currentColor = lerpColor(h);
    var wasNight = nightMode;
    nightMode = isNight(h);

    // Update CSS accent
    var hex = '#' + currentColor.map(function(c) { return ('0' + c.toString(16)).slice(-2); }).join('');
    document.documentElement.style.setProperty('--accent', hex);

    // Night mode — toggle dark theme
    if (nightMode && !wasNight) {
      document.documentElement.style.setProperty('--bg', '#111111');
      document.documentElement.style.setProperty('--surface', '#1a1a1a');
      document.documentElement.style.setProperty('--text', '#e8e8e8');
      document.documentElement.style.setProperty('--text-sec', '#999');
      document.documentElement.style.setProperty('--text-dim', '#666');
      document.documentElement.style.setProperty('--border', 'rgba(255,255,255,0.08)');
      document.body.style.background = '#111111';
      document.body.style.color = '#e8e8e8';
    } else if (!nightMode && wasNight) {
      document.documentElement.style.setProperty('--bg', '#fafafa');
      document.documentElement.style.setProperty('--surface', '#ffffff');
      document.documentElement.style.setProperty('--text', '#1a1a1a');
      document.documentElement.style.setProperty('--text-sec', '#555');
      document.documentElement.style.setProperty('--text-dim', '#999');
      document.documentElement.style.setProperty('--border', 'rgba(0,0,0,0.08)');
      document.body.style.background = '#fafafa';
      document.body.style.color = '#1a1a1a';
    }
  }

  // Initial color + update every 60s
  updateTimeColor();
  setInterval(updateTimeColor, 60000);

  // --- Temperature-driven energy ---
  var animSpeed = 0.008;  // default medium
  var animAmp = 0.07;     // default medium

  function fetchTemperature() {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=37.3541&longitude=-121.9552&current_weather=true')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        var temp = data.current_weather.temperature; // Celsius
        // Map temp to energy: cold=slow, hot=fast
        var t = Math.max(0, Math.min(1, (temp - 5) / 35)); // 5°C=0, 40°C=1
        animSpeed = 0.003 + t * 0.012;   // 0.003 (cold) to 0.015 (hot)
        animAmp = 0.04 + t * 0.08;       // 0.04 (cold) to 0.12 (hot)
      })
      .catch(function() { /* keep defaults */ });
  }
  fetchTemperature();

  // --- Drawing ---
  var LINES = 18;
  var POINTS = 80;
  var t = 0;

  function getHeight(x, i) {
    var base = 0.25 + i * 0.038;
    var h = base
      + Math.sin(x * (1.2 + i * 0.25) + t * 0.4 + i * 0.7) * animAmp
      + Math.sin(x * (2.5 + i * 0.15) + t * 0.25) * (animAmp * 0.5)
      + Math.sin(x * 0.6 + i * 0.4) * 0.1;
    // Mouse ripple
    var dx = x - mx, dy = base - my;
    var dist = Math.sqrt(dx * dx + dy * dy);
    h += Math.max(0, 1 - dist / 0.25) * 0.05 * Math.sin(dist * 25 - t * 4);
    return h;
  }

  function draw() {
    t += animSpeed;
    ctx.clearRect(0, 0, W, H);
    var yOff = scrollY * 0.2;
    var r = currentColor[0], g = currentColor[1], b = currentColor[2];

    for (var i = 0; i < LINES; i++) {
      var lineAlpha = 0.1 + (i / LINES) * 0.25;
      var fillAlpha = 0.06 + (i / LINES) * 0.15;
      var thick = 0.8 + (i / LINES) * 1.2;

      // Build the path points
      var pts = [];
      for (var j = 0; j <= POINTS; j++) {
        var x = j / POINTS;
        var h = getHeight(x, i);
        pts.push({ x: x * W, y: h * H - yOff });
      }

      // Draw gradient fill under the hill
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (var j = 1; j < pts.length; j++) ctx.lineTo(pts[j].x, pts[j].y);
      ctx.lineTo(W, H);
      ctx.lineTo(0, H);
      ctx.closePath();

      // Gradient: concentrated near ridge, fades quickly
      var minY = H;
      for (var j = 0; j < pts.length; j++) { if (pts[j].y < minY) minY = pts[j].y; }
      var grad = ctx.createLinearGradient(0, minY, 0, minY + H * 0.25);
      grad.addColorStop(0, 'rgba(' + r + ',' + g + ',' + b + ',' + fillAlpha + ')');
      grad.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)');
      ctx.fillStyle = grad;
      ctx.fill();

      // Draw the contour line on top
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (var j = 1; j < pts.length; j++) ctx.lineTo(pts[j].x, pts[j].y);
      ctx.strokeStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + lineAlpha + ')';
      ctx.lineWidth = thick;
      ctx.stroke();
    }

    requestAnimationFrame(draw);
  }

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) { draw(); }
  else {
    // Static single frame
    t = 0; draw();
  }
})();
