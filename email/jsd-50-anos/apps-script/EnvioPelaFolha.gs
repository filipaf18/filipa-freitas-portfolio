/**
 * Envio dos convites a partir da folha de cálculo, DENTRO do limite diário de envio da Google.
 * Versão corrigida do script «Envio de Convites»: mesmas listas, mesmas saudações e adaptação de género.
 *
 * O que muda em relação à versão anterior:
 *  - Lê a quota real que a Google ainda deixa enviar hoje (MailApp.getRemainingDailyQuota) e pára quando acaba,
 *    em vez de contar só os «Enviado a hoje» da folha (os testes e outros envios da conta também contam).
 *  - Se a Google recusar um envio por limite, PÁRA e deixa a linha em branco. Antes escrevia «Erro» em todas as
 *    linhas seguintes e essas pessoas nunca mais eram tentadas. As linhas que já ficaram com
 *    «Erro: Service invoked too many times...» voltam a ser tentadas sozinhas.
 *  - Envio automático: ativarEnvioAutomatico() cria um acionador diário que envia o que a quota deixar, todos os dias,
 *    até as listas acabarem (e desliga-se sozinho).
 *  - Trava para duas execuções ao mesmo tempo (menu + acionador) não enviarem duas vezes à mesma pessoa.
 *  - Corpo em texto simples junto do HTML (ajuda a não ir para o spam), nomes com «&» ou «<» não estragam o HTML,
 *    emails sem «@» ficam marcados («Erro: email inválido») em vez de ficarem sempre por tratar.
 *
 * LIMITES DA GOOGLE (Apps Script, MailApp/GmailApp; confirma em developers.google.com/apps-script/guides/services/quotas):
 *   conta Gmail pessoal: 100 destinatários por dia · Google Workspace: 1500 por dia · 6 minutos por execução.
 * Não há maneira legítima de os ultrapassar com a mesma conta. Com 100 por dia, 450 pessoas levam 5 dias.
 * Corre verQuota() (menu) para ver quantos ainda podes enviar hoje.
 *
 * Os ficheiros HTML do projeto têm de se chamar «convite» (geral) e «convite_institucional».
 */

// ---------------------------------------------------------------- configuração
var ASSUNTO = '50 Anos JSD Famalicão · Jantar Comemorativo';
var NOME_REMETENTE = 'JSD Famalicão';
var URL_FOLHA_INSTITUCIONAL = 'COLA_AQUI_O_URL_DA_FOLHA_INSTITUCIONAL';
var NOME_FOLHA_GERAL = '';                       // '' = a folha ativa (no envio automático, a primeira folha)
var LIMITE_POR_RONDA = 100;                      // máximo por execução
var PAUSA_MS = 1000;                             // pausa entre emails
var TEMPO_MAXIMO_MS = 5 * 60 * 1000;             // a Google pára os scripts aos 6 minutos: pára aos 5 e continua depois
var HORA_ENVIO_AUTOMATICO = 9;                   // hora do acionador diário (a Google pode atrasar até 1 hora)
var AVISAR_POR_EMAIL = true;                     // o envio automático manda um resumo para a tua conta (conta 1 na quota)

// ---------------------------------------------------------------- menu
function onOpen() {
  SpreadsheetApp.getUi().createMenu('✉️ Envio de Convites')
      .addItem('Enviar Lote - Convite Geral', 'enviarConvites')
      .addItem('Enviar Lote - Institucional', 'enviarConvitesInstitucionais')
      .addSeparator()
      .addItem('Ver quanto ainda posso enviar hoje', 'verQuota')
      .addItem('Ativar envio automático (diário)', 'ativarEnvioAutomatico')
      .addItem('Desativar envio automático', 'desativarEnvioAutomatico')
      .addToUi();
}

// ---------------------------------------------------------------- envio manual (menu)
function enviarConvites() {
  executar_(function () { return processarEnvios(folhaGeral_(), 'convite'); });
}

function enviarConvitesInstitucionais() {
  executar_(function () { return processarEnvios(folhaInstitucional_(), 'convite_institucional'); });
}

function folhaGeral_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (NOME_FOLHA_GERAL) {
    var f = ss.getSheetByName(NOME_FOLHA_GERAL);
    if (!f) throw new Error('Não existe a folha «' + NOME_FOLHA_GERAL + '».');
    return f;
  }
  return ss.getActiveSheet() || ss.getSheets()[0];
}

function folhaInstitucional_() {
  if (URL_FOLHA_INSTITUCIONAL.indexOf('COLA_AQUI') !== -1) {
    throw new Error('Falta o URL da folha institucional: preenche URL_FOLHA_INSTITUCIONAL no início do script.');
  }
  return SpreadsheetApp.openByUrl(URL_FOLHA_INSTITUCIONAL).getSheets()[0];
}

/** Corre um envio com a trava, e mostra o resumo (ou regista-o, se não houver ecrã, como nos acionadores). */
function executar_(envio) {
  var trava = LockService.getScriptLock();
  if (!trava.tryLock(30000)) {
    avisar_('Já está um envio a decorrer. Espera que termine e volta a tentar.');
    return;
  }
  try {
    avisar_(resumo_(envio()));
  } catch (e) {
    avisar_('Erro: ' + e.message);
  } finally {
    trava.releaseLock();
  }
}

// ---------------------------------------------------------------- motor de envio
/**
 * Envia a uma lista. Colunas da folha: A nome · B email · C género · D estado (vazio = por enviar).
 * Devolve {enviados, erros, pendentes, paragem}; paragem: 'quota' | 'ronda' | 'tempo' | 'concluida' | 'sem-dados'.
 */
function processarEnvios(folha, nomeFicheiroHtml) {
  var inicio = Date.now();
  var res = { enviados: 0, erros: 0, pendentes: 0, paragem: '' };
  var ultimaLinha = folha.getLastRow();
  if (ultimaLinha < 2) { res.paragem = 'sem-dados'; return res; }

  var dados = folha.getRange(2, 1, ultimaLinha - 1, 4).getValues();
  var linhas = [];                               // posições dos que ainda faltam
  for (var j = 0; j < dados.length; j++) {
    if (texto_(dados[j][0]) === '' && texto_(dados[j][1]) === '') break;
    if (porEnviar_(texto_(dados[j][3]))) linhas.push(j);
  }
  if (!linhas.length) { res.paragem = 'concluida'; return res; }

  var quota = MailApp.getRemainingDailyQuota();
  var podeEnviar = Math.min(LIMITE_POR_RONDA, quota);
  if (podeEnviar <= 0) { res.pendentes = linhas.length; res.paragem = 'quota'; return res; }

  var modelo = HtmlService.createHtmlOutputFromFile(nomeFicheiroHtml).getContent();
  var agora = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');

  for (var k = 0; k < linhas.length; k++) {
    if (res.enviados >= podeEnviar) { res.paragem = (podeEnviar === quota) ? 'quota' : 'ronda'; break; }
    if (Date.now() - inicio > TEMPO_MAXIMO_MS) { res.paragem = 'tempo'; break; }

    var i = linhas[k];
    var email = texto_(dados[i][1]);
    if (email.indexOf('@') === -1) {
      folha.getRange(i + 2, 4).setValue('Erro: email inválido');
      res.erros++;
      continue;
    }
    try {
      var html = personalizar_(modelo, nomeFicheiroHtml, texto_(dados[i][0]), texto_(dados[i][2]).toLowerCase());
      MailApp.sendEmail({ to: email, subject: ASSUNTO, body: textoSimples_(html), htmlBody: html, name: NOME_REMETENTE });
      folha.getRange(i + 2, 4).setValue('Enviado a ' + agora);
      res.enviados++;
      Utilities.sleep(PAUSA_MS);
    } catch (e) {
      if (erroDeQuota_(e)) { res.paragem = 'quota'; break; }   // a linha fica em branco: tenta-se na próxima ronda
      folha.getRange(i + 2, 4).setValue('Erro: ' + e.message);
      res.erros++;
    }
  }
  res.pendentes = linhas.length - res.enviados - res.erros;
  if (!res.paragem) res.paragem = res.pendentes > 0 ? 'ronda' : 'concluida';
  return res;
}

/** Por enviar: estado vazio, ou um erro de quota de uma ronda anterior (os outros erros ficam à vista para decidires). */
function porEnviar_(estado) {
  return estado === '' || /^Erro: .*(too many times|limit exceeded)/i.test(estado);
}

function erroDeQuota_(e) {
  return /too many times|limit exceeded|quota/i.test(String(e && e.message));
}

function texto_(v) {
  return (v === null || v === undefined ? '' : v).toString().trim();
}

// ---------------------------------------------------------------- personalização (igual à versão anterior)
function personalizar_(modelo, nomeFicheiroHtml, nomeCompleto, genero) {
  var partes = nomeCompleto.split(' ');
  var nomeFinal = partes.length > 1 ? partes[0] + ' ' + partes[partes.length - 1] : partes[0];
  nomeFinal = nomeFinal.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  var html = modelo;

  // saudação: no institucional mantém «companheiro(a)» e junta o nome; no geral o nome substitui «companheiro(a)»
  if (nomeFicheiroHtml === 'convite_institucional') {
    html = trocar_(html, 'Estimado(a) companheiro(a),', 'Estimado(a) companheiro(a) ' + nomeFinal + ',');
    html = trocar_(html, 'Caro(a) companheiro(a),', 'Caro(a) companheiro(a) ' + nomeFinal + ',');
  } else {
    html = trocar_(html, 'Caro(a) companheiro(a),', 'Caro(a) ' + nomeFinal + ',');
  }

  // género
  var feminino = (genero === 'feminino' || genero === 'f' || genero === 'mulher');
  var trocas = feminino
    ? [[/o\(a\)/g, 'a'], [/a\(o\)/g, 'a'], [/\(a\)/g, 'a'], [/\(o\)/g, ''], [/O\(A\)/g, 'A'], [/A\(O\)/g, 'A'], [/\(A\)/g, 'A'], [/\(O\)/g, '']]
    : [[/o\(a\)/g, 'o'], [/a\(o\)/g, 'o'], [/\(a\)/g, ''], [/\(o\)/g, 'o'], [/O\(A\)/g, 'O'], [/A\(O\)/g, 'O'], [/\(A\)/g, ''], [/\(O\)/g, 'O']];
  for (var t = 0; t < trocas.length; t++) html = html.replace(trocas[t][0], trocas[t][1]);
  return html;
}

/** Troca a primeira ocorrência, sem que «$» no nome seja tratado como código de substituição. */
function trocar_(texto, de, para) {
  var p = texto.indexOf(de);
  return p === -1 ? texto : texto.substring(0, p) + para + texto.substring(p + de.length);
}

/** Versão em texto simples do HTML (a outra parte do email, para quem não vê HTML). */
function textoSimples_(html) {
  return html
    .replace(/<(style|head)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<div style="display:none;[\s\S]*?<\/div>/i, '')
    .replace(/<br\s*\/?>|<\/tr>|<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, function (m, n) { return String.fromCharCode(parseInt(n, 10)); })
    .replace(/&amp;/g, '&')
    .split('\n').map(function (l) { return l.replace(/[ \t ]+/g, ' ').trim(); }).join('\n')
    .replace(/\n{3,}/g, '\n\n').trim();
}

// ---------------------------------------------------------------- mensagens
function resumo_(res) {
  var t = 'Enviou ' + res.enviados + ' emails nesta ronda.';
  if (res.erros) t += '\n' + res.erros + ' com erro (ver a coluna «Estado»).';
  if (res.paragem === 'quota') {
    t += '\n\nA quota diária de envio da Google esgotou-se. As ' + res.pendentes + ' pessoas que faltam NÃO foram marcadas com erro: '
       + 'ficam para a próxima ronda, passadas cerca de 24 horas (ou deixa o envio automático ativo).';
  } else if (res.paragem === 'ronda') {
    t += '\n\nPausa de segurança (limite por ronda). Faltam ' + res.pendentes + '. Volta a clicar daqui a uns minutos.';
  } else if (res.paragem === 'tempo') {
    t += '\n\nParou ao fim de 5 minutos (limite da Google por execução). Faltam ' + res.pendentes + '. Volta a clicar.';
  } else if (res.paragem === 'concluida' && res.enviados === 0 && !res.erros) {
    t = 'Não há ninguém por enviar nesta lista.';
  } else if (res.paragem === 'concluida') {
    t += '\n\nFim da lista.';
  } else if (res.paragem === 'sem-dados') {
    t = 'Não foram encontrados dados para enviar na folha.';
  }
  return t;
}

/** Mostra a mensagem num ecrã e, se não houver (acionadores), regista-a. */
function avisar_(mensagem) {
  try {
    SpreadsheetApp.getUi().alert(mensagem);
  } catch (e) {
    Logger.log(mensagem);
  }
}

function verQuota() {
  avisar_('Ainda podes enviar ' + MailApp.getRemainingDailyQuota() + ' emails hoje (o limite renova-se passadas cerca de 24 horas).\n'
        + 'Conta: ' + Session.getEffectiveUser().getEmail());
}

// ---------------------------------------------------------------- envio automático (todos os dias)
function ativarEnvioAutomatico() {
  desativarEnvioAutomatico();
  ScriptApp.newTrigger('envioAutomatico').timeBased().everyDays(1).atHour(HORA_ENVIO_AUTOMATICO).create();
  avisar_('Envio automático ativado: todos os dias, por volta das ' + HORA_ENVIO_AUTOMATICO + 'h, o script envia o que a quota da Google deixar '
        + '(primeiro a lista institucional, depois a geral), até as listas acabarem. Desliga-se sozinho no fim.');
}

function desativarEnvioAutomatico() {
  ScriptApp.getProjectTriggers().forEach(function (g) {
    if (g.getHandlerFunction() === 'envioAutomatico') ScriptApp.deleteTrigger(g);
  });
}

/** Função do acionador diário: institucional primeiro, depois a geral; para se a quota acabar. */
function envioAutomatico() {
  var trava = LockService.getScriptLock();
  if (!trava.tryLock(30000)) { Logger.log('Já está um envio a decorrer.'); return; }
  try {
    var listas = [['convite_institucional', folhaInstitucional_], ['convite', folhaGeral_]];
    var enviados = 0, erros = 0, pendentes = 0, paragem = '';
    for (var n = 0; n < listas.length; n++) {
      var r = processarEnvios(listas[n][1](), listas[n][0]);
      enviados += r.enviados; erros += r.erros; pendentes += r.pendentes;
      Logger.log(listas[n][0] + ': ' + resumo_(r).replace(/\n+/g, ' '));
      if (r.paragem === 'quota' || r.paragem === 'tempo') { paragem = r.paragem; break; }
    }
    var concluido = pendentes === 0 && !paragem;
    if (concluido) desativarEnvioAutomatico();
    if (AVISAR_POR_EMAIL && enviados > 0 && MailApp.getRemainingDailyQuota() > 0) {
      MailApp.sendEmail(Session.getEffectiveUser().getEmail(), 'Envio automático dos convites: resumo',
        'Hoje enviei ' + enviados + ' emails' + (erros ? ' (' + erros + ' com erro)' : '') + '.\n'
        + (concluido ? 'As listas estão concluídas e o envio automático foi desativado.'
                     : 'Faltam ' + pendentes + ' pessoas; continuo amanhã.'));
    }
  } catch (e) {
    Logger.log('Erro no envio automático: ' + e.message);
  } finally {
    trava.releaseLock();
  }
}
