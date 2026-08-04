import { z } from "zod";

/**
 * Validación de lo que envía el editor del backoffice.
 *
 * Se valida en el servidor —dentro de la Server Action— y no solo en el
 * formulario: las Server Actions son endpoints POST alcanzables directamente,
 * así que el cliente nunca es la última palabra.
 */

const bloqueTexto = z.object({
  type: z.literal("text"),
  data: z.object({
    heading: z.string().max(160).optional(),
    body: z.string().min(1, "El texto no puede quedar vacío"),
  }),
});

const bloqueVideo = z.object({
  type: z.literal("video"),
  data: z.object({
    vimeoId: z.string().min(1, "Falta el ID de Vimeo"),
    posterUrl: z.string().url().or(z.literal("")).optional(),
    caption: z.string().max(300).optional(),
  }),
});

const bloqueGaleria = z.object({
  type: z.literal("gallery"),
  data: z.object({
    caption: z.string().max(300).optional(),
    images: z.array(z.object({ url: z.string().url(), alt: z.string().optional() })),
  }),
});

const bloqueSketchfab = z.object({
  type: z.literal("sketchfab"),
  data: z.object({
    modelId: z.string().min(1, "Falta el ID del modelo"),
    title: z.string().max(160).optional(),
    caption: z.string().max(300).optional(),
  }),
});

const bloqueInfografia = z.object({
  type: z.literal("infographic"),
  data: z.object({
    url: z.string().url().or(z.literal("")),
    alt: z.string().max(200).optional(),
    caption: z.string().max(300).optional(),
  }),
});

const bloqueCifras = z.object({
  type: z.literal("stats"),
  data: z.object({
    items: z.array(
      z.object({
        label: z.string().min(1),
        value: z.string().min(1),
        unit: z.string().max(12).optional(),
      }),
    ),
  }),
});

const bloquePasos = z.object({
  type: z.literal("steps"),
  data: z.object({
    heading: z.string().max(160).optional(),
    items: z.array(z.object({ title: z.string().min(1), body: z.string().min(1) })),
  }),
});

export const bloqueSchema = z.discriminatedUnion("type", [
  bloqueTexto,
  bloqueVideo,
  bloqueGaleria,
  bloqueSketchfab,
  bloqueInfografia,
  bloqueCifras,
  bloquePasos,
]);

export type BloqueInput = z.infer<typeof bloqueSchema>;

export const contenidoSchema = z
  .object({
    id: z.string().uuid().optional(),
    slug: z
      .string()
      .min(3, "El slug necesita al menos 3 caracteres")
      .regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
    type: z.enum(["especial", "simple"]),
    status: z.enum(["draft", "published"]),
    title: z.string().min(1, "Falta el título"),
    subtitle: z.string().nullish(),
    summary: z.string().max(400, "El resumen se lee en el mapa: máximo 400 caracteres").nullish(),
    coverUrl: z.string().url().nullish().or(z.literal("")),
    vimeoId: z.string().nullish(),
    durationSeconds: z.number().int().min(0).nullish(),
    locationName: z.string().nullish(),
    kp: z.string().nullish(),
    lat: z.number().min(-90).max(90).nullish(),
    lng: z.number().min(-180).max(180).nullish(),
    tags: z.array(z.string()),
    orderIndex: z.number().int(),
    publishedAt: z.string().nullish(),
    blocks: z.array(bloqueSchema),
  })
  .refine((c) => (c.lat === null || c.lat === undefined) === (c.lng === null || c.lng === undefined), {
    message: "Cargá latitud y longitud, o ninguna de las dos",
    path: ["lat"],
  })
  .refine((c) => c.type !== "especial" || (c.lat !== null && c.lat !== undefined), {
    message: "Un especial necesita un punto georreferenciado en la traza",
    path: ["lat"],
  });

export type ContenidoInput = z.infer<typeof contenidoSchema>;
