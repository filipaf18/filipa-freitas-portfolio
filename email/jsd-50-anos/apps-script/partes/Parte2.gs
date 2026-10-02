// PARTE 2 de 8. Ficheiro «Parte2.gs» do projeto Apps Script.
// Não alterar. Faz parte do mesmo código que as outras partes.
var PARTE_2 = true;

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
  var falhadas = [];   // linhas que falharam desde o último envio que saiu

  for (var k = 0; k < linhas.length; k++) {
    if (res.enviados >= podeEnviar) { res.paragem = (podeEnviar === disponivel) ? 'quota' : 'ronda'; break; }
    if (Date.now() - inicio > TEMPO_MAXIMO_MS) { res.paragem = 'tempo'; break; }

    var i = linhas[k];
    var email = texto_(dados[i][1]);
    if (!emailValido_(email)) {
      folha.getRange(i + 2, 4).setValue('Erro: email inválido');
      res.erros++;
      continue;
    }
    try {
      var html = personalizar_(modelo, nomeFicheiroHtml, texto_(dados[i][0]), texto_(dados[i][2]).toLowerCase());
      MailApp.sendEmail({ to: email, subject: ASSUNTO, body: textoSimples_(html), htmlBody: html, name: NOME_REMETENTE });
    } catch (e) {
      if (erroDeQuota_(e)) { res.paragem = 'quota'; break; }   // a linha fica em branco: tenta-se na próxima ronda
      folha.getRange(i + 2, 4).setValue('Erro: ' + e.message);
      falhadas.push(i);
      res.erros++;
      res.ultimoErro = e.message;
      if (falhadas.length >= FALHAS_SEGUIDAS_MAX) {            // vários seguidos e nenhum saiu: não é culpa das pessoas
        for (var f = 0; f < falhadas.length; f++) folha.getRange(falhadas[f] + 2, 4).setValue('');
        res.erros -= falhadas.length;
        res.paragem = 'falha';
        break;
      }
      continue;
    }
    res.enviados++;
    falhadas = [];
    try {
      folha.getRange(i + 2, 4).setValue('Enviado a ' + agora);
    } catch (e) {                                              // o email saiu mas não ficou marcado: parar, senão repetia-se
      res.paragem = 'falha'; res.bloqueio = true;
      res.ultimoErro = 'O email saiu mas não consegui escrever «Enviado» na folha (' + e.message + '). Parei para não repetir emails: confirma que podes editar a folha.';
      break;
    }
    if (res.enviados === 1) registarInicioEnvio_();   // começa a contar as horas sem reserva (só na 1.ª vez)
    if (res.enviados < podeEnviar) Utilities.sleep(PAUSA_MS);
  }
  res.pendentes = linhas.length - res.enviados - res.erros;
  if (!res.paragem) res.paragem = res.pendentes > 0 ? 'ronda' : 'concluida';
  return res;
}
