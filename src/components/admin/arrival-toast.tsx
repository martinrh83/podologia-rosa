"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

/**
 * Un toast que llega con la página: el de «Nuevo turno» después de guardar.
 *
 * La acción redirige a la misma pantalla con `?guardado=…`, y el toast sale al
 * llegar. Después se saca el parámetro de la URL, así recargar la página no lo
 * vuelve a mostrar. El `id` evita que salga dos veces si el efecto corre de
 * nuevo (en desarrollo, React lo corre dos veces a propósito).
 */
export function ArrivalToast({ message, cleanUrl }: { message: string; cleanUrl: string }) {
  const router = useRouter();

  useEffect(() => {
    toast.success(message, { id: message });
    router.replace(cleanUrl, { scroll: false });
  }, [message, cleanUrl, router]);

  return null;
}
