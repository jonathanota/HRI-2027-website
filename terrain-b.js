// ============================================================
// TERRAIN CONFIG — EDIT THESE VALUES TO TUNE THE ANIMATION
// ============================================================
var CONFIG = {

  // --- TERRAIN BASICS ---
  LINES: 18,              // number of hill lines
  POINTS: 100,            // sample points per line (higher = smoother)
  BASE_START: 0.15,       // y-position of first line (0=top, 1=bottom)
  LINE_SPACING: 0.045,    // vertical gap between lines
  SCROLL_PARALLAX: 0.2,   // how much terrain shifts on scroll

  // --- WAVE ANIMATION ---
  DEFAULT_SPEED: 0.008,   // base animation speed (overridden by temperature)
  DEFAULT_AMP: 0.12,      // base wave amplitude (overridden by temperature)
  WAVE1_FREQ_BASE: 1.2,   // primary wave frequency base
  WAVE1_FREQ_PER_LINE: 0.25, // frequency increase per line
  WAVE1_SPEED: 0.4,       // primary wave time multiplier
  WAVE2_FREQ_BASE: 2.5,   // secondary wave frequency base
  WAVE2_FREQ_PER_LINE: 0.15,
  WAVE2_SPEED: 0.25,
  WAVE2_AMP_RATIO: 0.6,   // secondary wave amplitude as ratio of primary
  WAVE3_FREQ: 0.6,        // static undulation frequency
  WAVE3_AMP: 0.15,        // static undulation amplitude

  // --- MOUSE RIPPLE ---
  RIPPLE_RADIUS: 0.15,    // how far the mouse ripple reaches (0-1)
  RIPPLE_STRENGTH: 0.025,  // ripple amplitude
  RIPPLE_FREQ: 20,        // ripple wave frequency
  RIPPLE_SPEED: 2,        // ripple animation speed

  // --- LINE APPEARANCE ---
  LINE_ALPHA_MIN: 0.1,    // opacity of first line
  LINE_ALPHA_RANGE: 0.25, // opacity added across all lines
  FILL_ALPHA_MIN: 0.06,   // gradient fill opacity of first line
  FILL_ALPHA_RANGE: 0.15, // fill opacity added across all lines
  LINE_WIDTH_MIN: 0.8,    // stroke width of first line
  LINE_WIDTH_RANGE: 1.2,  // width added across all lines
  FILL_FADE_HEIGHT: 0.25, // gradient fade distance (ratio of canvas height)

  // --- MODE SYSTEM ---
  // Mode order: 0=hills, 1=signal(PWM), 2=circuit, 3=sine
  MODE_ORDER: [0, 2, 0, 1, 0, 3],
  MODE_HOLD_SEC: 10,      // seconds to hold each mode
  MODE_TRANSITION_SEC: 3.5, // seconds for morph transition
  FIRST_TRANSITION_SEC: 3,// seconds until first transition

  // --- PWM SIGNAL ---
  PWM_BIT_WIDTH: 0.00005,   // width of each bit (smaller = denser)
  PWM_BIT_WIDTH_PER_LINE: 0.0015, // bit width variation per line
  PWM_SWING: 0.16,         // amplitude as ratio of animAmp
  PWM_MESSAGES: ["HRI 2027","INNOVATIVE","HELLO WORLD"],

  // --- CIRCUIT TRACE ---
  CIRCUIT_GRID_STEP: 0.038,  // x-grid snap size (larger = bigger steps)
  CIRCUIT_QUANT_STEP: 0.028, // height quantization (larger = bigger jumps)
  CIRCUIT_VIA_SPACING: 0.04,// distance between via dots
  CIRCUIT_VIA_RADIUS: 3,     // via dot radius in pixels
  CIRCUIT_VIA_STROKE: 1,   // via dot stroke width
  CIRCUIT_VIA_MAX_ALPHA: 0.45,

  // --- SINE WAVE ---
  SINE_WORD: "HUMAN",     // word encoded in frequencies
  SINE_FREQ_BASE: 15,      // base frequency (cycles across viewport)
  SINE_FREQ_PER_CHAR: 0.2,// frequency added per ASCII value above 'A'
  SINE_PHASE_STEP: 0.2,   // phase offset multiplier between letters
  SINE_AMP: 0.15,         // modulation amplitude as ratio of animAmp
  SINE_SPEED: 0.75,        // time multiplier for sine animation

  // --- TEMPERATURE MAPPING ---
  TEMP_SPEED_MIN: 0.003,  // animation speed at cold
  TEMP_SPEED_RANGE: 0.012,// speed added at hot
  TEMP_AMP_MIN: 0.08,     // amplitude at cold
  TEMP_AMP_RANGE: 0.10,   // amplitude added at hot
  TEMP_COLD: 5,           // celsius = 0% energy
  TEMP_HOT: 40,           // celsius = 100% energy

  // --- TIME OF DAY COLORS [hour, R, G, B] ---
  COLOR_STOPS: [
    [0,  90, 60, 160],    // midnight
    [6,  104, 193, 195],  // 6am — teal
    [10, 104, 193, 195],  // 10am — teal
    [14, 184, 137, 46],   // 2pm — gold
    [18, 184, 137, 46],   // 6pm — gold
    [20, 193, 111, 247],  // 8pm — purple
    [22, 120, 70, 180],   // 10pm — dim purple
    [24, 90, 60, 160]     // midnight wrap
  ],
  NIGHT_START: 21,        // hour night mode begins
  NIGHT_END: 5,           // hour night mode ends

  // --- DEBUG ---
  // Set FORCE_MODE to lock into a single mode for tweaking:
  // null = normal cycling, 0 = hills, 1 = signal/PWM, 2 = circuit, 3 = sine
  FORCE_MODE: null
};
// ============================================================
// END CONFIG — code below uses CONFIG values
// ============================================================

(function() {
  var C = CONFIG;
  var canvas = document.getElementById('terrain');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var W, H, mx = 0.5, my = 0.5, scrollY = 0;

  var vScale = 1; // viewport scale factor for mobile
  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    // Scale parameters so terrain feels the same on mobile
    // Reference: 1440px wide desktop. On narrower screens, reduce line count and adjust spacing
    vScale = Math.min(1, W / 1000);
  }
  resize();
  window.addEventListener('resize', resize);
  document.addEventListener('mousemove', function(e) { mx = e.clientX / W; my = e.clientY / H; });
  window.addEventListener('scroll', function() { scrollY = window.scrollY; });

  // --- Color ---
  function getSantaClaraHour(){var now=new Date();var sc=new Date(now.toLocaleString('en-US',{timeZone:'America/Los_Angeles'}));return sc.getHours()+sc.getMinutes()/60;}
  function lerpColor(h){var stops=C.COLOR_STOPS;for(var i=0;i<stops.length-1;i++){var a=stops[i],b=stops[i+1];if(h>=a[0]&&h<b[0]){var t=(h-a[0])/(b[0]-a[0]);return[Math.round(a[1]+(b[1]-a[1])*t),Math.round(a[2]+(b[2]-a[2])*t),Math.round(a[3]+(b[3]-a[3])*t)];}}return[184,137,46];}
  function isNight(h){return h>=C.NIGHT_START||h<C.NIGHT_END;}
  var currentColor=[184,137,46],nightMode=false;
  function updateTimeColor(){var h=getSantaClaraHour();currentColor=lerpColor(h);var was=nightMode;nightMode=isNight(h);var hex='#'+currentColor.map(function(c){return('0'+c.toString(16)).slice(-2)}).join('');document.documentElement.style.setProperty('--accent',hex);if(nightMode&&!was){document.documentElement.style.setProperty('--bg','#111111');document.documentElement.style.setProperty('--text','#e8e8e8');document.documentElement.style.setProperty('--text-sec','#999');document.documentElement.style.setProperty('--text-dim','#666');document.documentElement.style.setProperty('--border','rgba(255,255,255,0.08)');document.body.style.background='#111111';document.body.style.color='#e8e8e8';document.querySelector('.nav').style.background='rgba(17,17,17,0.9)';}else if(!nightMode&&was){document.documentElement.style.setProperty('--bg','#fafafa');document.documentElement.style.setProperty('--text','#1a1a1a');document.documentElement.style.setProperty('--text-sec','#555');document.documentElement.style.setProperty('--text-dim','#999');document.documentElement.style.setProperty('--border','rgba(0,0,0,0.08)');document.body.style.background='#fafafa';document.body.style.color='#1a1a1a';document.querySelector('.nav').style.background='rgba(250,250,250,0.9)';}}
  updateTimeColor();setInterval(updateTimeColor,60000);
  // Debug overrides
  if(C.FORCE_COLOR){currentColor=C.FORCE_COLOR;var hex='#'+currentColor.map(function(c){return('0'+c.toString(16)).slice(-2)}).join('');document.documentElement.style.setProperty('--accent',hex);}
  if(C.FORCE_DAY){nightMode=false;document.documentElement.style.setProperty('--bg','#fafafa');document.documentElement.style.setProperty('--text','#1a1a1a');document.documentElement.style.setProperty('--text-sec','#555');document.documentElement.style.setProperty('--text-dim','#999');document.documentElement.style.setProperty('--border','rgba(0,0,0,0.08)');document.body.style.background='#fafafa';document.body.style.color='#1a1a1a';}

  // --- Temperature ---
  var animSpeed=C.DEFAULT_SPEED, animAmp=C.DEFAULT_AMP;
  fetch('https://api.open-meteo.com/v1/forecast?latitude=37.3541&longitude=-121.9552&current_weather=true')
    .then(function(r){return r.json()}).then(function(d){var temp=d.current_weather.temperature;var t2=Math.max(0,Math.min(1,(temp-C.TEMP_COLD)/(C.TEMP_HOT-C.TEMP_COLD)));animSpeed=C.TEMP_SPEED_MIN+t2*C.TEMP_SPEED_RANGE;animAmp=C.TEMP_AMP_MIN+t2*C.TEMP_AMP_RANGE;}).catch(function(){});

  // --- Mode system ---
  var modes=C.MODE_ORDER;
  var FPS=60;
  var MODE_HOLD=Math.round(C.MODE_HOLD_SEC*FPS);
  var MODE_TRANS=Math.round(C.MODE_TRANSITION_SEC*FPS);
  var modeIdx=0, modeBlend=0, modePhase='hold', modeTimer=MODE_HOLD-Math.round(C.FIRST_TRANSITION_SEC*FPS);

  // PWM
  var msgIdx=0;
  function textToBinary(str){var bits='';for(var i=0;i<str.length;i++){var b=str.charCodeAt(i).toString(2);while(b.length<8)b='0'+b;bits+=b;}return bits;}
  var currentBits=textToBinary(C.PWM_MESSAGES[0]);

  // Sine
  var humanFreqs=[], humanPhases=[];
  for(var i=0;i<C.LINES;i++){
    var cc=C.SINE_WORD.charCodeAt(i%C.SINE_WORD.length);
    humanFreqs.push(C.SINE_FREQ_BASE+(cc-65)*C.SINE_FREQ_PER_CHAR);
    humanPhases.push((i%C.SINE_WORD.length)*Math.PI*C.SINE_PHASE_STEP);
  }

  function curMode(){if(C.FORCE_MODE!==null)return C.FORCE_MODE;return modes[modeIdx%modes.length];}
  function nxtMode(){return modes[(modeIdx+1)%modes.length];}
  function updateMode(){
    modeTimer++;
    if(modePhase==='hold'){
      if(modeTimer>=MODE_HOLD){modePhase='transition';modeTimer=0;modeBlend=0;
        if(nxtMode()===1){currentBits=textToBinary(C.PWM_MESSAGES[msgIdx%C.PWM_MESSAGES.length]);msgIdx++;}
      }
    }else{
      modeBlend=modeTimer/MODE_TRANS;
      if(modeBlend>=1){modeBlend=0;modeIdx++;modePhase='hold';modeTimer=0;
        if(curMode()===1){currentBits=textToBinary(C.PWM_MESSAGES[msgIdx%C.PWM_MESSAGES.length]);msgIdx++;}
      }
    }
  }
  function smoothstep(t){return t*t*(3-2*t);}

  // --- Heights ---
  var t=0;
  function hillHeight(x,i){
    var base=C.BASE_START+i*(C.LINE_SPACING*(0.7+0.3*vScale));
    var h=base
      +Math.sin(x*(C.WAVE1_FREQ_BASE+i*C.WAVE1_FREQ_PER_LINE)+t*C.WAVE1_SPEED+i*0.7)*animAmp*(0.6+0.4*vScale)
      +Math.sin(x*(C.WAVE2_FREQ_BASE+i*C.WAVE2_FREQ_PER_LINE)+t*C.WAVE2_SPEED)*(animAmp*C.WAVE2_AMP_RATIO)
      +Math.sin(x*C.WAVE3_FREQ+i*0.4)*C.WAVE3_AMP*(0.6+0.4*vScale);
    var dx=x-mx,dy=base-my,dist=Math.sqrt(dx*dx+dy*dy);
    h+=Math.max(0,1-dist/C.RIPPLE_RADIUS)*C.RIPPLE_STRENGTH*Math.sin(dist*C.RIPPLE_FREQ-t*C.RIPPLE_SPEED);
    return h;
  }
  function signalHeight(x,i){
    var organic=hillHeight(x,i);
    var bw=C.PWM_BIT_WIDTH+i*C.PWM_BIT_WIDTH_PER_LINE;
    var bi=Math.floor(x/bw)%currentBits.length;
    if(bi<0)bi+=currentBits.length;
    var bit=currentBits[bi]==='1';
    var swing=animAmp*C.PWM_SWING*(0.7+0.3*vScale);
    return organic+(bit?-swing:swing);
  }
  function circuitHeight(x,i){
    var sx=Math.floor(x/C.CIRCUIT_GRID_STEP)*C.CIRCUIT_GRID_STEP;
    var organic=hillHeight(sx,i);
    return Math.round(organic/C.CIRCUIT_QUANT_STEP)*C.CIRCUIT_QUANT_STEP;
  }
  function sineHeight(x,i){
    var organic=hillHeight(x,i);
    var mod=Math.sin(x*humanFreqs[i]*Math.PI*2+t*C.SINE_SPEED+humanPhases[i])*animAmp*C.SINE_AMP*(0.7+0.3*vScale);
    return organic+mod;
  }
  function getHeight(x,i){
    var hH=hillHeight(x,i);
    if(modePhase==='hold'){var m=curMode();if(m===0)return hH;if(m===1)return signalHeight(x,i);if(m===2)return circuitHeight(x,i);return sineHeight(x,i);}
    var blend=smoothstep(modeBlend);var cm=curMode(),nm=nxtMode();
    function hm(m){if(m===0)return hH;if(m===1)return signalHeight(x,i);if(m===2)return circuitHeight(x,i);return sineHeight(x,i);}
    return hm(cm)+(hm(nm)-hm(cm))*blend;
  }

  // --- Draw ---
  function draw(){
    t+=animSpeed;
    updateMode();
    ctx.clearRect(0,0,W,H);
    var yOff=scrollY*C.SCROLL_PARALLAX;
    var r=currentColor[0],g=currentColor[1],b=currentColor[2];
    var showVias=(curMode()===2&&modePhase==='hold')||(modePhase==='transition'&&(curMode()===2||nxtMode()===2));
    var viaAlpha=0;
    if(curMode()===2&&modePhase==='hold')viaAlpha=1;
    else if(modePhase==='transition'&&nxtMode()===2)viaAlpha=smoothstep(modeBlend);
    else if(modePhase==='transition'&&curMode()===2)viaAlpha=1-smoothstep(modeBlend);
    var viaDots=[];

    for(var i=0;i<C.LINES;i++){
      var la=C.LINE_ALPHA_MIN+(i/C.LINES)*C.LINE_ALPHA_RANGE;
      var fa=C.FILL_ALPHA_MIN+(i/C.LINES)*C.FILL_ALPHA_RANGE;
      var lw=C.LINE_WIDTH_MIN+(i/C.LINES)*C.LINE_WIDTH_RANGE;
      var pts=[];
      for(var j=0;j<=C.POINTS;j++){var x=j/C.POINTS;var h=getHeight(x,i);pts.push({x:x*W,y:h*H-yOff});}

      ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);
      for(var j=1;j<pts.length;j++)ctx.lineTo(pts[j].x,pts[j].y);
      ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.closePath();
      var minY=H;for(var j=0;j<pts.length;j++){if(pts[j].y<minY)minY=pts[j].y;}
      var grad=ctx.createLinearGradient(0,minY,0,minY+H*C.FILL_FADE_HEIGHT);
      grad.addColorStop(0,'rgba('+r+','+g+','+b+','+fa+')');
      grad.addColorStop(1,'rgba('+r+','+g+','+b+',0)');
      ctx.fillStyle=grad;ctx.fill();

      ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);
      for(var j=1;j<pts.length;j++)ctx.lineTo(pts[j].x,pts[j].y);
      ctx.strokeStyle='rgba('+r+','+g+','+b+','+la+')';
      ctx.lineWidth=lw;ctx.stroke();

      if(showVias&&viaAlpha>0.05){
        for(var gx=C.CIRCUIT_VIA_SPACING;gx<1;gx+=C.CIRCUIT_VIA_SPACING){
          var gj=Math.round(gx*C.POINTS);
          if(gj>0&&gj<pts.length)viaDots.push({x:pts[gj].x,y:pts[gj].y,alpha:viaAlpha*la*2});
        }
      }
    }
    for(var d=0;d<viaDots.length;d++){
      var dot=viaDots[d];ctx.beginPath();ctx.arc(dot.x,dot.y,C.CIRCUIT_VIA_RADIUS,0,Math.PI*2);
      ctx.strokeStyle='rgba('+r+','+g+','+b+','+Math.min(dot.alpha,C.CIRCUIT_VIA_MAX_ALPHA)+')';
      ctx.lineWidth=C.CIRCUIT_VIA_STROKE;ctx.stroke();
    }
    requestAnimationFrame(draw);
  }
  if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){draw();}
})();
