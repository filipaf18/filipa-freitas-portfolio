"""4.º email: lembrete final (horas, morada, dress code, contacto e after party). v13 (geral) e v14 (institucional).
Mesma base visual de v11/v12. Uso: python3 src/gerar_lembrete_evento.py  (a partir de email/jsd-50-anos/)
Só gera os HTML v13/v14; os PNG saem de src/png_lembrete_evento.js."""
import re
from gerar_confirmacao import *      # blocos de v11/v12

CONTACTO_NOME = 'Daniela Torres'
CONTACTO_TEL = '+351 912 845 818'
TEL_HREF = 'tel:+351912845818'

TEXTOS = {
    'geral': dict(
        saudacao='Caro(a) companheiro(a),',
        paragrafos=['Falta muito pouco para o Jantar Comemorativo dos <strong {F}>50&nbsp;anos</strong> da JSD&nbsp;Famalicão. '
                    'Deixamos aqui o essencial para chegares descansado(a) e aproveitares a noite.'],
        duvida='Alguma dúvida? Fala com a <strong {F}>Daniela Torres</strong>, presidente da JSD&nbsp;Famalicão:',
        after='Se quiseres prolongar a noite, o <strong {F}>Classe&nbsp;Bar</strong> espera-nos a partir das <strong {F}>01h30</strong>, com entrada gratuita para todos os convidados.',
        fecho='Contamos contigo. Vai ser uma noite à altura de cinquenta anos.', despedida='Até amanhã,',
        pre='Amanhã, 19h00, Sunset House. Dress code casual chic e after party no Classe Bar.'),
    'institucional': dict(
        saudacao='Estimado(a) companheiro(a),',
        paragrafos=['Aproxima-se o Jantar Comemorativo dos <strong {F}>50&nbsp;anos</strong> da JSD&nbsp;Famalicão. '
                    'Recordamos abaixo as informações essenciais para que possa desfrutar da noite com tranquilidade.'],
        duvida='Para qualquer esclarecimento, pode contactar a <strong {F}>Daniela Torres</strong>, presidente da JSD&nbsp;Famalicão:',
        after='Para quem desejar prolongar a noite, o <strong {F}>Classe&nbsp;Bar</strong> acolherá os convidados a partir das <strong {F}>01h30</strong>, com entrada gratuita para os mesmos.',
        fecho='Contamos consigo. Será uma noite à altura de cinquenta anos.', despedida='Com os melhores cumprimentos,',
        pre='Amanhã, 19h00, Sunset House. Dress code casual chic e after party no Classe Bar.'),
}


def lembrete(t):
    f = lambda s: s.replace('{F}', FORTE)
    contacto = linha(f'<a href="{TEL_HREF}" style="color:{ESCURO}; text-decoration:none; font-weight:700; font-size:20px; letter-spacing:.5px;">{CONTACTO_TEL.replace(" ", "&nbsp;")}</a>',
                     6, 0, CORPO, 'center')
    corpo = ''.join([
        cabecalho('ATÉ AMANHÃ', titulo=None, subtitulo=None),
        linha(t['saudacao'], 36, 0, f'font-size:16px; line-height:27px; font-weight:700; color:{ESCURO};'),
        *[linha(f(p), 12, 0) for p in t['paragrafos']],
        dados_confirmacao(),
        linha(sem_rasto('DRESS CODE'), 44, 0, ETIQUETA, 'center', 't-etiqueta'),
        imagem_dresscode(24),
        filete(44, 0),
        sub('After party', 40, 0), logo_classe(16), linha(f(t['after']), 16, 0, CORPO, 'center'),
        filete(44, 0),
        sub('Dúvidas', 40, 0), linha(f(t['duvida']), 16, 0, CORPO, 'center'), contacto,
        linha(t['fecho'], 44, 0, f'font-size:20px; line-height:30px; font-weight:300; color:{ESCURO};', 'center', 't-citacao'),
        filete(44, 0),
        linha(t['despedida'], 32, 0), linha(ASSINATURA, 2, 0, f'font-size:16px; line-height:25px; font-weight:700; color:{ESCURO};'),
        mote(), linha('', 0, 44),
    ])
    html = pagina('50 Anos JSD Famalicão · Lembrete', t['pre'], corpo, '', css_extra=CSS, claro_forcado=True, logo_png=True,
                  gerador='src/gerar_lembrete_evento.py', banner_coluna=True, link_banner=SITE_50)
    return re.sub(r'\n[ \t]+', '\n', html)


if __name__ == '__main__':
    for nome, k in [('v13-lembrete-evento-geral.html', 'geral'), ('v14-lembrete-evento-institucional.html', 'institucional')]:
        (AQUI / nome).write_text(lembrete(TEXTOS[k]), encoding='utf-8'); print(nome)
