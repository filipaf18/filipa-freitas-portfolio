// VERIFICAR INSTALAÇÃO. Ficheiro à parte, só para diagnóstico (podes apagá-lo depois).
// Como usar: cria um ficheiro novo (+ → Script), cola isto, grava, escolhe «verificarFuncoes» no seletor do topo e carrega em Executar.
// Confere se TODAS as funções do script estão no projeto e se não há uma cópia antiga de alguma (número de parâmetros diferente).
function verificarFuncoes() {
  var esperadas = {
    1: 'onOpen/0 enviarConvites/0 enviarConvitesInstitucionais/0 partesEmFalta_/0 diagnosticar/0 desativarEnvioAutomatico/0',
    2: 'processarEnvios/5 textoSimples_/1',
    3: 'analisar_/2 diagnostico/0',
    4: 'executar_/1 resumo_/1 envioAutomatico/0',
    5: 'personalizar_/4 trocar_/3 enviarTeste/0 descreverLista_/3',
    6: 'verProgresso/0 verificarListas/0 registarFalha_/2 concluir_/1',
    7: 'enviarUmGeral/0 validarUrls_/0 emailsInstitucionais_/0 mapaEmails_/1 nomeProprio_/1 avisar_/1 inicioEnvio_/0 enviadosNas24h_/1 ativarEnvioAutomatico/0',
    8: 'enviarUmInstitucional/0 folhaGeral_/0 folhaInstitucional_/0 porEnviar_/1 erroDeQuota_/1 emailValido_/1 texto_/1 verQuota/0 registarInicioEnvio_/0 reservaAtual_/0 nomeDaLista_/2 dadosDe_/1 intervaloSorteado_/0 limparFalhas_/0 problemaAtual_/0'
  };
  var faltam = [], antigas = [], total = 0;
  for (var parte in esperadas) {
    var ficheiro = parte === '1' ? 'Código.gs' : 'Parte' + parte + '.gs';
    var itens = esperadas[parte].split(' ');
    for (var i = 0; i < itens.length; i++) {
      var nome = itens[i].split('/')[0], parametros = Number(itens[i].split('/')[1]);
      var funcao = null;
      total++;
      try { funcao = eval(nome); } catch (e) { funcao = null; }
      if (typeof funcao !== 'function') faltam.push(nome + ' (devia estar em ' + ficheiro + ')');
      else if (funcao.length !== parametros) antigas.push(nome + ' (tem ' + funcao.length + ' parâmetros, devia ter ' + parametros + ')');
    }
  }
  var texto = faltam.length || antigas.length
    ? '✘ O código do projeto não está certo.\n'
      + (faltam.length ? '\n' + (faltam.length === 1 ? 'Falta 1 função' : 'Faltam ' + faltam.length + ' funções') + ':\n  ' + faltam.join('\n  ')
        + '\n→ o ficheiro indicado está incompleto (colagem cortada, ou não foi gravado) ou é de outra versão: apaga tudo nele, cola de novo o conteúdo certo e grava com Ctrl+S.\n' : '')
      + (antigas.length ? '\n' + (antigas.length === 1 ? 'Há 1 função de uma versão antiga' : 'Há ' + antigas.length + ' funções de uma versão antiga') + ':\n  ' + antigas.join('\n  ')
        + '\n→ há outro ficheiro no projeto com código antigo a sobrepor-se. Deixa só Código.gs, Parte2.gs … e este: apaga os restantes.\n' : '')
    : '✔ As ' + total + ' funções estão todas no projeto, na versão certa. O código está completo.';
  try { SpreadsheetApp.getUi().alert(texto); } catch (e) { Logger.log(texto); }
  Logger.log(texto);
}
