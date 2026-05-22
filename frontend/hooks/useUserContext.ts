// frontend/hooks/useUserContext.ts
"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export type UserContext = {
  user: User | null;
  nome: string;
  premium: boolean;
  loading: boolean;
  jornada: string;
  nivel: string;
  banca: string;
};

export function useUserContext(): UserContext {
  const [user, setUser] = useState<User | null>(null);
  const [nome, setNome] = useState("");
  const [premium, setPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [jornada, setJornada] = useState("concurso");
  const [nivel, setNivel] = useState("Intermediario");
  const [banca, setBanca] = useState("Livre");

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(db, "usuarios", u.uid));
        if (snap.exists()) {
          const data = snap.data();
          setNome(data.nome || u.displayName?.split(" ")[0] || "Estudante");
          setPremium(data.premium ?? false);
          setJornada(data.jornada || "concurso");
          setNivel(data.nivel_padrao || "Intermediario");
          setBanca(data.banca_padrao || "Livre");
        } else {
          setNome(u.displayName?.split(" ")[0] || "Estudante");
        }
      } else {
        setNome("");
        setPremium(false);
        setJornada("concurso");
        setNivel("Intermediario");
        setBanca("Livre");
      }
      setLoading(false);
    });
  }, []);

  return { user, nome, premium, loading, jornada, nivel, banca };
}
