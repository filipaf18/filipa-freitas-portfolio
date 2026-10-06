// PARTE 7 de 8. Ficheiro «Parte7.gs» do projeto Apps Script.
// Não alterar. Faz parte do mesmo código que as outras partes.
var PARTE_7 = true;

/** Um email de cada vez, a cada clique: a próxima pessoa por enviar da lista. */
function enviarUmGeral() {
  executar_(function () { return processarEnvios(folhaGeral_(), 'convite', emailsInstitucionais_(), 1); });
}

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
  avisar_('Envio automático ativado: entre as ' + HORA_INICIO_ENVIO + 'h e as ' + HORA_FIM_ENVIO + 'h o script vê de minuto a minuto se a Google deixa enviar e, havendo quota (nem que seja para 1 email), '
        + (INTERVALO_MAX_S <= 0 ? 'envia logo, o mais depressa possível (' + PAUSA_AUTOMATICO_MS / 1000 + ' s entre emails), até a quota acabar. '
                                : 'envia um email de cada vez, com ' + INTERVALO_MIN_S + ' a ' + INTERVALO_MAX_S + ' segundos de intervalo. ')
        + 'Primeiro a lista institucional, depois a geral. '
        + (RESERVA_QUOTA > 0 ? 'Nas primeiras ' + HORAS_SEM_RESERVA + ' horas usa a quota toda; depois deixa sempre ' + RESERVA_QUOTA + ' por usar, para as confirmações. '
                             : 'Não deixa nenhuma quota de reserva. ')
        + 'Desliga-se sozinho quando as listas acabarem. «Ver progresso» mostra o ponto da situação.');
}
