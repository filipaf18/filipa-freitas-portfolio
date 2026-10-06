// PARTE 8 de 8. Ficheiro «Parte8.gs» do projeto Apps Script.
// Não alterar. Faz parte do mesmo código que as outras partes.
var PARTE_8 = true;

function enviarUmInstitucional() {
  executar_(function () { return processarEnvios(folhaInstitucional_(), 'convite_institucional', {}, 1); });
}

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

function erroDeQuota_(e) {
  return /too many times|limit exceeded|quota|daily limit|limit reached/i.test(String(e && e.message));
}

function emailValido_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function texto_(v) {
  return (v === null || v === undefined ? '' : v).toString().trim();
}

function verQuota() {
  avisar_('Ainda podes enviar ' + MailApp.getRemainingDailyQuota() + ' emails agora. O envio automático volta a ver de minuto a minuto e envia assim que a Google deixar enviar 1.\n'
        + (reservaAtual_() ? 'Destes, ' + reservaAtual_() + ' ficam de reserva (RESERVA_QUOTA) e não são usados pelo envio dos convites.\n'
           : RESERVA_QUOTA > 0 ? 'Neste momento não há reserva (primeiras ' + HORAS_SEM_RESERVA + ' horas de envio): os convites podem usar tudo.\n'
           : 'Não há reserva: os convites usam tudo o que a Google deixar.\n')
        + 'Conta: ' + Session.getEffectiveUser().getEmail());
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
