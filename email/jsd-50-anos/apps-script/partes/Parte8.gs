// PARTE 8 de 8. Ficheiro «Parte8.gs» do projeto Apps Script.
// Não alterar. Faz parte do mesmo código que as outras partes.
var PARTE_8 = true;

function folhaGeral_() {
  validarUrls_();
  return SpreadsheetApp.openByUrl(URL_FOLHA_GERAL).getSheets()[0];
}

function folhaInstitucional_() {
  validarUrls_();
  return SpreadsheetApp.openByUrl(URL_FOLHA_INSTITUCIONAL).getSheets()[0];
}

/** Por enviar: estado vazio, ou um erro de quota de uma ronda anterior (os outros erros ficam à vista para decidires). */
function porEnviar_(estado) {
  return estado === '' || /^Erro: .*(too many times|limit exceeded)/i.test(estado);
}

function emailValido_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function texto_(v) {
  return (v === null || v === undefined ? '' : v).toString().trim();
}

/** Troca a primeira ocorrência, sem que «$» no nome seja tratado como código de substituição. */
function trocar_(texto, de, para) {
  var p = texto.indexOf(de);
  return p === -1 ? texto : texto.substring(0, p) + para + texto.substring(p + de.length);
}

/** Guarda o momento do 1.º envio de convites (uma só vez). Os emails de teste não contam. */
function registarInicioEnvio_() {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('inicioEnvio')) props.setProperty('inicioEnvio', String(Date.now()));
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

function limparFalhas_() {
  var props = PropertiesService.getScriptProperties();
  ['falhasSeguidas', 'ultimoErro', 'pausaAte', 'aviso'].forEach(function (k) { props.deleteProperty(k); });
}

/** Problema ou aviso em vigor do envio automático (vazio se não houver). */
function problemaAtual_() {
  var props = PropertiesService.getScriptProperties();
  var erro = props.getProperty('ultimoErro'), aviso = props.getProperty('aviso');
  return (erro ? 'O envio automático teve um problema (' + erro + ') e volta a tentar sozinho.' : '') + (erro && aviso ? '\n' : '') + (aviso || '');
}
