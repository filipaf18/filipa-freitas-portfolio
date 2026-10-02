// PARTE 5 de 7. Ficheiro «Parte5.gs» do projeto Apps Script.
// Não alterar. Faz parte do mesmo código que as outras partes.
var PARTE_5 = true;

function folhaGeral_() {
  validarUrls_();
  return SpreadsheetApp.openByUrl(URL_FOLHA_GERAL).getSheets()[0];
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

/** Quantos faltam em cada lista, quantos já foram, e quantos dias levará a acabar. Não envia nada. */
function verProgresso() {
  try {
    var excluir = emailsInstitucionais_();
    var listas = [['Institucional', URL_FOLHA_INSTITUCIONAL, folhaInstitucional_(), {}], ['Geral', URL_FOLHA_GERAL, folhaGeral_(), excluir]];
    var linhas = [], faltam = 0;
    for (var n = 0; n < listas.length; n++) {
      var a = analisar_(dadosDe_(listas[n][2]), listas[n][3]);
      faltam += a.porEnviar.length;
      linhas.push(listas[n][0] + ' ' + nomeDaLista_(listas[n][1], listas[n][2]) + ':\n   '
        + a.enviados + ' enviados · ' + a.porEnviar.length + ' por enviar · '
        + (a.ignorados + a.novosIgnorados.length) + ' ignorados (repetidos / já institucionais) · ' + a.erros + ' com erro');
    }
    linhas.push('');
    linhas.push('Faltam ' + faltam + ' emails. Estimativa: ' + estimarDias_(faltam) + ' dias ('
              + (HORAS_SEM_RESERVA > 0 ? QUOTA_DIARIA_DA_CONTA + ' por dia nas primeiras ' + HORAS_SEM_RESERVA + ' horas de envio, depois ' : '')
              + Math.max(1, QUOTA_DIARIA_DA_CONTA - RESERVA_QUOTA) + ' por dia, com ' + RESERVA_QUOTA + ' de reserva).');
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
