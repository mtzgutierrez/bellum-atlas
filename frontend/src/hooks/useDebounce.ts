import { useEffect, useState } from 'react'

// Devuelve un valor que sólo se actualiza tras `delay` ms sin cambios. Útil
// para que los inputs de búsqueda no disparen una petición por tecla.
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}
