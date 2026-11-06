"""4.º email: lembrete final, versão única para todos os participantes (v13). Texto corrido, sem secções.
Uso: python3 src/gerar_lembrete_evento.py  (a partir de email/jsd-50-anos/). PNG: src/png_lembrete_evento.js."""
import re
from gerar_confirmacao import *      # blocos de v11/v12

F = FORTE
TEL = '+351&nbsp;912&nbsp;845&nbsp;818'
PRE = 'Amanhã, 19h00, Sunset House. Dress code casual chic e after party no Classe Bar.'

def logo_classe_pequeno(cima):
    return logo_classe(cima).replace('width="240"', 'width="170"').replace('width:240px', 'width:170px')

def lembrete():
    corpo = ''.join([
        cabecalho('ATÉ AMANHÃ', titulo=None, subtitulo=None),
        linha('Caro(a) companheiro(a),', 36, 0, f'font-size:16px; line-height:27px; font-weight:700; color:{ESCURO};'),
        linha(f'Amanhã, <strong {F}>sábado, 7&nbsp;de&nbsp;novembro</strong>, às <strong {F}>19h00</strong>, celebramos os '
              f'<strong {F}>50&nbsp;anos</strong> da JSD&nbsp;Famalicão na <strong {F}>Sunset&nbsp;House</strong> ({MAPA_LINK}). '
              'Esperamos por todos.', 12, 0),
        linha(f'O dress code é <strong {F}>casual chic</strong>: castanho, bege, azul-marinho, preto e branco, '
              'com toques de laranja queimado ou dourado.', 16, 0),
        imagem_dresscode(20),
        linha(f'Depois do jantar, a noite continua no <strong {F}>Classe&nbsp;Bar</strong>, a partir das <strong {F}>01h30</strong>, '
              'com entrada gratuita para todos os convidados.', 28, 0),
        logo_classe_pequeno(12),
        linha(f'Para qualquer dúvida, a <strong {F}>Daniela Torres</strong>, presidente da JSD&nbsp;Famalicão, está disponível em '
              f'<a href="tel:+351912845818" style="color:{ESCURO}; font-weight:700; text-decoration:none;">{TEL}</a>.', 28, 0),
        linha('Até amanhã,', 28, 0),
        linha(ASSINATURA, 2, 0, f'font-size:16px; line-height:25px; font-weight:700; color:{ESCURO};'),
        mote(), linha('', 0, 44),
    ])
    html = pagina('50 Anos JSD Famalicão · Lembrete', PRE, corpo, '', css_extra=CSS, claro_forcado=True, logo_png=True,
                  gerador='src/gerar_lembrete_evento.py', banner_coluna=True, link_banner=SITE_50)
    return re.sub(r'\n[ \t]+', '\n', html)

if __name__ == '__main__':
    (AQUI / 'v13-lembrete-evento.html').write_text(lembrete(), encoding='utf-8'); print('v13-lembrete-evento.html')
