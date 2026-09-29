# Convite · Jantar Comemorativo dos 50 anos da JSD Famalicão

- `convite-jantar-50-anos.html` — o email, em modo claro. **Autossuficiente**: o banner (que já inclui o logótipo «50 anos JSD Famalicão») vai embutido dentro do próprio ficheiro, sem depender de endereços externos.
- `banner-anexo.jpg` — o banner que está embutido (800 px, leve). `banner-email.jpg` é a versão de maior qualidade (976 px).
- `preview-desktop.png`, `preview-telemovel.png` — como fica.

## Como passar para o Gmail

1. Abre `convite-jantar-50-anos.html` no Chrome, `Ctrl/Cmd + A`, `Ctrl/Cmd + C`.
2. No Gmail, abre uma mensagem nova, cola (`Ctrl/Cmd + V`), põe os destinatários em **Cco**.
3. **Envia primeiro um teste para ti** e confirma que o banner aparece na caixa de entrada, no telemóvel e no computador. Não consegui testar dentro do Gmail.

**Plano B se o banner não aparecer depois de colar:** apaga a imagem partida (ou o espaço vazio) no topo, clica no ícone de imagem («Inserir fotografia») da barra do Gmail, carrega `banner-anexo.jpg` e escolhe **Em linha** (não «Como anexo»). Fica dentro do corpo do email e aparece sempre a quem o receber.

Assunto sugerido: `50 anos de JSD Famalicão · Jantar Comemorativo · 7 de novembro`

## Telemóvel e computador

O email **não precisa de detetar o dispositivo**: tem largura fluida (até 600 px, encolhe para o ecrã) e adapta-se sozinho. Por cima disso há um bloco `<style>` com `@media (max-width: 480px)` que, em ecrãs pequenos, reduz as margens, baixa o título de 32 para 28 px e faz o botão ocupar a largura toda.

- Os ajustes por largura de ecrã são a forma de o Gmail «saber» se está num telemóvel ou num computador. Funcionam no Gmail web e na app com contas Google; a app com contas de outros fornecedores ignora-os.
- O editor do Gmail costuma descartar o `<style>` ao colar, por isso, por este caminho, fica só a versão fluida (que já está boa nos dois). Não consegui confirmar isto no Gmail.
- Mostrar ou esconder blocos por dispositivo faz-se da mesma maneira (classe + `display:none` dentro do `@media`) e tem a mesma limitação.

## Identidade usada (modo claro, tirada do banner)

| Uso | Cor |
| --- | --- |
| Fundo da página / cartão | `#F2EEE8` / `#FFFFFF` |
| Painel dos dados do evento | `#F8F4EE` (linhas `#E4D9CB`) |
| Títulos / corpo / secundário | `#1B130C` / `#3E352B` / `#6B6054` |
| Azul das etiquetas (mais escuro que o do banner, para ler sobre branco) | `#0B72B8` |
| Laranja do banner (barras, botão, traço da citação) | `#F86420` |
| Laranja em texto | `#E2540F` |
| Âmbar | `#F8B451` |

O degradê azul→laranja do banner aparece nas duas barras e em «1976_2026» no rodapé, letra a letra, em texto real (com tons um pouco mais escuros para ler sobre branco).

Tipografia: Montserrat (geométrica, como a do banner) com Arial como reserva — o Gmail não carrega tipos web, por isso a maioria vai ver Arial.

Se houver manual de identidade com as cores e tipo exatos, é só trocar estes valores no HTML.

## A confirmar antes de enviar

- Morada atualizada: «Av. Visc. de Pindela 112, 4770-189 Cruz». O nome «Sunset House» ficou como estava; confirma que é o do local.
- «Sábado» foi acrescentado à data (7 de novembro de 2026 é sábado).
- A frase «Vão tomar da palavra representantes das estruturas da JSD e do PSD.» está no texto de abertura, depois do parágrafo dos 50 anos.
- Falta prazo de inscrição e forma de pagamento; se não estiverem no formulário, convém dizê-lo no email.
- A última linha do rodapé (como deixar de receber mensagens) é uma adição; apaga-a ou ajusta-a se a JSD tiver outra política.
