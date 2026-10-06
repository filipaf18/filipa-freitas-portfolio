// PARTE 6 de 8. Ficheiro «Parte6.gs» do projeto Apps Script.
// Não alterar. Faz parte do mesmo código que as outras partes.
var PARTE_6 = true;

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
    if (problemaAtual_()) linhas.push('', '⚠ ' + problemaAtual_());
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

/** Uma falha (não é falta de quota): guarda o erro, espera 1, 2, 3… até 10 minutos antes de tentar de novo, e avisa por email à 3.ª seguida. */
function registarFalha_(mensagem, desligar) {
  var props = PropertiesService.getScriptProperties();
  var n = (Number(props.getProperty('falhasSeguidas')) || 0) + 1;
  props.setProperty('falhasSeguidas', String(n));
  props.setProperty('ultimoErro', Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM HH:mm') + ' · ' + mensagem);
  props.setProperty('pausaAte', String(Date.now() + Math.min(n, 10) * 60000));
  Logger.log('Envio automático com falha (' + n + ' seguidas): ' + mensagem);
  if (desligar) desativarEnvioAutomatico();
  if (AVISAR_POR_EMAIL && (desligar || n === 3)) {
    try {
      MailApp.sendEmail(Session.getEffectiveUser().getEmail(), 'Envio automático dos convites: PROBLEMA',
        (desligar ? 'O envio automático foi DESATIVADO.\n\n' : 'O envio automático falhou ' + n + ' vezes seguidas e continua a tentar.\n\n') + mensagem
        + '\n\nNo menu da folha, «Diagnosticar» e «Ver progresso» mostram o ponto da situação.');
    } catch (e) { Logger.log('Não consegui avisar por email: ' + e.message); }
  }
}

/**
 * Nada por enviar nas duas listas. Só desativa se em ambas já saiu pelo menos um convite; se não, algo está mal
 * (separador errado, lista vazia, estados escritos à mão): fica ativo, sem concluir, e diz porquê em «Ver progresso».
 */
function concluir_(folhas) {
  var nomes = ['Institucional', 'Geral'], linhas = [], vazias = [];
  for (var n = 0; n < folhas.length; n++) {
    var a = analisar_(dadosDe_(folhas[n]), {});
    linhas.push(nomes[n] + ': ' + a.enviados + ' enviados · ' + a.ignorados + ' ignorados · ' + a.erros + ' com erro');
    if (a.enviados + a.ignorados === 0) vazias.push(nomes[n]);
  }
  if (vazias.length) {
    PropertiesService.getScriptProperties().setProperty('aviso', 'Não há ninguém por enviar, mas NÃO dei o envio por concluído: na lista ' + vazias.join(' e ')
      + ' nenhum convite foi enviado (lista vazia, outro separador — o script lê o 1.º —, ou a coluna D tem textos que não são «Enviado a…»). '
      + linhas.join(' · ') + '. Fica ativo: corrige a folha, ou desativa-o no menu se for assim mesmo.');
    return;
  }
  desativarEnvioAutomatico();
  limparFalhas_();
  if (!AVISAR_POR_EMAIL) return;
  try {
    MailApp.sendEmail(Session.getEffectiveUser().getEmail(), 'Envio automático dos convites: concluído',
      linhas.join('\n') + '\n\nAs listas estão concluídas e o envio automático foi desativado.\n'
      + 'Os «com erro» ficam na coluna Estado, para veres e decidires.');
  } catch (e) { Logger.log('Não consegui enviar o resumo: ' + e.message); }
}
