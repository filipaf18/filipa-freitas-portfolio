// PARTE 5 de 8. Ficheiro «Parte5.gs» do projeto Apps Script.
// Não alterar. Faz parte do mesmo código que as outras partes.
var PARTE_5 = true;

function enviarUmInstitucional() {
  executar_(function () { return processarEnvios(folhaInstitucional_(), 'convite_institucional', {}, 1); });
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
        Utilities.sleep(PAUSA_TESTE_MS);
      }
    }
    return { teste: true, enviados: enviados, destinos: destinos };
  });
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
    if (!emailValido_(email)) c.invalidos.push(linha);
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
