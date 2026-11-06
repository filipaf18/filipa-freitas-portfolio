// Briefing do animador (PDF, 2 páginas A4). Uso: node gerar_briefing_speaker.js [saida.pdf]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.argv[2] || path.join(ROOT, 'briefing/briefing-animador-bingo-cinco-jotas.pdf');
const b64 = (f, mime) => `data:${mime};base64,` + fs.readFileSync(path.join(ROOT, f)).toString('base64');
const font = (w, st='normal') => b64(`assets/fonts/montserrat-latin-${w}-${st}.woff2`, 'font/woff2');
const logo = b64('assets/logo-h-preto.png', 'image/png');
const img = (n) => b64('briefing/img/' + n, 'image/jpeg');
const box = JSON.parse(fs.readFileSync(path.join(ROOT, 'briefing/img/_box.json'), 'utf8'));
const G = 'linear-gradient(100deg,#1EBCE8 0%,#54CFC9 14%,#F8B451 38%,#F86420 62%,#E8452A 100%)';

const css = `
${[[300,'normal'],[500,'normal'],[700,'normal'],[800,'normal']].map(([w,st])=>`@font-face{font-family:M;font-weight:${w};font-style:${st};src:url(${font(w,st)}) format('woff2')}`).join('')}
@page{size:A4;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
html,body{font-family:M,sans-serif;color:#0A0701;font-size:9.6pt;line-height:1.45}
.page{position:relative;width:210mm;height:297mm;padding:13mm 16mm 0;overflow:hidden;page-break-after:always;background:#fff}
.page:last-child{page-break-after:auto}
.page::after{content:'';position:absolute;left:0;right:0;bottom:0;height:3mm;background:${G}}
.top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4mm}
.top img{height:11mm}
.kicker{font-size:7pt;font-weight:700;letter-spacing:.28em;text-transform:uppercase;color:#B3470F}
h1{font-weight:300;font-size:22pt;line-height:1.02;text-transform:uppercase;margin-top:1.6mm}
h1 b{font-weight:800;display:block;text-transform:none}
.sub{font-size:8.6pt;font-weight:700;letter-spacing:.24em;text-transform:uppercase;margin-top:1.6mm;color:#3E352B}
h2{font-size:11.5pt;font-weight:800;margin:5.5mm 0 2.4mm;display:flex;align-items:center;gap:2.4mm}
h2 span{display:inline-flex;width:6.4mm;height:6.4mm;border-radius:50%;background:${G};color:#fff;font-size:8.6pt;align-items:center;justify-content:center;flex:none}
p{margin-bottom:1.8mm}
.strip{display:grid;grid-template-columns:1.5fr 1fr 1fr;border:.35mm solid #0A0701}
.strip div{padding:2.2mm 3mm;border-right:.35mm solid #0A0701}.strip div:last-child{border-right:0}
.strip small{display:block;font-size:6.4pt;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#6B6054;margin-bottom:.5mm}
.strip b{font-weight:700;font-size:9pt;line-height:1.25;display:block}
.steps3{display:grid;grid-template-columns:repeat(3,1fr);gap:4mm}
.s3{border:.35mm solid #0A0701;border-radius:1.6mm;padding:3mm 3.4mm}
.s3 .n{font-size:20pt;font-weight:800;line-height:1;color:#F86420;display:block}
.s3 h3{font-size:10.4pt;font-weight:800;margin:1.2mm 0 1mm}
.s3 p{font-size:8.9pt;margin:0}
.note{font-size:8.9pt;margin-top:2.4mm;color:#3E352B}
.titles{display:grid;grid-template-columns:repeat(3,1fr);gap:4mm}
.ttl{border:.35mm solid #0A0701;border-radius:1.6mm;padding:3mm 3.4mm;display:flex;flex-direction:column;gap:1.4mm}
.ttl.top3{background:#0A0701;color:#fff}
.ttl small{font-size:6.6pt;font-weight:300;letter-spacing:.34em;text-transform:uppercase;line-height:1}
.ttl b.nm{font-size:15pt;font-weight:800;line-height:1}
.ttl .rule{font-size:9.4pt;font-weight:800;line-height:1.25}
.ttl .det{font-size:8.5pt;font-weight:500;line-height:1.35;opacity:.85}
.grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:1mm;width:34mm}
.grid4 i{aspect-ratio:1;border-radius:50%;border:.28mm solid currentColor;display:block;opacity:.55}
.grid4 i.on{border:0;background:${G};opacity:1}
.rules{margin-top:3mm}
ul{list-style:none}
ul li{padding-left:4.6mm;position:relative;margin-bottom:1.5mm}
ul li::before{content:'';position:absolute;left:0;top:1.7mm;width:2mm;height:2mm;border-radius:50%;background:${G}}
.pend{border-left:1.2mm solid #F86420;padding:2mm 0 2mm 3.4mm;margin-top:3.6mm;background:#FBF6F0}
.pend b{font-weight:800}
.tbd{font-weight:800;color:#B3470F}
.vfig{position:relative}
.vfig img{width:100%;display:block;border:.3mm solid #CFC8BE;border-radius:1.6mm}
.mk{position:absolute;width:6.2mm;height:6.2mm;margin:-3.1mm 0 0 -3.1mm;border-radius:50%;background:#F86420;color:#fff;font-weight:800;font-size:9pt;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 .7mm #fff}
.val{display:grid;grid-template-columns:78mm 1fr;gap:6mm;align-items:start}
ol{list-style:none;counter-reset:s}
ol li{counter-increment:s;display:grid;grid-template-columns:7.4mm 1fr;gap:2.4mm;margin-bottom:2.8mm}
ol li::before{content:counter(s);width:6.4mm;height:6.4mm;border-radius:50%;background:${G};color:#fff;font-weight:800;font-size:8.6pt;display:flex;align-items:center;justify-content:center;margin-top:.1mm}
ol.v li.fis::before{background:#0A0701}
ol b{font-weight:800}
.legend{font-size:8pt;color:#3E352B;margin-top:1.6mm}
.two{display:grid;grid-template-columns:1fr 1fr;gap:6mm}
.card2{border:.35mm solid #0A0701;border-radius:1.6mm;padding:3mm 3.4mm}
.card2 h3{font-size:10.6pt;font-weight:800;margin-bottom:1.2mm}
.card2 p{font-size:8.9pt;margin-bottom:1mm}
.chk li::before{border-radius:0;background:none;border:.3mm solid #0A0701;width:2.6mm;height:2.6mm;top:1.4mm}
.small ul li{font-size:8.9pt;margin-bottom:1.1mm}
.foot{position:absolute;left:16mm;right:16mm;bottom:6.5mm;display:flex;justify-content:space-between;font-size:6.6pt;letter-spacing:.06em;text-transform:uppercase;color:#3E352B}
`;
const g = (n) => `<div class="grid4">${Array.from({length:12},(_,i)=>`<i class="${i<n*4?'on':''}"></i>`).join('')}</div>`;
const W = box.regie.w, H = box.regie.h;
const mk = (n, x, y) => `<div class="mk" style="left:${(x/W*100).toFixed(1)}%;top:${(y/H*100).toFixed(1)}%">${n}</div>`;

const p1 = `<div class="page">
 <div class="top"><div><div class="kicker">Jantar dos 50 anos · JSD Famalicão</div><h1>Bingo<b>Cinco Jotas</b></h1><div class="sub">Briefing do animador · 1. As regras</div></div><img src="${logo}"></div>
 <div class="strip">
  <div><small>Quando</small><b>Depois de todos os discursos, antes da abertura do bolo</b></div>
  <div><small>Onde</small><b>7 nov 2026<br>Sunset House</b></div>
  <div><small>Cartões</small><b>140, um por convidado, e feijões</b></div>
 </div>

 <h2><span>1</span>O jogo, em três passos que se repetem</h2>
 <div class="steps3">
  <div class="s3"><span class="n">1</span><h3>Sai uma bola</h3><p>O globo roda e sai um número de 1 a 12. O animador diz o número em voz alta.</p></div>
  <div class="s3"><span class="n">2</span><h3>Lê-se a experiência</h3><p>A frase aparece no ecrã, por baixo da bola. O animador lê-a e pergunta: «Já viveste isto?». <b>As frases vão estar no ecrã.</b></p></div>
  <div class="s3"><span class="n">3</span><h3>Feijão no número</h3><p>Quem já viveu essa experiência põe um feijão nesse número, no seu cartão. Quem não viveu deixa em branco.</p></div>
 </div>
 <p class="note">Cada cartão tem os 12 números, por ordem diferente. Repete-se com a bola seguinte, até estarem atribuídos os três títulos ou terem saído as 12 bolas.</p>

 <h2><span>2</span>Como se ganha: os três títulos</h2>
 <div class="titles">
  <div class="ttl"><small>Jota</small><b class="nm">Rookie</b>${g(1)}<div class="rule">O primeiro a completar uma linha</div><div class="det">Uma linha são as 4 casas da mesma fila, na horizontal.</div></div>
  <div class="ttl"><small>Jota</small><b class="nm">Pro</b>${g(2)}<div class="rule">O primeiro a completar duas linhas</div><div class="det">Duas filas completas, quaisquer duas.</div></div>
  <div class="ttl top3"><small>Jota</small><b class="nm">Premium</b>${g(3)}<div class="rule">O primeiro a completar o cartão</div><div class="det">As 12 casas com feijão. Só acontece quando as 12 bolas já saíram.</div></div>
 </div>
 <div class="rules"><ul>
  <li><b>Completar</b> é ter feijão em todos os números da linha, e todos esses números já terem saído do globo.</li>
  <li>Só contam <b>linhas na horizontal</b>. Colunas e diagonais não contam.</li>
  <li>Cada título tem <b>um só vencedor</b>: o primeiro cartão levantado que a organização confirmar.</li>
  <li>Só se põe feijão no que se viveu. <b>A organização confere o cartão</b> antes de atribuir o título.</li>
  <li>O jogo acaba quando os três títulos estão atribuídos. O ecrã mostra então o <b>pódio</b>: 1.º Premium, 2.º Pro, 3.º Rookie. Segue-se o bolo.</li>
 </ul></div>
 <div class="pend"><b>Ainda por decidir:</b> <span class="tbd">[por decidir]</span> se dois cartões gritarem ao mesmo tempo &nbsp;·&nbsp; <span class="tbd">[por decidir]</span> se o mesmo cartão pode ganhar mais de um título &nbsp;·&nbsp; <span class="tbd">[a definir]</span> prémios físicos, se houver &nbsp;·&nbsp; <span class="tbd">[a definir]</span> quem controla o comando &nbsp;·&nbsp; <span class="tbd">[por fechar]</span> as frases das 12 experiências</div>
 <div class="foot"><span>Bingo Cinco Jotas · Briefing do animador</span><span>1 / 2</span></div>
</div>`;

const p2 = `<div class="page">
 <div class="top" style="margin-bottom:1mm"><div><div class="kicker">Briefing do animador · 2. O comando (régie)</div><h1 style="font-size:17pt">Como validar um cartão<b style="font-size:17pt">e atribuir o título</b></h1></div><img src="${logo}" style="height:9mm"></div>
 <p style="margin-top:1mm">O <b>comando</b> é o computador da organização, onde se controla o jogo. A <b>régie</b> é a parte do comando onde se valida um cartão. O público não vê nada disto: só vê o ecrã do projetor.</p>

 <div class="val" style="margin-top:2mm">
  <div>
   <div class="vfig"><img src="${img('img-validar.jpg')}">
    ${mk(2, box.vform.x + box.vform.w + 6 - 330, box.vform.y + box.vform.h/2)}
    ${mk(3, box.vgrid.x + box.vgrid.w + 24, box.vgrid.y + box.vgrid.h/2)}
    ${mk(4, 560, box.rows[0].y + box.rows[0].h*1.5)}
    ${mk(6, box.assign.x + box.assign.w + 24, box.assign.y + box.assign.h/2)}
   </div>
   <p class="legend">Exemplo: o cartão nº 2, com uma linha completa. Só aparece o botão do título que este cartão pode ter.</p>
  </div>
  <ol class="v">
   <li class="fis"><div><b>Pede o cartão</b> a quem gritou e lê o número no canto superior direito.</div></li>
   <li><div><b>Escreve o número</b> do cartão na caixa «Nº do cartão» e carrega em <b>Conferir</b>.</div></li>
   <li><div>Vê o cartão no comando. Os números <b>iluminados já saíram</b> do globo; os apagados ainda não.</div></li>
   <li><div>Lê as <b>linhas</b>. Cada uma diz «completa» (os 4 números já saíram) ou «faltam números».</div></li>
   <li class="fis"><div><b>Confirma no cartão físico</b> que há um feijão em todos os números da linha, e em mais nenhum que não tenha saído.</div></li>
   <li><div>Carrega em <b>Atribuir Jota…</b> no botão do título. Rookie aparece com 1 linha completa, Pro com 2 e Premium com as 3.</div></li>
  </ol>
 </div>
 <p class="legend" style="margin-top:1mm"><b>Preto:</b> passo com o cartão na mão. <b>Cor:</b> passo no comando. Enganaste-te? Carrega em «retirar» ao lado do título.</p>

 <h2 style="margin-top:4mm"><span>→</span>O que o ecrã mostra</h2>
 <ul>
  <li><b>Ao atribuir um título:</b> «Parabéns», o título, o número do cartão e as <b>frases que o jogador cumpriu</b> (4 para o Rookie, 8 para o Pro, 12 para o Premium). Fecha sozinho passados uns segundos, ou com «Fechar ecrã de título» no comando.</li>
  <li><b>Com os três títulos atribuídos:</b> o ecrã passa sozinho ao pódio. Se o jogo acabar sem os três, o botão <b>Pódio</b> mostra os lugares preenchidos.</li>
 </ul>

 <div class="two" style="margin-top:3.6mm">
  <div class="card2 small"><h3>Preparar antes do jantar</h3><ul class="chk">
   <li>Ficheiro do jogo nos dois computadores (Chrome ou Edge).</li>
   <li><b>Ecrã:</b> abrir, escolher «Ecrã», ecrã inteiro (F) e <b>clicar uma vez</b> para ativar o som. Aparece um código de 4 letras.</li>
   <li><b>Comando:</b> abrir, escolher «Comando», escrever o código e esperar «Ligado ao ecrã».</li>
   <li>Frases definitivas no separador Frases do comando <span class="tbd">[por fechar]</span>.</li>
   <li><b>Ensaio completo</b> com o wifi do Sunset House. A internet só é precisa para ligar.</li>
  </ul></div>
  <div class="card2 small"><h3>Durante o jogo, no comando</h3><ul>
   <li><b>Começar o programa:</b> abertura e música.</li>
   <li><b>Rodar o globo:</b> botão, Espaço, Enter, seta direita ou clique.</li>
   <li><b>Anular último:</b> se saiu uma bola por engano.</li>
  </ul>
  <h3 style="margin-top:2mm">Se algo falhar</h3><ul>
   <li><b>«Sem ligação ao ecrã»:</b> espera uns segundos. Se persistir, abre o modo «Tudo neste computador» no computador do ecrã.</li>
   <li><b>Sem som:</b> clica uma vez no ecrã.</li>
  </ul></div>
 </div>
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
