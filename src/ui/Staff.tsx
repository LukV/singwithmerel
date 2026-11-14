import clef from '../../docs/design/assets/signs/clef.svg?clean&ink';
import { SCALE, noteColour } from '../melody/scale';
import { lit, plays, t } from '../state';
import { handLine } from './hand';
import { staffLayout } from './staffLayout';
import { useSize } from './useSize';

const CLEF_INNER = clef.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
const BURST_ANGLES = [30, 68, 112, 150, 210, 248, 292, 330];

/**
 * Real notation, drawn per size: five hand-drawn lines, the treble clef, 4/4, the scale of do
 * major in quarter notes with stems, a bar line and the final double bar. The note last played
 * shows its colour and the dashes around it. On a phone (`compact`) the notes keep their
 * spacing and the staff follows the current note.
 */
export function Staff({ compact }: { compact: boolean }) {
  const s = t.value;
  const [ref, { width, height }] = useSize<HTMLDivElement>();
  const current = lit.value;
  const notes = SCALE;
  const names = s.noteNames;
  const label = s.staffLabel(names.join(' '));
  if (!width || !height) return <div ref={ref} class="staff" role="img" aria-label={label} />;

  const L = staffLayout(width, height, notes.length, compact, current);
  const u = L.s;
  const thin = Math.max(1.5, 0.22 * u);
  const clipId = 'staff-notes';

  return (
    <div ref={ref} class="staff" role="img" aria-label={label} data-lit={current ?? ''}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <defs>
          <clipPath id={clipId}>
            <rect x={L.notesLeft - 0.6 * u} y="0" width={width} height={height} />
          </clipPath>
        </defs>
        {L.lineYs.map((y, k) => (
          <path key={k} d={handLine(0, y, width, y, { wobble: 0.08 * u, step: 2.6 * u, seed: 31 + k })} class="staff__line" stroke-width={thin} />
        ))}
        <svg x={L.clef.x} y={L.clef.y} width={L.clef.width} height={L.clef.height} viewBox="0 0 60 150" class="staff__clef" dangerouslySetInnerHTML={{ __html: CLEF_INNER }} />
        <g class="staff__time lettering" font-size={L.time.size}>
          <text x={L.time.x} y={L.time.y1}>4</text>
          <text x={L.time.x} y={L.time.y2}>4</text>
        </g>
        <g clip-path={L.offset > 0 ? `url(#${clipId})` : undefined}>
          {L.barXs.map((x, k) => (
            <rect key={k} x={x - thin / 2} y={L.lineYs[0]} width={thin} height={8 * u} rx={thin / 2} class="staff__ink" />
          ))}
          <rect x={L.endX - 0.9 * u} y={L.lineYs[0]} width={thin} height={8 * u} rx={thin / 2} class="staff__ink" />
          <rect x={L.endX - 0.45 * u} y={L.lineYs[0]} width={0.45 * u} height={8 * u} rx={thin / 2} class="staff__ink" />
          {notes.map((note, i) => {
            const x = L.noteX(i);
            const y = L.noteY(note.step);
            const on = current === note.step;
            const up = note.step < 6;
            const stemX = up ? x + 0.95 * u : x - 1.17 * u - thin;
            const colour = on ? noteColour(note) : 'var(--on-ink)';
            return (
              <g key={i} class={`staff__note${on ? ' is-on' : ''}`} data-note={note.pitch}>
                {note.step === 0 && <rect x={x - 1.83 * u} y={y - thin / 2} width={3.67 * u} height={thin} rx={thin / 2} class="staff__ink" />}
                <rect x={stemX} y={up ? y - 6.8 * u : y} width={thin} height={6.8 * u} rx={thin / 2} class="staff__ink" />
                <ellipse cx={x} cy={y} rx={1.04 * u} ry={0.86 * u} transform={`rotate(-12 ${x} ${y})`} fill={colour} stroke={colour} stroke-width={0.28 * u} />
                {on && (
                  <g key={plays.value} class="staff__burst" stroke-width={thin}>
                    {BURST_ANGLES.map((a) => {
                      const r = (a * Math.PI) / 180;
                      const r1 = 1.6 * u;
                      const r2 = 2.45 * u;
                      return <line key={a} x1={x + Math.cos(r) * r1} y1={y - Math.sin(r) * r1} x2={x + Math.cos(r) * r2} y2={y - Math.sin(r) * r2} />;
                    })}
                  </g>
                )}
                <text x={x} y={L.nameY} class="staff__name lettering" font-size={Math.max(12, 1.22 * u)}>
                  {names[i]!.toUpperCase()}
                </text>
                {s.showLetters && (
                  <text x={x} y={L.letterY} class="staff__letter" font-size={Math.max(10, 0.83 * u)}>
                    {note.letter}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
