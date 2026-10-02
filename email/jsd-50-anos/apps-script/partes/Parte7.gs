// PARTE 7 de 7. Ficheiro «Parte7.gs» do projeto Apps Script.
// Não alterar. Faz parte do mesmo código que as outras partes.
var PARTE_7 = true;

function folhaGeral_() {
  validarUrls_();
  return SpreadsheetApp.openByUrl(URL_FOLHA_GERAL).getSheets()[0];
}

function folhaInstitucional_() {
  validarUrls_();
  return SpreadsheetApp.openByUrl(URL_FOLHA_INSTITUCIONAL).getSheets()[0];
}

/** Emails da lista institucional (para não lhes enviar também o convite geral). Vazio se estiver desligado. */
function emailsInstitucionais_() {
  if (!EXCLUIR_INSTITUCIONAIS_DA_GERAL) return {};
  var folha = folhaInstitucional_();
  var n = folha.getLastRow();
  return n < 2 ? {} : mapaEmails_(folha.getRange(2, 1, n - 1, 4).getValues());
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

/** Troca a primeira ocorrência, sem que «$» no nome seja tratado como código de substituição. */
function trocar_(texto, de, para) {
  var p = texto.indexOf(de);
  return p === -1 ? texto : texto.substring(0, p) + para + texto.substring(p + de.length);
}

/** Quando começaram os envios de convites, em ms: INICIO_DOS_ENVIOS, ou o momento em que este script enviou o 1.º; 0 se ainda não. */
function inicioEnvio_() {
  if (INICIO_DOS_ENVIOS) {
    var d = new Date(String(INICIO_DOS_ENVIOS).replace(' ', 'T'));
    if (!isNaN(d.getTime())) return d.getTime();
  }
  return Number(PropertiesService.getScriptProperties().getProperty('inicioEnvio')) || 0;
}

/** Guarda o momento do 1.º envio de convites (uma só vez). Os emails de teste não contam. */
function registarInicioEnvio_() {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('inicioEnvio')) props.setProperty('inicioEnvio', String(Date.now()));
}

/** Reserva em vigor: zero nas primeiras HORAS_SEM_RESERVA depois do 1.º convite enviado, RESERVA_QUOTA depois. */
function reservaAtual_() {
  if (HORAS_SEM_RESERVA <= 0) return RESERVA_QUOTA;
  var inicio = inicioEnvio_();
  if (!inicio || Date.now() - inicio < HORAS_SEM_RESERVA * 3600000) return 0;   // ainda não enviou nenhum, ou está nas primeiras horas
  return RESERVA_QUOTA;
}

/** Rótulo de uma lista para mostrar ao utilizador: nome do ficheiro e do separador (para ele confirmar que é a lista certa). */
function nomeDaLista_(url, folha) {
  var ss = SpreadsheetApp.openByUrl(url);
  return '«' + ss.getName() + '» (separador «' + folha.getName() + '»)';
}

function dadosDe_(folha) {
  var ultima = folha.getLastRow();
  return ultima < 2 ? [] : folha.getRange(2, 1, ultima - 1, 4).getValues();
}

function desativarEnvioAutomatico() {
  ScriptApp.getProjectTriggers().forEach(function (g) {
    if (g.getHandlerFunction() === 'envioAutomatico') ScriptApp.deleteTrigger(g);
  });
  PropertiesService.getScriptProperties().deleteProperty('acionador');
}

/** Intervalo até ao próximo email, em segundos: sorteado entre INTERVALO_MIN_S e INTERVALO_MAX_S. */
function intervaloSorteado_() {
  return INTERVALO_MIN_S + Math.floor(Math.random() * (Math.max(INTERVALO_MAX_S, INTERVALO_MIN_S) - INTERVALO_MIN_S + 1));
}
