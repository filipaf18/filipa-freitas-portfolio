"""4.º email: lembrete final, versão única para todos os participantes (v13). Texto corrido, sem secções.
Uso: python3 src/gerar_lembrete_evento.py  (a partir de email/jsd-50-anos/). PNG: src/png_lembrete_evento.js."""
import re
from gerar_confirmacao import *      # blocos de v11/v12

F = FORTE
TEL = '+351&nbsp;912&nbsp;845&nbsp;818'
PRE = 'É já amanhã. Sunset House, 19h30. Depois, a noite continua no Classe Bar, a partir das 01h30.'

def logo_classe_pequeno(cima):
    return logo_classe(cima).replace('width="240"', 'width="170"').replace('width:240px', 'width:170px')

def lembrete():
    L = lambda t, c: linha(t, c, 0)
    corpo = ''.join([
        cabecalho('ATÉ AMANHÃ', titulo=None, subtitulo=None),
        linha('Caro(a) companheiro(a),', 36, 0, f'font-size:16px; line-height:27px; font-weight:700; color:{ESCURO};'),
        L(f'É já amanhã, <strong {F}>sábado, dia 7&nbsp;de&nbsp;novembro</strong>, que nos juntamos para celebrar uma data muito especial: '
          f'os <strong {F}>50&nbsp;anos</strong> da Juventude Social Democrata de Vila Nova de Famalicão!', 12),
        L(f'O jantar comemorativo terá lugar na <strong {F}>Sunset&nbsp;House</strong> (<a href="{MAPA_HREF}" style="color:{ESCURO}; text-decoration:none;">'
          f'Av.&nbsp;Visconde de Pindela, n.º&nbsp;112, 4770&#8209;189&nbsp;Cruz</a>), com início marcado para as <strong {F}>19h30</strong>.', 16),
        L(f'Para a noite, sugerimos um estilo <strong {F}>casual chic</strong>. Deixamos aqui a inspiração:', 16),
        imagem_dresscode(16),
        L(f'E porque a celebração não termina à mesa, a noite continua no <strong {F}>Classe&nbsp;Bar</strong>, a partir das <strong {F}>01h30</strong>, '
          'com entrada gratuita para todos os convidados do jantar.', 28),
        logo_classe_pequeno(20),
        L(f'Para qualquer esclarecimento, a Presidente da JSD&nbsp;Famalicão <strong {F}>Daniela Torres</strong> estará disponível através do número '
          f'<a href="tel:+351912845818" style="color:{ESCURO}; font-weight:700; text-decoration:none;">{TEL}</a>.', 16),
        L('Vamos celebrar juntos 50 anos de história, de gerações e de uma identidade que continua a construir o futuro!', 16),
        L('Até lá,', 28),
        linha(ASSINATURA, 2, 0, f'font-size:16px; line-height:25px; font-weight:700; color:{ESCURO};'),
        linha('', 0, 44),
    ])
    html = pagina('50 Anos JSD Famalicão · Lembrete', PRE, corpo, '', css_extra=CSS, claro_forcado=True, logo_png=True,
                  gerador='src/gerar_lembrete_evento.py', banner_coluna=True, link_banner=SITE_50)
    return re.sub(r'\n[ \t]+', '\n', html)

if __name__ == '__main__':
    (AQUI / 'v13-lembrete-evento.html').write_text(lembrete(), encoding='utf-8'); print('v13-lembrete-evento.html')
