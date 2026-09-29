# Convite · Jantar Comemorativo dos 50 anos da JSD Famalicão

- `convite-jantar-50-anos.html` — o email (tabelas + estilos inline, como o Gmail exige).
- `banner-email.jpg` — centro do banner oficial (logótipo 50 anos + silhuetas), recortado para não cortar as frases dos lados.
- `preview-desktop.png`, `preview-telemovel.png` — como fica.

## Como passar para o Gmail

1. **Põe o `banner-email.jpg` num endereço público** (por exemplo no site `jsdfamalicao.pt`) e, no HTML, troca `banner-email.jpg` (aparece uma só vez, no `<img src>`) por esse endereço. O Gmail não mostra imagens locais nem embutidas em base64; sem isto o banner aparece partido no email que os convidados recebem.
2. Abre o HTML no Chrome, `Ctrl/Cmd + A`, `Ctrl/Cmd + C`.
3. No Gmail, abre uma mensagem nova, cola (`Ctrl/Cmd + V`), põe os destinatários em **Cco** e envia primeiro um teste para ti (vê no telemóvel e com o modo escuro).

Assunto sugerido: `50 anos de JSD Famalicão · Jantar Comemorativo · 7 de novembro`

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
