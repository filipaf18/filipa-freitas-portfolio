// PARTE 2 de 7. Ficheiro «Parte2.gs» do projeto Apps Script.
// Não alterar. Faz parte do mesmo código que as outras partes.
var PARTE_2 = true;

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
