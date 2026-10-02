// PARTE 6 de 7. Ficheiro «Parte6.gs» do projeto Apps Script.
// Não alterar. Faz parte do mesmo código que as outras partes.
var PARTE_6 = true;

/** Os dois endereços têm de estar preenchidos e apontar para ficheiros DIFERENTES (senão enviava-se o convite errado). */
function validarUrls_() {
  var faltam = [];
  if (URL_FOLHA_INSTITUCIONAL.indexOf('COLA_AQUI') !== -1) faltam.push('URL_FOLHA_INSTITUCIONAL');
  if (URL_FOLHA_GERAL.indexOf('COLA_AQUI') !== -1) faltam.push('URL_FOLHA_GERAL');
  if (faltam.length) throw new Error('Falta o URL da lista (' + faltam.join(' e ') + '): preenche no início do script.');
  var id = function (u) { var m = /\/d\/([a-zA-Z0-9_-]+)/.exec(u); return m ? m[1] : u; };
  if (id(URL_FOLHA_INSTITUCIONAL) === id(URL_FOLHA_GERAL)) {
    throw new Error('A lista institucional e a lista geral apontam para o MESMO ficheiro. Confirma os dois endereços no início do script '
                  + '(institucional = «Convidados 50 anos», geral = «Militantes Base»).');
  }
}

function mapaEmails_(dados) {
  var mapa = {};
  for (var k = 0; k < dados.length; k++) {
    var e = texto_(dados[k][1]).toLowerCase();
    if (e !== '') mapa[e] = true;
  }
  return mapa;
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
        + (reservaAtual_() ? 'Destes, ' + reservaAtual_() + ' ficam de reserva (RESERVA_QUOTA) e não são usados pelo envio dos convites.\n'
                           : 'Neste momento não há reserva (primeiras ' + HORAS_SEM_RESERVA + ' horas de envio): os convites podem usar tudo.\n')
        + 'Conta: ' + Session.getEffectiveUser().getEmail());
}

/** Quantos emails foram enviados nas últimas 24 horas, pelas horas escritas no estado («Enviado a dd/MM/aaaa HH:mm»). */
function enviadosNas24h_(dados) {
  var desde = Date.now() - 24 * 3600000, n = 0;
  for (var j = 0; j < dados.length; j++) {
    var m = /^Enviado a (\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})/.exec(texto_(dados[j][3]));
    if (m && new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), Number(m[4]), Number(m[5])).getTime() >= desde) n++;
  }
  return n;
}

// ---------------------------------------------------------------- envio automático (de minuto a minuto)
function ativarEnvioAutomatico() {
  desativarEnvioAutomatico();
  var props = PropertiesService.getScriptProperties();
  props.setProperty('acionador', 'minuto');
  props.deleteProperty('proximoEnvio');
  ScriptApp.newTrigger('envioAutomatico').timeBased().everyMinutes(1).create();
  avisar_('Envio automático ativado: entre as ' + HORA_INICIO_ENVIO + 'h e as ' + HORA_FIM_ENVIO + 'h o script envia um email de cada vez, com 1 a 2 minutos de intervalo '
        + '(primeiro a lista institucional, depois a geral), enquanto a Google deixar. Quando a quota acabar pára e retoma sozinho quando ela for libertada. '
        + 'Nas primeiras ' + HORAS_SEM_RESERVA + ' horas usa a quota toda; depois deixa sempre ' + RESERVA_QUOTA + ' por usar, para as confirmações. '
        + 'Desliga-se sozinho quando as listas acabarem. «Ver progresso» mostra o ponto da situação.');
}

/** Email para a própria conta quando as listas acabam. */
function resumoFinal_(folhas) {
  var nomes = ['Institucional', 'Geral'], linhas = [];
  for (var n = 0; n < folhas.length; n++) {
    var ultima = folhas[n].getLastRow();
    var a = analisar_(ultima < 2 ? [] : folhas[n].getRange(2, 1, ultima - 1, 4).getValues(), {});
    linhas.push(nomes[n] + ': ' + a.enviados + ' enviados · ' + a.ignorados + ' ignorados · ' + a.erros + ' com erro');
  }
  MailApp.sendEmail(Session.getEffectiveUser().getEmail(), 'Envio automático dos convites: concluído',
    linhas.join('\n') + '\n\nAs listas estão concluídas e o envio automático foi desativado.\n'
    + 'Os «com erro» ficam na coluna Estado, para veres e decidires.');
}
