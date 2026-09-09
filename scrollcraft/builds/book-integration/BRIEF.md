# Integração dos livros de Margareth

Brief derivado do projeto existente e das instruções fornecidas. Decisões de execução identificadas abaixo; não foi realizada entrevista nem redesenhada a marca.

## Evidências e oito decisões

1. Clima: acolhedor, editorial, humano. Inferido da copy, das cores e das fontes existentes.
2. Sequência: preservar apresentação e livro, CAA, materiais, missão, recursos e especialidades do `origin/main` em `3f7f444`.
3. Energia: abertura acolhedora, pausa prática no CAA, maior destaque visual nos materiais, resolução calma no contato. Decisão de execução.
4. Emoções: acolhimento → possibilidade → identificação → compreensão → autonomia → confiança. Decisão de execução.
5. Assinatura: dois traços se encontram num coração na mensagem sobre compreender a criança, retomando a união presente no livro Os Dois Iguais. Decisão de execução.
6. Estética: manter azul-marinho, terracota e serifas existentes. Refinar dimensões e leitura, sem trocar a identidade.
7. Mundo: seções distintas, navegação direta e rolagem natural existentes. Sem pinning ou viagem contínua.
8. Assets: usuário forneceu `/Users/andrealmeida/Downloads/book.zip`. `1.png` = Os Dois Iguais; `2.png` = Descubra os Sentidos; `3.png` = Não Era Falta de Amor. PNGs transparentes originais, sem regeneração, corte ou KIE. Preservar foto e Pequenos Gigantes.

## Jornada e curva antes dos dispositivos

| Etapa | Emoção pretendida | Causa |
|---|---|---|
| Apresentação | Acolhimento | A profissional e o livro aparecem juntos |
| CAA | Possibilidade | Uma ferramenta gratuita imediatamente acessível |
| Materiais | Identificação | Capas originais grandes e legíveis, associadas à necessidade de cada família |
| Missão | Compreensão | Dois caminhos formam um coração junto da mensagem sobre acolher a criança |
| Recursos | Autonomia | Escolha direta de ferramentas existentes |
| Especialidades e contato | Confiança | Credenciais e próximo passo claros |

Pico visual: coleção de materiais, maior bloco útil da página. Momento a contar: “Achei livros que me ajudam a entender meu filho, e os caminhos se encontram num coração.” A missão resolve o significado do pico, sem competir em tamanho. Nenhum vazio ou silêncio de tela foi planejado; o CAA usa uma superfície contida antes da coleção.

## Gramática e fingerprint gate

Galeria de recursos com navegação por âncoras, preservando a arquitetura existente. Não usar filme contínuo, capítulos longos, canvas de trabalho, palco fixo, arquivo denso, pôster ou percurso espacial: o objetivo é encontrar materiais e seguir links, com acesso direto.

Registro resolvido: `scrollcraft/FINGERPRINTS.md`, vazio antes desta integração. Gate aprovado sem comparações existentes. Não se atribui novidade à arquitetura herdada.

| Etapa | Dispositivo | Motivo |
|---|---|---|
| Apresentação | Profundidade discreta entre halo, retrato e livro | Valoriza recortes reais sem distorcer capas |
| CAA | Entrada curta | Torna a ferramenta perceptível sem segurar o scroll |
| Materiais | Entrada escalonada das capas | Dá ritmo à escolha; maior espaço de conteúdo |
| Missão | Traçado SVG ligado ao scroll | Une dois caminhos no coração da mensagem |
| Recursos | Fluxo estático | Busca rápida e acesso direto |
| Especialidades | Tipografia e fechamento estático | Resolução legível com CTA permanente |

## Mobile e acessibilidade

Coluna única, livros em `object-fit: contain`, títulos sem corte, texto de apoio maior, alvos de toque de pelo menos 44px. Nenhuma informação depende de movimento ou hover. O coração aparece completo com redução de movimento e sem JavaScript. Verificar 390px, 320px, tablet e desktop, menu, teclado e imagens sem JavaScript.

## Arquitetura

HTML/CSS/JavaScript estáticos com APIs Vercel, dashboard e analytics existentes. Não há React ou Next.js a migrar. `scrollcraft.js` é código local do projeto, não o engine compartilhado da skill. A verificação usa marcadores de atos de fluxo e o sinal de inicialização desse código local. Não substituir o runtime nem adicionar dependências de produção.
