// PARTE 1 de 7. Ficheiro «Código.gs (substitui o que lá estava)» do projeto Apps Script.

/**
 * Envio dos convites dos 50 anos da JSD Famalicão a partir de duas folhas de cálculo, dentro do limite diário da Google.
 * ATENÇÃO: este código SUBSTITUI o antigo (não deixes outro ficheiro .gs com as mesmas funções: o Apps Script não avisa
 * e mistura o código antigo com o novo). Se algo não funcionar, corre «Diagnosticar» no menu da folha.
 * Listas: institucional «Convidados 50 anos» (HTML «convite_institucional») e geral «Militantes Base» (HTML «convite»).
 * Colunas: A Nome · B Email · C Género · D estado (vazio = por enviar); linha 1 = cabeçalho. As listas podem crescer.
 * Quota (conta Gmail pessoal): 100 destinatários por dia, 6 minutos por execução. Documentação completa: LEIA-ME.md.
 */

// ---------------------------------------------------------------- configuração
var ASSUNTO = '50 Anos JSD Famalicão · Jantar Comemorativo';
var NOME_REMETENTE = 'JSD Famalicão';
var URL_FOLHA_INSTITUCIONAL = 'COLA_AQUI_O_URL_DA_LISTA_INSTITUCIONAL';   // «Convidados 50 anos»
var URL_FOLHA_GERAL = 'COLA_AQUI_O_URL_DA_LISTA_GERAL';                    // «Militantes Base»
var EXCLUIR_INSTITUCIONAIS_DA_GERAL = true;      // quem está na lista institucional não recebe o convite geral
var QUOTA_DIARIA_DA_CONTA = 100;                 // só para a estimativa de dias: 100 numa conta Gmail pessoal, 1500 no Workspace
var RESERVA_QUOTA = 10;                          // envios que ficam todos os dias para as confirmações de inscrição: 100 − 10 = 90 convites por dia
var HORAS_SEM_RESERVA = 72;                      // nas primeiras horas de envio de convites não se guarda reserva (0 = guardar sempre)
var INICIO_DOS_ENVIOS = '';                      // quando começaram os envios. '' = quando este script enviar o 1.º convite. Ex.: '2026-10-02 12:00'
var EMAILS_DE_TESTE = [];                        // para onde vão os emails de teste; vazio = a conta que corre o script. Ex.: ['eu@gmail.com', 'eu@icloud.com']
var LIMITE_POR_RONDA = 100;                      // máximo por execução
var PAUSA_MS = 1000;                             // pausa entre emails
var TEMPO_MAXIMO_MS = 5 * 60 * 1000;             // a Google pára os scripts aos 6 minutos: pára aos 5 e continua depois
var HORA_INICIO_ENVIO = 8;                       // o envio automático só envia entre estas horas (hora do script)
var HORA_FIM_ENVIO = 21;
var AVISAR_POR_EMAIL = true;                     // no fim, o envio automático manda um resumo para a tua conta


// ---------------------------------------------------------------- menu
function onOpen() {
  SpreadsheetApp.getUi().createMenu('✉️ Envio de Convites')
      .addItem('Enviar Lote - Convite Geral', 'enviarConvites')
      .addItem('Enviar Lote - Institucional', 'enviarConvitesInstitucionais')
      .addSeparator()
      .addItem('Diagnosticar (se algo não funciona)', 'diagnosticar')
      .addItem('Enviar emails de teste para mim', 'enviarTeste')
      .addItem('Verificar as listas (antes de enviar)', 'verificarListas')
      .addItem('Ver progresso (quantos faltam e quantos dias)', 'verProgresso')
      .addItem('Ver quanto ainda posso enviar hoje', 'verQuota')
      .addItem('Ativar envio automático', 'ativarEnvioAutomatico')
      .addItem('Desativar envio automático', 'desativarEnvioAutomatico')
      .addToUi();
}

// ---------------------------------------------------------------- envio manual (menu)
function enviarConvites() {
  executar_(function () { return processarEnvios(folhaGeral_(), 'convite', emailsInstitucionais_()); });
}

function enviarConvitesInstitucionais() {
  executar_(function () { return processarEnvios(folhaInstitucional_(), 'convite_institucional', {}); });
}

/** Partes do código (ficheiros Parte2.gs a Parte7.gs) que não estão no projeto. */
function partesEmFalta_() {
  var falta = [];
  if (typeof PARTE_2 === 'undefined') falta.push(2);
  if (typeof PARTE_3 === 'undefined') falta.push(3);
  if (typeof PARTE_4 === 'undefined') falta.push(4);
  if (typeof PARTE_5 === 'undefined') falta.push(5);
  if (typeof PARTE_6 === 'undefined') falta.push(6);
  if (typeof PARTE_7 === 'undefined') falta.push(7);
  return falta;
}

/** Menu «Diagnosticar»: primeiro confere se o código está completo, depois corre o diagnóstico do projeto. */
function diagnosticar() {
  var emFalta = partesEmFalta_();
  if (emFalta.length) {
    var texto = '✘ Faltam partes do código no projeto: ' + emFalta.map(function (k) { return 'Parte' + k + '.gs'; }).join(', ')
              + '.\nCria esses ficheiros (+ → Script), com esses nomes, e cola lá o conteúdo de cada um.';
    try { SpreadsheetApp.getUi().alert(texto); } catch (e) { Logger.log(texto); }
    return;
  }
  diagnostico();
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
