import { cn } from "@/lib/utils";

/**
 * Lightweight, dependency-free renderer for free-text notes.
 * - Preserves line breaks
 * - Turns lines starting with -, *, • or – into real bullet lists
 * - Turns lines starting with "1." / "2)" etc. into ordered lists
 * - Renders blank lines as spacing between paragraphs
 * Keeps it safe (plain text only — no HTML injection).
 */
export function RichText({ text, className }: { text: string; className?: string }) {
  const lines = (text ?? "").split(/\r?\n/);
  const blocks: React.ReactNode[] = [];
  let bullets: string[] = [];
  let ordered: string[] = [];
  let key = 0;

  const flushBullets = () => {
    if (bullets.length) {
      blocks.push(
        <ul key={`ul-${key++}`} className="list-disc pl-5 space-y-1">
          {bullets.map((b, i) => <li key={i}>{b}</li>)}
        </ul>
      );
      bullets = [];
    }
  };
  const flushOrdered = () => {
    if (ordered.length) {
      blocks.push(
        <ol key={`ol-${key++}`} className="list-decimal pl-5 space-y-1">
          {ordered.map((b, i) => <li key={i}>{b}</li>)}
        </ol>
      );
      ordered = [];
    }
  };
  const flushAll = () => { flushBullets(); flushOrdered(); };

  for (const raw of lines) {
    const line = raw.trim();
    const bulletMatch = line.match(/^[-*•–·]\s+(.*)/);
    const orderedMatch = line.match(/^\d+[.)]\s+(.*)/);

    if (bulletMatch) {
      flushOrdered();
      bullets.push(bulletMatch[1]);
    } else if (orderedMatch) {
      flushBullets();
      ordered.push(orderedMatch[1]);
    } else if (line === "") {
      flushAll();
    } else {
      flushAll();
      blocks.push(<p key={`p-${key++}`}>{line}</p>);
    }
  }
  flushAll();

  return <div className={cn("space-y-2 leading-relaxed", className)}>{blocks}</div>;
}
