import type { BattleResult } from '../data/mock'

const labels: Record<BattleResult, string> = {
  victory: 'Victoria',
  defeat: 'Derrota',
  draw: 'Empate',
  inconclusive: 'Indeciso',
}

export default function ResultBadge({ result }: { result: BattleResult }) {
  return (
    <span className={`ax-badge ax-badge-${result}`}>{labels[result]}</span>
  )
}
