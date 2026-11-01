import { createContext, useContext, useEffect, useState } from "react";
import { backend } from "./instance";
import type { Profil } from "./types";

export interface Ctx {
  profil: Profil;
  setProfil: (p: Profil) => void;
}
export const AppCtx = createContext<Ctx | null>(null);
export function useProfil(): Ctx {
  const c = useContext(AppCtx);
  if (!c) throw new Error("Contexte absent");
  return c;
}

/** Charge une donnée asynchrone et la recharge à chaque changement dans la base. */
export function useDonnee<T>(charger: () => Promise<T>, deps: unknown[] = []): { data: T | undefined; erreur?: string; recharger: () => void } {
  const [data, setData] = useState<T>();
  const [erreur, setErreur] = useState<string>();
  const [tic, setTic] = useState(0);
  useEffect(() => backend.onChange(() => setTic((x) => x + 1)), []);
  useEffect(() => {
    let vivant = true;
    charger()
      .then((d) => vivant && (setData(d), setErreur(undefined)))
      .catch((e: Error) => vivant && setErreur(e.message));
    return () => {
      vivant = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tic]);
  return { data, erreur, recharger: () => setTic((x) => x + 1) };
}

/** Route courante à partir du fragment d’URL : #/activite/b1-forum?devoir=… */
export function useRoute(): { segments: string[]; params: URLSearchParams } {
  const lireRoute = () => {
    const h = window.location.hash.replace(/^#\/?/, "");
    const [chemin, q] = h.split("?");
    return { segments: chemin.split("/").filter(Boolean).map(decodeURIComponent), params: new URLSearchParams(q ?? "") };
  };
  const [r, setR] = useState(lireRoute);
  useEffect(() => {
    const f = () => {
      setR(lireRoute());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);
  return r;
}

export const aller = (chemin: string) => {
  window.location.hash = chemin.startsWith("#") ? chemin : "#/" + chemin.replace(/^\//, "");
};
