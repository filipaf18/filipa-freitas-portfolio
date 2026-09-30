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
        titulo='50 Anos JSD Famalicão · Lembrete de pagamento',
        preheader='Para garantires o teu lugar no Jantar Comemorativo, falta apenas o pagamento por transferência bancária.',
        saudacao='Caro(a) companheiro(a),',
        paragrafos=[
            'Obrigado por te teres inscrito no Jantar Comemorativo dos 50&nbsp;anos da JSD&nbsp;Famalicão. Falta apenas um passo.',
            f'Para garantires o teu lugar nesta noite, o pagamento de {VALOR} por pessoa deve ser feito através de transferência bancária para:',
        ],
        nota='A inscrição é individual e só fica válida depois de confirmado o pagamento.',
        despedida='Até lá,',
        rodape_extra=CONVITES['v7-convite-geral.html']['rodape_extra'].replace('este convite', 'esta mensagem'),
    ),
    'v10-lembrete-institucional.html': dict(
        titulo='50 Anos JSD Famalicão · Lembrete de pagamento',
        preheader='Para garantir o seu lugar no Jantar Comemorativo, falta apenas o pagamento por transferência bancária.',
        saudacao='Estimado(a) companheiro(a),',
        paragrafos=[
            'Agradecemos a sua inscrição no Jantar Comemorativo dos 50&nbsp;anos da JSD&nbsp;Famalicão. Falta apenas um passo.',
            f'Para garantir o seu lugar nesta noite, o pagamento de {VALOR} por pessoa deve ser feito através de transferência bancária para:',
        ],
        nota='A inscrição é individual e só fica válida depois de confirmado o pagamento.',
        despedida='Com os melhores cumprimentos,',
        rodape_extra='',
    ),
}


def caixa_iban():
    """IBAN em destaque, entre dois filetes, escrito sem espaços para se poder copiar e colar."""
    return filete(28, 0) + linha(
        f'<span style="font-size:12px; line-height:18px; font-weight:700; letter-spacing:4px; color:#0B72B8;">IBAN</span><br>'
        f'<span style="font-size:20px; line-height:32px; font-weight:800; letter-spacing:1px; color:{ESCURO};">{IBAN}</span>',
        22, 22, 'font-size:16px; line-height:27px; color:#3E352B;', 'center', 't-lead') + filete()


def lembrete(t):
    corpo = ''.join([
        cabecalho().replace('>CONVITE<', '>LEMBRETE<').replace('Jantar Comemorativo', 'Pagamento da inscrição'),
        linha(t['saudacao'], 36, 0, f'font-size:16px; line-height:27px; font-weight:700; color:{ESCURO};'),
        *[linha(p, 12 if i == 0 else 16, 0) for i, p in enumerate(t['paragrafos'])],
        caixa_iban(),
        linha(t['nota'], 18, 0, f'font-size:13px; line-height:21px; color:{MUTED};', 'center', 't-nota'),
        linha(t['despedida'], 32, 0),
        linha(ASSINATURA, 2, 0, f'font-size:16px; line-height:25px; font-weight:700; color:{ESCURO};'),
        mote(),
        dados(),
        linha('', 0, 40),
    ])
    return pagina(t['titulo'], t['preheader'], corpo, t['rodape_extra'], css_extra=CSS,
                  claro_forcado=True, logo_png=True, gerador='src/gerar_lembrete.py', banner_max=800)


for nome, t in LEMBRETES.items():
    (AQUI / nome).write_text(lembrete(t), encoding='utf-8')
    print(nome)
