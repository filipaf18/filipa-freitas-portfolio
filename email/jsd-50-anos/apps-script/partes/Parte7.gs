// PARTE 7 de 8. Ficheiro «Parte7.gs» do projeto Apps Script.
// Não alterar. Faz parte do mesmo código que as outras partes.
var PARTE_7 = true;

/** Um email de cada vez, a cada clique: a próxima pessoa por enviar da lista. */
function enviarUmGeral() {
  executar_(function () { return processarEnvios(folhaGeral_(), 'convite', emailsInstitucionais_(), 1); });
}

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

/** Nomes todos em maiúsculas ou todos em minúsculas passam a «Maria da Silva»; os restantes ficam como estão. */
function nomeProprio_(nome) {
  if (nome !== nome.toUpperCase() && nome !== nome.toLowerCase()) return nome;
  var particulas = { de: 1, da: 1, do: 1, dos: 1, das: 1, e: 1 };
  return nome.toLowerCase().split(/\s+/).map(function (p, k) {
    if (k > 0 && particulas[p]) return p;
    return p.replace(/(^|[-'])([a-zà-ÿ])/g, function (m, a, b) { return a + b.toUpperCase(); });
  }).join(' ');
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

/** Quando começaram os envios de convites, em ms: INICIO_DOS_ENVIOS, ou o momento em que este script enviou o 1.º; 0 se ainda não. */
function inicioEnvio_() {
  if (INICIO_DOS_ENVIOS) {
    var d = new Date(String(INICIO_DOS_ENVIOS).replace(' ', 'T'));
    if (!isNaN(d.getTime())) return d.getTime();
  }
  return Number(PropertiesService.getScriptProperties().getProperty('inicioEnvio')) || 0;
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
