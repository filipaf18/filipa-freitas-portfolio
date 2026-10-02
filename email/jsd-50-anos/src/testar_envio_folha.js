// Testa apps-script/EnvioPelaFolha.gs fora do Google, com simulações de SpreadsheetApp, MailApp (com quota diária),
// HtmlService, LockService, ScriptApp, Session, Utilities e Logger. Usa os HTML reais v7 e v8 como «convite» e
// «convite_institucional». Confirma: respeito pela quota, paragem sem marcar «Erro», retoma no dia seguinte sem
// duplicados, nova tentativa dos erros de quota antigos, personalização (saudação e género), envio automático.
// Uso (a partir de email/jsd-50-anos/):  node src/testar_envio_folha.js
const fs = require('fs'), path = require('path'), vm = require('vm');
const aqui = path.resolve(__dirname, '..');
const codigo = fs.readFileSync(path.join(aqui, 'apps-script', 'EnvioPelaFolha.gs'), 'utf8');
const HTML = {
  convite: fs.readFileSync(path.join(aqui, 'v7-convite-geral.html'), 'utf8'),
  convite_institucional: fs.readFileSync(path.join(aqui, 'v8-convite-institucional.html'), 'utf8'),
};
let erros = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { erros++; console.log('  FALHA:', m); } };
const titulo = t => console.log('\n' + t);

class Folha {
  static leituras = 0;
  constructor(pessoas) { this.linhas = pessoas.map(p => [p[0], p[1], p[2] || '', p[3] || '']); }
  getLastRow() { Folha.leituras++; return this.linhas.length + 1; }
  getRange(r, c, nr, nc) {
    const f = this;
    return {
      getValues: () => f.linhas.slice(r - 2, r - 2 + nr).map(l => l.slice(c - 1, c - 1 + nc)),
      setValue: v => { f.linhas[r - 2][c - 1] = v; },
    };
  }
  estados() { return this.linhas.map(l => l[3]); }
}

function ambiente({ geral = [], institucional = [], quota = 100, ecra = true, falhaAposEnvios = null, quotaMentirosa = false, reserva = 0, hora = 10 }) {
  const e = { enviados: [], alertas: [], logs: [], sleeps: 0, gatilhos: [], travaOcupada: false, quota, usados: 0, hora, leituras: 0 };
  e.folhaGeral = new Folha(geral); e.folhaInst = new Folha(institucional);
  const c = {
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ({ getActiveSheet: () => e.folhaGeral, getSheets: () => [e.folhaGeral], getSheetByName: () => e.folhaGeral }),
      openByUrl: () => ({ getSheets: () => [e.folhaInst] }),
      getUi: () => { if (!ecra) throw new Error('sem ecrã (acionador)'); return { alert: m => e.alertas.push(m), createMenu: () => { const m = { addItem: () => m, addSeparator: () => m, addToUi: () => {} }; return m; } }; },
    },
    MailApp: {
      getRemainingDailyQuota: () => quotaMentirosa ? 1000 : e.quota - e.usados,
      sendEmail: (m, assunto, texto) => {
        if (e.usados >= e.quota || (falhaAposEnvios !== null && e.enviados.length >= falhaAposEnvios))
          throw new Error('Service invoked too many times for one day: email.');
        e.usados++; e.enviados.push(typeof m === 'string' ? { to: m, subject: assunto, body: texto } : m);
      },
    },
    HtmlService: { createHtmlOutputFromFile: nome => ({ getContent: () => HTML[nome] }) },
    Utilities: { sleep: () => { e.sleeps++; }, formatDate: () => '01/10/2026 09:00' },
    Session: { getScriptTimeZone: () => 'Europe/Lisbon', getEffectiveUser: () => ({ getEmail: () => 'jsd@exemplo.pt' }) },
    LockService: { getScriptLock: () => ({ tryLock: () => !e.travaOcupada, releaseLock: () => {} }) },
    ScriptApp: {
      newTrigger: fn => { const g = { fn, horas: null }; const b = { timeBased: () => b, everyHours: h => { g.horas = h; return b; }, create: () => { e.gatilhos.push(g); } }; return b; },
      getProjectTriggers: () => e.gatilhos.map(g => ({ getHandlerFunction: () => g.fn, _g: g })),
      deleteTrigger: t => { e.gatilhos = e.gatilhos.filter(g => g !== t._g); },
    },
    Logger: { log: m => e.logs.push(m) },
    Date: class extends Date { getHours() { return e.hora; } },       // hora do dia controlada pelo teste
    Math, String, RegExp, Error, Object, Array, JSON,
  };
  vm.createContext(c);
  vm.runInContext(codigo, c, { filename: 'EnvioPelaFolha.gs' });
  c.URL_FOLHA_INSTITUCIONAL = 'https://docs.google.com/spreadsheets/d/EXEMPLO/edit';
  vm.runInContext(`RESERVA_QUOTA = ${reserva};`, c);
  e.c = c; e.correr = js => vm.runInContext(js, c);
  return e;
}
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
ok(e.sleeps === 100, 'pausa entre envios');

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
e = ambiente({ geral: [['Maria João Ferreira', 'm@exemplo.pt', 'Feminino'], ['José Pedro Alves', 'j@exemplo.pt', 'masculino'], ['', '', '']],
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
ok(e.enviados.length === 5, 'a linha em branco pára a leitura');
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
titulo('10. reserva de 20 por dia para lembretes e confirmações');
e = ambiente({ geral: pessoas(150), quota: 100, reserva: 20 });
e.correr('enviarConvites()');
ok(e.enviados.length === 80 && e.usados === 80, `enviou ${e.enviados.length}, esperava 80 (ficam 20 de reserva)`);
ok(e.c.MailApp.getRemainingDailyQuota() === 20, 'ficam 20 por usar');
ok(/20 de reserva/.test(e.alertas[0]), 'o resumo menciona a reserva');
e.alertas.length = 0; e.correr('enviarConvites()');
ok(e.enviados.length === 80, 'com a reserva intacta não envia mais');

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
titulo('12. envio automático: horário, institucional primeiro, sem quota nem lê as folhas, desliga-se no fim');
e = ambiente({ geral: pessoas(10, 'g'), institucional: pessoas(5, 'i'), quota: 100 });
e.correr('ativarEnvioAutomatico()'); e.correr('ativarEnvioAutomatico()');
ok(e.gatilhos.length === 1 && e.gatilhos[0].fn === 'envioAutomatico' && e.gatilhos[0].horas === 1, 'um só acionador, de hora a hora (ativar duas vezes não duplica)');
e.hora = 3; e.correr('envioAutomatico()');
ok(e.enviados.length === 0, 'às 3h da manhã não envia');
e.hora = 21; e.correr('envioAutomatico()');
ok(e.enviados.length === 0, 'às 21h já não envia');
e.hora = 10; e.usados = 100; Folha.leituras = 0; e.correr('envioAutomatico()');
ok(e.enviados.length === 0 && Folha.leituras === 0, 'sem quota: não envia e nem lê as folhas');
e.usados = 0; e.correr('envioAutomatico()');
const convites = e.enviados.filter(m => m.to !== 'jsd@exemplo.pt');
ok(convites.length === 15 && convites.slice(0, 5).every(m => m.to.startsWith('i')) && convites.slice(5).every(m => m.to.startsWith('g')), 'institucional primeiro, geral a seguir');
ok(e.gatilhos.length === 0, 'tudo enviado: o acionador desliga-se');
const resumo = e.enviados.filter(m => /concluído/.test(m.subject || ''));
ok(resumo.length === 1 && resumo[0].to === 'jsd@exemplo.pt' && /Institucional: 5 enviados/.test(resumo[0].body) && /Geral: 10 enviados/.test(resumo[0].body), 'resumo final para a própria conta com as contagens');

e = ambiente({ geral: pessoas(50, 'g'), institucional: pessoas(10, 'i'), quota: 30, reserva: 5 });
e.correr('ativarEnvioAutomatico()'); e.correr('envioAutomatico()');
ok(e.enviados.length === 25 && e.enviados.filter(m => m.to.startsWith('i')).length === 10, `quota 30, reserva 5: 10 institucionais + 15 gerais; foram ${e.enviados.length}`);
ok(e.gatilhos.length === 1, 'continua ativo');

// ------------------------------------------------------------------ 13. o teu caso: 74 de 100 institucionais enviados, 1894 gerais, 100 por dia
titulo('13. o caso real: 26 institucionais por enviar (74 já enviados) e 1894 gerais, a 100 por dia');
function simular(reserva, repetidos = false) {
  const inst = pessoas(100, 'i').map((p, k) => k < 74 ? [p[0], p[1], p[2], 'Enviado a 30/09/2026 12:00'] : p);
  const ger = pessoas(1894, 'g');
  if (repetidos) { for (let k = 0; k < 40; k++) ger[k][1] = `i${k}@exemplo.pt`; for (let k = 40; k < 50; k++) ger[k][1] = ger[k - 40 + 100][1]; }
  const ee = ambiente({ geral: ger, institucional: inst, quota: 100, reserva });
  ee.correr('ativarEnvioAutomatico()');
  let dias = 0;
  while (ee.gatilhos.length && dias < 60) { ee.usados = 0; dias++; ee.correr('envioAutomatico()'); }
  return { ee, dias };
}
let sim = simular(0);
ok(sim.dias === 20, `sem reserva: ${sim.dias} dias (esperava 20)`);
ok(sim.ee.folhaInst.estados().every(s => /^Enviado a /.test(s)) && sim.ee.folhaGeral.estados().every(s => /^Enviado a /.test(s)), 'todas as 1894 + 26 enviadas');
const dest = sim.ee.enviados.map(m => m.to).filter(t => t !== 'jsd@exemplo.pt');
ok(dest.length === 1920 && unicos(dest), `1920 emails, ninguém repetido (${dest.length})`);
ok(sim.ee.enviados.slice(0, 26).every(m => m.to.startsWith('i')), 'o 1.º dia começa pelos 26 institucionais');
ok(sim.ee.enviados.slice(26, 100).every(m => m.to.startsWith('g')), '…e preenche o resto do 1.º dia (74) com gerais');
sim = simular(20);
ok(sim.dias === 24, `com reserva de 20: ${sim.dias} dias (esperava 24)`);
sim = simular(0, true);
ok(sim.dias === 19, `com 40 gerais que já são institucionais e 10 repetidos: ${sim.dias} dias (esperava 19)`);
ok(sim.ee.folhaGeral.estados().filter(s => /^Ignorado/.test(s)).length === 50, '50 ignorados (40 institucionais + 10 repetidos)');

// ------------------------------------------------------------------ 14. verProgresso e verQuota
titulo('14. verProgresso e verQuota');
e = ambiente({ institucional: pessoas(100, 'i').map((p, k) => k < 74 ? [p[0], p[1], p[2], 'Enviado a x'] : p), geral: pessoas(1894, 'g'), quota: 100, reserva: 20 });
e.correr('verProgresso()');
ok(/Institucional: 74 enviados · 26 por enviar/.test(e.alertas[0]) && /Geral: 0 enviados · 1894 por enviar/.test(e.alertas[0]), 'contagens');
ok(/Faltam 1920 emails/.test(e.alertas[0]) && /24 dias/.test(e.alertas[0]), 'estimativa de 24 dias com reserva de 20: ' + e.alertas[0].split('\n').pop());
ok(e.enviados.length === 0, 'não envia nada');
e = ambiente({ quota: 100, reserva: 20 }); e.usados = 72; e.correr('verQuota()');
ok(/28 emails/.test(e.alertas[0]) && /jsd@exemplo\.pt/.test(e.alertas[0]) && /20 .*reserva/.test(e.alertas[0]), 'verQuota mostra 28, a reserva e a conta');

// sem URL da folha institucional
e = ambiente({ institucional: pessoas(2) }); e.c.URL_FOLHA_INSTITUCIONAL = 'COLA_AQUI_O_URL_DA_FOLHA_INSTITUCIONAL';
e.correr('enviarConvitesInstitucionais()');
ok(/Falta o URL/.test(e.alertas[0]) && e.enviados.length === 0, 'avisa se falta o URL da folha institucional');
e = ambiente({ geral: pessoas(2) }); e.c.URL_FOLHA_INSTITUCIONAL = 'COLA_AQUI_O_URL_DA_FOLHA_INSTITUCIONAL';
e.correr('enviarConvites()');
ok(e.enviados.length === 2, 'o geral funciona sem o URL (só não exclui os institucionais)');

console.log(erros ? `\n${erros} FALHAS em ${n} verificações` : `\nTudo certo: ${n} verificações.`);
process.exit(erros ? 1 : 0);
