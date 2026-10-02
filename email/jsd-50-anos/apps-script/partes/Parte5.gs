// PARTE 5 de 7. Ficheiro «Parte5.gs» do projeto Apps Script.
// Não alterar. Faz parte do mesmo código que as outras partes.
var PARTE_5 = true;

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
