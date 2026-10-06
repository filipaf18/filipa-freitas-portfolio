// PARTE 4 de 8. Ficheiro «Parte4.gs» do projeto Apps Script.
// Não alterar. Faz parte do mesmo código que as outras partes.
var PARTE_4 = true;

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
  var t = 'Enviou ' + res.enviados + (res.enviados === 1 ? ' email' : ' emails') + ' nesta ronda.';
  if (res.ignorados) t += '\n' + res.ignorados + ' ignorados (email repetido ou já na lista institucional): ficam marcados «Ignorado».';
  if (res.erros) t += '\n' + res.erros + ' com erro (ver a coluna «Estado»).';
  if (res.paragem === 'quota') {
    t += '\n\nA Google não deixa enviar mais agora' + (reservaAtual_() ? ' (ficam ' + reservaAtual_() + ' de reserva)' : '')
       + '. As ' + res.pendentes + ' pessoas que faltam NÃO foram marcadas com erro. Volta a clicar quando quiseres, '
       + 'ou deixa o envio automático ativo: vê de minuto a minuto e envia assim que a Google deixar enviar 1 email.';
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
 * Função do acionador de minuto a minuto: se a Google deixa enviar (nem que seja 1 email), envia logo, o mais depressa possível
 * (institucional primeiro, depois a geral), entre as HORA_INICIO_ENVIO e as HORA_FIM_ENVIO. Cada execução envia, a PAUSA_AUTOMATICO_MS
 * uns dos outros, até a quota acabar, a lista acabar ou passarem 5 minutos; se a quota acabar, volta a ver no minuto seguinte.
 * Com INTERVALO_MAX_S > 0 envia, em vez disso, um email de cada vez, com um intervalo sorteado entre INTERVALO_MIN_S e INTERVALO_MAX_S
 * (menos 30 s, porque o acionador só corre de minuto a minuto: o intervalo real fica arredondado ao minuto mais próximo).
 */
function envioAutomatico() {
  var hora = new Date().getHours();
  if (hora < HORA_INICIO_ENVIO || hora >= HORA_FIM_ENVIO) return;                  // fora do horário de envio
  var props = PropertiesService.getScriptProperties();
  var agora = Date.now(), proximo = Number(props.getProperty('proximoEnvio')) || 0;
  if (agora < proximo && proximo - agora <= INTERVALO_MAX_S * 1000) return;        // só com intervalo: ainda não é a hora do próximo email
  if (agora < (Number(props.getProperty('pausaAte')) || 0)) return;                // pausa depois de uma falha
  if (MailApp.getRemainingDailyQuota() - reservaAtual_() <= 0) return;             // sem quota: volta a ver no minuto seguinte (nem lê as folhas)

  var trava = LockService.getScriptLock();
  if (!trava.tryLock(3000)) return;                                                // outra execução está a enviar
  try {
    var depressa = INTERVALO_MAX_S <= 0, maximo = depressa ? Infinity : 1, pausa = depressa ? PAUSA_AUTOMATICO_MS : 0;
    var institucional = folhaInstitucional_(), geral = null;
    var r = processarEnvios(institucional, 'convite_institucional', {}, maximo, pausa);
    if (r.enviados === 0 && r.paragem !== 'quota' && r.paragem !== 'tempo' && r.paragem !== 'falha') {   // a institucional acabou: segue-se a geral
      geral = folhaGeral_();
      r = processarEnvios(geral, 'convite', emailsInstitucionais_(), maximo, pausa);
    }
    if (r.bloqueio) {
      registarFalha_(r.ultimoErro, true);                                          // saiu sem ficar marcado: desliga, para não repetir emails
    } else if (r.paragem === 'falha') {
      registarFalha_(r.ultimoErro, false);
    } else if (r.enviados > 0) {
      if (depressa) props.deleteProperty('proximoEnvio');
      else props.setProperty('proximoEnvio', String(Date.now() + (intervaloSorteado_() - 30) * 1000));
      limparFalhas_();
    } else if (r.paragem === 'concluida' || r.paragem === 'sem-dados') {
      concluir_([institucional, geral || folhaGeral_()]);
    }
  } catch (e) {
    registarFalha_(e.message, false);                                              // folha ou ficheiro HTML inacessível, etc.: tenta de novo mais tarde
  } finally {
    trava.releaseLock();
  }
}
