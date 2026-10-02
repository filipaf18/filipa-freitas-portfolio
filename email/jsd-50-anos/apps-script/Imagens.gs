/**
 * Imagens do banner e do logo, em base64 (geradas por src/gerar_apps_script.py; não editar à mão).
 * imagensInline(['banner', 'logo']) devolve os blobs para o parâmetro `inlineImages` do GmailApp / MailApp;
 * no HTML a imagem aparece como <img src="cid:banner">.
 */
function imagensInline(nomes) {
  const todas = Object.assign({}, imagensBase_(),
    typeof imagensDressCode_ === 'function' ? imagensDressCode_() : {});   // ImagensDressCode.gs (3.º email)
  const blobs = {};
  nomes.forEach(function (nome) {
    const i = todas[nome];
    if (!i) throw new Error('Falta a imagem «' + nome + '». Cola também o ficheiro ImagensDressCode.gs no projeto.');
    blobs[nome] = Utilities.newBlob(Utilities.base64Decode(i.base64), i.mime, i.ficheiro);
  });
  return blobs;
}

function imagensBase_() {
  return {

  };
}
