// Terrain: hills → signal → hills → circuit → hills → sine (Asimov frequencies)
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

  // --- Color ---
  var colorStops = [[0,90,60,160],[6,104,193,195],[10,104,193,195],[14,184,137,46],[18,184,137,46],[20,193,111,247],[22,120,70,180],[24,90,60,160]];
  function getSantaClaraHour(){var now=new Date();var sc=new Date(now.toLocaleString('en-US',{timeZone:'America/Los_Angeles'}));return sc.getHours()+sc.getMinutes()/60;}
  function lerpColor(h){for(var i=0;i<colorStops.length-1;i++){var a=colorStops[i],b=colorStops[i+1];if(h>=a[0]&&h<b[0]){var t=(h-a[0])/(b[0]-a[0]);return[Math.round(a[1]+(b[1]-a[1])*t),Math.round(a[2]+(b[2]-a[2])*t),Math.round(a[3]+(b[3]-a[3])*t)];}}return[184,137,46];}
  function isNight(h){return h>=22||h<6;}
  var currentColor=[184,137,46],nightMode=false;
  function updateTimeColor(){var h=getSantaClaraHour();currentColor=lerpColor(h);var was=nightMode;nightMode=isNight(h);var hex='#'+currentColor.map(function(c){return('0'+c.toString(16)).slice(-2)}).join('');document.documentElement.style.setProperty('--accent',hex);if(nightMode&&!was){document.documentElement.style.setProperty('--bg','#111111');document.documentElement.style.setProperty('--text','#e8e8e8');document.documentElement.style.setProperty('--text-sec','#999');document.documentElement.style.setProperty('--text-dim','#666');document.documentElement.style.setProperty('--border','rgba(255,255,255,0.08)');document.body.style.background='#111111';document.body.style.color='#e8e8e8';}else if(!nightMode&&was){document.documentElement.style.setProperty('--bg','#fafafa');document.documentElement.style.setProperty('--text','#1a1a1a');document.documentElement.style.setProperty('--text-sec','#555');document.documentElement.style.setProperty('--text-dim','#999');document.documentElement.style.setProperty('--border','rgba(0,0,0,0.08)');document.body.style.background='#fafafa';document.body.style.color='#1a1a1a';}}
  updateTimeColor();setInterval(updateTimeColor,60000);

  // --- Temperature ---
  var animSpeed=0.008,animAmp=0.12;
  fetch('https://api.open-meteo.com/v1/forecast?latitude=37.3541&longitude=-121.9552&current_weather=true')
    .then(function(r){return r.json()}).then(function(d){var temp=d.current_weather.temperature;var t2=Math.max(0,Math.min(1,(temp-5)/35));animSpeed=0.003+t2*0.012;animAmp=0.08+t2*0.10;}).catch(function(){});

  // --- Mode system: hills(0) → signal(1) → hills → circuit(2) → hills → sine(3) ---
  var modes = [0, 2, 0, 1, 0, 3];
  var modeIdx = 0;
  var modeBlend = 0;
  var modePhase = 'hold';
  var modeTimer = 720;
  var MODE_HOLD = 900;
  var MODE_TRANSITION = 420;

  // PWM data
  var messages = ["HRI 2027","INNOVATIVE","HELLO WORLD","SEP 30 2026","MAR 16 2027"];
  var msgIdx = 0;
  function textToBinary(str){var bits='';for(var i=0;i<str.length;i++){var b=str.charCodeAt(i).toString(2);while(b.length<8)b='0'+b;bits+=b;}return bits;}
  var currentBits = textToBinary(messages[0]);

  // Sine wave data — frequencies encode "HUMAN" (H=72, U=85, M=77, A=65, N=78)
  // Each line gets a frequency derived from these ASCII values
  // Lines 0-17 cycle through the letters, creating interference patterns
  var humanWord = "HUMAN";
  var humanFreqs = [];
  for (var i = 0; i < 18; i++) {
    var charCode = humanWord.charCodeAt(i % humanWord.length);
    // Map ASCII to a pleasant frequency range (3-8 cycles across viewport)
    humanFreqs.push(8 + (charCode - 65) * 0.4);
  }
  // Phase offsets encode the letter positions
  var humanPhases = [];
  for (var i = 0; i < 18; i++) {
    humanPhases.push((i % humanWord.length) * Math.PI * 0.4);
  }

  function curMode(){return modes[modeIdx%modes.length];}
  function nxtMode(){return modes[(modeIdx+1)%modes.length];}

  function updateMode(){
    modeTimer++;
    if(modePhase==='hold'){
      if(modeTimer>=MODE_HOLD){modePhase='transition';modeTimer=0;modeBlend=0;
        if(nxtMode()===1){currentBits=textToBinary(messages[msgIdx%messages.length]);msgIdx++;}
      }
    } else {
      modeBlend=modeTimer/MODE_TRANSITION;
      if(modeBlend>=1){modeBlend=0;modeIdx++;modePhase='hold';modeTimer=0;
        if(curMode()===1){currentBits=textToBinary(messages[msgIdx%messages.length]);msgIdx++;}
      }
    }
  }

  function smoothstep(t){return t*t*(3-2*t);}

  // --- Height functions ---
  var LINES=18, POINTS=100, t=0;

  function hillHeight(x,i){
    var base=0.15+i*0.045;
    var h=base+Math.sin(x*(1.2+i*0.25)+t*0.4+i*0.7)*animAmp+Math.sin(x*(2.5+i*0.15)+t*0.25)*(animAmp*0.6)+Math.sin(x*0.6+i*0.4)*0.15;
    var dx=x-mx,dy=base-my,dist=Math.sqrt(dx*dx+dy*dy);
    h+=Math.max(0,1-dist/0.25)*0.05*Math.sin(dist*25-t*4);
    return h;
  }

  function signalHeight(x,i){
    var organic=hillHeight(x,i);
    var bitWidth=0.007+i*0.0006;
    var bitIdx=Math.floor(x/bitWidth)%currentBits.length;
    if(bitIdx<0)bitIdx+=currentBits.length;
    var bit=currentBits[bitIdx]==='1';
    var swing=animAmp*0.2;
    return organic+(bit?-swing:swing);
  }

  function circuitHeight(x,i){
    var gridStep=0.035;
    var snappedX=Math.floor(x/gridStep)*gridStep;
    var organic=hillHeight(snappedX,i);
    var quantStep=0.022;
    return Math.round(organic/quantStep)*quantStep;
  }

  function sineHeight(x,i){
    var organic=hillHeight(x,i);
    var freq=humanFreqs[i];
    var phase=humanPhases[i];
    // Sine modulation riding on the organic hill
    var mod=Math.sin(x*freq*Math.PI*2+t*0.3+phase)*animAmp*0.15;
    return organic+mod;
  }

  function getHeight(x,i){
    var hHill=hillHeight(x,i);
    if(modePhase==='hold'){
      var m=curMode();
      if(m===0)return hHill;
      if(m===1)return signalHeight(x,i);
      if(m===2)return circuitHeight(x,i);
      return sineHeight(x,i);
    }
    var blend=smoothstep(modeBlend);
    var cm=curMode(),nm=nxtMode();
    function heightForMode(m){
      if(m===0)return hHill;
      if(m===1)return signalHeight(x,i);
      if(m===2)return circuitHeight(x,i);
      return sineHeight(x,i);
    }
    return heightForMode(cm)+(heightForMode(nm)-heightForMode(cm))*blend;
  }

  // --- Draw ---
  function draw(){
    t+=animSpeed;
    updateMode();
    ctx.clearRect(0,0,W,H);
    var yOff=scrollY*0.2;
    var r=currentColor[0],g=currentColor[1],b=currentColor[2];

    var showVias=(curMode()===2&&modePhase==='hold')||(modePhase==='transition'&&(curMode()===2||nxtMode()===2));
    var viaAlpha=0;
    if(curMode()===2&&modePhase==='hold')viaAlpha=1;
    else if(modePhase==='transition'&&nxtMode()===2)viaAlpha=smoothstep(modeBlend);
    else if(modePhase==='transition'&&curMode()===2)viaAlpha=1-smoothstep(modeBlend);

    var viaDots=[];

    for(var i=0;i<LINES;i++){
      var lineAlpha=0.1+(i/LINES)*0.25;
      var fillAlpha=0.06+(i/LINES)*0.15;
      var thick=0.8+(i/LINES)*1.2;

      var pts=[];
      for(var j=0;j<=POINTS;j++){
        var x=j/POINTS;
        var h=getHeight(x,i);
        pts.push({x:x*W,y:h*H-yOff});
      }

      // Fill
      ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);
      for(var j=1;j<pts.length;j++)ctx.lineTo(pts[j].x,pts[j].y);
      ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.closePath();
      var minY=H;for(var j=0;j<pts.length;j++){if(pts[j].y<minY)minY=pts[j].y;}
      var grad=ctx.createLinearGradient(0,minY,0,minY+H*0.25);
      grad.addColorStop(0,'rgba('+r+','+g+','+b+','+fillAlpha+')');
      grad.addColorStop(1,'rgba('+r+','+g+','+b+',0)');
      ctx.fillStyle=grad;ctx.fill();

      // Stroke
      ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);
      for(var j=1;j<pts.length;j++)ctx.lineTo(pts[j].x,pts[j].y);
      ctx.strokeStyle='rgba('+r+','+g+','+b+','+lineAlpha+')';
      ctx.lineWidth=thick;ctx.stroke();

      // Vias
      if(showVias&&viaAlpha>0.05){
        var gs=0.035;
        for(var gx=gs;gx<1;gx+=gs){
          var gj=Math.round(gx*POINTS);
          if(gj>0&&gj<pts.length)viaDots.push({x:pts[gj].x,y:pts[gj].y,alpha:viaAlpha*lineAlpha*2});
        }
      }
    }

    // Vias — stroke ring only
    for(var d=0;d<viaDots.length;d++){
      var dot=viaDots[d];
      ctx.beginPath();ctx.arc(dot.x,dot.y,3,0,Math.PI*2);
      ctx.strokeStyle='rgba('+r+','+g+','+b+','+Math.min(dot.alpha,0.45)+')';
      ctx.lineWidth=1.2;ctx.stroke();
    }

    requestAnimationFrame(draw);
  }

  if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){draw();}
})();
