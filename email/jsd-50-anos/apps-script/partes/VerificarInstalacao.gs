// VERIFICAR INSTALAÇÃO. Ficheiro à parte, só para diagnóstico (podes apagá-lo depois).
// Como usar: cria um ficheiro novo (+ → Script), cola isto, grava, escolhe «verificarFuncoes» no seletor do topo e carrega em Executar.
// Confere se TODAS as funções do script estão no projeto e se não há uma cópia antiga de alguma (número de parâmetros diferente).
function verificarFuncoes() {
  var esperadas = {
    1: 'onOpen/0 enviarConvites/0 enviarConvitesInstitucionais/0 partesEmFalta_/0 diagnosticar/0 textoSimples_/1',
    2: 'analisar_/2 processarEnvios/3',
    3: 'trocar_/3 diagnostico/0 envioAutomatico/0',
    4: 'erroDeQuota_/1 personalizar_/4 resumo_/1 descreverLista_/3',
    5: 'folhaGeral_/0 executar_/1 enviarTeste/0 verProgresso/0 verificarListas/0',
    6: 'validarUrls_/0 mapaEmails_/1 nomeProprio_/1 avisar_/1 inicioEnvio_/0 estimarDias_/1 ativarEnvioAutomatico/0 resumoFinal_/1',
    7: 'folhaInstitucional_/0 emailsInstitucionais_/0 porEnviar_/1 texto_/1 verQuota/0 registarInicioEnvio_/0 reservaAtual_/0 nomeDaLista_/2 dadosDe_/1 desativarEnvioAutomatico/0'
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
