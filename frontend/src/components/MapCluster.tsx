import styles from './MapCluster.module.css'

interface MapClusterProps {
  x: number
  y: number
  count: number
}

export default function MapCluster({ x, y, count }: MapClusterProps) {
  return (
    <div className={styles.cluster} style={{ left: `${x}%`, top: `${y}%` }}>
      {count}
      <div className={styles.ring} />
    </div>
  )
}
