import { useId, useMemo } from 'preact/hooks';
import waiting from '../../../docs/design/assets/merel/merel-waiting-static.svg?clean';
import singing from '../../../docs/design/assets/merel/merel-singing-static.svg?clean';
import thinking from '../../../docs/design/assets/merel/merel-thinking-static.svg?clean';
import listening from '../../../docs/design/assets/merel/merel-listening-static.svg?clean';
import bowing from '../../../docs/design/assets/merel/merel-bowing-static.svg?clean';
import { t } from '../../state';
import './merel-motion.css';

export type Pose = 'waiting' | 'singing' | 'thinking' | 'listening' | 'bowing';

const DRAWINGS: Record<Pose, string> = { waiting, singing, thinking, listening, bowing };

interface Props {
  pose: Pose;
  /** Moves when live; stands still otherwise. Reduced motion always stands still. */
  live?: boolean;
  /** Crop of the drawing; the cards use a tighter one than the identity screen. */
  viewBox?: string;
  class?: string;
}

/**
 * Merel, drawn from docs/design/assets/merel/merel-<pose>-static.svg with its motion groups
 * (m-bob, m-head, m-beak-u, m-beak-l, m-eye, m-tail, m-marks) intact, so merel-motion.css
 * moves him. The clip-path ids get a per-instance prefix so several Merels can share a page.
 */
export function Merel({ pose, live = false, viewBox, class: className = '' }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const html = useMemo(() => {
    let svg = DRAWINGS[pose]
      .replace(/id="([^"]+)"/g, `id="${uid}-$1"`)
      .replace(/url\(#([^)]+)\)/g, `url(#${uid}-$1)`);
    if (viewBox) svg = svg.replace(/viewBox="[^"]*"/, `viewBox="${viewBox}"`);
    return svg;
  }, [pose, uid, viewBox]);
  return (
    <span
      role="img"
      aria-label={t.value.merel[pose]}
      class={`merel p-${pose}${live ? ' live' : ''} ${className}`}
      data-pose={pose}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
