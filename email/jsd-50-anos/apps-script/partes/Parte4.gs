// PARTE 4 de 7. Ficheiro «Parte4.gs» do projeto Apps Script.
// Não alterar. Faz parte do mesmo código que as outras partes.
var PARTE_4 = true;

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
    avisar_(linhas.join('\n'));
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
  if (MailApp.getRemainingDailyQuota() - reservaAtual_() <= 0) return;             // a Google não deixa enviar mais: nem lê as folhas

  var trava = LockService.getScriptLock();
  if (!trava.tryLock(3000)) return;                                                // outra execução está a enviar
  try {
    var institucional = folhaInstitucional_(), geral = null;
    var r = processarEnvios(institucional, 'convite_institucional', {}, 1);
    if (r.enviados === 0 && r.paragem !== 'quota' && r.paragem !== 'tempo') {      // a institucional acabou: segue-se a geral
      geral = folhaGeral_();
      r = processarEnvios(geral, 'convite', emailsInstitucionais_(), 1);
    }
    if (r.enviados > 0) {
      props.setProperty('proximoEnvio', String(Date.now() + (intervaloSorteado_() - 30) * 1000));
    } else if (r.paragem === 'concluida' || r.paragem === 'sem-dados') {          // as duas listas acabaram
      desativarEnvioAutomatico();
      if (AVISAR_POR_EMAIL) resumoFinal_([institucional, geral || folhaGeral_()]);
    }
  } catch (e) {
    Logger.log('Erro no envio automático: ' + e.message);
  } finally {
    trava.releaseLock();
  }
}
