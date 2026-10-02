// PARTE 7 de 8. Ficheiro «Parte7.gs» do projeto Apps Script.
// Não alterar. Faz parte do mesmo código que as outras partes.
var PARTE_7 = true;

/** Emails da lista institucional (para não lhes enviar também o convite geral). Vazio se estiver desligado. */
function emailsInstitucionais_() {
  if (!EXCLUIR_INSTITUCIONAIS_DA_GERAL) return {};
  var folha = folhaInstitucional_();
  var n = folha.getLastRow();
  return n < 2 ? {} : mapaEmails_(folha.getRange(2, 1, n - 1, 4).getValues());
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

/** Quando começaram os envios de convites, em ms: INICIO_DOS_ENVIOS, ou o momento em que este script enviou o 1.º; 0 se ainda não. */
function inicioEnvio_() {
  if (INICIO_DOS_ENVIOS) {
    var d = new Date(String(INICIO_DOS_ENVIOS).replace(' ', 'T'));
    if (!isNaN(d.getTime())) return d.getTime();
  }
  return Number(PropertiesService.getScriptProperties().getProperty('inicioEnvio')) || 0;
}

/** Reserva em vigor: zero nas primeiras HORAS_SEM_RESERVA depois do 1.º convite enviado, RESERVA_QUOTA depois. */
function reservaAtual_() {
  if (HORAS_SEM_RESERVA <= 0) return RESERVA_QUOTA;
  var inicio = inicioEnvio_();
  if (!inicio || Date.now() - inicio < HORAS_SEM_RESERVA * 3600000) return 0;   // ainda não enviou nenhum, ou está nas primeiras horas
  return RESERVA_QUOTA;
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
  limparFalhas_();
  ScriptApp.newTrigger('envioAutomatico').timeBased().everyMinutes(1).create();
  avisar_('Envio automático ativado: entre as ' + HORA_INICIO_ENVIO + 'h e as ' + HORA_FIM_ENVIO + 'h o script envia um email de cada vez, com 1 a 2 minutos de intervalo '
        + '(primeiro a lista institucional, depois a geral), enquanto a Google deixar. Quando a quota acabar pára e retoma sozinho quando ela for libertada. '
        + 'Nas primeiras ' + HORAS_SEM_RESERVA + ' horas usa a quota toda; depois deixa sempre ' + RESERVA_QUOTA + ' por usar, para as confirmações. '
        + 'Desliga-se sozinho quando as listas acabarem. «Ver progresso» mostra o ponto da situação.');
}
