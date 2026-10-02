// PARTE 3 de 7. Ficheiro «Parte3.gs» do projeto Apps Script.
// Não alterar. Faz parte do mesmo código que as outras partes.
var PARTE_3 = true;

/** Troca a primeira ocorrência, sem que «$» no nome seja tratado como código de substituição. */
function trocar_(texto, de, para) {
  var p = texto.indexOf(de);
  return p === -1 ? texto : texto.substring(0, p) + para + texto.substring(p + de.length);
}

/**
 * Confere o projeto e diz o que falha, sem enviar nada: conta e quota, os dois ficheiros HTML (existem? têm as imagens do
 * site e a saudação onde o nome entra?), o acesso às duas listas e o cabeçalho, e o envio automático.
 */
function diagnostico() {
  var linhas = [], problemas = 0;
  var ok = function (t) { linhas.push('✔ ' + t); };
  var mau = function (t) { linhas.push('✘ ' + t); problemas++; };

  try {
    ok('Conta: ' + Session.getEffectiveUser().getEmail() + ' · ainda podes enviar ' + MailApp.getRemainingDailyQuota() + ' emails hoje.');
  } catch (e) { mau('Não consegui ler a quota (falta autorizar o envio de emails?): ' + e.message); }

  var modelos = [['convite', 'Caro(a) companheiro(a),'], ['convite_institucional', 'Estimado(a) companheiro(a),']];
  for (var m = 0; m < modelos.length; m++) {
    try {
      var html = HtmlService.createHtmlOutputFromFile(modelos[m][0]).getContent();
      var avisos = [];
      if (html.indexOf('data:image') !== -1) avisos.push('traz imagens embutidas (versão antiga): o Gmail não as mostra, usa o HTML novo');
      if (html.indexOf('https://jsdfamalicao.pt/convite/') === -1) avisos.push('não refere as imagens do site');
      if (html.indexOf(modelos[m][1]) === -1) avisos.push('não tem «' + modelos[m][1] + '»: o nome não entra na saudação');
      if (avisos.length) mau('Ficheiro HTML «' + modelos[m][0] + '»: ' + avisos.join('; ') + '.');
      else ok('Ficheiro HTML «' + modelos[m][0] + '» (' + Math.round(html.length / 1024) + ' KB): imagens por endereço e saudação com «' + modelos[m][1] + '».');
    } catch (e) {
      mau('Falta o ficheiro HTML «' + modelos[m][0] + '» no projeto (no editor: + → HTML, com este nome exato, e cola lá o HTML do convite).');
    }
  }

  var enderecosOk = true;
  try { validarUrls_(); ok('Endereços das duas listas preenchidos e diferentes.'); } catch (e) { enderecosOk = false; mau(e.message); }
  if (enderecosOk) {
    var listas = [['Institucional', URL_FOLHA_INSTITUCIONAL], ['Geral', URL_FOLHA_GERAL]];
    for (var l = 0; l < listas.length; l++) {
      try {
        var folha = SpreadsheetApp.openByUrl(listas[l][1]).getSheets()[0];
        var cab = folha.getRange(1, 1, 1, 4).getValues()[0].map(function (c) { return texto_(c); });
        var rotulo = listas[l][0] + ' ' + nomeDaLista_(listas[l][1], folha) + ', ' + Math.max(0, folha.getLastRow() - 1) + ' linhas';
        if (/nome/i.test(cab[0]) && /mail/i.test(cab[1]) && /g[eé]nero|sexo/i.test(cab[2])) ok(rotulo + '; cabeçalho «' + cab.join(' | ') + '».');
        else mau(rotulo + ': o cabeçalho devia ser «Nome | Email | Género | estado» nas colunas A a D e é «' + cab.join(' | ') + '».');
      } catch (e) {
        mau('Lista ' + listas[l][0] + ': não consegui abrir (endereço errado, ou a conta ' + Session.getEffectiveUser().getEmail() + ' não tem acesso): ' + e.message);
      }
    }
  }

  var ativos = ScriptApp.getProjectTriggers().filter(function (g) { return g.getHandlerFunction() === 'envioAutomatico'; }).length;
  linhas.push((ativos ? '✔ Envio automático ativo.' : '• Envio automático desativado (ativa-o no menu quando quiseres começar).'));
  avisar_(linhas.join('\n') + '\n\n' + (problemas ? problemas + ' problema(s) assinalado(s) com ✘.' : 'Tudo em ordem.'));
}

/** Função do acionador: institucional primeiro, depois a geral; para quando a quota acaba. */
function envioAutomatico() {
  var hora = new Date().getHours();
  if (hora < HORA_INICIO_ENVIO || hora >= HORA_FIM_ENVIO) return;                  // fora do horário de envio
  if (MailApp.getRemainingDailyQuota() - reservaAtual_() <= 0) return;             // sem quota: nem lê as folhas

  var trava = LockService.getScriptLock();
  if (!trava.tryLock(30000)) { Logger.log('Já está um envio a decorrer.'); return; }
  try {
    var listas = [['convite_institucional', function () { return folhaInstitucional_(); }, function () { return {}; }],
                  ['convite', folhaGeral_, emailsInstitucionais_]];
    var pendentes = 0, paragem = '', folhas = [];
    for (var n = 0; n < listas.length; n++) {
      var folha = listas[n][1]();
      folhas.push(folha);
      var r = processarEnvios(folha, listas[n][0], listas[n][2]());
      pendentes += r.pendentes;
      Logger.log(listas[n][0] + ': ' + resumo_(r).replace(/\n+/g, ' '));
      if (r.paragem === 'quota' || r.paragem === 'tempo') { paragem = r.paragem; break; }
    }
    var concluido = pendentes === 0 && !paragem;
    if (concluido) {
      desativarEnvioAutomatico();
      if (AVISAR_POR_EMAIL) resumoFinal_(folhas);
    }
  } catch (e) {
    Logger.log('Erro no envio automático: ' + e.message);
  } finally {
    trava.releaseLock();
  }
}
