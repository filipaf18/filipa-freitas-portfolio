// PARTE 1 de 8. Ficheiro «Código.gs (substitui o que lá estava)» do projeto Apps Script.

/**
 * Envio dos convites dos 50 anos da JSD Famalicão a partir de duas folhas de cálculo, dentro do limite diário da Google.
 * ATENÇÃO: este código SUBSTITUI o antigo (não deixes outro ficheiro .gs com as mesmas funções: o Apps Script não avisa
 * e mistura o código antigo com o novo). Se algo não funcionar, corre «Diagnosticar» no menu da folha.
 * Listas: institucional «Convidados 50 anos» (HTML «convite_institucional») e geral «Militantes Base» (HTML «convite»).
 * Colunas: A Nome · B Email · C Género · D estado (vazio = por enviar); linha 1 = cabeçalho. As listas podem crescer.
 * Não assume nenhum limite diário: envia enquanto a quota real da Google deixar (lida em cada envio) e pára quando recusar.
 * Envio automático: um email de cada vez, com 1 a 2 minutos de intervalo, entre as 8h e as 22h. Documentação: LEIA-ME.md.
 */

// ---------------------------------------------------------------- configuração
var ASSUNTO = '50 Anos JSD Famalicão · Jantar Comemorativo';
var NOME_REMETENTE = 'JSD Famalicão';
var URL_FOLHA_INSTITUCIONAL = 'COLA_AQUI_O_URL_DA_LISTA_INSTITUCIONAL';   // «Convidados 50 anos»
var URL_FOLHA_GERAL = 'COLA_AQUI_O_URL_DA_LISTA_GERAL';                    // «Militantes Base»
var EXCLUIR_INSTITUCIONAIS_DA_GERAL = true;      // quem está na lista institucional não recebe o convite geral
var RESERVA_QUOTA = 10;                          // envios que ficam sempre por usar na quota da Google, para as confirmações de inscrição
var HORAS_SEM_RESERVA = 72;                      // nas primeiras horas de envio de convites não se guarda reserva (0 = guardar sempre)
var INICIO_DOS_ENVIOS = '';                      // quando começaram os envios. '' = quando este script enviar o 1.º convite. Ex.: '2026-10-02 12:00'
var EMAILS_DE_TESTE = [];                        // para onde vão os emails de teste; vazio = a conta que corre o script. Ex.: ['eu@gmail.com', 'eu@icloud.com']
var LIMITE_POR_RONDA = 0;                        // máximo de emails por clique em «Enviar Lote» (0 = sem limite: só a quota e o tempo)
var PAUSA_MS = 1000;                             // pausa entre emails no envio manual em lote
var INTERVALO_MIN_S = 60;                        // envio automático: intervalo entre emails, sorteado entre estes dois valores (segundos)
var INTERVALO_MAX_S = 120;                       // o acionador corre de minuto a minuto, por isso o intervalo real é de 1 ou 2 minutos
var TEMPO_MAXIMO_MS = 5 * 60 * 1000;             // a Google pára os scripts aos 6 minutos: pára aos 5 e continua depois
var HORA_INICIO_ENVIO = 8;                       // o envio automático só envia entre estas horas (hora do script)
var HORA_FIM_ENVIO = 22;                         // …até às 22h (não envia a partir das 22h00)
var AVISAR_POR_EMAIL = true;                     // no fim (ou se houver falhas seguidas), o envio automático manda um aviso para a tua conta
var FALHAS_SEGUIDAS_MAX = 3;                     // se falharem tantos envios seguidos sem sair nenhum, é uma falha geral: ninguém é marcado com erro


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

/** Partes do código (ficheiros Parte2.gs a Parte8.gs) que não estão no projeto. */
function partesEmFalta_() {
  var falta = [];
  if (typeof PARTE_2 === 'undefined') falta.push(2);
  if (typeof PARTE_3 === 'undefined') falta.push(3);
  if (typeof PARTE_4 === 'undefined') falta.push(4);
  if (typeof PARTE_5 === 'undefined') falta.push(5);
  if (typeof PARTE_6 === 'undefined') falta.push(6);
  if (typeof PARTE_7 === 'undefined') falta.push(7);
  if (typeof PARTE_8 === 'undefined') falta.push(8);
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

/** Nomes todos em maiúsculas ou todos em minúsculas passam a «Maria da Silva»; os restantes ficam como estão. */
function nomeProprio_(nome) {
  if (nome !== nome.toUpperCase() && nome !== nome.toLowerCase()) return nome;
  var particulas = { de: 1, da: 1, do: 1, dos: 1, das: 1, e: 1 };
  return nome.toLowerCase().split(/\s+/).map(function (p, k) {
    if (k > 0 && particulas[p]) return p;
    return p.replace(/(^|[-'])([a-zà-ÿ])/g, function (m, a, b) { return a + b.toUpperCase(); });
  }).join(' ');
}
