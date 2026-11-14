import { isIos } from '../install';
import { t } from '../state';
import { useMedia } from './useMedia';

/** On a phone, one line each under Start: headphones, and on an iPhone the silent switch. */
export function Tips() {
  const s = t.value;
  const touch = useMedia('(pointer: coarse)');
  if (!touch) return null;
  return (
    <ul class="tips">
      <li>{s.tips.headphones}</li>
      {isIos() && <li>{s.tips.silentSwitch}</li>}
    </ul>
  );
}
