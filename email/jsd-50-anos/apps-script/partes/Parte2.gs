// PARTE 2 de 7. Ficheiro «Parte2.gs» do projeto Apps Script.
// Não alterar. Faz parte do mesmo código que as outras partes.
var PARTE_2 = true;

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
 * Devolve {enviados, erros, ignorados, pendentes, paragem}; paragem: 'quota' | 'ronda' | 'tempo' | 'concluida' | 'sem-dados'.
 */
function processarEnvios(folha, nomeFicheiroHtml, excluir) {
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
  var podeEnviar = Math.min(LIMITE_POR_RONDA, disponivel);
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
      Utilities.sleep(PAUSA_MS);
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
