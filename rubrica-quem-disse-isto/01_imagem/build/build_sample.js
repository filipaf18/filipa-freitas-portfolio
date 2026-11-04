// Frame de exemplo 9:16 com Apresentador + elementos de marca (para aprovação do estilo)
const { chromium } = require('playwright'); const fs=require('fs'),path=require('path');
const ap=require('./apresentador_flat.js'); const R=path.join(__dirname,'..'); const P=(n)=>`file://${R}/png_brand/${n}.png`;
const svg=(o)=>ap(o).replace('width="600" height="900"','width="760" height="1140"');
const html=(a)=>`<body style="margin:0;width:1080px;height:1920px;position:relative;overflow:hidden;background:#111">
<img src="${P('fundo_estudio_9x16')}" style="position:absolute;inset:0">
<div style="position:absolute;left:160px;top:420px">${svg(a)}</div>
<div style="position:absolute;left:0;right:0;top:1166px;height:26px;background:#E9E9E9"></div><div style="position:absolute;left:0;right:0;top:1192px;height:530px;background:linear-gradient(180deg,#F58220,#D96516)"></div><div style="position:absolute;left:0;right:0;top:1192px;height:14px;background:rgba(0,0,0,.25)"></div>
<img src="file://${R}/brand/overlay_gradiente_9x16.png" style="position:absolute;inset:0;width:1080px;height:1920px">
<img src="${P('cartao_nome_suspeito')}" style="position:absolute;left:30px;top:130px;width:620px">
<img src="${P('cartao_vidro_ficcional')}" style="position:absolute;left:600px;top:70px;width:460px">
<img src="${P('pilula_legenda')}" style="position:absolute;left:40px;top:1470px">
<img src="${P('cartao_vidro_votacao')}" style="position:absolute;left:600px;top:320px;width:440px"></body>`;
(async()=>{const b=await chromium.launch();
for(const [n,a] of [['frame_exemplo_apresentador',{boca:'aberta',sobr:'erguida',cartao:true}]]){
 const p=await b.newPage({viewport:{width:1080,height:1920}});
 const hf=path.join(__dirname,'_s.html'); fs.writeFileSync(hf,html(a)); await p.goto('file://'+hf); await p.waitForTimeout(500); fs.unlinkSync(hf);
 await p.screenshot({path:path.join(R,'png_brand',n+'.png')});}
 await b.close();})();
