// Verificação do convite tal como chega depois de COLADO no Gmail, em vários ecrãs.
//
// 1. Copia e cola de verdade, no Chromium, para uma caixa editável como a do Gmail (Arial, letra «small»):
//    - A: pelo botão «Copiar convite» de copiar-convites.html (o caminho certo), com a caixa de escrita a 500, 640 e
//         1000 px (janela pequena do Gmail, normal e em ecrã inteiro): ao colar, o Chrome mede o conteúdo nessa largura;
//    - B: abrindo o convite e copiando com Ctrl+A / Ctrl+C (o caminho errado, mas acontece), num computador e num
//         telemóvel;
//    - script: o HTML original, como o envia o script de envio (com <head>).
// 2. Simula o Gmail a mostrar o email recebido: sem <style> nem classes, e sem as propriedades de CSS novas que o
//    Chrome escreve ao colar (text-wrap-mode, text-decoration-line, text-size-adjust) e que o Gmail não conhece.
//    Variantes: sem align nas tabelas, sem align nas células, sem margin:0 auto, sem text-align, letra 25 % maior.
// 3. Em cada ecrã (320 a 1400 px) mede: transbordo horizontal, banner e barras de ponta a ponta, texto centrado no eixo
//    da página, texto à esquerda na margem dos filetes, filetes simétricos, traço e logo no eixo, fotos dos oradores
//    iguais e simétricas, nome e cargo centrados debaixo de cada foto, imagens carregadas.
//
// Uso (a partir de email/politicamente-falando-02/): NODE_PATH=$(npm root -g) node src/verificar.cjs
// Grava previas/colado-*.png e sai com código 1 se alguma verificação falhar.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const AQUI = path.resolve(__dirname, '..');

// As imagens vão por endereço (GitHub e jsdfamalicao.pt). Aqui cada endereço é respondido com o ficheiro igual da pasta
// imagens/ (o site não é acessível deste ambiente); qualquer outro pedido à rede é bloqueado.
const IMAGENS_LOCAIS = path.join(AQUI, 'imagens');
async function imagensLocais(alvo) {
  await alvo.route('**/*', (route) => {
    const url = route.request().url();
    if (!url.startsWith('http')) return route.continue();
    const ficheiro = path.join(IMAGENS_LOCAIS, decodeURIComponent(url.split('?')[0].split('/').pop()));
    if (fs.existsSync(ficheiro)) return route.fulfill({ path: ficheiro });
    return route.abort();
  });
}
const CONVITES = { institucional: 'convite-institucional.html' };
const LARGURAS = [320, 360, 375, 390, 414, 600, 768, 1024, 1400];
const LARGURAS_VARIANTES = [320, 375, 768, 1400];
const TOL = { caixa: 0.5, texto: 1 };

// ---------------------------------------------------------------- o Gmail a mostrar o email recebido
const gmail = (h) => h
  .replace(/<head>[\s\S]*?<\/head>/i, '')
  .replace(/<style[\s\S]*?<\/style>/gi, '')
  .replace(/\sclass="[^"]*"/g, '')
  .replace(/(text-wrap-mode|text-decoration-line|text-size-adjust)\s*:[^;"]*;?\s*/g, '');
const semAttr = (tag, attr) => (h) => h.replace(new RegExp(`(<${tag}\\b[^>]*?)\\s${attr}="[^"]*"`, 'g'), '$1');
const semCss = (re) => (h) => h.replace(re, '');
const amplia = (h) => h.replace(/font-size:\s*([\d.]+)px/g, (m, v) => (+v > 1 ? `font-size:${(+v * 1.25).toFixed(1)}px` : m));
const VARIANTES = {
  'Gmail': (h) => h,
  'sem align nas tabelas': semAttr('table', 'align'),
  'sem align nas células': semAttr('td', 'align'),
  'sem margin:0 auto': semCss(/margin:\s*0(px)?\s+auto;?/g),
  'sem text-align': semCss(/text-align:\s*\w+;?/g),
  'letra 25% maior': amplia,
  'sem font-size:0 nem line-height:0 (info)': semCss(/(font-size:\s*0(px)?|line-height:\s*0(px)?)\s*;?/g),
  'sem display:block nas imagens (info)': (h) => h.replace(/(<img\b[^>]*?style="[^"]*?)display:\s*block;?/g, '$1'),
  'sem width nas tabelas (info)': semAttr('table', 'width'),
  'sem cellpadding/cellspacing/border (info)': (h) => semAttr('table', 'border')(semAttr('table', 'cellspacing')(semAttr('table', 'cellpadding')(h))),
  'sem atributos de largura/altura nas imagens (info)': (h) => semAttr('img', 'height')(semAttr('img', 'width')(h)),
};
// combinações que só se registam: o caminho errado (Ctrl+C troca os espaços do tema por &nbsp;) com letra 25 % maior
// num ecrã de 320 px, e os clientes que ignorassem font-size:0 ou display:block (as barras e o traço engrossam).
const informativo = (fonte, variante) => variante.includes('(info)') || (fonte.includes(' B:') && variante === 'letra 25% maior');
const documento = (corpo) => `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0">${corpo}</body></html>`;

// ---------------------------------------------------------------- medições
const MEDIR = () => {
  const W = document.documentElement.clientWidth, eixo = W / 2, res = [];
  const add = (classe, desvio, onde) => res.push([classe, Math.max(0, desvio), onde]);
  const R = (el) => el.getBoundingClientRect();
  const curto = (s) => s.replace(/\s+/g, ' ').trim().slice(0, 30);
  add('transbordo horizontal', document.documentElement.scrollWidth - W, `${document.documentElement.scrollWidth} px`);
  for (const el of document.querySelectorAll('body *')) {
    const b = R(el);
    if (b.width > 0 && b.height > 0 && (b.right > W + 0.5 || b.left < -0.5)) add('elemento fora do ecrã', Math.max(b.right - W, -b.left), `${el.tagName} ${curto(el.alt || el.textContent)}`);
  }
  const imgs = [...document.images];
  for (const i of imgs) {
    if (!i.complete || !i.naturalWidth) { add('imagem partida', 99, i.alt); continue; }
    const b = R(i);
    add('imagens sem deformação (%)', Math.abs((b.width / b.height) / (i.naturalWidth / i.naturalHeight) - 1) * 100, i.alt);
  }
  const img = (alt) => imgs.find((i) => i.alt.startsWith(alt));
  const banner = img('Politicamente Falando');
  if (banner) { const b = R(banner); add('banner de ponta a ponta', Math.abs(b.left) + Math.abs(b.right - W), ''); }
  for (const td of document.querySelectorAll('td[height="6"]')) { const b = R(td); add('barras de ponta a ponta', Math.abs(b.left) + Math.abs(b.right - W), ''); }
  let margem = null;
  // filetes da data: as bordas de cima e de baixo da tabela dos dados
  for (const t of [...document.querySelectorAll('table, div')].filter((t) => parseFloat(getComputedStyle(t).borderTopWidth) > 0)) {
    const b = R(t); add('filetes: margens iguais', Math.abs(b.left - (W - b.right)), ''); margem = margem ?? b.left;
  }
  if (margem === null) add('filetes da data em falta', 99, '');
  for (const td of document.querySelectorAll('td[height="2"]')) { const b = R(td); add('traço no eixo', Math.abs((b.left + b.right) / 2 - eixo), ''); }
  const logo = img('50 anos JSD');
  if (logo) { const b = R(logo); add('logo no eixo', Math.abs((b.left + b.right) / 2 - eixo), ''); }
  const eva = img('Eva Brás Pinho'), alv = img('Álvaro Oliveira');
  if (eva && alv) {
    const e = R(eva), a = R(alv);
    add('fotos: mesma largura', Math.abs(e.width - a.width), `${e.width.toFixed(1)} / ${a.width.toFixed(1)} px`);
    add('fotos: par simétrico no eixo', Math.abs((e.left + a.right) / 2 - eixo), '');
    add('fotos: mesma altura na página', Math.abs(e.top - a.top), '');
    for (const f of [eva, alv]) {
      const cel = f.closest('table').closest('td'), c = R(cel), cs = getComputedStyle(cel), fb = R(f);
      const cx = (c.left + parseFloat(cs.paddingLeft) + c.right - parseFloat(cs.paddingRight)) / 2;
      add('fotos: centradas na coluna', Math.abs((fb.left + fb.right) / 2 - cx), f.alt);
    }
  }
  const signature = img('Assinatura');
  if (signature && margem !== null) add('texto à esquerda na margem dos filetes', Math.abs(R(signature).left - margem), 'assinatura');
  // células e linhas de texto em <div> (a data): cada uma medida pela sua própria tinta
  for (const td of document.querySelectorAll('td, div')) {
    if (td.tagName === 'DIV' && (td.querySelector('div') || !td.closest('td'))) continue;
    const rects = [];
    const w = document.createTreeWalker(td, NodeFilter.SHOW_TEXT, { acceptNode: (n) =>
      (n.textContent.replace(/[\s ]/g, '') && n.parentElement.closest('td, div') === td) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT });
    let n;
    while ((n = w.nextNode())) {
      const rg = document.createRange(); rg.selectNodeContents(n);
      for (const q of rg.getClientRects()) if (q.width > 0.5) rects.push({ l: q.left, r: q.right, t: q.top, b: q.bottom, s: n.textContent });
    }
    if (!rects.length) continue;
    rects.sort((x, y) => (x.t + x.b) - (y.t + y.b));
    const linhas = [];
    for (const q of rects) {
      const m = (q.t + q.b) / 2, L = linhas[linhas.length - 1];
      if (L && Math.abs(m - L.m) < 0.6 * (q.b - q.t)) { L.l = Math.min(L.l, q.l); L.r = Math.max(L.r, q.r); L.s += q.s; }
      else linhas.push({ l: q.l, r: q.r, m, s: q.s });
    }
    const alinh = getComputedStyle(td).textAlign;
    const orador = td.tagName === 'TD' && !!td.closest('table').closest('td') && [eva, alv].some((f) => f && f.closest('table') === td.closest('table'));
    for (const L of linhas) {
      if (alinh === 'center' || alinh === '-webkit-center') {
        if (orador) {
          const b = R(td), cs = getComputedStyle(td);
          add('nome e cargo centrados debaixo da foto', Math.abs((L.l + L.r) / 2 - (b.left + parseFloat(cs.paddingLeft) + b.right - parseFloat(cs.paddingRight)) / 2), curto(L.s));
        } else add('texto centrado no eixo', Math.abs((L.l + L.r) / 2 - eixo), curto(L.s));
      } else if (margem !== null && !orador) add('texto à esquerda na margem dos filetes', Math.abs(L.l - margem), curto(L.s));
    }
  }
  return res;
};
const LIMITE = (classe) => (/texto|nome|deformação/.test(classe) ? TOL.texto : TOL.caixa);

// ---------------------------------------------------------------- copiar e colar de verdade
async function colar(ctx, larguraCaixa) {
  const p = await ctx.newPage();
  await p.setViewportSize({ width: larguraCaixa + 60, height: 900 });
  await p.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:20px">
    <div id="caixa" contenteditable="true" style="width:${larguraCaixa}px;min-height:300px;font-family:Arial,Helvetica,sans-serif;font-size:small"></div></body></html>`);
  await p.click('#caixa');
  await p.keyboard.press('Control+V');
  await p.waitForTimeout(300);
  const h = await p.$eval('#caixa', (e) => e.innerHTML);
  await p.close();
  return h;
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
  await imagensLocais(ctx);
  const fontes = {};       // `${convite} ${fonte}` → HTML colado (ou original)
  for (const [chave, ficheiro] of Object.entries(CONVITES)) {
    for (const caixa of [500, 640, 1000]) {
      const p = await ctx.newPage();
      await p.goto('file://' + path.join(AQUI, 'copiar-convites.html'));
      await p.click(`button[data-copiar="${chave}"]`);
      fontes[`${chave} A: botão, caixa de ${caixa} px`] = await colar(ctx, caixa);
      await p.close();
    }
    for (const [rotulo, largura] of [['computador', 1400], ['telemóvel', 390]]) {
      const p = await ctx.newPage();
      await p.setViewportSize({ width: largura, height: 900 });
      await p.goto('file://' + path.join(AQUI, ficheiro));
      await p.keyboard.press('Control+A'); await p.keyboard.press('Control+C');
      fontes[`${chave} B: Ctrl+A/C no ${rotulo}`] = await colar(ctx, 640);
      await p.close();
    }
    fontes[`${chave} script (HTML original)`] = fs.readFileSync(path.join(AQUI, ficheiro), 'utf8');
  }

  const page = await ctx.newPage();
  const resumo = [];
  let falhas = 0;
  for (const [fonte, html] of Object.entries(fontes)) {
    const script = fonte.includes('script');
    const variantes = script ? { 'original': (h) => h, ...VARIANTES } : VARIANTES;
    for (const [nomeVar, fn] of Object.entries(variantes)) {
      const doc = nomeVar === 'original' ? html : documento(fn(gmail(html)));
      const pior = {};
      const ws = nomeVar === 'Gmail' || nomeVar === 'original' ? LARGURAS : LARGURAS_VARIANTES;
      const recorte = nomeVar.startsWith('sem font-size') && fonte === 'institucional A: botão, caixa de 640 px';
      for (const w of ws) {
        await page.setViewportSize({ width: w, height: 900 });
        await page.setContent(doc, { waitUntil: 'load' });
        for (const [classe, desvio, onde] of await page.evaluate(MEDIR)) {
          if (!(classe in pior) || desvio > pior[classe][0]) pior[classe] = [desvio, `${w}px ${onde}`];
        }
        if (nomeVar === 'Gmail' && /institucional A: botão, caixa de 640|institucional B: Ctrl\+A\/C no computador/.test(fonte) && (w === 375 || w === 1400)) {
          const nome = `previas/colado-${fonte.includes(' A:') ? 'botao' : 'ctrl-c'}-${w === 375 ? 'telemovel' : 'computador'}.png`;
          await page.screenshot({ path: path.join(AQUI, nome), fullPage: true });
        }
        if (recorte && w === 375) await page.screenshot({ path: path.join(AQUI, 'previas/colado-sem-font-size-0-telemovel.png'), fullPage: true });
      }
      const maus = Object.entries(pior).filter(([c, [d]]) => d > LIMITE(c) + 1e-6);
      const max = Math.max(0, ...Object.values(pior).map(([d]) => d));
      const info = informativo(fonte, nomeVar);
      console.log(`${maus.length ? (info ? 'info ' : 'FALHA') : 'ok   '} ${fonte} · ${nomeVar}: ${Object.keys(pior).length} verificações, desvio máx. ${max.toFixed(2)} px`);
      for (const [c, [d, onde]] of maus.sort((x, y) => y[1][0] - x[1][0])) console.log(`        ${c}: ${d.toFixed(2)} px em ${onde}`);
      falhas += maus.length && !info ? 1 : 0;
      resumo.push(maus.length);
    }
  }
  await browser.close();
  console.log(falhas ? `${falhas} casos com falhas` : `sem falhas (${resumo.length} casos)`);
  process.exit(falhas ? 1 : 0);
})();
