// PARTE 3 de 8. Ficheiro «Parte3.gs» do projeto Apps Script.
// Não alterar. Faz parte do mesmo código que as outras partes.
var PARTE_3 = true;

// ---------------------------------------------------------------- análise da lista (só lê)
/**
 * Percorre a lista e separa: quem falta enviar, quem já foi, os erros, e quem deve ser ignorado (email repetido na
 * lista, ou já na lista institucional). «excluir» é um mapa email-em-minúsculas → true.
 */
function analisar_(dados, excluir) {
  var r = { total: 0, porEnviar: [], novosIgnorados: [], enviados: 0, ignorados: 0, erros: 0 };
  var vistos = {};
  for (var j = 0; j < dados.length; j++) {
    var email = texto_(dados[j][1]);
    var estado = texto_(dados[j][3]);
    if (texto_(dados[j][0]) === '' && email === '') continue;      // linha em branco: salta (a lista pode ter espaços)
    r.total++;
    var chave = email.toLowerCase();
    var pendente = porEnviar_(estado);
    var enviado = /^Enviado a /.test(estado);
    if (pendente) {
      if (chave !== '' && vistos[chave]) r.novosIgnorados.push({ i: j, motivo: 'Ignorado: email repetido na lista' });
      else if (chave !== '' && excluir[chave]) r.novosIgnorados.push({ i: j, motivo: 'Ignorado: já está na lista institucional' });
      else r.porEnviar.push(j);
    } else if (enviado) {
      r.enviados++;
    } else if (/^Ignorado/.test(estado)) {
      r.ignorados++;
    } else {
      r.erros++;
    }
    if (chave !== '' && (pendente || enviado)) vistos[chave] = true;   // a primeira ocorrência é a que conta
  }
  return r;
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
  if (ativos && PropertiesService.getScriptProperties().getProperty('acionador') !== 'minuto') {
    mau('O envio automático está ativo, mas foi criado por uma versão antiga do script (de hora a hora): escolhe «Desativar envio automático» e depois «Ativar envio automático».');
  } else {
    linhas.push(ativos ? '✔ Envio automático ativo (de minuto a minuto, entre as ' + HORA_INICIO_ENVIO + 'h e as ' + HORA_FIM_ENVIO + 'h).'
                       : '• Envio automático desativado (ativa-o no menu quando quiseres começar).');
  }
  if (problemaAtual_()) mau(problemaAtual_());
  avisar_(linhas.join('\n') + '\n\n' + (problemas ? problemas + ' problema(s) assinalado(s) com ✘.' : 'Tudo em ordem.'));
}
