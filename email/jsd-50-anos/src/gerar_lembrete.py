"""Segundo email: lembrete do pagamento da inscrição por transferência bancária (IBAN).
v9 (geral) e v10 (institucional). Mesmo layout e mesma base visual dos convites v7/v8.

Uso: python3 src/gerar_lembrete.py  (a partir de email/jsd-50-anos/)
Nota: importar gerar_final volta a gerar v7/v8 e copiar-convites.html (saída idêntica).
"""
from gerar_final import *          # comum.py, mote(), dados(), MUTED, CONVITES, ASSINATURA…

IBAN = 'PT50004587424041768753236'
VALOR = f'<strong {FORTE}>35&nbsp;€</strong>'

LEMBRETES = {
    'v9-lembrete-geral.html': dict(
        titulo='50 Anos JSD Famalicão · Pagamento da inscrição',
        etiqueta='PAGAMENTO DA INSCRIÇÃO',
        preheader='Falta só o pagamento da tua inscrição no Jantar Comemorativo dos 50 anos da JSD Famalicão.',
        saudacao='Caro(a) companheiro(a),',
        paragrafos=[
            'Obrigado por te teres inscrito no Jantar Comemorativo dos 50&nbsp;anos da JSD&nbsp;Famalicão. Ficamos muito contentes por poder contar contigo!',
            f'Para garantires o teu lugar nesta noite, pedimos-te que faças o pagamento de {VALOR} por pessoa, por transferência bancária para o seguinte IBAN:',
        ],
        comprovativo='Depois de fazeres a transferência, envia&#8209;nos o comprovativo, respondendo a este email. Após o pagamento, a confirmação da inscrição pode demorar até 72&nbsp;horas.',
        nota='Se já fizeste o pagamento, podes ignorar esta mensagem. Obrigado! A inscrição é individual e só fica válida depois de confirmado o pagamento.',
        despedida='Até lá,',
        rodape_extra=CONVITES['v7-convite-geral.html']['rodape_extra'].replace('este convite', 'esta mensagem'),
    ),
    'v10-lembrete-institucional.html': dict(
        titulo='50 Anos JSD Famalicão · Pagamento da inscrição',
        etiqueta='PAGAMENTO DA INSCRIÇÃO',
        preheader='Falta só o pagamento da sua inscrição no Jantar Comemorativo dos 50 anos da JSD Famalicão.',
        saudacao='Estimado(a) companheiro(a),',
        paragrafos=[
            'Agradecemos a sua inscrição no Jantar Comemorativo dos 50&nbsp;anos da JSD&nbsp;Famalicão. Será uma honra contar consigo!',
            f'Para garantir o seu lugar nesta noite, pedimos-lhe que efetue o pagamento de {VALOR} por pessoa, por transferência bancária para o seguinte IBAN:',
        ],
        comprovativo='Após efetuar a transferência, agradecemos que nos envie o comprovativo, respondendo a este email. Após o pagamento, a confirmação da inscrição pode demorar até 72&nbsp;horas.',
        nota='Caso já tenha efetuado o pagamento, queira desconsiderar esta mensagem, com os nossos agradecimentos. A inscrição é individual e só fica válida depois de confirmado o pagamento.',
        despedida='Com os melhores cumprimentos,',
        rodape_extra='',
    ),
}


def caixa_iban():
    """IBAN em destaque, entre dois filetes, escrito sem espaços para se poder copiar e colar."""
    return filete(28, 0) + linha(
        f'<span style="font-size:12px; line-height:18px; font-weight:700; letter-spacing:4px; color:#0B72B8;">IBAN</span><br>'
        f'<span style="font-size:18px; line-height:32px; font-weight:800; letter-spacing:0.5px; color:{ESCURO}; word-break:break-all;">{IBAN}</span>',
        22, 22, 'font-size:16px; line-height:27px; color:#3E352B;', 'left', 't-lead') + filete()


def lembrete(t):
    corpo = ''.join([
        cabecalho(t['etiqueta'], titulo=None, subtitulo=None),     # o banner já diz «Jantar Comemorativo · 50 Anos JSD Famalicão»
        linha(t['saudacao'], 36, 0, f'font-size:16px; line-height:27px; font-weight:700; color:{ESCURO};'),
        *[linha(p, 12 if i == 0 else 16, 0) for i, p in enumerate(t['paragrafos'])],
        caixa_iban(),
        linha(t['comprovativo'], 24, 0),
        linha(t['nota'], 16, 0, f'font-size:13px; line-height:21px; color:{MUTED};', 'left', 't-nota'),
        linha(t['despedida'], 32, 0),
        linha(ASSINATURA, 2, 0, f'font-size:16px; line-height:25px; font-weight:700; color:{ESCURO};'),
        mote(),
        dados(),
        linha('', 0, 40),
    ])
    return pagina(t['titulo'], t['preheader'], corpo, t['rodape_extra'], css_extra=CSS,
                  claro_forcado=True, logo_png=True, gerador='src/gerar_lembrete.py', banner_coluna=True, link_banner='https://jsdfamalicao.pt/50-anos')


docs = {}
for nome, t in LEMBRETES.items():
    docs[nome] = lembrete(t)
    (AQUI / nome).write_text(docs[nome], encoding='utf-8')
    print(nome)

(AQUI / 'copiar-lembretes.html').write_text(pagina_copiar(
    docs, [('v9-lembrete-geral.html', 'Lembrete geral (militantes)'), ('v10-lembrete-institucional.html', 'Lembrete institucional')],
    'Copiar lembretes').replace('no convite que queres enviar', 'no lembrete que queres enviar'), encoding='utf-8')
print('copiar-lembretes.html criado')
