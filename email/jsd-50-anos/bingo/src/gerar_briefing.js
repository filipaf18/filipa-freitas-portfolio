// Briefing do jogo (PDF, 2 páginas A4). Uso: node gerar_briefing.js [ficheiro_saida.pdf]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.argv[2] || path.join(ROOT, 'briefing/briefing-bingo-3js.pdf');
const b64 = (f, mime) => `data:${mime};base64,` + fs.readFileSync(path.join(ROOT, f)).toString('base64');
const font = (w) => b64(`assets/fonts/montserrat-latin-${w}-normal.woff2`, 'font/woff2');
const logo = b64('assets/logo-h-preto.png', 'image/png');
const cartao = b64('fase1-v6/bingo-A6.png', 'image/png');
const G = 'linear-gradient(100deg,#1EBCE8 0%,#54CFC9 14%,#F8B451 38%,#F86420 62%,#E8452A 100%)';

const exemplos = [
 'Ir a um congresso','Comer 3 bifanas num só dia de campanha','Colar cartazes de madrugada',
 'Fazer campanha porta a porta','Distribuir panfletos à chuva','Ficar sem voz num comício',
 'Viajar de autocarro para um evento da Jota','Dormir na sede','Ter estado numa lista candidata',
 'Fazer uma intervenção numa reunião','Levar um amigo para a Jota','Já ter sido eleito para um cargo'];

const css = `
${[300,500,700,800].map(w=>`@font-face{font-family:M;font-weight:${w};src:url(${font(w)}) format('woff2')}`).join('')}
@page{size:A4;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
html,body{font-family:M,sans-serif;color:#0A0701;font-size:9pt;line-height:1.45}
.page{position:relative;width:210mm;height:297mm;padding:15mm 16mm 0;overflow:hidden;page-break-after:always;background:#fff}
.page:last-child{page-break-after:auto}
.page::after{content:'';position:absolute;left:0;right:0;bottom:0;height:3.2mm;background:${G}}
.gt{background:${G};-webkit-background-clip:text;background-clip:text;color:transparent}
.top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:7mm}
.top img{height:12mm}
.kicker{font-size:7pt;font-weight:700;letter-spacing:.3em;text-transform:uppercase}
h1{font-weight:300;font-size:25pt;line-height:1.05;text-transform:uppercase;margin-top:2mm}
h1 b{font-weight:800;display:block;text-transform:none}
h2{font-size:9pt;font-weight:800;letter-spacing:.22em;text-transform:uppercase;margin:4.2mm 0 2mm;padding-bottom:1.2mm;border-bottom:.35mm solid #0A0701}
p{margin-bottom:2mm}
.info{display:grid;grid-template-columns:repeat(4,1fr);border:.35mm solid #0A0701;margin-top:5mm}
.info div{padding:2.6mm 3mm;border-right:.35mm solid #0A0701}.info div:last-child{border-right:0}
.info small{display:block;font-size:6.2pt;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#6B6054;margin-bottom:.8mm}
.info b{font-weight:700;font-size:9.4pt;line-height:1.25;display:block}
.flow{display:flex;align-items:stretch;gap:0;margin:1mm 0 1mm}
.flow div{flex:1;padding:3mm 2.6mm;text-align:center;font-weight:500;font-size:8.2pt;border:.35mm solid #0A0701;border-right:0}
.flow div:last-child{border-right:.35mm solid #0A0701}
.flow div.on{background:#0A0701;color:#fff;font-weight:800;letter-spacing:.04em}
.flow small{display:block;font-size:6.2pt;font-weight:500;letter-spacing:.12em;text-transform:uppercase;opacity:.75;margin-top:.8mm}
ol.steps{list-style:none;counter-reset:s}
ol.steps li{counter-increment:s;display:grid;grid-template-columns:8mm 1fr;gap:2mm;margin-bottom:2.3mm}
ol.steps li::before{content:counter(s);width:6.4mm;height:6.4mm;border-radius:50%;background:${G};color:#fff;font-weight:800;font-size:8pt;display:flex;align-items:center;justify-content:center}
ol.steps b{font-weight:800}
.tiers{display:grid;grid-template-columns:repeat(3,1fr);gap:3mm;margin:3mm 0 1mm}.tiers div{border:.35mm solid #0A0701;padding:2.4mm 3mm;text-align:center}.tiers b{display:block;font-size:17pt;font-weight:800}.tiers span{font-size:7.4pt;font-weight:500;line-height:1.3;display:block}.tiers .top3{background:#0A0701;color:#fff}
.box{border-left:1.2mm solid #F86420;padding:1.4mm 0 1.4mm 3.2mm;margin:2.4mm 0 0}
.tbd{font-weight:700;color:#B3470F}
.cols{display:grid;grid-template-columns:78mm 1fr;gap:7mm;align-items:start}
.card img{width:100%;display:block;border:.3mm solid #CFC8BE}
.card small{display:block;margin-top:1.6mm;font-size:7pt;color:#3E352B}
table{border-collapse:collapse;width:100%;font-size:8.3pt}
td{border-bottom:.25mm solid #D9D2C8;padding:1.1mm 1mm;vertical-align:middle}
td.n{width:8mm;font-weight:800;color:#F86420;font-size:10pt}
.say{margin-bottom:1.4mm;padding:1.3mm 3mm;background:#F6F3EE;border-radius:1mm}
.say small{display:block;font-size:6.2pt;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:#6B6054;margin-bottom:.8mm}
.say i{font-style:normal;font-weight:500}
ul.chk{list-style:none}
ul.chk li{padding-left:5mm;position:relative;margin-bottom:1.3mm}
ul.chk li::before{content:'';position:absolute;left:0;top:1.1mm;width:2.8mm;height:2.8mm;border:.3mm solid #0A0701}
.foot{position:absolute;left:16mm;right:16mm;bottom:7.5mm;display:flex;justify-content:space-between;font-size:6.6pt;letter-spacing:.06em;text-transform:uppercase;color:#3E352B}
`;

const p1 = `<div class="page">
 <div class="top"><div><div class="kicker gt">Jantar dos 50 anos · JSD Famalicão</div><h1>Bingo<b>3J’s</b></h1></div><img src="${logo}"></div>
 <p style="font-size:10.5pt;font-weight:300;max-width:150mm">Um bingo das memórias de militância: cada número do cartão é uma coisa que se vive na Jota (ir a um congresso, comer três bifanas num só dia de campanha…). A cada número sorteado, quem já o viveu risca a bola. Os prémios são títulos, como nos vinhos: <b>1J, 2J’s e 3J’s</b>.</p>
 <div class="info">
  <div><small>Quando</small><b>Depois de todos os discursos, antes da abertura do bolo</b></div>
  <div><small>Data e local</small><b>7 nov 2026<br>Sunset House</b></div>
  <div><small>Duração</small><b>~15 min<br><span style="font-weight:500;font-size:7.5pt">(sugestão)</span></b></div>
  <div><small>Participantes</small><b>132 convidados<br>1 cartão cada</b></div>
 </div>

 <h2>Onde entra no programa</h2>
 <div class="flow"><div>Jantar<small>serviço</small></div><div>Discursos<small>todos</small></div><div class="on">Bingo 3J’s<small style="opacity:.85">~15 min</small></div><div>Abertura do bolo<small>50 anos</small></div></div>
 <p style="font-size:8pt;color:#3E352B;margin-top:2mm">O bingo serve de ponte: depois de um bloco mais formal, devolve energia à sala e prepara o momento do bolo. Todos continuam sentados nas suas mesas.</p>

 <h2>Como funciona</h2>
 <ol class="steps">
  <li><div><b>Cartões nas mesas.</b> Cada convidado tem o seu cartão (Nº 001 a 132) e uma caneta. Os cartões já estão em cada lugar, ou são distribuídos durante a sobremesa.</div></li>
  <li><div><b>O animador explica em 30 segundos.</b> Cada cartão tem 12 bolas numeradas de 1 a 12. Cada número é uma experiência de militância, que o animador lê em voz alta (e que aparece no ecrã).</div></li>
  <li><div><b>Sorteio.</b> O animador sorteia um número de cada vez, sem repetir, e lê a experiência. <b>Quem já a viveu risca a bola</b> desse número; quem não viveu, deixa em branco. O cartão não tem texto: só os números.</div></li>
  <li><div><b>1J, 2J’s, 3J’s.</b> Quem completar uma <b>linha de 4 bolas</b> levanta o cartão e grita «1J!» (e, mais adiante, «2J’s!» ou «3J’s!»). Como cada cartão tem os mesmos números por ordem diferente, as linhas completam-se em momentos diferentes e não há dois cartões com o mesmo padrão de vitória.</div></li>
  <li><div><b>Validação.</b> A organização confere o número do cartão (canto superior direito) com a folha de controlo e, para animar, pede ao vencedor que conte a história de uma das bolas. Entrega o título e o jogo continua até ao 3J’s (ou até saírem os 12 números); segue-se o bolo.</div></li>
 </ol>
<div class="tiers"><div><b>1J</b><span>uma linha<br>(4 bolas)</span></div><div><b>2J’s</b><span>duas linhas<br>(8 bolas)</span></div><div class="top3"><b>3J’s</b><span>cartão cheio<br>(12 bolas)</span></div></div>
 <div class="box"><b>Prémios por título:</b> <span class="tbd">[a definir]</span> &nbsp;·&nbsp; <b>Método de sorteio:</b> <span class="tbd">[a definir: saco de bolas, cartas ou ecrã]</span> &nbsp;·&nbsp; <b>Animador:</b> <span class="tbd">[a definir]</span></div>
 <div class="foot"><span>Bingo 3J’s · Briefing</span><span>1 / 2</span></div>
</div>`;

const p2 = `<div class="page">
 <div class="top" style="margin-bottom:2mm"><div><div class="kicker gt">Amostra e exemplos</div></div><img src="${logo}" style="height:9mm"></div>
 <div class="cols">
  <div class="card"><img src="${cartao}"><small><b>Amostra do cartão</b> (A6 horizontal, 148×105 mm). A ordem dos números muda em cada um dos 132 cartões. O design ainda pode sofrer alterações.</small></div>
  <div>
   <h2 style="margin-top:0">Experiências de exemplo</h2>
   <table>${exemplos.map((t,i)=>`<tr><td class="n">${i+1}</td><td>${t}</td></tr>`).join('')}</table>
   <p style="font-size:7.2pt;color:#6B6054;margin-top:1.8mm">Exemplos ilustrativos. A lista definitiva das 12 experiências está por fechar.</p>
  </div>
 </div>

 <h2>Frases de exemplo para o animador</h2>
 <div class="say"><small>Abertura</small><i>«Antes de cortarmos o bolo, falta uma última tradição da noite: o <b>Bingo 3J’s</b>! Vamos descobrir quem, nesta sala, é 1J, 2J’s ou mesmo 3J’s — como nos vinhos, quanto mais J’s, mais vivido! Peguem no cartão que têm à vossa frente.»</i></div>
 <div class="say"><small>Regras em 30 segundos</small><i>«Cada cartão tem 12 bolas, numeradas de 1 a 12. Eu sorteio um número e leio uma experiência de militância. Quem já a viveu, risca a bola. Quem completar uma linha de quatro, levanta o cartão e grita 1J!»</i></div>
 <div class="say"><small>A cada sorteio</small><i>«Número <b>2</b>! Já comeste três bifanas num só dia de campanha? Quem sim, risca o 2… e quem quiser, levante a mão e conte-nos onde foi!»</i></div>
 <div class="say"><small>Quando alguém completa um título</small><i>«Cartão no ar, não mexam! A organização vai conferir o número… Confirmado: temos um <b>1J</b>! Quem será o primeiro 2J’s? E o 3J’s, o militante premium desta noite?»</i></div>
 <div class="say"><small>Fecho e passagem para o bolo</small><i>«Cinco décadas, uma identidade — e todas estas histórias fazem parte dela. A cada um no seu lugar: está na hora do <b>bolo dos 50 anos</b>!»</i></div>


 <h2>Para a organização</h2>
 <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 8mm">
  <ul class="chk"><li>132 cartões impressos em A6, numerados 001–132</li><li>Folha de controlo (CSV) com a disposição de cada cartão, nas mãos dos validadores</li><li>Canetas ou marcadores em todas as mesas</li></ul>
  <ul class="chk"><li>Lista das 12 experiências no ecrã ou na mão do animador</li><li>Microfone e sorteador (bolas, cartas ou ecrã)</li><li>Prémio e quem o entrega</li></ul>
 </div>
 <div class="foot"><span>Bingo 3J’s · Briefing</span><span>2 / 2</span></div>
</div>`;

(async()=>{
  fs.mkdirSync(path.dirname(OUT),{recursive:true});
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.setContent(`<!doctype html><meta charset=utf-8><style>${css}</style>${p1}${p2}`);
  await p.evaluate(()=>document.fonts.ready);
  await p.pdf({path:OUT,format:'A4',printBackground:true,preferCSSPageSize:true});
  await b.close();
})();
