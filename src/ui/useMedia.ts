import { useEffect, useState } from 'preact/hooks';

export function useMedia(query: string): boolean {
  const get = () => typeof matchMedia === 'function' && matchMedia(query).matches;
  const [matches, setMatches] = useState(get);
  useEffect(() => {
    if (typeof matchMedia !== 'function') return;
    const mql = matchMedia(query);
    const change = () => setMatches(mql.matches);
    change();
    mql.addEventListener('change', change);
    return () => mql.removeEventListener('change', change);
  }, [query]);
  return matches;
}
