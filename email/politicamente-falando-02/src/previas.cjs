// Pré-visualizações e verificação de transbordo: cada convite no computador e no telemóvel, tal como é e como fica
// depois de colado no Gmail (sem o <head>, logo sem o <style> responsivo).
// Uso (a partir de email/politicamente-falando-02/): NODE_PATH=$(npm root -g) node src/previas.cjs
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const { readFileSync } = fs;
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

(async () => {

const CONVITES = ['convite-institucional', 'convite-geral'];
const LARGURAS = [320, 360, 375, 390, 414, 768, 1024, 1400];
const PREVIAS = { telemovel: 375, desktop: 1400 };

const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
let falhas = 0;
for (const nome of CONVITES) {
  const original = readFileSync(`${nome}.html`, 'utf8');
  const colado = original.replace(/<head>[\s\S]*?<\/head>/, '');
  for (const [versao, html] of [['original', original], ['colado', colado]]) {
    for (const largura of LARGURAS) {
      const page = await browser.newPage({ viewport: { width: largura, height: 900 }, deviceScaleFactor: 1 });
      await imagensLocais(page);
      await page.setContent(html, { waitUntil: 'load' });
      const r = await page.evaluate(() => {
        const W = document.documentElement.clientWidth;
        const fora = [...document.querySelectorAll('body *')].filter((e) => {
          const b = e.getBoundingClientRect();
          return b.width > 0 && (b.right > W + 0.5 || b.left < -0.5);
        }).map((e) => e.tagName + (e.className ? '.' + e.className : ''));
        const imgs = [...document.images].filter((i) => !i.complete || i.naturalWidth === 0).length;
        const tema = document.querySelector('.t-tema');
        const linhasTema = tema ? Math.round(tema.getBoundingClientRect().height / parseFloat(getComputedStyle(tema).lineHeight)) : 0;
        return { scroll: document.documentElement.scrollWidth, W, fora: fora.slice(0, 5), imgs, linhasTema };
      });
      const ok = r.scroll <= r.W && r.fora.length === 0 && r.imgs === 0;
      if (!ok) falhas++;
      console.log(`${ok ? 'ok ' : 'FALHA'} ${nome} ${versao} ${largura}px: largura ${r.scroll}/${r.W}, tema em ${r.linhasTema} linhas` +
        (r.fora.length ? `, fora do ecrã: ${r.fora.join(' ')}` : '') + (r.imgs ? `, ${r.imgs} imagens partidas` : ''));
      for (const [rotulo, w] of Object.entries(PREVIAS)) {
        if (w === largura && versao === 'original') {
          await page.screenshot({ path: `previas/${nome}-${rotulo}.png`, fullPage: true });
        }
      }
      await page.close();
    }
  }
}
await browser.close();
console.log(falhas ? `${falhas} falhas` : 'sem falhas');
process.exit(falhas ? 1 : 0);
})();
