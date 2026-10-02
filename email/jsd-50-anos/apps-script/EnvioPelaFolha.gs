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

/** Partes do código (ficheiros Parte2.gs a ParteN.gs) que não estão no projeto. Com o código num só ficheiro, nenhuma. */
function partesEmFalta_() {
  return [];
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

function mapaEmails_(dados) {
  var mapa = {};
  for (var k = 0; k < dados.length; k++) {
    var e = texto_(dados[k][1]).toLowerCase();
    if (e !== '') mapa[e] = true;
  }
  return mapa;
}

/** Corre um envio com a trava, e mostra o resumo (ou regista-o, se não houver ecrã, como nos acionadores). */
function executar_(envio) {
  var trava = LockService.getScriptLock();
  if (!trava.tryLock(30000)) {
    avisar_('Já está um envio a decorrer. Espera que termine e volta a tentar.');
    return;
  }
  try {
    avisar_(resumo_(envio()));
  } catch (e) {
    avisar_('Erro: ' + e.message);
  } finally {
    trava.releaseLock();
  }
}

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

// ---------------------------------------------------------------- motor de envio
/**
 * Envia a uma lista. Colunas da folha: A nome · B email · C género · D estado (vazio = por enviar).
 * «maximo» (opcional): quantos emails, no máximo, nesta chamada (o envio automático passa 1).
 * Devolve {enviados, erros, ignorados, pendentes, paragem}; paragem: 'quota' | 'ronda' | 'tempo' | 'concluida' | 'sem-dados'.
 */
function processarEnvios(folha, nomeFicheiroHtml, excluir, maximo) {
  var inicio = Date.now();
  var res = { enviados: 0, erros: 0, ignorados: 0, pendentes: 0, paragem: '' };
  var ultimaLinha = folha.getLastRow();
  if (ultimaLinha < 2) { res.paragem = 'sem-dados'; return res; }

  var dados = folha.getRange(2, 1, ultimaLinha - 1, 4).getValues();
  var a = analisar_(dados, excluir || {});
  for (var g = 0; g < a.novosIgnorados.length; g++) {
    folha.getRange(a.novosIgnorados[g].i + 2, 4).setValue(a.novosIgnorados[g].motivo);
  }
  res.ignorados = a.novosIgnorados.length;
  var linhas = a.porEnviar;
  if (!linhas.length) { res.paragem = 'concluida'; return res; }

  var disponivel = MailApp.getRemainingDailyQuota() - reservaAtual_();
  var limite = maximo > 0 ? maximo : (LIMITE_POR_RONDA > 0 ? LIMITE_POR_RONDA : Infinity);   // sem limite fixo: só a quota e o tempo
  var podeEnviar = Math.min(limite, disponivel);
  if (podeEnviar <= 0) { res.pendentes = linhas.length; res.paragem = 'quota'; return res; }

  var modelo = HtmlService.createHtmlOutputFromFile(nomeFicheiroHtml).getContent();
  var agora = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');

  for (var k = 0; k < linhas.length; k++) {
    if (res.enviados >= podeEnviar) { res.paragem = (podeEnviar === disponivel) ? 'quota' : 'ronda'; break; }
    if (Date.now() - inicio > TEMPO_MAXIMO_MS) { res.paragem = 'tempo'; break; }

    var i = linhas[k];
    var email = texto_(dados[i][1]);
    if (email.indexOf('@') === -1) {
      folha.getRange(i + 2, 4).setValue('Erro: email inválido');
      res.erros++;
      continue;
    }
    try {
      var html = personalizar_(modelo, nomeFicheiroHtml, texto_(dados[i][0]), texto_(dados[i][2]).toLowerCase());
      MailApp.sendEmail({ to: email, subject: ASSUNTO, body: textoSimples_(html), htmlBody: html, name: NOME_REMETENTE });
      folha.getRange(i + 2, 4).setValue('Enviado a ' + agora);
      res.enviados++;
      if (res.enviados === 1) registarInicioEnvio_();   // começa a contar as horas sem reserva (só na 1.ª vez)
      if (res.enviados < podeEnviar) Utilities.sleep(PAUSA_MS);
    } catch (e) {
      if (erroDeQuota_(e)) { res.paragem = 'quota'; break; }   // a linha fica em branco: tenta-se na próxima ronda
      folha.getRange(i + 2, 4).setValue('Erro: ' + e.message);
      res.erros++;
    }
  }
  res.pendentes = linhas.length - res.enviados - res.erros;
  if (!res.paragem) res.paragem = res.pendentes > 0 ? 'ronda' : 'concluida';
  return res;
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

// ---------------------------------------------------------------- personalização (igual à versão anterior)
function personalizar_(modelo, nomeFicheiroHtml, nomeCompleto, genero) {
  var partes = nomeProprio_(nomeCompleto).split(/\s+/);
  var nomeFinal = partes.length > 1 ? partes[0] + ' ' + partes[partes.length - 1] : partes[0];
  nomeFinal = nomeFinal.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  var html = modelo;

  // saudação: no institucional mantém «companheiro(a)» e junta o nome; no geral o nome substitui «companheiro(a)».
  // Sem nome na folha, fica «Caro(a) companheiro(a),» (e o género adapta-o na mesma).
  if (nomeFinal !== '') {
    if (nomeFicheiroHtml === 'convite_institucional') {
      html = trocar_(html, 'Estimado(a) companheiro(a),', 'Estimado(a) companheiro(a) ' + nomeFinal + ',');
      html = trocar_(html, 'Caro(a) companheiro(a),', 'Caro(a) companheiro(a) ' + nomeFinal + ',');
    } else {
      html = trocar_(html, 'Caro(a) companheiro(a),', 'Caro(a) ' + nomeFinal + ',');
    }
  }

  // género
  var feminino = (genero === 'feminino' || genero === 'f' || genero === 'mulher');
  var trocas = feminino
    ? [[/o\(a\)/g, 'a'], [/a\(o\)/g, 'a'], [/\(a\)/g, 'a'], [/\(o\)/g, ''], [/O\(A\)/g, 'A'], [/A\(O\)/g, 'A'], [/\(A\)/g, 'A'], [/\(O\)/g, '']]
    : [[/o\(a\)/g, 'o'], [/a\(o\)/g, 'o'], [/\(a\)/g, ''], [/\(o\)/g, 'o'], [/O\(A\)/g, 'O'], [/A\(O\)/g, 'O'], [/\(A\)/g, ''], [/\(O\)/g, 'O']];
  for (var t = 0; t < trocas.length; t++) html = html.replace(trocas[t][0], trocas[t][1]);
  return html;
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

/** Troca a primeira ocorrência, sem que «$» no nome seja tratado como código de substituição. */
function trocar_(texto, de, para) {
  var p = texto.indexOf(de);
  return p === -1 ? texto : texto.substring(0, p) + para + texto.substring(p + de.length);
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

// ---------------------------------------------------------------- mensagens
function resumo_(res) {
  if (res.teste) {
    return 'Enviados ' + res.enviados + ' emails de teste para ' + res.destinos.join(', ') + ' (convite geral e institucional, feminino e masculino).\n'
         + 'Não alteram as listas. Confere o nome, o género («Cara»/«Caro»), as imagens e o aspeto no Gmail (web e app) e no iPhone.';
  }
  var t = 'Enviou ' + res.enviados + ' emails nesta ronda.';
  if (res.ignorados) t += '\n' + res.ignorados + ' ignorados (email repetido ou já na lista institucional): ficam marcados «Ignorado».';
  if (res.erros) t += '\n' + res.erros + ' com erro (ver a coluna «Estado»).';
  if (res.paragem === 'quota') {
    t += '\n\nA quota diária de envio da Google esgotou-se' + (reservaAtual_() ? ' (ficam ' + reservaAtual_() + ' de reserva para as confirmações de inscrição)' : '')
       + '. As ' + res.pendentes + ' pessoas que faltam NÃO foram marcadas com erro: ficam para a próxima ronda, '
       + 'passadas cerca de 24 horas (ou deixa o envio automático ativo).';
  } else if (res.paragem === 'ronda') {
    t += '\n\nPausa de segurança (limite por ronda). Faltam ' + res.pendentes + '. Volta a clicar daqui a uns minutos.';
  } else if (res.paragem === 'tempo') {
    t += '\n\nParou ao fim de 5 minutos (limite da Google por execução). Faltam ' + res.pendentes + '. Volta a clicar.';
  } else if (res.paragem === 'concluida' && res.enviados === 0 && !res.erros && !res.ignorados) {
    t = 'Não há ninguém por enviar nesta lista.';
  } else if (res.paragem === 'concluida') {
    t += '\n\nFim da lista.';
  } else if (res.paragem === 'sem-dados') {
    t = 'Não foram encontrados dados para enviar na folha.';
  }
  return t;
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

/** Quantos emails foram enviados nas últimas 24 horas, pelas horas escritas no estado («Enviado a dd/MM/aaaa HH:mm»). */
function enviadosNas24h_(dados) {
  var desde = Date.now() - 24 * 3600000, n = 0;
  for (var j = 0; j < dados.length; j++) {
    var m = /^Enviado a (\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})/.exec(texto_(dados[j][3]));
    if (m && new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), Number(m[4]), Number(m[5])).getTime() >= desde) n++;
  }
  return n;
}

/**
 * Emails de teste: para cada endereço de EMAILS_DE_TESTE (ou para a conta que corre o script), 4 emails, como os veria
 * quem os recebe: convite geral e institucional, cada um para uma mulher e para um homem (com nomes inventados).
 * Não toca nas listas nem nos estados. Gasta 4 da quota do dia por endereço. O assunto leva «[TESTE]».
 */
function enviarTeste() {
  executar_(function () {
    var destinos = EMAILS_DE_TESTE.filter(function (e) { return texto_(e) !== ''; });
    if (!destinos.length) destinos = [Session.getEffectiveUser().getEmail()];
    var casos = [['convite', 'Maria Teste Silva', 'feminino'], ['convite', 'João Teste Santos', 'masculino'],
                 ['convite_institucional', 'Ana Teste Costa', 'feminino'], ['convite_institucional', 'Rui Teste Dias', 'masculino']];
    var total = destinos.length * casos.length;
    var quota = MailApp.getRemainingDailyQuota();
    if (quota < total) throw new Error('A quota de hoje (' + quota + ') não chega para ' + total + ' emails de teste.');
    var enviados = 0;
    for (var d = 0; d < destinos.length; d++) {
      for (var c = 0; c < casos.length; c++) {
        var html = personalizar_(HtmlService.createHtmlOutputFromFile(casos[c][0]).getContent(), casos[c][0], casos[c][1], casos[c][2]);
        MailApp.sendEmail({ to: destinos[d], subject: '[TESTE] ' + ASSUNTO, body: textoSimples_(html), htmlBody: html, name: NOME_REMETENTE });
        enviados++;
        Utilities.sleep(PAUSA_MS);
      }
    }
    return { teste: true, enviados: enviados, destinos: destinos };
  });
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
  avisar_(linhas.join('\n') + '\n\n' + (problemas ? problemas + ' problema(s) assinalado(s) com ✘.' : 'Tudo em ordem.'));
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

/** Quantos faltam em cada lista, quantos já foram, e quantos dias levará a acabar. Não envia nada. */
function verProgresso() {
  try {
    var excluir = emailsInstitucionais_();
    var listas = [['Institucional', URL_FOLHA_INSTITUCIONAL, folhaInstitucional_(), {}], ['Geral', URL_FOLHA_GERAL, folhaGeral_(), excluir]];
    var linhas = [], faltam = 0, ultimas24 = 0;
    for (var n = 0; n < listas.length; n++) {
      var dadosLista = dadosDe_(listas[n][2]);
      var a = analisar_(dadosLista, listas[n][3]);
      faltam += a.porEnviar.length;
      ultimas24 += enviadosNas24h_(dadosLista);
      linhas.push(listas[n][0] + ' ' + nomeDaLista_(listas[n][1], listas[n][2]) + ':\n   '
        + a.enviados + ' enviados · ' + a.porEnviar.length + ' por enviar · '
        + (a.ignorados + a.novosIgnorados.length) + ' ignorados (repetidos / já institucionais) · ' + a.erros + ' com erro');
    }
    linhas.push('');
    linhas.push('Faltam ' + faltam + ' emails. Nas últimas 24 horas foram enviados ' + ultimas24 + '.'
              + (ultimas24 >= 20 ? ' Ao ritmo das últimas 24 horas, faltam cerca de ' + Math.ceil(faltam / ultimas24) + ' dias.'
                                 : ' Ainda não há envios que cheguem para estimar os dias (o ritmo depende da quota da Google).'));
    avisar_(linhas.join('\n'));
  } catch (e) {
    avisar_('Erro: ' + e.message);
  }
}

/**
 * Confere as listas ANTES de enviar, sem enviar nada nem mostrar nomes: género por reconhecer (seria tratado como
 * masculino), emails inválidos, emails repetidos, geral já na institucional, nomes sem apelido ou em maiúsculas.
 * Indica os números das linhas da folha (corrige à mão) em vez dos dados.
 */
function verificarListas() {
  try {
    var instituicao = folhaInstitucional_(), geral = folhaGeral_();
    var dInst = dadosDe_(instituicao), dGeral = dadosDe_(geral);
    var texto = [descreverLista_('Institucional ' + nomeDaLista_(URL_FOLHA_INSTITUCIONAL, instituicao), dInst, {}),
                 descreverLista_('Geral ' + nomeDaLista_(URL_FOLHA_GERAL, geral), dGeral, mapaEmails_(dInst))];
    avisar_(texto.join('\n\n'));
  } catch (e) {
    avisar_('Erro: ' + e.message);
  }
}

function descreverLista_(rotulo, dados, institucionais) {
  var c = { total: 0, fem: 0, masc: 0, generoDesconhecido: [], invalidos: [], repetidos: [], jaInstitucionais: [], semApelido: 0, maiusculas: 0 };
  var vistos = {};
  var feminino = ['feminino', 'f', 'mulher'], masculino = ['masculino', 'm', 'homem'];
  for (var j = 0; j < dados.length; j++) {
    var nome = texto_(dados[j][0]), email = texto_(dados[j][1]), genero = texto_(dados[j][2]).toLowerCase();
    if (nome === '' && email === '') continue;
    c.total++;
    var linha = j + 2;
    if (feminino.indexOf(genero) !== -1) c.fem++;
    else if (masculino.indexOf(genero) !== -1) c.masc++;
    else c.generoDesconhecido.push(linha);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) c.invalidos.push(linha);
    var chave = email.toLowerCase();
    if (chave !== '') {
      if (vistos[chave]) c.repetidos.push(linha); else vistos[chave] = true;
      if (institucionais[chave]) c.jaInstitucionais.push(linha);
    }
    if (nome.split(/\s+/).length < 2) c.semApelido++;
    if (nome !== '' && nomeProprio_(nome) !== nome) c.maiusculas++;
  }
  var lista = function (v) { return v.length ? v.length + ' (linhas ' + v.slice(0, 12).join(', ') + (v.length > 12 ? '…' : '') + ')' : '0'; };
  return rotulo + ': ' + c.total + ' pessoas\n'
    + '   Feminino ' + c.fem + ' · Masculino ' + c.masc + ' · género por reconhecer (seria tratado como masculino): ' + lista(c.generoDesconhecido) + '\n'
    + '   emails inválidos: ' + lista(c.invalidos) + '\n'
    + '   emails repetidos (só o 1.º recebe): ' + lista(c.repetidos) + '\n'
    + (rotulo.indexOf('Geral') === 0 ? '   já na lista institucional (não recebem o geral): ' + lista(c.jaInstitucionais) + '\n' : '')
    + '   nomes com uma só palavra: ' + c.semApelido + ' · nomes todos em maiúsculas/minúsculas (são corrigidos no email): ' + c.maiusculas;
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

/**
 * Função do acionador de minuto a minuto: envia UM email de cada vez (institucional primeiro, depois a geral), entre as
 * HORA_INICIO_ENVIO e as HORA_FIM_ENVIO. Não assume nenhum limite diário: envia enquanto a quota real da Google, menos
 * a reserva, deixar, e pára quando ela acabar. O intervalo sorteado conta 30 s a menos (meio minuto) porque o acionador
 * só corre de minuto a minuto: assim o intervalo real fica arredondado ao minuto mais próximo (1 ou 2 minutos).
 */
function envioAutomatico() {
  var hora = new Date().getHours();
  if (hora < HORA_INICIO_ENVIO || hora >= HORA_FIM_ENVIO) return;                  // fora do horário de envio
  var props = PropertiesService.getScriptProperties();
  var agora = Date.now(), proximo = Number(props.getProperty('proximoEnvio')) || 0;
  if (agora < proximo && proximo - agora <= INTERVALO_MAX_S * 1000) return;        // ainda não é a hora do próximo email
  if (MailApp.getRemainingDailyQuota() - reservaAtual_() <= 0) return;             // a Google não deixa enviar mais: nem lê as folhas

  var trava = LockService.getScriptLock();
  if (!trava.tryLock(3000)) return;                                                // outra execução está a enviar
  try {
    var institucional = folhaInstitucional_(), geral = null;
    var r = processarEnvios(institucional, 'convite_institucional', {}, 1);
    if (r.enviados === 0 && r.paragem !== 'quota' && r.paragem !== 'tempo') {      // a institucional acabou: segue-se a geral
      geral = folhaGeral_();
      r = processarEnvios(geral, 'convite', emailsInstitucionais_(), 1);
    }
    if (r.enviados > 0) {
      props.setProperty('proximoEnvio', String(Date.now() + (intervaloSorteado_() - 30) * 1000));
    } else if (r.paragem === 'concluida' || r.paragem === 'sem-dados') {          // as duas listas acabaram
      desativarEnvioAutomatico();
      if (AVISAR_POR_EMAIL) resumoFinal_([institucional, geral || folhaGeral_()]);
    }
  } catch (e) {
    Logger.log('Erro no envio automático: ' + e.message);
  } finally {
    trava.releaseLock();
  }
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
