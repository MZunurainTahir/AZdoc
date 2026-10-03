/**
 * DomainContext — the active bio-health domain (human/livestock/pet/plant/crop).
 * Persisted in localStorage; drives AI persona, doctors, pharmacy and UI theming.
 */
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ACTIVE_DOMAIN_KEY, DOMAINS, Domain, DomainId, getDomain } from "../lib/domains";

interface DomainContextType {
  domainId: DomainId;
  domain: Domain;
  setDomain: (id: DomainId) => void;
  hasChosen: boolean;
}

const DomainContext = createContext<DomainContextType>({
  domainId: "crop",
  domain: DOMAINS[DOMAINS.length - 1],
  setDomain: () => {},
  hasChosen: false,
});

function readStoredDomain(): DomainId | null {
  try {
    const raw = localStorage.getItem(ACTIVE_DOMAIN_KEY);
    if (raw && DOMAINS.some((d) => d.id === raw)) return raw as DomainId;
  } catch {
    /* ignore */
  }
  return null;
}

export function DomainProvider({ children }: { children: ReactNode }) {
  const [domainId, setDomainId] = useState<DomainId>("crop");
  const [hasChosen, setHasChosen] = useState<boolean>(true);

  useEffect(() => {
    const stored = readStoredDomain();
    if (stored) {
      setDomainId(stored);
      setHasChosen(true);
    } else {
      setHasChosen(false);
    }
  }, []);

  const setDomain = (id: DomainId) => {
    setDomainId(id);
    setHasChosen(true);
    try {
      localStorage.setItem(ACTIVE_DOMAIN_KEY, id);
    } catch {
      /* ignore */
    }
  };

  return (
    <DomainContext.Provider
      value={{ domainId, domain: getDomain(domainId), setDomain, hasChosen }}
    >
      {children}
    </DomainContext.Provider>
  );
}

export const useDomain = () => useContext(DomainContext);
