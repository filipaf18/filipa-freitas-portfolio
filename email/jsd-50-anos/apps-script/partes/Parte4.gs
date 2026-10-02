// PARTE 4 de 7. Ficheiro «Parte4.gs» do projeto Apps Script.
// Não alterar. Faz parte do mesmo código que as outras partes.
var PARTE_4 = true;

function erroDeQuota_(e) {
  return /too many times|limit exceeded|quota/i.test(String(e && e.message));
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
