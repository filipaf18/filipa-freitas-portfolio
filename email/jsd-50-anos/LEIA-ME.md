# Convite · Jantar Comemorativo dos 50 anos da JSD Famalicão

- `convite-jantar-50-anos.html` — o email (tabelas + estilos inline, como o Gmail exige).
- `banner-email.jpg` — centro do banner oficial (logótipo 50 anos + silhuetas), recortado para não cortar as frases dos lados.
- `preview-desktop.png`, `preview-telemovel.png` — como fica.

## Como passar para o Gmail

O banner (que já inclui o logótipo «50 anos JSD Famalicão») está alojado no GitHub e o HTML aponta para esse endereço público, fixo a um commit, por isso **não é preciso trocar nada**. Verifiquei que o endereço responde como imagem JPEG e que o banner aparece no email renderizado num browser. Não consegui testar dentro do Gmail.

1. Abre `convite-jantar-50-anos.html` no Chrome (precisa de internet para mostrar o banner), `Ctrl/Cmd + A`, `Ctrl/Cmd + C`.
2. No Gmail, abre uma mensagem nova, cola (`Ctrl/Cmd + V`), põe os destinatários em **Cco** e envia primeiro um teste para ti (vê no telemóvel e com o modo escuro).

**Plano B se o banner não aparecer depois de colar:** apaga a imagem partida (ou o espaço vazio) no topo do email, clica no ícone de imagem («Inserir fotografia») da barra do Gmail, carrega `banner-email.jpg` e escolhe **Em linha**. Fica embutido no email e aparece sempre a quem o receber.

Assunto sugerido: `50 anos de JSD Famalicão · Jantar Comemorativo · 7 de novembro`

## Telemóvel e computador

O email **não precisa de detetar o dispositivo**: tem largura fluida (até 600 px, encolhe para o ecrã) e adapta-se sozinho. Por cima disso há um bloco `<style>` com `@media (max-width: 480px)` que, em ecrãs pequenos, reduz as margens, baixa o título de 32 para 28 px e faz o botão ocupar a largura toda.

- Os ajustes por largura de ecrã são a forma de o Gmail «saber» se está num telemóvel ou num computador. Funcionam no Gmail web e na app com contas Google; a app com contas de outros fornecedores ignora-os.
- O editor do Gmail costuma descartar o `<style>` ao colar, por isso, por este caminho, fica só a versão fluida (que já está boa nos dois). Não consegui confirmar isto no Gmail.
- Mostrar ou esconder blocos por dispositivo faz-se da mesma maneira (classe + `display:none` dentro do `@media`) e tem a mesma limitação.

## Identidade usada (tirada do banner)

| Uso | Cor |
| --- | --- |
| Fundo | `#0A0701` / cartão `#130D07` |
| Texto | `#FFFFFF`, corpo `#E6DCCF`, secundário `#B5A692` |
| Azul (início do degradê de «1976_2026») | `#1EBCE8` |
| Âmbar | `#F8B451` |
| Laranja (fim do degradê) | `#F86420` |

Tipografia: Montserrat (geométrica, como a do banner) com Arial como reserva — o Gmail não carrega tipos web, por isso a maioria vai ver Arial. «1976_2026» leva o degradê do banner letra a letra, em texto real.

Se houver manual de identidade com as cores e tipo exatos, é só trocar estes valores no HTML (procurar por `#F86420`, `#1EBCE8`, etc.).

## A confirmar antes de enviar

- Morada e código postal de «Sunset House» (`4765-000` parece provisório).
- «Sábado» foi acrescentado à data (7 de novembro de 2026 é sábado).
- Falta prazo de inscrição e forma de pagamento; se não estiverem no formulário, convém dizê-lo no email.
- A última linha do rodapé (como deixar de receber mensagens) é uma adição; apaga-a ou ajusta-a se a JSD tiver outra política.
