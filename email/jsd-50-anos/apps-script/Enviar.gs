/**
 * Envio dos emails dos 50 anos da JSD Famalicão por Apps Script, com as imagens anexadas ao próprio email
 * (CID), sem as alojar em nenhum site. Cola no projeto: Enviar.gs, Convites.gs, Imagens.gs e, para o 3.º email,
 * ImagensDressCode.gs. Autoriza o script quando o Google pedir. Usa MailApp, que só pede permissão para enviar
 * emails (o GmailApp também serve, com as mesmas opções, mas pede acesso a toda a caixa de correio).
 *
 * Primeiro corre testeParaMim() (envia os seis emails para a tua própria conta), vê-os no Gmail e no iPhone
 * e só depois usa enviarEmail(destinatario, chave) no teu envio a sério, por exemplo:
 *
 *   linhas.forEach(function (l) { enviarEmail(l.email, l.institucional ? 'convite-institucional' : 'convite-geral'); });
 *
 * Quotas do Google: 100 destinatários por dia numa conta Gmail normal e 1500 no Google Workspace.
 */
const REMETENTE = 'JSD Famalicão';     // nome que aparece como remetente; '' para usar o nome da conta

// chave → assunto e imagens que o HTML usa (<img src="cid:...">). Os assuntos podem ser mudados à vontade.
const EMAILS = {
  // 1.º email · convite, militantes
  'convite-geral': { assunto: "50 Anos JSD Famalicão · Jantar Comemorativo", imagens: [] },
  // 1.º email · convite, institucionais
  'convite-institucional': { assunto: "50 Anos JSD Famalicão · Convite", imagens: [] },
  // 2.º email · lembrete do pagamento, militantes
  'lembrete-geral': { assunto: "50 Anos JSD Famalicão · Pagamento da inscrição", imagens: [] },
  // 2.º email · lembrete do pagamento, institucionais
  'lembrete-institucional': { assunto: "50 Anos JSD Famalicão · Pagamento da inscrição", imagens: [] },
  // 3.º email · inscrição confirmada, militantes
  'confirmacao-geral': { assunto: "50 Anos JSD Famalicão · Inscrição confirmada", imagens: [] },
  // 3.º email · inscrição confirmada, institucionais
  'confirmacao-institucional': { assunto: "50 Anos JSD Famalicão · Inscrição confirmada", imagens: [] }
};

/**
 * Envia um email. «opcoes» é opcional e aceita as opções do MailApp (bcc, replyTo, cc…).
 */
function enviarEmail(destinatario, chave, opcoes) {
  const e = EMAILS[chave];
  if (!e) throw new Error('Email desconhecido: «' + chave + '». Os possíveis são: ' + Object.keys(EMAILS).join(', '));
  const o = { htmlBody: htmlDoEmail_(chave) };
  if (e.imagens.length) o.inlineImages = imagensInline(e.imagens);     // só as imagens que ainda não têm endereço
  if (REMETENTE) o.name = REMETENTE;
  MailApp.sendEmail(destinatario, e.assunto, textoDoEmail_(chave), Object.assign(o, opcoes || {}));
}

/** Envia cada um dos emails para a tua própria conta, para veres como chegam. */
function testeParaMim() {
  const eu = Session.getEffectiveUser().getEmail();
  Object.keys(EMAILS).forEach(function (chave) { enviarEmail(eu, chave); });
  Logger.log('Enviados ' + Object.keys(EMAILS).length + ' emails de teste para ' + eu);
}
