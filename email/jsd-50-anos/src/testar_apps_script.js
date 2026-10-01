// Testa os ficheiros .gs de apps-script/ fora do Google, com simulações de MailApp, Utilities e Session.
// Corre testeParaMim() e confirma, para cada email: sem imagens data:, todos os cid: com o seu anexo (e nenhum
// anexo a mais), bytes das imagens iguais aos ficheiros originais, e HTML igual ao dos ficheiros v7 a v12 quando
// os cid: voltam a ser imagens base64.
// Uso (a partir de email/jsd-50-anos/):  node src/testar_apps_script.js
const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto');

const aqui = path.resolve(__dirname, '..');
const pasta = path.join(aqui, 'apps-script');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const enviados = [];

const contexto = {
  Utilities: {
    base64Decode: s => Buffer.from(s, 'base64'),
    newBlob: (dados, mime, nome) => ({ dados: Buffer.from(dados), mime, nome }),
  },
  MailApp: { sendEmail: (para, assunto, texto, opcoes) => enviados.push({ para, assunto, texto, opcoes }) },
  Session: { getEffectiveUser: () => ({ getEmail: () => 'teste@exemplo.pt' }) },
  Logger: { log: m => console.log('  [Logger]', m) },
};
vm.createContext(contexto);
for (const f of ['Imagens.gs', 'ImagensDressCode.gs', 'Convites.gs', 'Enviar.gs']) {
  // «const» de topo não fica no contexto do vm: acrescenta-se a leitura de EMAILS no fim
  vm.runInContext(fs.readFileSync(path.join(pasta, f), 'utf8'), contexto, { filename: f });
}
vm.runInContext('this.EMAILS_ = EMAILS;', contexto);

const ficheiros = {
  'convite-geral': 'v7-convite-geral.html', 'convite-institucional': 'v8-convite-institucional.html',
  'lembrete-geral': 'v9-lembrete-geral.html', 'lembrete-institucional': 'v10-lembrete-institucional.html',
  'confirmacao-geral': 'v11-confirmacao-geral.html', 'confirmacao-institucional': 'v12-confirmacao-institucional.html',
};
const originais = {
  'banner-jantar.jpg': 'banner-jantar.jpg', 'logo-50-anos.png': 'logo-50-anos.png',
  'dresscode-casual-chic.jpg': 'dresscode/dresscode-casual-chic.jpg', 'classe-bar-logo.png': 'dresscode/classe-bar-logo.png',
};

let erros = 0;
const falha = m => { erros++; console.log('  FALHA:', m); };

vm.runInContext('testeParaMim()', contexto);
if (enviados.length !== Object.keys(ficheiros).length) falha(`esperava ${Object.keys(ficheiros).length} emails e foram ${enviados.length}`);

const chaves = Object.keys(contexto.EMAILS_);          // testeParaMim envia pela ordem de EMAILS
enviados.forEach((e, i) => { e.chave = chaves[i]; });
for (const e of enviados) {
  const html = e.opcoes.htmlBody, imagens = e.opcoes.inlineImages;
  console.log(`${e.chave}: «${e.assunto}», HTML ${(html.length / 1024).toFixed(0)} KB, anexos: ${Object.keys(imagens).join(', ')}`);
  if (e.para !== 'teste@exemplo.pt') falha('destinatário errado');
  if (!e.texto || e.texto.length < 200) falha('texto simples vazio ou curto');
  if (!html.includes('<!DOCTYPE html>') || !html.includes('<head>')) falha('o HTML devia chegar completo, com <head>');
  if (/data:image/.test(html)) falha('sobrou uma imagem data:');
  if (/src="https?:/.test(html)) falha('sobrou uma imagem externa');
  const usados = [...new Set([...html.matchAll(/src="cid:([^"]+)"/g)].map(m => m[1]))].sort();
  const anexados = Object.keys(imagens).sort();
  if (JSON.stringify(usados) !== JSON.stringify(anexados)) falha(`cid usados [${usados}] ≠ anexos [${anexados}]`);
  if (e.opcoes.name !== 'JSD Famalicão') falha('nome do remetente');
  // as imagens anexadas são exatamente os ficheiros originais, e o HTML é o mesmo dos ficheiros v7 a v12
  let reconstruido = html;
  for (const nome of anexados) {
    const b = imagens[nome];
    const orig = fs.readFileSync(path.join(aqui, originais[b.nome]));
    if (sha(b.dados) !== sha(orig)) falha(`bytes de «${nome}» diferentes de ${originais[b.nome]}`);
    reconstruido = reconstruido.split(`cid:${nome}`).join(`data:${b.mime};base64,${b.dados.toString('base64')}`);
  }
  const fonte = fs.readFileSync(path.join(aqui, ficheiros[e.chave]), 'utf8');
  if (reconstruido !== fonte) falha(`HTML reconstruído ≠ ${ficheiros[e.chave]}`);
  const emHtml = fs.readFileSync(path.join(pasta, 'html', ficheiros[e.chave]), 'utf8');
  if (emHtml !== html) falha('html/ e Convites.gs diferem');
}
// erro claro quando falta uma chave
try { vm.runInContext("enviarEmail('a@b.pt', 'nao-existe')", contexto); falha('devia dar erro com chave desconhecida'); } catch (x) { console.log('  chave desconhecida →', x.message.split('.')[0]); }
console.log(erros ? `\n${erros} FALHAS` : '\nTudo certo: 6 emails, imagens e HTML iguais aos originais.');
process.exit(erros ? 1 : 0);
