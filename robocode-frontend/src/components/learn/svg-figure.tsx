/** Renders a trusted, seed-authored inline SVG illustration. */
export function SvgFigure({ svg, caption }: { svg: string; caption?: string }) {
  return (
    <figure className="my-6 flex flex-col items-center gap-2">
      <div
        className="w-full max-w-xl overflow-x-auto rounded-xl border border-border bg-card p-4 [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      {caption && <figcaption className="text-center text-sm text-muted-foreground">{caption}</figcaption>}
    </figure>
  );
}
