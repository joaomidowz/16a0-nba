export type Locale = 'pt' | 'en';

export const messages = {
  pt: {
    eyebrow: 'Desafio de playoffs',
    title: 'Você consegue chegar ao 16-0?',
    subtitle: 'Monte um elenco com seis lendas, sobreviva a quatro séries e tente varrer todos os adversários.',
    start: 'Sortear minha run',
    random: 'Modo aleatório',
    champions: 'Apenas campeões',
    underdog: 'Underdog run',
    daily: 'Desafio diário',
    draftTitle: 'Monte seu elenco',
    simulate: 'Começar os playoffs',
    result: 'Resultado da run',
  },
  en: {
    eyebrow: 'Playoff challenge',
    title: 'Can you finish 16-0?',
    subtitle: 'Build a six-player roster, survive four series and try to sweep every opponent.',
    start: 'Draw my run',
    random: 'Random mode',
    champions: 'Champions only',
    underdog: 'Underdog run',
    daily: 'Daily challenge',
    draftTitle: 'Build your roster',
    simulate: 'Start the playoffs',
    result: 'Run result',
  },
} as const;
