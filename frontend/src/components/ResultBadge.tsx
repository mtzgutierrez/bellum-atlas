import type { ApiFactionResult } from '../api/types'

const labels: Record<ApiFactionResult, string> = {
  victory: 'Victoria',
  defeat: 'Derrota',
  draw: 'Empate',
  inconclusive: 'Indeciso',
}

export default function ResultBadge({ result }: { result: ApiFactionResult }) {
  return (
    <span className={`ax-badge ax-badge-${result}`}>{labels[result]}</span>
  )
}
