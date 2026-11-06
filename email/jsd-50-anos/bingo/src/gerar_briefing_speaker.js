// Briefing do animador (PDF, 2 páginas A4). Uso: node gerar_briefing_speaker.js [saida.pdf]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.argv[2] || path.join(ROOT, 'briefing/briefing-animador-bingo-cinco-jotas.pdf');
const b64 = (f, mime) => `data:${mime};base64,` + fs.readFileSync(path.join(ROOT, f)).toString('base64');
const font = (w, st='normal') => b64(`assets/fonts/montserrat-latin-${w}-${st}.woff2`, 'font/woff2');
const logo = b64('assets/logo-h-preto.png', 'image/png');
const img = (n) => b64('briefing/img/' + n, 'image/jpeg');
const G = 'linear-gradient(100deg,#1EBCE8 0%,#54CFC9 14%,#F8B451 38%,#F86420 62%,#E8452A 100%)';

const css = `
${[[300,'normal'],[500,'normal'],[700,'normal'],[800,'normal'],[900,'italic']].map(([w,st])=>`@font-face{font-family:M;font-weight:${w};font-style:${st};src:url(${font(w,st)}) format('woff2')}`).join('')}
@page{size:A4;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
html,body{font-family:M,sans-serif;color:#0A0701;font-size:8.7pt;line-height:1.42}
.page{position:relative;width:210mm;height:297mm;padding:13mm 15mm 0;overflow:hidden;page-break-after:always;background:#fff}
.page:last-child{page-break-after:auto}
.page::after{content:'';position:absolute;left:0;right:0;bottom:0;height:3mm;background:${G}}
.gt{background:${G};-webkit-background-clip:text;background-clip:text;color:transparent}
.top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:5mm}
.top img{height:11mm}
.kicker{font-size:6.8pt;font-weight:700;letter-spacing:.3em;text-transform:uppercase}
h1{font-weight:300;font-size:23pt;line-height:1.02;text-transform:uppercase;margin-top:1.6mm}
h1 b{font-weight:800;display:block;text-transform:none}
.sub{font-size:8.6pt;font-weight:700;letter-spacing:.25em;text-transform:uppercase;margin-top:2mm;color:#3E352B}
h2{font-size:8.2pt;font-weight:800;letter-spacing:.22em;text-transform:uppercase;margin:5mm 0 2.2mm;padding-bottom:1.3mm;border-bottom:.35mm solid #0A0701}
p{margin-bottom:1.6mm}
.lead{font-size:9.6pt;font-weight:300;max-width:165mm}
.info{display:grid;grid-template-columns:repeat(4,1fr);border:.35mm solid #0A0701;margin-top:4mm}
.info div{padding:2.2mm 2.8mm;border-right:.35mm solid #0A0701}.info div:last-child{border-right:0}
.info small{display:block;font-size:6pt;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#6B6054;margin-bottom:.6mm}
.info b{font-weight:700;font-size:8.6pt;line-height:1.25;display:block}
.flow{display:flex;margin:1mm 0}
.flow div{flex:1;padding:2.4mm 2mm;text-align:center;font-weight:500;font-size:8pt;border:.35mm solid #0A0701;border-right:0}
.flow div:last-child{border-right:.35mm solid #0A0701}
.flow div.on{background:#0A0701;color:#fff;font-weight:800}
.flow small{display:block;font-size:6pt;font-weight:500;letter-spacing:.12em;text-transform:uppercase;opacity:.75;margin-top:.5mm}
.cols{display:grid;grid-template-columns:1fr 60mm;gap:7mm;align-items:start}
ol{list-style:none;counter-reset:s}
ol li{counter-increment:s;display:grid;grid-template-columns:7mm 1fr;gap:2mm;margin-bottom:2.2mm}
ol li::before{content:counter(s);width:6mm;height:6mm;border-radius:50%;background:${G};color:#fff;font-weight:800;font-size:7.6pt;display:flex;align-items:center;justify-content:center;margin-top:.3mm}
ol b{font-weight:800}
.card img{width:100%;display:block;border:.3mm solid #CFC8BE}
.card small{display:block;margin-top:1.2mm;font-size:6.6pt;color:#3E352B;line-height:1.35}
.t{display:grid;grid-template-columns:1fr 11mm;gap:1.6mm;align-items:center;padding:1.5mm 2.4mm;border:.3mm solid #0A0701;margin-top:2mm}
.t.top3{background:#0A0701;color:#fff}
.t .nm{font-size:6pt;font-weight:300;letter-spacing:.3em;text-transform:uppercase;line-height:1}
.t .nm b{display:block;font-weight:800;font-size:11pt;letter-spacing:0;text-transform:none;margin-top:.3mm}
.t p{font-size:6.8pt;font-weight:500;line-height:1.25;margin:.5mm 0 0}
.mini{display:grid;grid-template-columns:repeat(4,1fr);gap:.6mm}
.mini i{aspect-ratio:1;border-radius:50%;border:.22mm solid currentColor;display:block}
.mini i.on{border:0;background:${G}}
.pend{border-left:1.1mm solid #F86420;padding:1.4mm 0 1.4mm 3mm;margin-top:2.5mm;font-size:8pt}
.tbd{font-weight:700;color:#B3470F}
.imgs{display:grid;grid-template-columns:1.25fr 1fr;gap:5mm;align-items:start}
.imgs img{width:100%;display:block;border:.3mm solid #CFC8BE;border-radius:1mm}
.imgs small{display:block;font-size:6.6pt;color:#3E352B;margin-top:1.1mm}
.imgs h3{font-size:9.2pt;font-weight:800;margin-bottom:1.4mm}
ul{list-style:none}
ul li{padding-left:3.6mm;position:relative;margin-bottom:1mm}
ul li::before{content:'';position:absolute;left:0;top:1.6mm;width:1.7mm;height:1.7mm;border-radius:50%;background:${G}}
.two{display:grid;grid-template-columns:1fr 1fr;gap:6mm}
.chk li::before{border-radius:0;background:none;border:.3mm solid #0A0701;width:2.5mm;height:2.5mm;top:.9mm}
.chk li{padding-left:5mm}
.say{margin-bottom:1.6mm;padding:1.5mm 2.6mm;background:#F6F3EE;border-radius:1mm}
.say small{display:block;font-size:5.8pt;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:#6B6054;margin-bottom:.4mm}
.say i{font-style:normal;font-weight:500}
.p2 h2{margin:3.2mm 0 1.6mm}.p2 .say{margin-bottom:1.2mm;padding:1.2mm 2.4mm}.p2 .imgs{grid-template-columns:1.1fr 1fr}.p2 ul li{margin-bottom:.7mm}
.foot{position:absolute;left:15mm;right:15mm;bottom:6.5mm;display:flex;justify-content:space-between;font-size:6.4pt;letter-spacing:.06em;text-transform:uppercase;color:#3E352B}
`;
const mini = (n) => `<div class="mini">${Array.from({length:12},(_,i)=>`<i class="${i<n*4?'on':''}"></i>`).join('')}</div>`;
const titulo = (n, nome, desc, top) => `<div class="t${top?' top3':''}"><div><div class="nm">Jota<b>${nome}</b></div><p>${desc}</p></div>${mini(n)}</div>`;

const p1 = `<div class="page">
 <div class="top"><div><div class="kicker" style="color:#B3470F">Jantar dos 50 anos · JSD Famalicão</div><h1>Bingo<b>Cinco Jotas</b></h1><div class="sub">Briefing do animador</div></div><img src="${logo}"></div>
 <p class="lead">Um bingo das memórias de militância. Cada número do cartão é uma experiência vivida na Jota. O animador anuncia a bola, a experiência aparece no ecrã e quem já a viveu coloca um feijão no número. Ganham títulos os primeiros a completar uma linha, duas linhas ou o cartão inteiro.</p>
 <div class="info">
  <div><small>Quando</small><b>Depois de todos os discursos, antes da abertura do bolo</b></div>
  <div><small>Data e local</small><b>7 nov 2026<br>Sunset House</b></div>
  <div><small>Duração</small><b>~15 min<br><span style="font-weight:500;font-size:7pt">(estimativa)</span></b></div>
  <div><small>Cartões</small><b>140, um por convidado<br>+ feijões</b></div>
 </div>
 <h2>Onde entra no programa</h2>
 <div class="flow"><div>Jantar<small>serviço</small></div><div>Discursos<small>todos</small></div><div class="on">Bingo Cinco Jotas<small style="opacity:.85">~15 min</small></div><div>Abertura do bolo<small>50 anos</small></div></div>
 <h2>Como corre o jogo</h2>
 <div class="cols">
  <ol>
   <li><div><b>Cartões e feijões nas mesas.</b> Cada convidado tem o seu cartão (nº 001 a 140) e feijões pequenos. Estão nos lugares ou são entregues durante a sobremesa.</div></li>
   <li><div><b>Abertura.</b> Quem controla o comando inicia o programa: aparece o genérico no ecrã e entra a música de fundo. O animador apresenta o jogo e explica as regras em 30 segundos.</div></li>
   <li><div><b>Cada bola.</b> O globo roda e sai uma bola de 1 a 12. O animador diz o número. A experiência correspondente aparece no ecrã, na faixa branca, e lê-se em voz alta. <b>Quem já a viveu coloca um feijão</b> no número do cartão; quem não viveu deixa em branco. <b>As frases vão estar no ecrã</b>, por isso o animador não precisa de as decorar.</div></li>
   <li><div><b>Títulos.</b> Quem completar uma linha, duas linhas ou o cartão inteiro levanta o cartão e grita. Cada título é do <b>primeiro</b> a completá-lo.</div></li>
   <li><div><b>Validação.</b> A organização escreve no comando o número do cartão (canto superior direito) e vê que linhas têm os 4 números já sorteados. Confirma, com o cartão na mão, que há um feijão em cada um e atribui o título. O ecrã mostra o cartão, as frases que o jogador cumpriu e o título.</div></li>
   <li><div><b>Pódio.</b> Quando os três títulos estão atribuídos, o ecrã passa sozinho para o pódio: 1.º Jota Premium, 2.º Jota Pro, 3.º Jota Rookie. Segue-se o bolo.</div></li>
  </ol>
  <div>
   <div class="card"><img src="${img('img-cartao-frente.jpg')}"><small><b>O cartão.</b> A6, só com números de 1 a 12, por ordem diferente em cada um. Verso com as regras e os títulos.</small></div>
   ${titulo(1,'Rookie','O primeiro a completar uma linha.')}
   ${titulo(2,'Pro','O primeiro a completar duas linhas.')}
   ${titulo(3,'Premium','O primeiro a completar o cartão.',true)}
  </div>
 </div>
 <div class="pend"><b>Por definir:</b> <span class="tbd">[a definir]</span> quem controla o comando &nbsp;·&nbsp; <span class="tbd">[a definir]</span> prémios físicos, se houver, além dos títulos &nbsp;·&nbsp; <span class="tbd">[por fechar]</span> as frases das 12 experiências</div>
 <div class="foot"><span>Bingo Cinco Jotas · Briefing do animador</span><span>1 / 2</span></div>
</div>`;

const p2 = `<div class="page p2">
 <div class="top" style="margin-bottom:2mm"><div class="kicker" style="color:#B3470F">Ecrãs, preparação e fala</div><img src="${logo}" style="height:9mm"></div>
 <h2 style="margin-top:2mm">Os dois ecrãs</h2>
 <div class="imgs">
  <div><h3>Ecrã (projetor)</h3><img src="${img('img-ecra.jpg')}"><small>O que o público vê. O texto da faixa é provisório: as frases definitivas vão aparecer aqui.</small></div>
  <div><h3>Comando (organização)</h3><img src="${img('img-comando.jpg')}"><small>O que a organização controla, noutro computador ou no telemóvel.</small></div>
 </div>
 <div class="two" style="margin-top:2.5mm">
  <ul>
   <li><b>Ecrã:</b> só mostra o programa e toca a música. Não tem botões de jogo. Só o público vê: globo, bola, frase, títulos, pódio.</li>
   <li><b>Ligação:</b> o ecrã mostra um código de 4 letras antes de começar. Escrevendo-o no comando, ficam ligados.</li>
  </ul>
  <ul>
   <li><b>Comando:</b> Começar o programa, Rodar o globo, Anular último, validar cartão e atribuir títulos, Pódio, frases, volume e Novo jogo.</li>
   <li><b>Rodar:</b> Espaço, Enter, seta direita ou clique (também serve um apresentador de diapositivos).</li>
  </ul>
 </div>
 <div class="two">
  <div>
   <h2>Antes do jantar</h2>
   <ul class="chk">
    <li>Ficheiro do jogo nos dois computadores (Chrome ou Edge).</li>
    <li>Ecrã: abrir, escolher «Ecrã», pôr em ecrã inteiro (F) e <b>clicar uma vez</b> para ativar o som.</li>
    <li>Comando: abrir, escolher «Comando», escrever o código e esperar «Ligado ao ecrã».</li>
    <li>Frases definitivas escritas no separador Frases do comando <span class="tbd">[por fechar]</span>.</li>
    <li><b>Ensaio completo</b> com os dois computadores e o wifi do Sunset House. A internet é precisa só para ligar.</li>
    <li>Cartões e feijões em todas as mesas.</li>
   </ul>
  </div>
  <div>
   <h2>Se algo falhar</h2>
   <ul>
    <li><b>«Sem ligação ao ecrã»:</b> espera uns segundos, volta a ligar sozinho. Se persistir, abre o modo «Tudo neste computador» no computador do ecrã e continua.</li>
    <li><b>Sem som:</b> clicar uma vez no ecrã.</li>
    <li><b>Bola errada:</b> «Anular último».</li>
    <li><b>Título atribuído por engano:</b> «retirar», no separador Validar do comando.</li>
    <li><b>Fechar o ecrã de um título:</b> «Fechar ecrã de título» no comando.</li>
   </ul>
  </div>
 </div>
 <h2>Sugestões de fala <span style="font-weight:500;letter-spacing:.05em;text-transform:none">(a adaptar)</span></h2>
 <div class="say"><small>Abertura</small><i>«Antes de cortarmos o bolo, falta uma última tradição da noite: o <b>Bingo Cinco Jotas</b>! Peguem no cartão e nos feijões que têm à vossa frente.»</i></div>
 <div class="say"><small>Regras em 30 segundos</small><i>«Cada cartão tem 12 bolas numeradas. Eu digo o número da bola e a experiência aparece no ecrã. Quem já a viveu, põe um feijão no número. Quem completar uma linha é Jota Rookie, duas linhas Jota Pro e o cartão inteiro Jota Premium.»</i></div>
 <div class="say"><small>A cada bola</small><i>«Número … Já viveste isto? Está no ecrã!»</i></div>
 <div class="say"><small>Quando alguém levanta o cartão</small><i>«Cartão no ar! A organização vai conferir… Confirmado! Reparem na combinação e nas experiências no ecrã.»</i></div>
 <div class="say"><small>Fecho e passagem para o bolo</small><i>«Cinco décadas, uma identidade! E agora, a cada um no seu lugar: está na hora do bolo dos 50 anos.»</i></div>
 <div class="foot"><span>Bingo Cinco Jotas · Briefing do animador</span><span>2 / 2</span></div>
</div>`;

(async () => {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage();
  await p.setContent(`<!doctype html><meta charset=utf-8><style>${css}</style>${p1}${p2}`);
  await p.evaluate(() => document.fonts.ready);
  await p.pdf({ path: OUT, format: 'A4', printBackground: true, preferCSSPageSize: true });
  await b.close();
})();
