// PARTE 4 de 8. Ficheiro «Parte4.gs» do projeto Apps Script.
// Não alterar. Faz parte do mesmo código que as outras partes.
var PARTE_4 = true;

// ---------------------------------------------------------------- mensagens
function resumo_(res) {
  if (res.teste) {
    return 'Enviados ' + res.enviados + ' emails de teste para ' + res.destinos.join(', ') + ' (convite geral e institucional, feminino e masculino).\n'
         + 'Não alteram as listas. Confere o nome, o género («Cara»/«Caro»), as imagens e o aspeto no Gmail (web e app) e no iPhone.';
  }
  var t = 'Enviou ' + res.enviados + (res.enviados === 1 ? ' email' : ' emails') + ' nesta ronda.';
  if (res.ignorados) t += '\n' + res.ignorados + ' ignorados (email repetido ou já na lista institucional): ficam marcados «Ignorado».';
  if (res.erros) t += '\n' + res.erros + ' com erro (ver a coluna «Estado»).';
  if (res.paragem === 'quota') {
    t += '\n\nA quota diária de envio da Google esgotou-se' + (reservaAtual_() ? ' (ficam ' + reservaAtual_() + ' de reserva para as confirmações de inscrição)' : '')
       + '. As ' + res.pendentes + ' pessoas que faltam NÃO foram marcadas com erro: ficam para a próxima ronda, '
       + 'passadas cerca de 24 horas (ou deixa o envio automático ativo).';
  } else if (res.paragem === 'ronda') {
    t += '\n\nParou no limite pedido. Faltam ' + res.pendentes + '. Volta a clicar quando quiseres enviar mais.';
  } else if (res.paragem === 'tempo') {
    t += '\n\nParou ao fim de 5 minutos (limite da Google por execução). Faltam ' + res.pendentes + '. Volta a clicar.';
  } else if (res.paragem === 'falha') {
    t += '\n\n' + (res.bloqueio ? '' : 'Pararam os envios: falharam ' + FALHAS_SEGUIDAS_MAX + ' seguidos sem sair nenhum, o que não costuma ser culpa das pessoas, '
       + 'por isso NÃO as marquei com erro. Último erro: ') + res.ultimoErro;
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
  if (agora < (Number(props.getProperty('pausaAte')) || 0)) return;                // pausa depois de uma falha
  if (MailApp.getRemainingDailyQuota() - reservaAtual_() <= 0) return;             // a Google não deixa enviar mais: nem lê as folhas

  var trava = LockService.getScriptLock();
  if (!trava.tryLock(3000)) return;                                                // outra execução está a enviar
  try {
    var institucional = folhaInstitucional_(), geral = null;
    var r = processarEnvios(institucional, 'convite_institucional', {}, 1);
    if (r.enviados === 0 && r.paragem !== 'quota' && r.paragem !== 'tempo' && r.paragem !== 'falha') {   // a institucional acabou: segue-se a geral
      geral = folhaGeral_();
      r = processarEnvios(geral, 'convite', emailsInstitucionais_(), 1);
    }
    if (r.bloqueio) {
      registarFalha_(r.ultimoErro, true);                                          // saiu sem ficar marcado: desliga, para não repetir emails
    } else if (r.enviados > 0) {
      props.setProperty('proximoEnvio', String(Date.now() + (intervaloSorteado_() - 30) * 1000));
      limparFalhas_();
    } else if (r.paragem === 'falha') {
      registarFalha_(r.ultimoErro, false);
    } else if (r.paragem === 'concluida' || r.paragem === 'sem-dados') {
      concluir_([institucional, geral || folhaGeral_()]);
    }
  } catch (e) {
    registarFalha_(e.message, false);                                              // folha ou ficheiro HTML inacessível, etc.: tenta de novo mais tarde
  } finally {
    trava.releaseLock();
  }
}
