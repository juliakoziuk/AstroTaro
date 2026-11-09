// Текст «тлумачення» складається з значень карт; це шаблон, а не справжній AI
export function composeReading(spread, drawn, question) {
  const first = question ? `Ти запитала: «${question}». ` : ''
  const parts = drawn.map((d, i) => {
    const slot = spread.slots[i]
    const tail = d.reversed ? ' Карта перевернута: ця тема зараз звернена всередину, до внутрішнього, а не до зовнішніх подій.' : ''
    return `${slot}: «${d.card.name}». ${d.card.meaning}${tail}`
  })
  const keys = [...new Set(drawn.flatMap((d) => d.card.keywords.slice(0, 1)))].join(', ')
  const closing = `Спільна нитка розкладу: ${keys}. ${drawn[Math.min(2, drawn.length - 1)].card.advice} Це символічна рефлексія: розклад не передбачає майбутнє, а допомагає сформулювати власні відповіді.`
  return `${first}${parts.join('\n\n')}\n\n${closing}`
}
