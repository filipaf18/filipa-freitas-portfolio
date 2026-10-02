"""Divide apps-script/EnvioPelaFolha.gs em partes pequenas (apps-script/partes/Parte1.gs … ParteN.gs).

Porquê: ao copiar um ficheiro comprido de uma pré-visualização, só chegam as primeiras ~100 linhas e o Apps Script dá
«SyntaxError: Unexpected end of input». Cada parte tem no máximo MAX_LINHAS linhas, só com funções inteiras, por isso
cabe sempre; e cada uma (a partir da 2.ª) declara `var PARTE_k = true;` para o menu «Diagnosticar» dizer qual falta.
Os ficheiros de um projeto Apps Script partilham o mesmo espaço de nomes, por isso a ordem e os nomes não importam.

A Parte1 leva o cabeçalho, a configuração, o menu e as funções de arranque, e vai para o ficheiro «Código.gs» do projeto.

Uso (a partir de email/jsd-50-anos/):  python3 src/dividir_script.py [pasta de saída]
"""
import pathlib, re, sys

AQUI = pathlib.Path(__file__).resolve().parent.parent
ORIGEM = AQUI / 'apps-script' / 'EnvioPelaFolha.gs'
MAX_LINHAS = 92


def blocos(linhas):
    """(preâmbulo, [bloco, …]): cada bloco = comentários que o antecedem + a função inteira, até ao «}» da coluna 0."""
    primeira = next(i for i, l in enumerate(linhas) if l.startswith('function '))
    ini = primeira
    while ini > 0 and linhas[ini - 1].lstrip().startswith(('//', '/**', '*', '*/')):
        ini -= 1
    pre, resto, out, pendente, i = linhas[:ini], linhas[ini:], [], [], 0
    while i < len(resto):
        l = resto[i]
        if l.startswith('function '):
            j = i
            while resto[j] != '}':
                j += 1
            out.append(pendente + resto[i:j + 1])
            pendente, i = [], j + 1
            continue
        if l.strip():
            pendente.append(l)
        elif pendente:
            pendente.append(l)
        i += 1
    assert not [l for l in pendente if l.strip()], 'sobrou código fora de funções: ' + pendente[0]
    return pre, [[l for l in b]for b in out]


def nome_da(bloco):
    return next(re.match(r'function (\w+)', l).group(1) for l in bloco if l.startswith('function '))


def gerar_falta(n):
    corpo = ['/** Partes do código (ficheiros Parte2.gs a Parte%d.gs) que não estão no projeto. */' % n, 'function partesEmFalta_() {', '  var falta = []']
    corpo[-1] += ';'
    for k in range(2, n + 1):
        corpo.append("  if (typeof PARTE_%d === 'undefined') falta.push(%d);" % (k, k))
    return corpo + ['  return falta;', '}']


def main(saida):
    linhas = ORIGEM.read_text(encoding='utf-8').split('\n')
    if linhas and linhas[-1] == '':
        linhas.pop()
    pre, bs = blocos(linhas)
    FIXAS = ['onOpen', 'enviarConvites', 'enviarConvitesInstitucionais', 'partesEmFalta_', 'diagnosticar']   # ficam na Parte1
    for n_partes in range(2, 20):                           # tenta 2, 3, … partes até tudo caber
        falta = gerar_falta(n_partes)
        bs2 = [falta if nome_da(b) == 'partesEmFalta_' else b for b in bs]
        ordem = {nome_da(b): i for i, b in enumerate(bs2)}
        capacidade = [MAX_LINHAS - len(pre) - 2] + [MAX_LINHAS - 4] * (n_partes - 1)    # cabeçalhos incluídos
        grupos = [[] for _ in range(n_partes)]
        for b in bs2:
            if nome_da(b) in FIXAS:
                grupos[0].append(b); capacidade[0] -= len(b) + 1
        livre = sorted((b for b in bs2 if nome_da(b) not in FIXAS), key=lambda b: -len(b))   # primeiro as maiores
        ok = capacidade[0] >= 0
        for b in livre:                                     # cada função vai para a parte onde sobra menos espaço
            destinos = [k for k in range(n_partes) if capacidade[k] >= len(b) + 1]
            if not destinos:
                ok = False; break
            k = min(destinos, key=lambda k: capacidade[k])
            grupos[k].append(b); capacidade[k] -= len(b) + 1
        if ok and all(grupos):
            partes = [sorted(g, key=lambda b: ordem[nome_da(b)]) for g in grupos]
            break
    else:
        raise SystemExit('não consegui dividir em menos de 20 partes')
    saida.mkdir(parents=True, exist_ok=True)
    for f in saida.glob('Parte*.gs'):
        f.unlink()
    for k, grupo in enumerate(partes, 1):
        cab = ['// PARTE %d de %d. Ficheiro «%s» do projeto Apps Script.' % (k, n_partes, 'Código.gs (substitui o que lá estava)' if k == 1 else 'Parte%d.gs' % k)]
        if k == 1:
            texto = pre + [''] + sum(([*b, ''] for b in grupo), [])
            texto = cab + [''] + texto
        else:
            texto = cab + ['// Não alterar. Faz parte do mesmo código que as outras partes.', 'var PARTE_%d = true;' % k, ''] + sum(([*b, ''] for b in grupo), [])
        while texto[-1] == '':
            texto.pop()
        assert len(texto) <= MAX_LINHAS + 6, f'Parte{k} tem {len(texto)} linhas'
        (saida / f'Parte{k}.gs').write_text('\n'.join(texto) + '\n', encoding='utf-8')
        print(f'Parte{k}.gs: {len(texto)} linhas, {len(chr(10).join(texto))} caracteres: ' + ', '.join(nome_da(b) for b in grupo))
    return len(partes)


if __name__ == '__main__':
    main(pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else AQUI / 'apps-script' / 'partes')
