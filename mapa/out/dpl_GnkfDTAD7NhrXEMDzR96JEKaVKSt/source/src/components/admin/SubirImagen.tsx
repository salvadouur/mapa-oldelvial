"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Etiqueta } from "./campos";

interface Props {
  etiqueta: string;
  ayuda?: string;
  value: string;
  onChange: (url: string) => void;
  /** Subcarpeta dentro del bucket, para no mezclar todo en la raíz. */
  carpeta?: string;
}

/**
 * Campo de imagen: acepta pegar una URL o subir un archivo al bucket `media`.
 *
 * La subida va directo del navegador a Supabase Storage con la sesión del
 * usuario; no pasa por el servidor de Next, así que no hay límite de tamaño de
 * Server Action ni un salto extra.
 */
export default function SubirImagen({ etiqueta, ayuda, value, onChange, carpeta = "portadas" }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function subir(archivo: File) {
    setSubiendo(true);
    setError(null);

    try {
      const supabase = createClient();
      const extension = archivo.name.split(".").pop()?.toLowerCase() ?? "jpg";
      // Nombre único: evita pisar una imagen ya usada por otra publicación.
      const ruta = `${carpeta}/${crypto.randomUUID()}.${extension}`;

      const { error: errorSubida } = await supabase.storage
        .from("media")
        .upload(ruta, archivo, { cacheControl: "31536000", upsert: false });

      if (errorSubida) throw errorSubida;

      const { data } = supabase.storage.from("media").getPublicUrl(ruta);
      onChange(data.publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir la imagen");
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div>
      <Etiqueta ayuda={ayuda} error={error ?? undefined}>
        {etiqueta}
      </Etiqueta>

      <div className="flex gap-2.5">
        {value && (
          <span className="h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="h-full w-full object-cover" />
          </span>
        )}

        <div className="flex-1 space-y-2">
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://…"
            className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-[13px] text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-cyan"
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => input.current?.click()}
              disabled={subiendo}
              className="label-tech rounded-lg border border-line px-3 py-2 text-ink-soft transition-colors hover:border-cyan/50 hover:text-cyan disabled:opacity-50"
            >
              {subiendo ? "Subiendo…" : "Subir archivo"}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="label-tech px-2 py-2 text-ink-faint transition-colors hover:text-amber"
              >
                Quitar
              </button>
            )}
          </div>

          <input
            ref={input}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const archivo = e.target.files?.[0];
              if (archivo) subir(archivo);
              e.target.value = "";
            }}
          />
        </div>
      </div>
    </div>
  );
}
