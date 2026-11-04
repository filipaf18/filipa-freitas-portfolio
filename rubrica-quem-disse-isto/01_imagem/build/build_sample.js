// Frame de exemplo 9:16 com Apresentador + elementos de marca (para aprovação do estilo)
const { chromium } = require('playwright'); const fs=require('fs'),path=require('path');
const ap=require('./apresentador_flat.js'); const R=path.join(__dirname,'..'); const P=(n)=>`file://${R}/png_brand/${n}.png`;
const svg=(o)=>ap(o).replace('width="600" height="900"','width="760" height="1140"');
const P2=(n)=>`file://${R}/png_brand/${n}.png`;
const svg2=(o,w)=>ap(o).replace('width="600" height="900"',`width="${w}" height="${w*1.5}"`);
const html=(a)=>`<body style="margin:0;width:1920px;height:1080px;position:relative;overflow:hidden;background:#111">
<img src="${P2('fundo_estudio_16x9')}" style="position:absolute;inset:0">
<div style="position:absolute;left:700px;top:90px;width:520px;height:600px;overflow:hidden">${svg2(a,520)}</div>
<img src="${P2('cartao_vidro_frase')}" style="position:absolute;left:1260px;top:60px;width:620px">
<img src="${P2('mesa_estudio_16x9')}" style="position:absolute;inset:0">
<img src="${P2('overlay_gradiente_16x9')}" style="position:absolute;inset:0">
<img src="${P2('cartao_nome_suspeito')}" style="position:absolute;left:60px;top:40px;width:520px">
<img src="${P2('cartao_vidro_ficcional')}" style="position:absolute;left:60px;top:200px;width:460px">
<img src="${P2('pilula_legenda')}" style="position:absolute;left:60px;top:880px">
<img src="${P2('cartao_vidro_votacao')}" style="position:absolute;left:1500px;top:760px;width:380px"></body>`;
(async()=>{const b=await chromium.launch();
for(const [n,a] of [['frame_exemplo_16x9',{boca:'aberta',sobr:'erguida',cartao:true}]]){
 const p=await b.newPage({viewport:{width:1920,height:1080}});
 const hf=path.join(__dirname,'_s.html'); fs.writeFileSync(hf,html(a)); await p.goto('file://'+hf); await p.waitForTimeout(500); fs.unlinkSync(hf);
 await p.screenshot({path:path.join(R,'png_brand',n+'.png')});}
 await b.close();})();
