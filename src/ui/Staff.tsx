import clef from '../../docs/design/assets/signs/clef.svg?clean&ink';
import { useRef } from 'preact/hooks';
import { voice } from '../listen/listening';
import { SCALE, noteColour } from '../melody/scale';
import { round } from '../round/controller';
import { plays, t } from '../state';
import { handLine } from './hand';
import { staffLayout, type StaffLayout } from './staffLayout';
import { staffView } from './staffView';
import { useSize } from './useSize';
import { voiceStep } from './voiceDot';

const CLEF_INNER = clef.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
const BURST_ANGLES = [30, 68, 112, 150, 210, 248, 292, 330];

interface HeadProps {
  x: number;
  y: number;
  u: number;
  thin: number;
  step: number;
  beats: number;
  colour: string;
  ledger: boolean;
  /** Draw the head filled even for a half note: the colour of a sung or found note is a dot. */
  filled: boolean;
}

function Note({ x, y, u, thin, step, beats, colour, ledger, filled }: HeadProps) {
  const up = step < 6;
  const stemX = up ? x + 0.95 * u : x - 1.17 * u - thin;
  const hollow = beats >= 2 && !filled;
  return (
    <>
      {ledger && <rect x={x - 1.83 * u} y={y - thin / 2} width={3.67 * u} height={thin} rx={thin / 2} class="staff__ink" />}
      <rect x={stemX} y={up ? y - 6.8 * u : y} width={thin} height={6.8 * u} rx={thin / 2} class="staff__ink" />
      <ellipse
        cx={x}
        cy={y}
        rx={hollow ? 0.94 * u : 1.04 * u}
        ry={hollow ? 0.76 * u : 0.86 * u}
        transform={`rotate(-12 ${x} ${y})`}
        fill={hollow ? 'none' : colour}
        stroke={colour}
        stroke-width={hollow ? 0.36 * u : 0.28 * u}
      />
    </>
  );
}

function Burst({ x, y, u, thin }: { x: number; y: number; u: number; thin: number }) {
  return (
    <g class="staff__burst" stroke-width={thin}>
      {BURST_ANGLES.map((a) => {
        const r = (a * Math.PI) / 180;
        const r1 = 1.6 * u;
        const r2 = 2.45 * u;
        return <line key={a} x1={x + Math.cos(r) * r1} y1={y - Math.sin(r) * r1} x2={x + Math.cos(r) * r2} y2={y - Math.sin(r) * r2} />;
      })}
    </g>
  );
}

/**
 * Your voice while Merel listens: a soft paper-coloured dot with a faint ring, at the height of
 * your pitch, in the column of the note to sing. Never a note's colour. It glides (CSS) and fades
 * when you are silent; with reduced motion it jumps.
 */
function VoiceDot({ L, u, thin }: { L: StaffLayout; u: number; thin: number }) {
  const r = round.value;
  const cents = voice.value;
  const last = useRef<{ x: number; y: number } | null>(null);
  if (!r || r.phase !== 'turn' || !r.listen) {
    last.current = null;
    return null;
  }
  const index = Math.min(r.sung, r.melody.length - 1);
  const target = r.melody[index]!;
  const beat = r.melody.slice(0, index).reduce((sum, n) => sum + n.beats, 0);
  if (cents !== null) last.current = { x: L.noteX(beat), y: L.noteY(voiceStep(cents, target.step)) };
  const at = last.current;
  if (!at) return null;
  return (
    <g class={`staff__voice${cents === null ? ' is-silent' : ''}`} style={{ transform: `translate(${at.x}px, ${at.y}px)` }}>
      <circle r={1.5 * u} class="staff__voice-ring" stroke-width={thin} />
      <circle r={0.8 * u} class="staff__voice-dot" />
    </g>
  );
}

/**
 * Real notation, drawn per size: five hand-drawn lines, the treble clef, 4/4, the notes with
 * stems in their rhythm, bar lines and the final double bar. A note sounding or just played
 * shows its colour and the dashes around it; found notes keep their colour. On a phone
 * (`compact`) the notes keep their spacing and the staff follows the current note.
 */
export function Staff({ compact }: { compact: boolean }) {
  const s = t.value;
  const view = staffView.value;
  const [ref, { width, height }] = useSize<HTMLDivElement>();
  const shown = view.notes.filter((n) => n.mark !== 'hidden');
  const label = shown.length ? s.staffLabel(shown.map((n) => s.noteNames[n.step]).join(' ')) : s.staffEmpty;
  if (!width || !height) return <div ref={ref} class="staff" role="img" aria-label={label} />;

  const L = staffLayout(width, height, view.beats, compact, view.focus);
  const u = L.s;
  const thin = Math.max(1.5, 0.22 * u);
  const clipId = 'staff-notes';

  return (
    <div ref={ref} class="staff" role="img" aria-label={label}>
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
          {view.notes.map((n, i) => {
            if (n.mark === 'hidden') return null;
            const note = SCALE[n.step]!;
            const x = L.noteX(n.beat);
            const y = L.noteY(n.step);
            const coloured = n.mark === 'on' || n.mark === 'found';
            const colour = coloured ? noteColour(note) : 'var(--on-ink)';
            return (
              <g key={i} class={`staff__note is-${n.mark}`} data-note={note.pitch}>
                <Note x={x} y={y} u={u} thin={thin} step={n.step} beats={n.beats} colour={colour} ledger={n.step === 0} filled={coloured} />
                {n.mark === 'on' && <Burst key={plays.value} x={x} y={y} u={u} thin={thin} />}
                <text x={x} y={L.nameY} class="staff__name lettering" font-size={Math.max(12, 1.22 * u)}>
                  {s.noteNames[n.step]!.toUpperCase()}
                </text>
                {s.showLetters && (
                  <text x={x} y={L.letterY} class="staff__letter" font-size={Math.max(10, 0.83 * u)}>
                    {note.letter}
                  </text>
                )}
              </g>
            );
          })}
          {view.ghost && (
            <g class="staff__ghost" data-note={SCALE[view.ghost.step]!.pitch}>
              <Note
                x={L.noteX(view.ghost.beat)}
                y={L.noteY(view.ghost.step)}
                u={u}
                thin={thin}
                step={view.ghost.step}
                beats={1}
                colour={noteColour(SCALE[view.ghost.step]!)}
                ledger={view.ghost.step === 0}
                filled
              />
              <text x={L.noteX(view.ghost.beat)} y={L.nameY} class="staff__name lettering" font-size={Math.max(12, 1.22 * u)}>
                {s.noteNames[view.ghost.step]!.toUpperCase()}
              </text>
            </g>
          )}
          <VoiceDot L={L} u={u} thin={thin} />
        </g>
      </svg>
    </div>
  );
}
