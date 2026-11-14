import { handLine, type HandOptions } from './hand';
import { useSize } from './useSize';

interface Props extends HandOptions {
  /** Horizontal across the box, or vertical down its middle. */
  direction?: 'horizontal' | 'vertical';
  strokeWidth?: number;
  class?: string;
}

/** A hand-drawn line that fills its box and is redrawn, not stretched, when the box changes. */
export function HandRule({ direction = 'horizontal', strokeWidth = 4, class: className, ...opts }: Props) {
  const [ref, { width, height }] = useSize<SVGSVGElement>();
  const pad = strokeWidth;
  const d =
    width && height
      ? direction === 'horizontal'
        ? handLine(pad, height / 2, width - pad, height / 2, opts)
        : handLine(width / 2, pad, width / 2, height - pad, opts)
      : '';
  return (
    <svg ref={ref} aria-hidden="true" class={className} width="100%" height="100%">
      <path d={d} fill="none" stroke="currentColor" stroke-width={strokeWidth} stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  );
}
