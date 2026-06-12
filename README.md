# 16-0

Jogo web local inspirado no 7-0: monte um elenco de seis jogadores e tente vencer quatro series dos playoffs sem perder uma partida.

## Executar

```bash
npm install
npm run dev
```

## Validar

```bash
npm run validate
```

## Escopo implementado

- modos aleatorio, champions only, underdog e desafio diario
- seed e simulacao reproduziveis na URL com `s`, `m`, `auto` e `speed`
- dataset carregado sob demanda
- draft sequencial com uma equipe por vez, pular, voltar e resumo parcial
- seis escolhas vindas de seis equipes diferentes
- mini-quadra persistente com vagas livres, preenchidas e recomendadas
- atribuicao explicita de PG, SG, SF, PF, C ou sexto homem
- posicoes primarias e adjacentes com opcoes incompativeis desabilitadas
- remocao, troca, desfazer e sugestao automatica por posicao
- atributos medios e habilidades especiais
- simulacao automatica da run completa ou manual jogo a jogo
- velocidade lenta, normal ou rapida
- controles persistentes para trocar modo e velocidade durante a partida
- pausa manual ao fim de cada quarto e botao para pular a animacao
- quatro series em melhor de sete
- placar animado por quarto e box score revelado apenas no fim do jogo
- recompensas entre series
- resumo final, link compartilhavel e imagem PNG
- interface responsiva, navegacao por teclado e seletor PT/EN inicial

## Dataset

O arquivo recebido esta em `src/data/dataset_16a0.json`. Embora a especificacao mencione 50 times e 300 jogadores, a versao atual possui 49 times e 294 jogadores, sempre com seis atletas por equipe. Os testes preservam essa contagem ate a inclusao da equipe ausente.
