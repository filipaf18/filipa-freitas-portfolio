// Testa apps-script/EnvioPelaFolha.gs fora do Google, com simulações de SpreadsheetApp, MailApp (com quota diária),
// HtmlService, LockService, ScriptApp, Session, Utilities e Logger. Usa os HTML reais v7 e v8 como «convite» e
// «convite_institucional». Confirma: respeito pela quota, paragem sem marcar «Erro», retoma no dia seguinte sem
// duplicados, nova tentativa dos erros de quota antigos, personalização (saudação e género), envio automático.
// Uso (a partir de email/jsd-50-anos/):  node src/testar_envio_folha.js
const fs = require('fs'), path = require('path'), vm = require('vm');
const aqui = path.resolve(__dirname, '..');
const codigo = fs.readFileSync(path.join(aqui, 'apps-script', 'EnvioPelaFolha.gs'), 'utf8');
// PARTES=1 node src/testar_envio_folha.js → corre tudo com o código dividido (apps-script/partes/), carregado por ordem inversa
const pastaPartes = path.join(aqui, 'apps-script', 'partes');
const modoPartes = !!process.env.PARTES;
const ficheirosPartes = fs.readdirSync(pastaPartes).filter(f => /^Parte\d+\.gs$/.test(f)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
const HTML = {
  convite: fs.readFileSync(path.join(aqui, 'v7-convite-geral.html'), 'utf8'),
  convite_institucional: fs.readFileSync(path.join(aqui, 'v8-convite-institucional.html'), 'utf8'),
};
let erros = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { erros++; console.log('  FALHA:', m); } else if (process.env.VERBOSO) console.log('  ok:', m); };
const titulo = t => console.log('\n' + t);

class Folha {
  static leituras = 0;
  constructor(pessoas, ficheiro = '', separador = 'Folha1') { this.linhas = pessoas.map(p => [p[0], p[1], p[2] || '', p[3] || '']); this.ficheiro = ficheiro; this.separador = separador; this.cabecalho = ['Nome', 'Email', 'Género', 'Email Enviado?']; }
  getName() { return this.separador; }
  getLastRow() { Folha.leituras++; return this.linhas.length + 1; }
  getRange(r, c, nr, nc) {
    const f = this;
    if (r === 1) return { getValues: () => [f.cabecalho.slice(c - 1, c - 1 + nc)] };
    return {
      getValues: () => f.linhas.slice(r - 2, r - 2 + nr).map(l => l.slice(c - 1, c - 1 + nc)),
      setValue: v => { f.linhas[r - 2][c - 1] = v; },
    };
  }
  estados() { return this.linhas.map(l => l[3]); }
}

function ambiente({ geral = [], institucional = [], quota = 100, ecra = true, falhaAposEnvios = null, quotaMentirosa = false, rolante = false, semente = null, reserva = 0, hora = 10, horasSemReserva = 0, inicioDosEnvios = '', emailsDeTeste = [], omitirParte = null, modificarParte = {}, extraCodigo = [] }) {
  const e = { enviados: [], alertas: [], logs: [], sleeps: 0, gatilhos: [], travaOcupada: false, quota, usados: 0, hora, leituras: 0, agora: Date.UTC(2026, 9, 3, 10, 0), props: {}, marcas: [], registos: [], htmls: Object.assign({}, HTML) };
  e.folhaGeral = new Folha(geral, 'Militantes Base'); e.folhaInst = new Folha(institucional, 'Convidados 50 anos');
  const c = {
    SpreadsheetApp: {
      openByUrl: url => {
        const f = url.includes('GERAL') ? e.folhaGeral : url.includes('INSTITUCIONAL') ? e.folhaInst : null;
        if (!f) throw new Error('endereço desconhecido: ' + url);
        return { getName: () => f.ficheiro, getSheets: () => [f] };
      },
      getUi: () => { if (!ecra) throw new Error('sem ecrã (acionador)'); return { alert: m => e.alertas.push(m), createMenu: () => { const m = { addItem: () => m, addSeparator: () => m, addToUi: () => {} }; return m; } }; },
    },
    MailApp: {
      getRemainingDailyQuota: () => quotaMentirosa ? 1000 : rolante ? e.quota - e.marcas.filter(t => t > e.agora - 24 * 3600000).length : e.quota - e.usados,
      sendEmail: (m, assunto, texto) => {
        const restante = rolante ? e.quota - e.marcas.filter(t => t > e.agora - 24 * 3600000).length : e.quota - e.usados;
        if (restante <= 0 || (falhaAposEnvios !== null && e.enviados.length >= falhaAposEnvios))
          throw new Error('Service invoked too many times for one day: email.');
        e.usados++; e.marcas.push(e.agora);
        e.enviados.push(typeof m === 'string' ? { to: m, subject: assunto, body: texto } : m);
        e.registos.push({ to: typeof m === 'string' ? m : m.to, t: e.agora, restante: restante - 1 });
      },
    },
    HtmlService: { createHtmlOutputFromFile: nome => { if (!(nome in e.htmls)) throw new Error('No HTML file named ' + nome); return { getContent: () => e.htmls[nome] }; } },
    Utilities: { sleep: () => { e.sleeps++; }, formatDate: () => '01/10/2026 09:00' },
    Session: { getScriptTimeZone: () => 'Europe/Lisbon', getEffectiveUser: () => ({ getEmail: () => 'jsd@exemplo.pt' }) },
    LockService: { getScriptLock: () => ({ tryLock: () => !e.travaOcupada, releaseLock: () => {} }) },
    ScriptApp: {
      newTrigger: fn => { const g = { fn, horas: null, minutos: null }; const b = { timeBased: () => b, everyHours: h => { g.horas = h; return b; }, everyMinutes: m => { g.minutos = m; return b; }, create: () => { e.gatilhos.push(g); } }; return b; },
      getProjectTriggers: () => e.gatilhos.map(g => ({ getHandlerFunction: () => g.fn, _g: g })),
      deleteTrigger: t => { e.gatilhos = e.gatilhos.filter(g => g !== t._g); },
    },
    Logger: { log: m => e.logs.push(m) },
    Date: class extends Date { getHours() { return e.hora; } static now() { return e.agora; } },   // hora e relógio controlados pelo teste
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => (k in e.props ? e.props[k] : null), setProperty: (k, v) => { e.props[k] = String(v); }, deleteProperty: k => { delete e.props[k]; } }) },
    Math: semente === null ? Math : Object.assign(Object.create(Math), { random: mulberry32(semente) }), String, RegExp, Error, Object, Array, JSON,
  };
  vm.createContext(c);
  if (modoPartes) {
    for (const f of ficheirosPartes.slice().reverse()) {
      if (f === omitirParte) continue;
      const txt = fs.readFileSync(path.join(pastaPartes, f), 'utf8');
      vm.runInContext(modificarParte[f] ? modificarParte[f](txt) : txt, c, { filename: f });
    }
    for (const x of extraCodigo) vm.runInContext(x, c);
  } else {
    vm.runInContext(codigo, c, { filename: 'EnvioPelaFolha.gs' });
  }
  c.URL_FOLHA_INSTITUCIONAL = 'https://docs.google.com/spreadsheets/d/INSTITUCIONAL111/edit?usp=sharing';
  c.URL_FOLHA_GERAL = 'https://docs.google.com/spreadsheets/d/GERAL222/edit?usp=sharing';
  vm.runInContext(`RESERVA_QUOTA = ${reserva}; HORAS_SEM_RESERVA = ${horasSemReserva}; INICIO_DOS_ENVIOS = ${JSON.stringify(inicioDosEnvios)}; EMAILS_DE_TESTE = ${JSON.stringify(emailsDeTeste)};`, c);
  e.c = c; e.correr = js => vm.runInContext(js, c);
  return e;
}
const H = 3600 * 1000, MIN = 60 * 1000;
const mulberry32 = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
/** Corre o acionador de minuto a minuto: avança o relógio um minuto de cada vez (e a hora do dia) até «parar()» ou ao fim. */
const minutos = (e, n, parar) => { for (let i = 0; i < n; i++) { e.agora += MIN; e.hora = new Date(e.agora).getUTCHours(); e.correr('envioAutomatico()'); if (parar && parar()) return i + 1; } return n; };
const pessoas = (k, prefixo = 'p', g = 'masculino') => Array.from({ length: k }, (_, i) => [`${prefixo}${i} Silva Santos`, `${prefixo}${i}@exemplo.pt`, g]);
const unicos = a => new Set(a).size === a.length;

// ------------------------------------------------------------------ 1. a quota da Google é respeitada
titulo('1. 150 pessoas, quota de 100: envia 100, pára, e não marca nenhum «Erro»');
let e = ambiente({ geral: pessoas(150), quota: 100 });
e.correr('enviarConvites()');
ok(e.enviados.length === 100, `enviou ${e.enviados.length}, esperava 100`);
ok(e.folhaGeral.estados().filter(s => s === '').length === 50, 'as 50 que faltam devem ficar em branco');
ok(!e.folhaGeral.estados().some(s => /^Erro/.test(s)), 'nenhuma linha deve ficar com «Erro»');
ok(e.folhaGeral.estados().filter(s => /^Enviado a /.test(s)).length === 100, '100 linhas «Enviado a …»');
ok(/quota diária/.test(e.alertas[0]) && /50 pessoas/.test(e.alertas[0]), 'o resumo diz que a quota acabou e quantas faltam');
ok(e.sleeps === 99, 'pausa de 1 s entre envios no envio manual (não depois do último)');

titulo('2. no dia seguinte (quota renovada) envia só as 50 que faltam, sem duplicados');
e.usados = 0;
const antes = e.enviados.length;
e.correr('enviarConvites()');
ok(e.enviados.length - antes === 50, `enviou ${e.enviados.length - antes}, esperava 50`);
ok(unicos(e.enviados.map(m => m.to)) && e.enviados.length === 150, '150 destinatários diferentes, sem repetir ninguém');
ok(e.folhaGeral.estados().every(s => /^Enviado a /.test(s)), 'todas marcadas como enviadas');
e.usados = 0; e.enviados.length = 0; e.alertas.length = 0;
e.correr('enviarConvites()');
ok(e.enviados.length === 0 && /ninguém por enviar/.test(e.alertas[0]), 'uma 3.ª vez não envia nada');

// ------------------------------------------------------------------ 3. o que já ficou com «Erro» da quota é retomado
titulo('3. linhas com o erro de quota da versão anterior voltam a ser tentadas; outros erros e enviados não');
e = ambiente({ geral: [
  ['A Um', 'a@exemplo.pt', 'f', 'Enviado a 30/09/2026'],
  ['B Dois', 'b@exemplo.pt', 'm', 'Erro: Service invoked too many times for one day: email.'],
  ['C Tres', 'c@exemplo.pt', 'm', 'Erro: Invalid email: c@'],
  ['D Quatro', 'd@exemplo.pt', 'f', ''],
], quota: 100 });
e.correr('enviarConvites()');
ok(e.enviados.map(m => m.to).join() === 'b@exemplo.pt,d@exemplo.pt', `enviou para ${e.enviados.map(m => m.to)}`);
ok(e.folhaGeral.estados()[2] === 'Erro: Invalid email: c@', 'o outro erro fica como estava, à vista');

// ------------------------------------------------------------------ 4. quota que o Google reporta mal
titulo('4. a Google recusa um envio a meio (quota mais baixa do que a indicada): pára, não marca, não insiste');
e = ambiente({ geral: pessoas(30), quota: 1000, quotaMentirosa: true, falhaAposEnvios: 10 });
e.correr('enviarConvites()');
ok(e.enviados.length === 10, `enviou ${e.enviados.length}`);
ok(e.folhaGeral.estados().slice(10).every(s => s === ''), 'as linhas seguintes ficam em branco (não ficam com «Erro»)');
ok(!e.folhaGeral.estados().some(s => /^Erro/.test(s)), 'sem erros marcados');

// ------------------------------------------------------------------ 5. quota baixa já à partida
titulo('5. quota restante 28 (testes e outros envios já gastaram parte): envia 28');
e = ambiente({ geral: pessoas(60), quota: 100 }); e.usados = 72;
e.correr('enviarConvites()');
ok(e.enviados.length === 28, `enviou ${e.enviados.length}, esperava 28`);
e.alertas.length = 0; e.correr('enviarConvites()');
ok(e.enviados.length === 28 && /esgotou/.test(e.alertas[0]), 'com a quota a zero não tenta enviar e explica');

// ------------------------------------------------------------------ 6. personalização com os HTML reais
titulo('6. saudação e género, com os HTML reais (v7 geral e v8 institucional)');
const corpo = m => m.htmlBody;
e = ambiente({ geral: [['Maria João Ferreira', 'm@exemplo.pt', 'Feminino'], ['', '', ''], ['José Pedro Alves', 'j@exemplo.pt', 'masculino']],
               institucional: [['Ana Costa', 'a@exemplo.pt', 'f'], ['Rui Dias', 'r@exemplo.pt', ''], ['Tom & <Jerry> Cat', 't@exemplo.pt', 'm']] });
e.correr('enviarConvites()'); e.correr('enviarConvitesInstitucionais()');
const [gF, gM, iF, iM, iX] = e.enviados;
ok(corpo(gF).includes('Cara Maria Ferreira,') && !corpo(gF).includes('companheir'), 'geral feminino: «Cara Maria Ferreira,»');
ok(corpo(gM).includes('Caro José Alves,'), 'geral masculino: «Caro José Alves,»');
ok(corpo(iF).includes('Estimada companheira Ana Costa,') && corpo(iF).includes('que a convidamos'), 'institucional feminino: «Estimada companheira Ana Costa,» e «que a convidamos»');
ok(corpo(iM).includes('Estimado companheiro Rui Dias,') && corpo(iM).includes('que o convidamos'), 'institucional masculino: «Estimado companheiro Rui Dias,»');
ok(corpo(iX).includes('Estimado companheiro Tom Cat,'), 'nome com várias partes: só o primeiro e o último');
const nomeEsc = ambiente({ geral: [['A & B <x> Cruz', 'x@exemplo.pt', 'm']] }); nomeEsc.correr('enviarConvites()');
ok(corpo(nomeEsc.enviados[0]).includes('Caro A Cruz,'), 'primeiro e último nome');
const nomeEsc2 = ambiente({ geral: [['A&B <x>', 'x@exemplo.pt', 'm']] }); nomeEsc2.correr('enviarConvites()');
ok(corpo(nomeEsc2.enviados[0]).includes('Caro A&amp;B &lt;x&gt;,'), 'caracteres especiais escapados: ' + (corpo(nomeEsc2.enviados[0]).match(/Caro [^,]*,/) || [''])[0]);
for (const m of e.enviados) ok(!/\((a|o|A|O)\)/.test(m.htmlBody.replace(/<[^>]+>/g, ' ')), `sobrou «(a)» ou «(o)» no texto de ${m.to}`);
ok(e.enviados.length === 5, 'a linha em branco no meio da lista é saltada e quem vem depois também recebe');
ok(e.enviados.every(m => m.subject === '50 Anos JSD Famalicão · Jantar Comemorativo' && m.name === 'JSD Famalicão'), 'assunto e remetente');
ok(e.enviados.every(m => m.body && m.body.length > 200 && !/<[a-z]/i.test(m.body) && /50 anos/.test(m.body)), 'texto simples presente e sem etiquetas');
ok(e.enviados.every(m => /https:\/\/jsdfamalicao\.pt\/convite\/capa-evento-email\.png/.test(m.htmlBody)), 'HTML com as imagens por endereço');

// ------------------------------------------------------------------ 7. emails inválidos e linhas em branco
titulo('7. email sem «@» fica marcado; não bloqueia os seguintes');
e = ambiente({ geral: [['X Y', 'sem-arroba', 'm'], ['Z W', 'z@exemplo.pt', 'f']] });
e.correr('enviarConvites()');
ok(e.folhaGeral.estados()[0] === 'Erro: email inválido' && /^Enviado/.test(e.folhaGeral.estados()[1]), 'marcado e segue');

// ------------------------------------------------------------------ 8. sem ecrã (acionador) e com a trava ocupada
titulo('8. sem ecrã (acionador) não rebenta; com outra execução em curso não envia');
e = ambiente({ geral: pessoas(3), ecra: false });
let rebentou = false; try { e.correr('enviarConvites()'); } catch (x) { rebentou = true; }
ok(!rebentou && e.enviados.length === 3 && /3 emails/.test(e.logs.join()), 'envia e regista no registo em vez de abrir uma caixa');
e = ambiente({ geral: pessoas(3) }); e.travaOcupada = true; e.correr('enviarConvites()');
ok(e.enviados.length === 0 && /a decorrer/.test(e.alertas[0]), 'trava ocupada: não envia');

// ------------------------------------------------------------------ 9. tempo máximo por execução
titulo('9. pára ao fim do tempo máximo e continua depois');
e = ambiente({ geral: pessoas(10) }); e.correr('TEMPO_MAXIMO_MS = -1');
e.correr('enviarConvites()');
ok(e.enviados.length === 0 && /5 minutos/.test(e.alertas[0]), 'pára por tempo');
e.correr('TEMPO_MAXIMO_MS = 300000'); e.correr('enviarConvites()');
ok(e.enviados.length === 10, 'retoma e envia');

// ------------------------------------------------------------------ 10. reserva da quota
titulo('10. reserva de 10 por dia para as confirmações de inscrição (90 convites por dia)');
e = ambiente({ geral: pessoas(150), quota: 100, reserva: 10 });
e.correr('enviarConvites()');
ok(e.enviados.length === 90 && e.usados === 90, `enviou ${e.enviados.length}, esperava 90 (ficam 10 de reserva)`);
ok(e.c.MailApp.getRemainingDailyQuota() === 10, 'ficam 10 por usar');
ok(/10 de reserva/.test(e.alertas[0]), 'o resumo menciona a reserva');
e.alertas.length = 0; e.correr('enviarConvites()');
ok(e.enviados.length === 90, 'com a reserva intacta não envia mais');
e.usados += 4; e.enviados.length = 0; e.correr('enviarConvites()');
ok(e.enviados.length === 0, 'se as confirmações gastaram quota, os convites não tocam na reserva');
e.usados = 0; e.correr('enviarConvites()');
ok(e.enviados.length === 60, `no dia seguinte envia os 60 que faltam (foram ${e.enviados.length})`);

// ------------------------------------------------------------------ 11. repetidos e quem já está na lista institucional
titulo('11. quem está na lista institucional não recebe o geral; repetidos só uma vez');
e = ambiente({
  institucional: [['Ana Costa', 'ana@exemplo.pt', 'f'], ['Rui Dias', 'RUI@exemplo.pt', 'm']],
  geral: [['Ana C', 'ana@exemplo.pt', 'f'], ['Rui D', 'rui@EXEMPLO.pt', 'm'], ['Zé A', 'ze@exemplo.pt', 'm'], ['Zé A', ' ZE@exemplo.pt ', 'm'], ['Eva B', 'eva@exemplo.pt', 'f']],
});
e.correr('enviarConvites()');
ok(e.enviados.map(m => m.to).join() === 'ze@exemplo.pt,eva@exemplo.pt', `enviou para ${e.enviados.map(m => m.to)}`);
ok(e.folhaGeral.estados().join('|') === 'Ignorado: já está na lista institucional|Ignorado: já está na lista institucional|Enviado a 01/10/2026 09:00|Ignorado: email repetido na lista|Enviado a 01/10/2026 09:00', 'estados: ' + e.folhaGeral.estados().join('|'));
ok(/2 ignorados|3 ignorados/.test(e.alertas[0]) && /3 ignorados/.test(e.alertas[0]), 'o resumo diz quantos foram ignorados: ' + e.alertas[0].split('\n')[1]);
e.enviados.length = 0; e.correr('enviarConvites()');
ok(e.enviados.length === 0, 'não volta a tentar os ignorados');
e = ambiente({ institucional: [['Ana', 'ana@exemplo.pt', 'f']], geral: [['Ana', 'ana@exemplo.pt', 'f']] });
e.correr('EXCLUIR_INSTITUCIONAIS_DA_GERAL = false'); e.correr('enviarConvites()');
ok(e.enviados.length === 1, 'com a exclusão desligada, envia');
e = ambiente({ institucional: [['Ana', 'ana@exemplo.pt', 'f'], ['Ana', 'ana@exemplo.pt', 'f']] });
e.correr('enviarConvitesInstitucionais()');
ok(e.enviados.length === 1 && e.folhaInst.estados()[1] === 'Ignorado: email repetido na lista', 'repetidos também na própria lista institucional');
// um repetido cuja 1.ª ocorrência deu erro não-recuperável ainda pode receber
e = ambiente({ geral: [['A B', 'a@exemplo.pt', 'f', 'Erro: Invalid email'], ['A B', 'a@exemplo.pt', 'f']] });
e.correr('enviarConvites()');
ok(e.enviados.length === 1, 'repetido de uma linha com erro definitivo ainda é tentado');

// ------------------------------------------------------------------ 12. envio automático
titulo('12. envio automático: um email de cada vez, 1 a 2 minutos de intervalo, das 8h às 22h, institucional primeiro');
e = ambiente({ geral: pessoas(10, 'g'), institucional: pessoas(5, 'i'), quota: 100, semente: 1, rolante: true });
e.correr('ativarEnvioAutomatico()'); e.correr('ativarEnvioAutomatico()');
ok(e.gatilhos.length === 1 && e.gatilhos[0].fn === 'envioAutomatico' && e.gatilhos[0].minutos === 1, 'um só acionador, de minuto a minuto (ativar duas vezes não duplica)');
ok(e.props.acionador === 'minuto', 'regista que o acionador é o de minuto a minuto');
for (const h of [3, 7, 22, 23]) { e.hora = h; e.correr('envioAutomatico()'); }
ok(e.enviados.length === 0, 'às 3h, 7h, 22h e 23h não envia');
e.hora = 8; e.correr('envioAutomatico()');
ok(e.enviados.length === 1 && e.enviados[0].to === 'i0@exemplo.pt', 'às 8h envia um só email, o 1.º institucional');
e.correr('envioAutomatico()');
ok(e.enviados.length === 1, 'sem passar o intervalo não envia o 2.º');
e.hora = 21; minutos(e, 400, () => e.gatilhos.length === 0);                     // 400 minutos a partir das 10h (UTC), horas simuladas
const conv12 = e.registos.filter(r => r.to !== 'jsd@exemplo.pt');
ok(conv12.length === 15 && conv12.slice(0, 5).every(r => r.to.startsWith('i')) && conv12.slice(5).every(r => r.to.startsWith('g')), `institucional primeiro, geral a seguir (${conv12.length} emails)`);
const gaps12 = conv12.slice(1).map((r, k) => r.t - conv12[k].t).filter(g => g < 30 * MIN);
ok(gaps12.length >= 10 && gaps12.every(g => g === MIN || g === 2 * MIN) && gaps12.includes(MIN) && gaps12.includes(2 * MIN), `intervalos de 1 ou 2 minutos, ambos aparecem: ${[...new Set(gaps12)].map(g => g / MIN + ' min').join(', ')}`);
ok(e.gatilhos.length === 0 && !('acionador' in e.props), 'tudo enviado: o acionador desliga-se');
const resumo = e.enviados.filter(m => /concluído/.test(m.subject || ''));
ok(resumo.length === 1 && resumo[0].to === 'jsd@exemplo.pt' && /Institucional: 5 enviados/.test(resumo[0].body) && /Geral: 10 enviados/.test(resumo[0].body), 'resumo final para a própria conta com as contagens');

// só envia entre as 8h e as 22h, e sem parar
e = ambiente({ geral: pessoas(2000, 'g'), quota: 5000, semente: 5, rolante: true, reserva: 0 });
e.agora = Date.UTC(2026, 9, 3, 0, 0); e.correr('ativarEnvioAutomatico()');
minutos(e, 24 * 60);
const horas = e.registos.map(r => new Date(r.t).getUTCHours());
ok(Math.min(...horas) === 8 && Math.max(...horas) === 21, `só envia entre as 8h e as 22h (primeira às ${Math.min(...horas)}h, última às ${Math.max(...horas)}h)`);
ok(e.registos.length > 500 && e.registos.length < 640, `durante as 14 horas envia sem parar: ${e.registos.length} emails (a cerca de 1,5 minutos cada)`);
const gapsDia = e.registos.slice(1).map((r, k) => r.t - e.registos[k].t);
ok(gapsDia.every(g => g === MIN || g === 2 * MIN), 'sem falhas nem pausas: todos os intervalos de 1 ou 2 minutos');

// quota: não assume nenhum valor, lê o que a Google deixar; reserva sempre por usar; retoma quando a Google a liberta
e = ambiente({ geral: pessoas(40, 'g'), quota: 12, rolante: true, semente: 2, reserva: 4 });
e.agora = Date.UTC(2026, 9, 3, 8, 0); e.correr('ativarEnvioAutomatico()'); minutos(e, 300);
ok(e.registos.length === 8 && e.registos.at(-1).restante === 4, `quota 12 com reserva 4: envia 8 e deixa 4 por usar (enviou ${e.registos.length}, restam ${e.registos.at(-1).restante})`);
Folha.leituras = 0; minutos(e, 120);
ok(e.registos.length === 8 && Folha.leituras === 0, 'sem quota: não envia e nem lê as folhas');
minutos(e, 24 * 60);
ok(e.registos.length === 16, `a Google liberta a quota passadas 24 horas: retoma sozinho (${e.registos.length} emails)`);
ok(e.gatilhos.length === 1, 'continua ativo');

// ------------------------------------------------------------------ 13. o teu caso: 74 de 100 institucionais enviados, 1894 gerais
titulo('13. o caso real: 26 institucionais por enviar (74 já enviados ontem) e 1894 gerais, um email de cada vez');
function simularReal({ reserva, horasSemReserva, quotaTotal = 100, repetidos = false, maxDias = 40 }) {
  const inst = pessoas(100, 'i').map((p, k) => k < 74 ? [p[0], p[1], p[2], 'Enviado a 02/10/2026'] : p);
  const ger = pessoas(1894, 'g');
  if (repetidos) { for (let k = 0; k < 40; k++) ger[k][1] = `i${k}@exemplo.pt`; for (let k = 40; k < 50; k++) ger[k][1] = ger[k - 40 + 100][1]; }
  const ee = ambiente({ geral: ger, institucional: inst, quota: quotaTotal, reserva, horasSemReserva, rolante: true, semente: 7 });
  ee.agora = Date.UTC(2026, 9, 3, 7, 0);
  for (let k = 0; k < 74; k++) ee.marcas.push(Date.UTC(2026, 9, 2, 12, 0));       // os 74 de ontem ainda contam na quota da conta
  ee.correr('ativarEnvioAutomatico()');
  const m = minutos(ee, maxDias * 1440, () => ee.gatilhos.length === 0);
  return { ee, dias: m / 1440, conv: ee.registos.filter(r => r.to !== 'jsd@exemplo.pt') };
}
let sim = simularReal({ reserva: 10, horasSemReserva: 72 });
ok(sim.dias > 19 && sim.dias < 24, `quota de 100, 72 h sem reserva e depois reserva de 10: ${sim.dias.toFixed(1)} dias`);
ok(sim.ee.folhaInst.estados().every(s => /^Enviado a /.test(s)) && sim.ee.folhaGeral.estados().every(s => /^Enviado a /.test(s)), 'todas as 1894 + 26 enviadas');
ok(sim.conv.length === 1920 && unicos(sim.conv.map(r => r.to)), `1920 emails, ninguém repetido (${sim.conv.length})`);
ok(sim.conv.slice(0, 26).every(r => r.to.startsWith('i')) && sim.conv.slice(26, 60).every(r => r.to.startsWith('g')), 'começa pelos 26 institucionais, depois os gerais');
ok(sim.conv.every(r => { const h = new Date(r.t).getUTCHours(); return h >= 8 && h < 22; }), 'nenhum envio fora das 8h às 22h');
const gs = sim.conv.slice(1).map((r, k) => r.t - sim.conv[k].t).filter(g => g < 60 * MIN);
ok(gs.length > 1500 && gs.every(g => g === MIN || g === 2 * MIN), `ritmo de 1 ou 2 minutos (${gs.length} intervalos conferidos)`);
const depois72 = sim.conv.filter(r => r.t - sim.conv[0].t >= 72 * H);
ok(depois72.length > 1000 && depois72.every(r => r.restante >= 10), 'passadas as 72 horas, a reserva de 10 nunca é tocada');
const antes72 = sim.conv.filter(r => r.t - sim.conv[0].t < 72 * H);
ok(antes72.some(r => r.restante < 10), 'nas primeiras 72 horas a quota é usada toda');
sim = simularReal({ reserva: 10, horasSemReserva: 72, repetidos: true });
ok(sim.ee.folhaGeral.estados().filter(s => /^Ignorado/.test(s)).length === 50 && sim.conv.length === 1870, `40 gerais já institucionais + 10 repetidos ignorados: ${sim.conv.length} emails`);

// ------------------------------------------------------------------ 14. verProgresso e verQuota
titulo('14. verProgresso e verQuota');
e = ambiente({ institucional: pessoas(100, 'i').map((p, k) => k < 74 ? [p[0], p[1], p[2], 'Enviado a x'] : p), geral: pessoas(1894, 'g'), quota: 100, reserva: 10 });
e.correr('verProgresso()');
ok(/Institucional «Convidados 50 anos» \(separador «Folha1»\):\n\s+74 enviados · 26 por enviar/.test(e.alertas[0]) && /Geral «Militantes Base» \(separador «Folha1»\):\n\s+0 enviados · 1894 por enviar/.test(e.alertas[0]), 'contagens por lista: ' + e.alertas[0].split('\n').slice(0, 4).join(' | '));
ok(/Faltam 1920 emails\. Nas últimas 24 horas foram enviados 0\. Ainda não há envios que cheguem para estimar/.test(e.alertas[0]), 'sem envios recentes: não estima nada nem assume uma quota: ' + e.alertas[0].split('\n').pop());
const fmt = t => { const d = new Date(t), p = n => String(n).padStart(2, '0'); return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`; };
const T0 = Date.UTC(2026, 9, 3, 10, 0);
e = ambiente({ institucional: pessoas(100, 'i').map((p, k) => k < 50 ? [p[0], p[1], p[2], 'Enviado a ' + fmt(T0 - 2 * H)] : p), geral: pessoas(1000, 'g') });
e.correr('verProgresso()');
ok(/Nas últimas 24 horas foram enviados 50\. Ao ritmo das últimas 24 horas, faltam cerca de 21 dias/.test(e.alertas[0]), 'estima pelo ritmo real das últimas 24 h: ' + e.alertas[0].split('\n').pop());
e = ambiente({ institucional: pessoas(100, 'i').map((p, k) => k < 50 ? [p[0], p[1], p[2], 'Enviado a ' + fmt(T0 - 30 * H)] : p), geral: pessoas(10, 'g') });
e.correr('verProgresso()');
ok(/foram enviados 0\./.test(e.alertas[0]), 'envios com mais de 24 horas não contam para o ritmo');
ok(/«Convidados 50 anos» \(separador «Folha1»\)/.test(e.alertas[0]) && /«Militantes Base»/.test(e.alertas[0]), 'mostra o nome de cada ficheiro, para confirmar que é a lista certa');
ok(e.enviados.length === 0, 'não envia nada');
e = ambiente({ quota: 100, reserva: 10 }); e.usados = 72; e.correr('verQuota()');
ok(/28 emails/.test(e.alertas[0]) && /jsd@exemplo\.pt/.test(e.alertas[0]) && /10 .*reserva/.test(e.alertas[0]), 'verQuota mostra 28, a reserva e a conta');

// ------------------------------------------------------------------ 15. endereços das listas
titulo('15. endereços em falta ou iguais: não envia nada e explica');
for (const [fn, qual] of [['enviarConvites', 'geral'], ['enviarConvitesInstitucionais', 'institucional'], ['verProgresso', 'progresso'], ['verificarListas', 'verificação']]) {
  e = ambiente({ geral: pessoas(2), institucional: pessoas(2) }); e.c.URL_FOLHA_INSTITUCIONAL = 'COLA_AQUI_O_URL_DA_LISTA_INSTITUCIONAL';
  e.correr(fn + '()');
  ok(/Falta o URL da lista \(URL_FOLHA_INSTITUCIONAL\)/.test(e.alertas[0]) && e.enviados.length === 0, `${qual}: avisa que falta o URL institucional`);
}
e = ambiente({ geral: pessoas(2), institucional: pessoas(2) }); e.c.URL_FOLHA_GERAL = 'COLA_AQUI_O_URL_DA_LISTA_GERAL';
e.correr('enviarConvites()');
ok(/URL_FOLHA_GERAL/.test(e.alertas[0]) && e.enviados.length === 0, 'avisa que falta o URL geral');
for (const fn of ['enviarConvites', 'enviarConvitesInstitucionais', 'envioAutomatico']) {
  e = ambiente({ geral: pessoas(2), institucional: pessoas(2) });
  e.c.URL_FOLHA_GERAL = 'https://docs.google.com/spreadsheets/d/MESMO/edit?usp=sharing'; e.c.URL_FOLHA_INSTITUCIONAL = 'https://docs.google.com/spreadsheets/d/MESMO/edit#gid=0';
  e.correr(fn + '()');
  ok(e.enviados.length === 0 && (fn === 'envioAutomatico' ? true : /MESMO ficheiro/.test(e.alertas[0])), `${fn}: duas listas com o mesmo ficheiro não enviam nada`);
}

// ------------------------------------------------------------------ 16. as listas crescem
titulo('16. as listas crescem entre execuções: linhas novas, também depois de espaços; institucionais novos primeiro');
e = ambiente({ geral: pessoas(3, 'g'), institucional: pessoas(2, 'i'), quota: 100, rolante: true, semente: 3 });
e.correr('ativarEnvioAutomatico()'); minutos(e, 30, () => e.gatilhos.length === 0);
ok(e.folhaGeral.estados().every(s => /^Enviado/.test(s)) && e.gatilhos.length === 0, 'envia tudo e desliga-se');
e.folhaGeral.linhas.push(['', '', '', ''], ['Nova Pessoa Um', 'novo1@exemplo.pt', 'Feminino', ''], ['Nova Pessoa Dois', 'novo2@exemplo.pt', 'Masculino', '']);
e.folhaInst.linhas.push(['Convidado Novo', 'conv@exemplo.pt', 'Masculino', '']);
e.registos.length = 0; e.correr('ativarEnvioAutomatico()'); minutos(e, 30, () => e.gatilhos.length === 0);
const novos = e.registos.map(r => r.to).filter(t => t !== 'jsd@exemplo.pt');
ok(novos.join() === 'conv@exemplo.pt,novo1@exemplo.pt,novo2@exemplo.pt', `novos: ${novos}`);

// ------------------------------------------------------------------ 17. nomes: maiúsculas e sem nome
titulo('17. nomes em maiúsculas e linhas sem nome');
e = ambiente({ geral: [['JOÃO PEDRO DA SILVA', 'a@exemplo.pt', 'Masculino'], ['maria de fátima santos azevedo', 'b@exemplo.pt', 'Feminino'], ['Ana-Luísa D\'Ávila', 'c@exemplo.pt', 'f'], ['', 'd@exemplo.pt', 'Feminino'], ['Rita', 'e@exemplo.pt', 'Feminino']] });
e.correr('enviarConvites()');
const saud = e.enviados.map(m => (m.htmlBody.match(/Cara?o? [^<]*,/) || [''])[0]);
ok(saud[0] === 'Caro João Silva,', 'maiúsculas → «Caro João Silva,» (foi «' + saud[0] + '»)');
ok(saud[1] === 'Cara Maria Azevedo,', 'minúsculas → «Cara Maria Azevedo,» (foi «' + saud[1] + '»)');
ok(saud[2] === 'Cara Ana-Luísa D\'Ávila,', 'nome já bem escrito fica como está (foi «' + saud[2] + '»)');
ok(saud[3] === 'Cara companheira,', 'sem nome: «Cara companheira,» (foi «' + saud[3] + '»)');
ok(saud[4] === 'Cara Rita,', 'só um nome: «Cara Rita,» (foi «' + saud[4] + '»)');

// ------------------------------------------------------------------ 18. verificarListas
titulo('18. verificarListas: aponta linhas, sem mostrar nomes nem emails');
e = ambiente({
  institucional: [['Ana Costa', 'ana@exemplo.pt', 'Feminino'], ['Rui Dias', 'rui@exemplo.pt', 'Masculino']],
  geral: [['Ana C', 'ANA@exemplo.pt', 'Feminino'], ['Zé', 'ze@exemplo', 'Masculino'], ['EVA BORGES', 'eva@exemplo.pt', ''], ['Eva Borges', 'eva@exemplo.pt', 'Feminino'], ['Tó Mané', 'to@exemplo.pt', 'Outro']],
});
e.correr('verificarListas()');
const v = e.alertas[0];
ok(/Geral «Militantes Base» \(separador «Folha1»\): 5 pessoas/.test(v), 'cabeçalho da lista geral: ' + v.split('\n').find(l => l.startsWith('Geral')));
ok(/género por reconhecer .*: 2 \(linhas 4, 6\)/.test(v), 'género por reconhecer: linhas 4 e 6');
ok(/emails inválidos: 1 \(linhas 3\)/.test(v), 'email inválido: linha 3');
ok(/emails repetidos .*: 1 \(linhas 5\)/.test(v), 'email repetido: linha 5');
ok(/já na lista institucional .*: 1 \(linhas 2\)/.test(v), 'já institucional: linha 2');
ok(/nomes com uma só palavra: 1/.test(v) && /maiúsculas\/minúsculas .*: 1/.test(v), 'nomes com uma palavra e em maiúsculas');
ok(!/@|Ana|Eva|Rui/.test(v.replace(/Militantes Base|Convidados 50 anos/g, '')), 'não mostra nomes nem emails');
ok(e.enviados.length === 0, 'não envia nada');

// ------------------------------------------------------------------ 19. sem reserva nas primeiras 72 horas
titulo('19. sem reserva nas primeiras 72 horas de envio; depois, reserva de 10');
e = ambiente({ geral: pessoas(1000, 'g'), quota: 100, reserva: 10, horasSemReserva: 72 });
e.correr('enviarConvites()');
ok(e.enviados.length === 100, `1.º envio: ${e.enviados.length} (sem reserva, esperava 100)`);
ok(e.props.inicioEnvio === String(e.agora), 'regista o momento do 1.º envio');
e.usados = 0; e.agora += 24 * H; e.enviados.length = 0; e.correr('enviarConvites()');
ok(e.enviados.length === 100, 'dia 2 (24 h): ainda sem reserva');
e.usados = 0; e.agora += 47 * H; e.enviados.length = 0; e.correr('enviarConvites()');
ok(e.enviados.length === 100, 'a 71 h: ainda sem reserva');
e.usados = 0; e.agora += 2 * H; e.enviados.length = 0; e.correr('enviarConvites()');
ok(e.enviados.length === 90, `a 73 h: reserva de 10 → ${e.enviados.length} (esperava 90)`);
e = ambiente({ geral: pessoas(100, 'g'), quota: 100, reserva: 10, horasSemReserva: 72, inicioDosEnvios: '2026-09-29 10:00' });
e.correr('enviarConvites()');
ok(e.enviados.length === 90, 'INICIO_DOS_ENVIOS passado há mais de 72 h: já há reserva (' + e.enviados.length + ')');
e = ambiente({ geral: pessoas(100, 'g'), quota: 100, reserva: 10, horasSemReserva: 72, inicioDosEnvios: '2026-10-02 12:00' });
e.correr('enviarConvites()');
ok(e.enviados.length === 100, 'INICIO_DOS_ENVIOS há ~22 h: sem reserva (' + e.enviados.length + ')');
e = ambiente({ geral: pessoas(100, 'g'), quota: 100, reserva: 10, horasSemReserva: 72 });
e.correr('verQuota()');
ok(/não há reserva/.test(e.alertas[0]), 'antes do 1.º envio: verQuota diz que não há reserva');
e.correr('enviarConvites()'); e.alertas.length = 0; e.usados = 0; e.agora += 80 * H; e.correr('verQuota()');
ok(/Destes, 10 ficam de reserva/.test(e.alertas[0]), 'passadas as 72 horas: verQuota mostra a reserva de 10');

titulo('20. não assume 100: com uma quota maior envia mais, até ao ritmo de 1 a 2 minutos');
sim = simularReal({ reserva: 10, horasSemReserva: 0, quotaTotal: 1500 });
ok(sim.dias < 5 && sim.conv.length === 1920, `quota de 1500: as 1920 saem em ${sim.dias.toFixed(1)} dias (não ficam limitadas a 100 por dia)`);
const porDia = {}; sim.conv.forEach(r => { const d = Math.floor(r.t / (24 * H)); porDia[d] = (porDia[d] || 0) + 1; });
ok(Math.max(...Object.values(porDia)) > 450, `em cada dia completo envia ${Math.max(...Object.values(porDia))} (14 horas a 1 ou 2 minutos)`);
sim = simularReal({ reserva: 10, horasSemReserva: 0, quotaTotal: 50, maxDias: 70 });
const porDia50 = {}; sim.conv.forEach(r => { const d = Math.floor(r.t / (24 * H)); porDia50[d] = (porDia50[d] || 0) + 1; });
ok(sim.conv.length === 1920 && Math.max(...Object.values(porDia50)) <= 40, `quota de 50 e reserva 10: nunca mais de 40 por dia (máximo ${Math.max(...Object.values(porDia50))})`);

// ------------------------------------------------------------------ 21. emails de teste
titulo('21. enviarTeste: 4 emails por endereço, sem tocar nas listas nem nos estados');
e = ambiente({ geral: pessoas(3, 'g'), institucional: pessoas(2, 'i'), quota: 100, emailsDeTeste: ['eu@gmail.com', 'eu@icloud.com'] });
e.correr('enviarTeste()');
ok(e.enviados.length === 8 && e.usados === 8, `8 emails (${e.enviados.length})`);
ok(e.enviados.slice(0, 4).every(m => m.to === 'eu@gmail.com') && e.enviados.slice(4).every(m => m.to === 'eu@icloud.com'), '4 para cada endereço');
ok(e.enviados.every(m => m.subject === '[TESTE] 50 Anos JSD Famalicão · Jantar Comemorativo'), 'assunto com «[TESTE]»');
ok(/Cara Maria Silva,/.test(e.enviados[0].htmlBody) && /Caro João Santos,/.test(e.enviados[1].htmlBody), 'geral: feminino e masculino');
ok(/Estimada companheira Ana Costa,/.test(e.enviados[2].htmlBody) && /Estimado companheiro Rui Dias,/.test(e.enviados[3].htmlBody), 'institucional: feminino e masculino');
ok(e.folhaGeral.estados().every(s => s === '') && e.folhaInst.estados().every(s => s === ''), 'as listas ficam intactas');
ok(!('inicioEnvio' in e.props), 'o teste não começa a contar as 72 horas');
ok(/Enviados 8 emails de teste para eu@gmail\.com, eu@icloud\.com/.test(e.alertas[0]), 'mensagem final: ' + e.alertas[0].split('\n')[0]);
e = ambiente({ quota: 100 }); e.correr('enviarTeste()');
ok(e.enviados.length === 4 && e.enviados.every(m => m.to === 'jsd@exemplo.pt'), 'sem endereços configurados: envia para a própria conta');
e = ambiente({ quota: 100, emailsDeTeste: ['a@x.pt', 'b@x.pt', 'c@x.pt'] }); e.usados = 92; e.correr('enviarTeste()');
ok(e.enviados.length === 0 && /não chega para 12/.test(e.alertas[0]), 'sem quota para tantos testes: avisa e não envia');

// ------------------------------------------------------------------ 22. diagnóstico
titulo('22. diagnostico(): diz o que falta no projeto, sem enviar nada');
e = ambiente({ geral: pessoas(1894, 'g'), institucional: pessoas(100, 'i'), quota: 100 });
e.correr('diagnostico()');
const dg = e.alertas[0];
ok(/Tudo em ordem/.test(dg) && !/✘/.test(dg), 'projeto certo: tudo em ordem');
ok(/✔ Ficheiro HTML «convite» .*imagens por endereço/.test(dg) && /✔ Ficheiro HTML «convite_institucional»/.test(dg), 'os dois HTML conferidos');
ok(/Institucional «Convidados 50 anos» \(separador «Folha1»\), 100 linhas; cabeçalho «Nome \| Email \| Género \| Email Enviado\?»/.test(dg) && /Geral «Militantes Base» .*1894 linhas/.test(dg), 'listas e cabeçalho: ' + dg.split('\n').filter(l => /Lista|Institucional|Geral/.test(l)).join(' / ').slice(0, 160));
ok(/Envio automático desativado/.test(dg) && e.enviados.length === 0, 'estado do envio automático; não envia nada');
e.correr('ativarEnvioAutomatico()'); e.alertas.length = 0; e.correr('diagnostico()');
ok(/✔ Envio automático ativo/.test(e.alertas[0]), 'envio automático ativo');

const diag = (alterar, esperado, nome) => { const x = ambiente({ geral: pessoas(3, 'g'), institucional: pessoas(2, 'i') }); alterar(x); x.correr('diagnostico()'); ok(esperado.test(x.alertas[0]) && /✘/.test(x.alertas[0]) && /problema\(s\)/.test(x.alertas[0]), nome + ': ' + x.alertas[0].split('\n').filter(l => /✘/.test(l)).join(' / ').slice(0, 140)); return x; };
diag(x => { delete x.htmls.convite_institucional; }, /✘ Falta o ficheiro HTML «convite_institucional»/, 'falta um ficheiro HTML');
diag(x => { x.htmls.convite = x.htmls.convite.replace('https://jsdfamalicao.pt/convite/capa-evento-email.png', 'data:image/png;base64,AAAA').replace(/https:\/\/jsdfamalicao\.pt\/convite\/[^"]+/g, 'data:image/png;base64,AAAA'); }, /✘ Ficheiro HTML «convite»: traz imagens embutidas/, 'HTML antigo com imagens embutidas');
diag(x => { x.htmls.convite = x.htmls.convite.replace('Caro(a) companheiro(a),', 'Caro(a),'); }, /não tem «Caro\(a\) companheiro\(a\),»/, 'HTML sem a saudação onde entra o nome');
diag(x => { x.c.URL_FOLHA_GERAL = 'COLA_AQUI_O_URL_DA_LISTA_GERAL'; }, /✘ Falta o URL da lista \(URL_FOLHA_GERAL\)/, 'endereço por preencher');
diag(x => { x.c.URL_FOLHA_GERAL = 'https://docs.google.com/spreadsheets/d/GERAL222_SEM_ACESSO/edit'; x.folhaGeral = null; x.c.URL_FOLHA_GERAL = 'https://docs.google.com/spreadsheets/d/OUTRA999/edit'; }, /✘ Lista Geral: não consegui abrir/, 'lista sem acesso ou endereço errado');
diag(x => { x.folhaInst.cabecalho = ['Email', 'Nome', 'Género', 'Estado']; }, /✘ Institucional .*o cabeçalho devia ser/, 'colunas trocadas na lista');
diag(x => { x.c.URL_FOLHA_GERAL = x.c.URL_FOLHA_INSTITUCIONAL; }, /MESMO ficheiro/, 'as duas listas no mesmo ficheiro');
diag(x => { x.gatilhos.push({ fn: 'envioAutomatico', horas: 1, minutos: null }); }, /✘ O envio automático está ativo, mas foi criado por uma versão antiga do script \(de hora a hora\)/, 'acionador de hora a hora de uma versão antiga');

// ------------------------------------------------------------------ 23. diagnosticar (menu) e o código dividido em partes
titulo('23. diagnosticar() e a verificação das partes do código');
e = ambiente({ geral: pessoas(3, 'g'), institucional: pessoas(2, 'i') });
e.correr('diagnosticar()');
ok(/Tudo em ordem/.test(e.alertas[0]), 'com o código completo corre o diagnóstico');
if (modoPartes) {
  ok(ficheirosPartes.length >= 2 && ficheirosPartes[0] === 'Parte1.gs', `${ficheirosPartes.length} partes: ${ficheirosPartes.join(', ')}`);
  for (const f of ficheirosPartes) {
    const txt = fs.readFileSync(path.join(pastaPartes, f), 'utf8');
    const linhas = txt.trimEnd().split('\n').length;
    ok(linhas <= 95, `${f} tem ${linhas} linhas (máximo 95: uma cópia que só traga as primeiras 100 linhas fica completa)`);
    let sintaxeOk = true; try { new vm.Script(txt); } catch (x) { sintaxeOk = false; }
    ok(sintaxeOk, `${f} tem sintaxe válida sozinha`);
    ok(f === 'Parte1.gs' || new RegExp(`var PARTE_${f.match(/\d+/)[0]} = true;`).test(txt), `${f} declara o seu marcador`);
  }
  for (const f of ficheirosPartes.slice(1)) {
    const x = ambiente({ geral: pessoas(2), institucional: pessoas(2), omitirParte: f });
    x.correr('diagnosticar()');
    ok(new RegExp(`Faltam partes do código no projeto: ${f.replace('.', '\\.')}\\b`).test(x.alertas[0]) && x.enviados.length === 0, `sem ${f}: o diagnóstico diz qual falta`);
  }
  const todas = fs.readFileSync(path.join(aqui, 'apps-script', 'EnvioPelaFolha.gs'), 'utf8').match(/^function \w+/gm).sort();
  const nasPartes = ficheirosPartes.flatMap(f => fs.readFileSync(path.join(pastaPartes, f), 'utf8').match(/^function \w+/gm)).sort();
  ok(JSON.stringify(todas) === JSON.stringify(nasPartes), `as ${todas.length} funções do ficheiro único estão nas partes, nem uma a mais nem a menos`);
}

// ------------------------------------------------------------------ 24. verificarFuncoes (VerificarInstalacao.gs)
if (modoPartes) {
  titulo('24. VerificarInstalacao.gs: diz que função falta ou está desatualizada, e em que ficheiro');
  const verificador = fs.readFileSync(path.join(pastaPartes, 'VerificarInstalacao.gs'), 'utf8');
  const nFuncoes = ficheirosPartes.flatMap(f => fs.readFileSync(path.join(pastaPartes, f), 'utf8').match(/^function \w+/gm)).length;
  const corre = opcoes => { const x = ambiente(Object.assign({ geral: pessoas(2), institucional: pessoas(2), extraCodigo: [verificador] }, opcoes)); x.correr('verificarFuncoes()'); return x.alertas[0]; };
  let v = corre({});
  ok(new RegExp(`✔ As ${nFuncoes} funções estão todas no projeto`).test(v), 'projeto certo: ' + v.slice(0, 80));
  const ler = f => fs.readFileSync(path.join(pastaPartes, f), 'utf8');
  const parteDe = nome => ficheirosPartes.find(f => new RegExp(`^function ${nome}\\(`, 'm').test(ler(f)));
  const P = parteDe('inicioEnvio_'), outraFuncao = ler(P).match(/^function (\w+)/gm).map(x => x.slice(9)).find(n => n !== 'inicioEnvio_');
  v = corre({ omitirParte: P });
  ok(/Faltam \d+ funções/.test(v) && v.includes(`inicioEnvio_ (devia estar em ${P})`) && v.includes(`${outraFuncao} (devia estar em ${P})`), `sem ${P}: lista as funções dela (${outraFuncao}, inicioEnvio_…)`);
  v = corre({ modificarParte: { [P]: t => t.replace(/\/\*\*(?:(?!\*\/)[^])*\*\/\nfunction inicioEnvio_\(\) \{[^]*?\n\}\n/, '') } });
  ok(v.includes(`Falta 1 função:\n  inicioEnvio_ (devia estar em ${P})`), `o teu caso, ${P} sem a inicioEnvio_: ` + (v.match(/Falta[^]*?\)/) || ['(não apanhou)'])[0].replace(/\n\s*/g, ' '));
  v = corre({ extraCodigo: [verificador, 'function processarEnvios(folha, nomeFicheiroHtml) { return 0; }'] });
  ok(/processarEnvios \(tem 2 parâmetros, devia ter 4\)/.test(v) && /versão antiga/.test(v), 'cópia antiga de uma função a sobrepor-se: apanhada');
  v = corre({ omitirParte: 'Parte1.gs' });
  ok(/onOpen \(devia estar em Código\.gs\)/.test(v), 'sem a Parte1: diz que é o Código.gs');
}

// ------------------------------------------------------------------ 25. nunca dá por concluído sem ter enviado; falhas gerais não queimam a lista
titulo('25. o envio automático só conclui quando as listas acabaram de facto; uma falha geral não marca ninguém com erro');
{
  const ativo = x => x.gatilhos.some(g => g.fn === 'envioAutomatico');
  const correr = (x, k) => { for (let i = 0; i < k; i++) { if (!ativo(x)) return i; x.agora += MIN; x.hora = new Date(x.agora).getUTCHours(); x.correr('envioAutomatico()'); } return k; };  // como a Google: sem acionador, não corre
  const convites = x => x.registos.filter(r => r.to !== 'jsd@exemplo.pt').length;
  const mails = x => x.enviados.filter(m => m.to === 'jsd@exemplo.pt').map(m => m.subject);
  const ultimo = x => x.alertas[x.alertas.length - 1];
  const comEstado = (f, re) => f.estados().filter(s => re.test(s)).length;
  const arranca = o => { const x = ambiente(o); x.correr('ativarEnvioAutomatico()'); return x; };

  // a) lista geral sem linhas (por exemplo o 1.º separador está vazio): não conclui, fica ativo e explica
  let x = arranca({ geral: [], institucional: pessoas(2, 'i') }); correr(x, 10);
  ok(convites(x) === 2 && ativo(x) && mails(x).length === 0, 'a) geral vazia: envia a institucional, não desativa nem diz «concluído»');
  x.correr('verProgresso()');
  ok(/NÃO dei o envio por concluído/.test(ultimo(x)) && /Geral/.test(ultimo(x)), 'a) «Ver progresso» explica porque não concluiu');
  x.folhaGeral.linhas.push(...pessoas(2, 'g').map(p => [p[0], p[1], p[2], '']));          // a lista cresce depois
  correr(x, 10);
  ok(convites(x) === 4 && !ativo(x) && mails(x).length === 1 && /concluído/.test(mails(x)[0]), 'a) quando a lista passa a ter gente envia-a e só então conclui, com um só aviso');
  ok(!/NÃO dei/.test(x.props.aviso || ''), 'a) o aviso desaparece quando conclui');

  // b) estados escritos à mão que não são «Enviado a…» (ex.: «Sim»): nada é enviado, não conclui
  x = arranca({ geral: pessoas(4, 'g').map(p => p.concat(['Sim'])), institucional: pessoas(1, 'i').map(p => p.concat(['Enviado a 01/10/2026 09:00'])) }); correr(x, 5);
  ok(convites(x) === 0 && ativo(x) && mails(x).length === 0, 'b) coluna D = «Sim» na geral: não conclui');
  ok(/nenhum convite foi enviado/.test(x.props.aviso || '') && /Geral/.test(x.props.aviso || ''), 'b) o aviso nomeia a lista geral');

  // c) tudo enviado de facto: conclui uma vez (e o acionador deixa de correr)
  x = arranca({ geral: pessoas(3, 'g'), institucional: pessoas(2, 'i') }); correr(x, 60);
  ok(convites(x) === 5 && !ativo(x) && mails(x).length === 1, 'c) 2 + 3 enviados: conclui com um só aviso e desativa');

  // d) falha geral (erro que não é de quota) em todos os envios: ninguém fica marcado, tenta de novo, avisa à 3.ª
  x = arranca({ geral: pessoas(5, 'g'), institucional: [] });
  const original = x.c.MailApp.sendEmail; let avariado = true;
  x.c.MailApp.sendEmail = (m, ...resto) => { if (avariado && (m.to || m) !== 'jsd@exemplo.pt') throw new Error('Exception: Service error: Mail'); return original(m, ...resto); };
  correr(x, 40);
  ok(comEstado(x.folhaGeral, /./) === 0 && ativo(x) && convites(x) === 0, 'd) falha geral durante 40 min: nenhuma linha marcada «Erro», acionador ativo');
  ok(Number(x.props.falhasSeguidas) >= 5 && Number(x.props.falhasSeguidas) <= 12, `d) a pausa vai aumentando: ${x.props.falhasSeguidas} tentativas em 40 minutos (não 40)`);
  ok(mails(x).length === 1 && /PROBLEMA/.test(mails(x)[0]), 'd) um só email de aviso (à 3.ª falha seguida)');
  x.correr('verProgresso()'); x.correr('diagnostico()');
  ok(/Service error: Mail/.test(x.alertas[x.alertas.length - 2]) && /Service error: Mail/.test(ultimo(x)), 'd) «Ver progresso» e «Diagnosticar» mostram o erro');
  avariado = false; correr(x, 60);
  ok(comEstado(x.folhaGeral, /^Enviado a/) === 5 && !x.props.ultimoErro && !x.props.falhasSeguidas, 'd) quando a falha passa, envia todos e o erro desaparece');

  // e) uma falha só de um endereço: marca essa linha e segue
  x = arranca({ geral: pessoas(5, 'g'), institucional: [] }); const o2 = x.c.MailApp.sendEmail;
  x.c.MailApp.sendEmail = m => { if (m.to === 'g0@exemplo.pt') throw new Error('Exception: Invalid email: g0'); return o2(m); };
  correr(x, 12);
  ok(comEstado(x.folhaGeral, /^Erro: .*Invalid email/) === 1 && comEstado(x.folhaGeral, /^Enviado a/) === 4, 'e) um endereço rejeitado fica «Erro» e os outros 4 saem');

  // f) a Google recusa com outras palavras («Daily email limit reached»): é quota, ninguém é marcado
  x = arranca({ geral: pessoas(4, 'g'), institucional: [] }); x.c.MailApp.sendEmail = () => { throw new Error('Exception: Daily email limit reached.'); }; correr(x, 6);
  ok(comEstado(x.folhaGeral, /./) === 0 && ativo(x), 'f) outra redação de erro de quota: não marca ninguém');

  // g) o ficheiro HTML não existe: o acionador não morre em silêncio (guarda o erro, pausa, avisa)
  x = arranca({ geral: pessoas(3, 'g'), institucional: [] }); delete x.htmls.convite; correr(x, 8);
  ok(ativo(x) && /No HTML file named convite/.test(x.props.ultimoErro || '') && mails(x).length === 1, 'g) HTML em falta: erro guardado e avisado por email, sem marcar ninguém');

  // h) o email sai mas a folha não deixa escrever «Enviado»: pára e desativa, para não repetir o email de minuto a minuto
  x = arranca({ geral: pessoas(4, 'g'), institucional: [] });
  const f = x.folhaGeral, intacto = f.getRange.bind(f);
  f.getRange = (r, c, nr, nc) => { const y = intacto(r, c, nr, nc); return (c === 4 && nr === undefined) ? { getValues: y.getValues, setValue: v => { if (/^Enviado/.test(v)) throw new Error('sem permissão'); y.setValue(v); } } : y; };
  correr(x, 10);
  ok(convites(x) === 1 && !ativo(x) && /PROBLEMA/.test(mails(x)[0] || ''), 'h) sem poder escrever na folha: um só email enviado, envio automático desativado e aviso por email');

  // i) envio manual com falha geral: não marca ninguém e explica
  x = ambiente({ geral: pessoas(6, 'g'), institucional: [] }); x.c.MailApp.sendEmail = () => { throw new Error('Exception: Service error: Mail'); };
  x.correr('enviarConvites()');
  ok(comEstado(x.folhaGeral, /./) === 0 && /não costuma ser culpa das pessoas/.test(x.alertas[0]) && /Service error: Mail/.test(x.alertas[0]), 'i) «Enviar Lote» com falha geral: ninguém marcado e a mensagem explica');

  // j) reativar limpa avisos e falhas antigas
  x = arranca({ geral: pessoas(2, 'g'), institucional: [] }); x.props.ultimoErro = 'velho'; x.props.aviso = 'velho'; x.props.pausaAte = String(x.agora + 1e9); x.correr('ativarEnvioAutomatico()');
  ok(!x.props.ultimoErro && !x.props.aviso && !x.props.pausaAte, 'j) «Ativar envio automático» limpa erros, avisos e pausas antigas');
}

console.log(erros ? `\n${erros} FALHAS em ${n} verificações` : `\nTudo certo: ${n} verificações.`);
process.exit(erros ? 1 : 0);
