"""Gera sorteio/bingo-cinco-jotas.html: ficheiro único (sem conta, sem hospedagem) com 3 modos:
Ecrã (projetor), Comando e Tudo neste computador. Liga ecrã e comando por um código de 4 letras
(WebRTC direto via PeerJS; no mesmo computador usa BroadcastChannel).
Uso: python3 gerar_sorteio_offline.py"""
import base64, csv, json, pathlib, re
raiz = pathlib.Path(__file__).resolve().parent.parent
s = (raiz / 'sorteio/sorteio.template.html').read_text(encoding='utf-8')

def rep(old, new, count=1):
    global s
    assert old in s, 'NÃO ENCONTRADO: ' + old[:90]
    s = s.replace(old, new, count)

# ---------------- CSS ----------------
css_extra = r'''
body.no-role .room,body.no-role .ctl{display:none}
.modes{position:fixed;inset:0;z-index:200;background:radial-gradient(70% 70% at 50% 40%,#10151E,#05070A);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;padding:24px;overflow:auto}
.modes h1{margin:0;text-align:center;font-weight:300;font-size:clamp(1.5rem,3.6vw,2.8rem);letter-spacing:.08em;text-transform:uppercase;line-height:1.05}
.modes h1 b{font-weight:900;font-style:italic;display:block;font-size:1.3em;letter-spacing:0}
.modes .sub{font-size:12px;letter-spacing:.4em;text-transform:uppercase;color:var(--muted);text-align:center}
.mgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;width:min(1000px,100%)}
.mcard{border:1px solid var(--line);border-radius:16px;background:var(--glass);padding:20px;display:flex;flex-direction:column;gap:10px;text-align:left}
.mcard h2{margin:0;font-size:20px;font-weight:800;letter-spacing:0;text-transform:none}
.mcard p{margin:0;color:var(--muted);font-size:14px;line-height:1.5;flex:1}
.mnote{max-width:900px;font-size:13px;color:var(--muted);text-align:center;line-height:1.6;margin:0}
body.role-ctl{overflow:auto;height:auto}
.role-ctl .room,.role-ctl .ctl{display:none}
.cmd{max-width:780px;margin:0 auto;padding:18px 16px 48px;display:flex;flex-direction:column;gap:16px}
.cmd[hidden]{display:none!important}
.cmd-top{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
.cmd-top small{display:block;font-size:11px;font-weight:700;letter-spacing:.4em;text-transform:uppercase;color:var(--muted)}
.cmd-top h1{margin:2px 0 0;font-weight:300;font-size:26px;letter-spacing:.04em;text-transform:uppercase}
.cmd-top h1 b{font-weight:900;font-style:italic}
.pill{border-radius:999px;padding:8px 14px;font-weight:800;font-size:13px;border:1px solid var(--line);background:var(--glass)}
.pill.on{background:rgba(93,208,138,.16);color:var(--ok);border-color:var(--ok)}
.pill.off{background:rgba(255,138,128,.12);color:var(--bad);border-color:var(--bad)}
.cmd-pair{display:flex;gap:10px;align-items:center;flex-wrap:wrap;font-size:14px;color:var(--muted)}
.cmd-pair input{width:7.6ch;padding:10px 12px;border:2px solid var(--fg);border-radius:12px;background:var(--stage);font-weight:800;font-size:24px;text-align:center;text-transform:uppercase;letter-spacing:.2em}
.cmd-live{display:grid;grid-template-columns:110px 1fr;gap:16px;align-items:center;border:1px solid var(--line);border-radius:16px;padding:14px;background:var(--glass)}
.cmd-ball{width:110px;height:110px;border-radius:50%;background:var(--grad);padding:6px;display:flex}
.cmd-ball i{flex:1;border-radius:50%;background:#fff;color:var(--ink);display:flex;align-items:center;justify-content:center;font-style:normal;font-weight:900;font-size:46px}
.cmd-phrase{margin:4px 0 0;font-size:22px;font-weight:800;line-height:1.15}
.cmd-actions{display:flex;gap:10px;flex-wrap:wrap}
.btn.big{padding:16px 30px;font-size:18px;border-radius:14px}
.cmd-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start}
.cboard{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.cmini{aspect-ratio:1;border-radius:50%;border:2px solid var(--line);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:18px;color:rgba(255,255,255,.4)}
.cmini.on{border:0;background:var(--grad);color:var(--ink);padding:3px}
.cmini.on span{width:100%;height:100%;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center}
.ctit{display:flex;flex-direction:column;gap:8px}
.ctit div{display:flex;justify-content:space-between;gap:8px;border:1px solid var(--line);border-radius:10px;padding:9px 12px;font-size:14px}
.ctit b{font-weight:800}.ctit .w{color:var(--ok);font-weight:800}
.cmd-end{border:1px solid var(--line);border-radius:16px;padding:14px;background:var(--glass)}
.cmd-end.hl{border-color:var(--c4);box-shadow:0 0 0 1px var(--c4)}
.cmd-end h2{margin:0 0 10px;font-size:12px;font-weight:800;letter-spacing:.24em;text-transform:uppercase}
.cmd-end p{margin:10px 0 0;font-size:13px;color:var(--muted);line-height:1.5}
.role-ctl .regie{position:static;width:auto;border:1px solid var(--line);border-radius:16px;overflow:visible}
.role-ctl #close{display:none}
.role-ctl .vgrid{max-width:360px}
@media (max-width:640px){.cmd-grid{grid-template-columns:1fr}.cmd-live{grid-template-columns:80px 1fr}.cmd-ball{width:80px;height:80px}.cmd-ball i{font-size:32px}}
.pair{position:absolute;left:2cqw;bottom:4.7cqw;z-index:4;display:flex;align-items:center;gap:.8cqw;font-size:1.05cqw;font-weight:700;letter-spacing:.16em;text-transform:uppercase;background:rgba(0,0,0,.55);padding:.5cqw 1.1cqw;border-radius:.6cqw;color:var(--muted)}
.pair i{width:.8cqw;height:.8cqw;border-radius:50%;background:var(--bad)}
.pair.on i{background:var(--ok)}
.pair b{color:#fff;letter-spacing:.3em}
.role-solo .pair{display:none}
.intro .hint b{display:block;margin-top:1cqw;font-size:3.4cqw;letter-spacing:.35em;padding-left:.35em;color:#fff}
.role-display .g-play,.role-display #newgame,.role-display #pbtn,.role-display #endbtn{display:none!important}
.role-display #t-validar,.role-display #t-frases{display:none}
.role-ctl .g-musicfile{display:none!important}
'''
rep('</style>', css_extra + '</style>')

# ---------------- HTML ----------------
modes = '''<div class="modes" id="modes" hidden>
  <div class="sub">Jantar dos 50 anos · JSD Famalicão</div>
  <h1>Bingo <b class="gt">Cinco Jotas</b></h1>
  <div class="mgrid">
    <div class="mcard"><h2>Ecrã</h2><p>O computador do projetor. Mostra o programa: globo, bolas, frases, títulos e pódio, e toca a música. <b>Não tem nenhum botão de jogo</b>; fica só a ver. Mostra um código de 4 letras.</p><button class="btn primary" data-role="ecra">Abrir como ecrã</button></div>
    <div class="mcard"><h2>Comando</h2><p>O outro computador (ou telemóvel). Escreves o código que aparece no ecrã e controlas tudo: rodar o globo, validar cartões, atribuir títulos, frases e volume.</p><button class="btn primary" data-role="comando">Abrir como comando</button></div>
    <div class="mcard"><h2>Tudo neste computador</h2><p>Um só computador, uma só janela, como antes. Serve de plano B se a ligação entre os dois computadores falhar.</p><button class="btn" data-role="solo">Jogar neste computador</button></div>
  </div>
  <p class="mnote">Para usar dois computadores: abre este ficheiro nos dois, escolhe <b>Ecrã</b> num e <b>Comando</b> no outro, e escreve o código no comando. Precisa de internet nos dois só para fazer a ligação; depois falam diretamente um com o outro. No mesmo computador (duas janelas) também funciona, mesmo sem internet. Não é preciso nenhuma conta.</p>
</div>
<div class="room">'''
rep('<div class="room">', modes)
rep('<canvas id="fx"></canvas>', '<div class="pair" id="pair"><i></i><span id="pairtxt"></span></div>\n    <canvas id="fx"></canvas>')
cmd = '''</div>

<main class="cmd" id="cmd" hidden>
  <header class="cmd-top"><div><small>Comando</small><h1>Bingo <b class="gt">Cinco Jotas</b></h1></div><div class="pill off" id="c-status">A ligar ao ecrã…</div></header>
  <div class="cmd-pair"><label for="c-code">Código do ecrã</label><input id="c-code" maxlength="4" autocapitalize="characters" autocomplete="off" placeholder="ABCD"><button class="btn primary" id="c-ligar" type="button" style="padding:10px 18px;font-size:15px">Ligar</button><span id="c-pairmsg"></span></div>
  <section class="cmd-live"><div class="cmd-ball"><i id="c-num">?</i></div><div><div class="hint2" id="c-count">0 de 12 sorteados</div><p class="cmd-phrase" id="c-phrase">Ainda nenhuma bola.</p></div></section>
  <div class="cmd-actions"><button class="btn primary big" id="c-draw" type="button">Começar o programa</button><button class="btn" id="c-undo" type="button">Anular último</button><button class="btn" id="c-podium" type="button">Pódio</button><button class="btn" id="c-close" type="button">Fechar ecrã de título</button></div>
  <section class="cmd-grid"><div class="cboard" id="c-board"></div><div class="ctit" id="c-titles"></div></section>
  <section class="cmd-end" id="c-endbox"><h2>Fim do jogo</h2><div class="cmd-actions"><button class="btn big" id="c-end" type="button">Encerrar o jogo</button><button class="btn big danger" id="c-new" type="button">Começar de novo</button></div><p id="c-endmsg"></p></section>
  <div id="c-regie"></div>
</main>
'''
# fecha o .room (o div que abrimos) antes de <div class="ctl"...>
rep('\n<div class="ctl" id="ctl">', cmd + '\n<div class="ctl" id="ctl">')
# separador Jogo com classes por papel
novo_jogo = '''<section id="v-jogo" class="col" hidden>
    <div class="g-play" style="display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn primary" id="draw" type="button" style="padding:10px 20px;font-size:15px">Rodar o globo <kbd>Espaço</kbd></button>
      <button class="btn" id="undo" type="button">Anular último</button>
    </div>
    <h2 style="margin-top:6px">Som e música</h2>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn" id="snd" type="button" aria-pressed="true">Som ligado</button>
      <button class="btn" id="mus" type="button" aria-pressed="true">Música ligada</button>
    </div>
    <div class="vol"><label for="vol">Volume da música</label><input type="range" id="vol" min="0" max="100" value="50"><output id="volo">50%</output></div>
    <div class="col g-musicfile" style="gap:6px">
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><button class="btn" id="mbtn" type="button">Usar a minha música</button><button class="btn" id="mreset" type="button" hidden>Voltar à música do estúdio</button></div>
      <input type="file" id="mfile" accept="audio/*" hidden>
      <p class="hint2" id="mnome">A tocar a música de estúdio embutida. Podes escolher um ficheiro de áudio teu (MP3, por exemplo), que toca em ciclo. O ficheiro escolhido perde-se ao recarregar a página. Escolhe-o no computador do ecrã.</p>
    </div>
    <h2 class="g-play" style="margin-top:6px">Atalhos</h2>
    <div class="keys g-play"><b>Espaço, Enter, seta direita ou clique</b><span>Rodar o globo e sortear (também funciona com um apresentador de diapositivos)</span><b>P</b><span>Mostrar o pódio</span><b>R</b><span>Abrir ou fechar a régie</span><b>F</b><span>Ecrã inteiro</span><b>M</b><span>Som ligado ou desligado</span><b>Esc</b><span>Fechar a régie ou um título</span></div>
    <div class="g-play" style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" id="intro-again" type="button">Rever a abertura</button><button class="btn danger" id="reset" type="button">Começar de novo</button></div>
    <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" id="modo" type="button">Mudar de modo</button></div>
  </section>
</aside>'''
s2 = re.sub(r'<section id="v-jogo" class="col" hidden>.*?</section>\n</aside>', lambda m: novo_jogo, s, count=1, flags=re.S)
assert s2 != s; s = s2

# ---------------- JS: papéis ----------------
rep("var CARDS = /*CARDS*/{};", "var ROLE = ({'#ecra':'display','#comando':'ctl','#solo':'solo'})[location.hash] || null;\nvar CARDS = /*CARDS*/{};")
rep("var animating=false, introRunning=false,", "var pendingState=null, hasState=false, ctlSeen=0, lastReady=0, code='', saveT=null;\nvar animating=false, introRunning=false,")
rep("function save(){ try{", "function save(){ if(ROLE==='display') return; try{")

# draw -> draw / runDraw
rep("""function draw(){
  if(animating) return;
  if(!started){ runIntro(); return; }
  var rem = remaining(); if(!rem.length){ toast('Já saíram os 12 números.'); return; }
  var pick = rem[rand(rem.length)];
  function finish(n){""", """function draw(){
  if(ROLE==='display' || animating) return;
  if(!started){ if(ROLE==='ctl') ctlBegin(); else runIntro(); return; }
  var rem = remaining(); if(!rem.length){ toast('Já saíram os 12 números.'); return; }
  var pick = rem[rand(rem.length)];
  if(ROLE==='ctl'){ ctlDraw(pick); return; }
  runDraw(pick);
}
function runDraw(pick){
  function finish(n){""")
rep("""    setTimeout(function(){ $('lower').classList.add('in'); },350);
  }
  animating = true;""", """    setTimeout(function(){ $('lower').classList.add('in'); },350);
    afterDraw();
  }
  animating = true;""")
rep("var n = state.order.pop(); save(); render(); toast('Anulado o número '+n+'.');", "var n = state.order.pop(); save(); render(); sendState(); toast('Anulado o número '+n+'.');")
rep("""  clearTimeout(resetTimer); confirmandoNovo=false; labelsNovo('Novo jogo');
  state.order=[]; state.winners={}; save();
  Music.stop(); closeAward(); closePodium(); closeClosing(); ended=false; closeRegie(); lowerOut();
  started=false; introRunning=false; var el=$('intro'); el.classList.remove('play'); el.classList.remove('gone');
  render(); toast('Novo jogo. Tudo a zeros.');
}""", """  clearTimeout(resetTimer); confirmandoNovo=false; labelsNovo('Novo jogo');
  resetNow(true);
}
function resetNow(emit){
  state.order=[]; state.winners={}; save();
  Music.stop(); closeAward(); closePodium(); closeClosing(); ended=false; closeRegie(); lowerOut();
  started=false; introRunning=false; animating=false; var el=$('intro'); el.classList.remove('play'); el.classList.remove('gone');
  render();
  if(emit && ROLE==='ctl'){ sendCmd({t:'newgame'}); sendState(); }
  if(ROLE!=='display') toast('Novo jogo. Tudo a zeros.');
}""")
rep("  Cage.setTray(state.order.slice(-6).reverse());\n  buildTicker();\n}", "  Cage.setTray(state.order.slice(-6).reverse());\n  buildTicker();\n  if(ROLE==='ctl') renderCtl();\n}")
rep("function maybeMusic(){ if(started &&", "function maybeMusic(){ if(ROLE!=='ctl' && started &&")
rep("function replayIntro(){ closeRegie(); Music.stop();", "function replayIntro(){\n  if(ROLE==='ctl'){ sendCmd({t:'intro-again'}); toast('Abertura enviada para o ecrã.'); return; }\n  closeRegie(); Music.stop();")
rep("function openRegie(){ $('regie').hidden=false; showTab('validar'); wakeCtl(); }", "function openRegie(){ if(ROLE==='ctl') return; $('regie').hidden=false; showTab(ROLE==='display'?'jogo':'validar'); wakeCtl(); }")
rep("function closeRegie(){ $('regie').hidden=true; }", "function closeRegie(){ if(ROLE==='ctl') return; $('regie').hidden=true; }")
rep("b.addEventListener('click', function(){ var id=b.getAttribute('data-assign'); state.winners[id]={card:num,at:Date.now()}; save(); render(); closeRegie(); award(id,num); });",
    "b.addEventListener('click', function(){ var id=b.getAttribute('data-assign'); state.winners[id]={card:num,at:Date.now()}; save(); render(); if(ROLE==='ctl'){ sendState(); sendCmd({t:'award',id:id,card:num,winners:state.winners}); mostrarCartao(num); toast('Título enviado para o ecrã.'); } else { closeRegie(); award(id,num); } });")
rep("b.addEventListener('click', function(){ delete state.winners[b.getAttribute('data-retirar')]; save(); render(); mostrarCartao(num); });",
    "b.addEventListener('click', function(){ delete state.winners[b.getAttribute('data-retirar')]; save(); render(); sendState(); mostrarCartao(num); });")
rep("state.phrases[k-1]=inp.value; state.edited=true; save(); $('fstate').textContent='Guardado.'; render(); });", "state.phrases[k-1]=inp.value; state.edited=true; save(); $('fstate').textContent='Guardado.'; render(); sendStateSoon(); });")
rep("save(); syncSom(); toast(", "save(); syncSom(); sendState(); toast(")
rep("else maybeMusic(); save(); syncMus(); }", "else maybeMusic(); save(); syncMus(); sendState(); }")

rep("function toast(msg){ var t=$('toast');", "function toast(msg){ if(ROLE==='display') return; var t=$('toast');")
# ---------------- JS: ligação, ecrã e comando; novo init ----------------
i0 = s.index('function init(){'); i1 = s.rindex('init();')
novo = r'''/* ---------- ligação entre ecrã e comando ---------- */
var Link = (function(){
  var sid=Math.random().toString(36).slice(2,8), n=0, seen=[], bc=null, peer=null, conns=[], handler=null, info=null, role='', cod='', retryT=null;
  function pid(){ return 'jsd50-bingo-'+cod; }
  function cfg(){ return window.__PEER_CFG || {debug:0}; }
  function onmsg(m){ if(!m||!m.i||seen.indexOf(m.i)>-1) return; seen.push(m.i); if(seen.length>400) seen.shift(); if(handler) handler(m); }
  function raw(m){ if(bc){ try{ bc.postMessage(m); }catch(e){} } conns.forEach(function(c){ if(c.open){ try{ c.send(m); }catch(e){} } }); }
  function state(t,msg){ if(info) info(t,msg||''); }
  function host(){
    try{ peer=new Peer(pid(),cfg()); }catch(e){ state('erro','Sem suporte para ligação direta neste navegador.'); return; }
    peer.on('open',function(){ state('servidor-ok'); });
    peer.on('connection',function(c){ c.on('open',function(){ conns=conns.filter(function(x){return x.open}); conns.push(c); }); c.on('data',onmsg); });
    peer.on('disconnected',function(){ try{ peer.reconnect(); }catch(e){} });
    peer.on('error',function(err){
      if(err.type==='unavailable-id'){ try{ peer.destroy(); }catch(e){} clearTimeout(retryT); retryT=setTimeout(host,4000); state('a-tentar','A reservar o código…'); }
      else state('sem-servidor','Sem acesso ao servidor de ligação ('+err.type+'). No mesmo computador continua a funcionar.');
    });
  }
  function join(){
    try{ peer=new Peer(undefined,cfg()); }catch(e){ state('erro','Sem suporte para ligação direta neste navegador.'); return; }
    function connect(){ clearTimeout(retryT); if(!peer||peer.destroyed) return; var c=peer.connect(pid(),{reliable:true}); c.on('open',function(){ conns=[c]; }); c.on('data',onmsg); c.on('close',function(){ conns=[]; retryT=setTimeout(connect,3000); }); c.on('error',function(){ retryT=setTimeout(connect,3000); }); }
    peer.on('open',function(){ state('servidor-ok'); connect(); });
    peer.on('disconnected',function(){ try{ peer.reconnect(); }catch(e){} });
    peer.on('error',function(err){ if(err.type==='peer-unavailable'){ retryT=setTimeout(connect,3000); } else state('sem-servidor','Sem acesso ao servidor de ligação ('+err.type+'). No mesmo computador continua a funcionar.'); });
  }
  return {
    send:function(m){ m.i=sid+'-'+(++n); raw(m); },
    start:function(r,c,h,i){
      role=r; cod=c; handler=h; info=i;
      if(!window.__NO_BC){ try{ bc=new BroadcastChannel('jsd50-bingo-'+cod); bc.onmessage=function(e){ onmsg(e.data); }; }catch(e){} }
      if(typeof Peer==='undefined'){ state('erro','A biblioteca de ligação não carregou.'); return; }
      if(window.__NO_PEER) return;
      if(r==='display') host(); else join();
    }
  };
})();
function sendCmd(m){ if(ROLE==='ctl') Link.send(m); }
function snapshot(){ return {order:state.order.slice(),winners:state.winners,phrases:state.phrases.slice(),edited:state.edited,mute:state.mute,music:state.music,vol:state.vol,started:started}; }
function sendState(){ if(ROLE==='ctl') Link.send({t:'state',s:snapshot()}); }
function sendStateSoon(){ if(ROLE!=='ctl') return; clearTimeout(saveT); saveT=setTimeout(sendState,250); }
function podiumCmd(){ if(ROLE==='ctl') sendCmd({t:'podium'}); else if(ROLE==='solo'){ if($('podium').hidden) showPodium(); else closePodium(); } }

/* ----- lado do ecrã ----- */
function afterDraw(){ if(pendingState){ var s0=pendingState; pendingState=null; applyState(s0); } }
function applyState(s){
  if(animating){ pendingState=s; return; }
  state.order=(s.order||[]).filter(function(n){return ALL.indexOf(n)>-1}); state.winners=s.winners||{}; if(Array.isArray(s.phrases)&&s.phrases.length===12) state.phrases=s.phrases; state.edited=!!s.edited;
  var oldMute=state.mute; state.mute=!!s.mute; state.music=s.music!==false; state.vol=typeof s.vol==='number'?s.vol:state.vol;
  Som.set(!state.mute); Music.volume(state.vol/100); syncSom(); syncMus();
  if(s.started && !started && !introRunning){ started=true; $('intro').classList.add('gone'); }
  render();
  if(state.mute||!state.music) Music.stop(); else maybeMusic();
}
function onRemote(m){
  switch(m.t){
    case 'hello': ctlSeen=Date.now(); Link.send({t:'ready',need:!hasState}); updPair(); break;
    case 'state': hasState=true; applyState(m.s); break;
    case 'begin': if(!started) runIntro(); break;
    case 'draw': if(started && !animating && remaining().indexOf(m.pick)>-1) runDraw(m.pick); break;
    case 'award': if(m.winners) state.winners=m.winners; render(); award(m.id,m.card); break;
    case 'podium': if($('podium').hidden) showPodium(); else closePodium(); break;
    case 'close': closeAward(); closePodium(); break;
    case 'closing': showClosing(); break;
    case 'newgame': resetNow(false); break;
    case 'intro-again': replayIntro(); break;
  }
}
function updPair(){
  var ok = Date.now()-ctlSeen<9000, p=$('pair');
  // código e dicas só aparecem antes de o comando ligar; depois o ecrã fica só com o programa
  p.hidden = started || ok; p.classList.toggle('on',ok);
  $('pairtxt').innerHTML = 'Código <b>'+code+'</b> · à espera do comando'+(linkMsg?' · '+linkMsg:'');
  if(!started){
    $('ihint').innerHTML = ok ? 'O programa vai começar' : 'O programa vai começar · código de ligação<b>'+code+'</b>à espera do comando';
    if(!audioReady) $('ihint').innerHTML += '<br><span style="font-size:1.1cqw;letter-spacing:.15em">Clica uma vez neste ecrã para ativar o som</span>';
    if(linkMsg) $('ihint').innerHTML += '<br><span style="font-size:1.1cqw;letter-spacing:.15em;color:var(--bad)">'+linkMsg+'</span>';
  }
}
var linkMsg='', audioReady=false;
function genCode(){ var L='BCDFGHJKMNPQRSTVWXZ',c=''; for(var i=0;i<4;i++) c+=L.charAt(rand(L.length)); return c; }
function bootDisplay(){
  try{ code=localStorage.getItem('bingo-codigo')||''; }catch(e){}
  if(!/^[A-Z]{4}$/.test(code)){ code=genCode(); try{ localStorage.setItem('bingo-codigo',code); }catch(e){} }
  Link.start('display',code,onRemote,function(t,msg){ linkMsg=(t==='sem-servidor'||t==='erro')?msg:''; updPair(); });
  setInterval(updPair,2000); updPair();
  var arm=function(){ document.removeEventListener('pointerdown',arm); document.removeEventListener('keydown',arm); try{ Som.ctx(); }catch(e){} audioReady=true; updPair(); maybeMusic(); };
  document.addEventListener('pointerdown',arm); document.addEventListener('keydown',arm);
}

/* ----- lado do comando ----- */
var linkInfo='';
function ctlOk(){ return Date.now()-lastReady<9000; }
function ctlBegin(){ if(!ctlOk()){ toast('Sem ligação ao ecrã.'); return; } sendCmd({t:'begin'}); started=true; animating=true; sendState(); render(); setTimeout(function(){ animating=false; render(); },3800); }
function ctlDraw(pick){
  if(!ctlOk()){ toast('Sem ligação ao ecrã.'); return; }
  animating=true; sendCmd({t:'draw',pick:pick}); render();
  setTimeout(function(){ state.order.push(pick); save(); animating=false; render(); sendState(); },4300);
}
function onCtlMsg(m){ if(m.t==='ready'){ lastReady=Date.now(); if(m.need) sendState(); renderCtl(); } }
function renderCtl(){
  var n=state.order.length, last=n?state.order[n-1]:null, ok=ctlOk();
  var pill=$('c-status'); pill.className='pill '+(ok?'on':'off'); pill.textContent = ok ? 'Ligado ao ecrã' : (linkInfo||'A ligar ao ecrã…');
  $('c-num').textContent = last===null?'?':last; $('c-count').textContent = n+' de 12 sorteados';
  $('c-phrase').textContent = last===null ? 'Ainda nenhuma bola.' : (state.phrases[last-1]||'');
  var all=!!(state.winners.rookie&&state.winners.pro&&state.winners.premium);
  $('c-endbox').classList.toggle('hl', all||ended);
  $('c-endmsg').textContent = ended ? 'O ecrã mostra o encerramento. Carrega em «Começar de novo» para preparar o próximo jogo.' : (all ? 'Os três títulos estão atribuídos. Depois do pódio, encerra o jogo (ecrã de despedida) ou começa de novo.' : 'Quando o jogo acabar: «Encerrar o jogo» mostra o ecrã de despedida; «Começar de novo» apaga tudo e volta ao início.');
  var d=$('c-draw'); d.disabled = !ok || animating || ended || (started && n>=12);
  d.textContent = !started ? 'Começar o programa' : (n>=12 ? 'Sorteio terminado' : (animating ? 'A rodar…' : 'Rodar o globo'));
  $('c-undo').disabled = animating || !n;
  var b=$('c-board'); b.innerHTML=''; ALL.forEach(function(k){ var el=document.createElement('div'); var on=state.order.indexOf(k)>-1; el.className='cmini'+(on?' on':''); el.innerHTML = on?'<span>'+k+'</span>':k; b.appendChild(el); });
  var t=$('c-titles'); t.innerHTML=''; TITULOS.forEach(function(x){ var w=state.winners[x.id]; var el=document.createElement('div'); el.innerHTML='<b>Jota '+x.nome+'</b>'+(w?'<span class="w">Nº '+pad(w.card)+'</span>':'<span style="color:var(--muted)">por atribuir</span>'); t.appendChild(el); });
}
function bootCtl(){
  $('cmd').hidden=false; $('c-regie').appendChild($('regie')); $('regie').hidden=false;
  var saved=''; try{ saved=localStorage.getItem('bingo-codigo-ctl')||''; }catch(e){}
  $('c-code').value=saved;
  function ligar(){ var v=($('c-code').value||'').toUpperCase().replace(/[^A-Z]/g,''); if(v.length!==4){ $('c-pairmsg').textContent='O código tem 4 letras.'; return; } try{ localStorage.setItem('bingo-codigo-ctl',v); }catch(e){} location.reload(); }
  $('c-ligar').addEventListener('click',ligar); $('c-code').addEventListener('keydown',function(e){ if(e.key==='Enter'){ e.preventDefault(); ligar(); } });
  $('c-draw').addEventListener('click',draw); $('c-undo').addEventListener('click',undo); $('c-podium').addEventListener('click',podiumCmd); $('c-close').addEventListener('click',function(){ sendCmd({t:'close'}); }); $('c-end').addEventListener('click',encerrar); $('c-new').addEventListener('click',reset);
  if(/^[A-Z]{4}$/.test(saved)){
    Link.start('ctl',saved,onCtlMsg,function(t,msg){ linkInfo=(t==='sem-servidor'||t==='erro')?msg:''; renderCtl(); });
    function hello(){ Link.send({t:'hello'}); renderCtl(); } hello(); setInterval(hello,3000); setTimeout(hello,800);
  } else { $('c-pairmsg').textContent='Escreve o código que aparece no ecrã.'; $('c-code').focus(); }
  renderCtl();
}
function showModes(){
  document.body.classList.add('no-role'); $('modes').hidden=false;
  Array.prototype.forEach.call(document.querySelectorAll('[data-role]'), function(b){ b.addEventListener('click', function(){ location.hash='#'+b.getAttribute('data-role'); location.reload(); }); });
}

function init(){
  document.body.classList.add('role-'+ROLE);
  if(ROLE!=='display') load();
  Som.set(!state.mute && ROLE!=='ctl'); started = ROLE==='display' ? false : state.order.length>0;
  if(started) $('intro').classList.add('gone');
  if(ROLE!=='ctl'){ Cage.init(); FX.init(); }
  buildFrases(); render(); syncSom(); syncMus(); Music.volume(state.vol/100);
  if(ROLE==='solo' && started){ var arm=function(){ document.removeEventListener('pointerdown',arm); document.removeEventListener('keydown',arm); maybeMusic(); }; document.addEventListener('pointerdown',arm); document.addEventListener('keydown',arm); }
  $('draw').addEventListener('click', draw); $('undo').addEventListener('click', undo); $('reset').addEventListener('click', reset);
  $('close').addEventListener('click', closeRegie); $('newgame').addEventListener('click', function(){ reset(); this.blur(); });
  $('snd').addEventListener('click', toggleSom); $('mus').addEventListener('click', toggleMus);
  $('vol').addEventListener('input', function(){ state.vol=+this.value; $('volo').textContent=state.vol+'%'; Music.volume(state.vol/100); save(); sendState(); });
  $('mbtn').addEventListener('click', function(){ $('mfile').click(); }); $('mfile').addEventListener('change', escolherMusica); $('mreset').addEventListener('click', musicaEstudio);
  $('modo').addEventListener('click', function(){ history.replaceState(null,'',location.pathname+location.search); location.reload(); });
  $('fs').addEventListener('click', function(){ fullscreen(); this.blur(); });
  document.addEventListener('fullscreenchange', function(){ $('fs').textContent = document.fullscreenElement ? 'Sair do ecrã inteiro' : 'Ecrã inteiro'; wakeCtl(); });
  $('stage').addEventListener('click', function(e){ if(ROLE!=='solo' || e.button!==0 || !started) return; if(!$('award').hidden || !$('podium').hidden || !$('closing').hidden) return; draw(); });
  $('vform').addEventListener('submit', onValidar); $('repor').addEventListener('click', repor); $('intro-again').addEventListener('click', replayIntro);
  $('intro').addEventListener('click', function(){ if(ROLE==='solo' && !started) runIntro(); });
  $('award').addEventListener('click', closeAward); $('podium').addEventListener('click', closePodium); $('pbtn').addEventListener('click', function(){ podiumCmd(); this.blur(); }); $('endbtn').addEventListener('click', function(){ encerrar(); this.blur(); });
  Array.prototype.forEach.call(document.querySelectorAll('.tab'), function(t){ t.addEventListener('click', function(){ showTab(t.getAttribute('data-view')); }); });
  document.addEventListener('mousemove', wakeCtl); document.addEventListener('pointerdown', wakeCtl);
  document.addEventListener('keydown', function(e){
    var typing = /INPUT|TEXTAREA/.test(e.target.tagName), k=e.key;
    if(k==='Escape'){ if(!$('award').hidden) closeAward(); else if(!$('podium').hidden) closePodium(); else if(!$('closing').hidden){ closeClosing(); Music.duck(1,1); maybeMusic(); } else closeRegie(); return; }
    if(typing) return;
    if(ROLE==='ctl'){ if((k===' '||k==='Enter'||k==='ArrowRight'||k==='PageDown') && e.target===document.body){ e.preventDefault(); draw(); } return; }
    if(ROLE==='display'){ if(k==='f'||k==='F') fullscreen(); else if(k==='r'||k==='R'){ if($('regie').hidden) openRegie(); else closeRegie(); } else if(k==='m'||k==='M') toggleSom(); return; }
    if(k===' '||k==='Enter'||k==='ArrowRight'||k==='PageDown'){ if(e.target===document.body && $('regie').hidden){ e.preventDefault(); if(!$('award').hidden) closeAward(); else if(!$('podium').hidden) closePodium(); else if(!$('closing').hidden){} else draw(); } }
    else if(k==='r'||k==='R'){ if($('regie').hidden) openRegie(); else closeRegie(); }
    else if(k==='f'||k==='F'){ fullscreen(); }
    else if(k==='p'||k==='P'){ podiumCmd(); }
    else if(k==='m'||k==='M'){ toggleSom(); }
  });
  document.addEventListener('visibilitychange', wake); wake(); wakeCtl();
  if(ROLE==='display') bootDisplay(); else if(ROLE==='ctl') bootCtl();
}
'''
s = s[:i0] + novo + 'if(ROLE) init(); else showModes();' + s[i1+len('init();'):]

# ---------------- documento autónomo ----------------
title = re.search(r'<title>.*?</title>', s).group(0)
s = s.replace(title, '')
s = re.sub(r'<link[^>]*>\s*', '', s)
s = re.sub(r'<meta name="claude:[^>]*>\s*', '', s)
style = re.search(r'<style>.*?</style>', s, re.S).group(0)
s = s.replace(style, '', 1)
def b64(p, mime): return 'data:%s;base64,%s' % (mime, base64.b64encode((raiz/p).read_bytes()).decode())
faces = ''
for w, st in [(300,'normal'),(500,'normal'),(700,'normal'),(800,'normal'),(900,'normal'),(800,'italic'),(900,'italic')]:
    faces += "@font-face{font-family:'Montserrat';font-style:%s;font-weight:%d;src:url(%s) format('woff2')}" % (st, w, b64('assets/fonts/montserrat-latin-%d-%s.woff2' % (w, st), 'font/woff2'))
reset = 'html{color-scheme:dark}body{margin:0;font-size:16px}img{max-width:100%}'
rows = list(csv.DictReader(open(raiz/'impressao/cartoes-bingo-140.csv', encoding='utf-8')))
cartoes = {str(int(r['cartao'])): [int(r['l%d_c%d' % (a, b)]) for a in (1,2,3) for b in (1,2,3,4)] for r in rows}
s = s.replace('/*CARDS*/{}', json.dumps(cartoes, separators=(',', ':')))
s = s.replace('__LOGO_BRANCO__', (raiz/'sorteio/logo-branco.b64').read_text())
peer = (raiz/'sorteio/vendor/peerjs.min.js').read_text(encoding='utf-8').replace('//# sourceMappingURL=peerjs.min.js.map', '')
assert '</script' not in peer
assert '<script>\n(function(){' in s
s = s.replace('<script>\n(function(){', '<script>' + peer + '</script>\n<script>\n(function(){', 1)
doc = ('<!doctype html><html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
       + title.replace('Bingo Cinco Jotas', 'Bingo Cinco Jotas') + '<style>' + reset + faces + '</style>' + style + '</head><body>' + s + '</body></html>')
out = raiz / 'sorteio/bingo-cinco-jotas.html'
out.write_text(doc, encoding='utf-8')
print('escrito', out.name, len(doc)//1024, 'KB')
