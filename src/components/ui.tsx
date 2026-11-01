import type { ReactNode } from "react";
import { COMPETENCES, type Competence } from "../lib/types";
import { typo } from "../lib/util";

/** Texte avec typographie française appliquée. */
export const T = ({ children }: { children: string }) => <>{typo(children)}</>;

export const Badge = ({ children, ton }: { children: ReactNode; ton?: "ok" | "attention" | "neutre" | "info" }) => (
  <span className={`badge ${ton ?? "neutre"}`}>{children}</span>
);

export const BadgeComp = ({ c }: { c: Competence }) => (
  <span className={`badge comp-${c}`} title={COMPETENCES[c]}>{c}</span>
);

export function Jauge({ valeur, label }: { valeur: number; label?: string }) {
  const v = Math.max(0, Math.min(1, valeur));
  const ton = v >= 0.75 ? "ok" : v >= 0.5 ? "moyen" : "faible";
  return (
    <div className="jauge" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v * 100)} aria-label={label}>
      <div className={`jauge-barre ${ton}`} style={{ width: `${v * 100}%` }} />
    </div>
  );
}

export function Vide({ children }: { children: ReactNode }) {
  return <div className="vide">{children}</div>;
}

export function Paragraphes({ texte }: { texte: string }) {
  return (
    <>
      {texte.split(/\n{2,}/).map((p, i) => (
        <p key={i}>
          {p.split("\n").map((l, j, a) => (
            <span key={j}>
              {typo(l)}
              {j < a.length - 1 && <br />}
            </span>
          ))}
        </p>
      ))}
    </>
  );
}
