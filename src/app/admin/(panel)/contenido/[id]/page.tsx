import { notFound } from "next/navigation";
import ContentEditor from "@/components/admin/ContentEditor";
import { obtenerContenido } from "@/lib/content/admin";

export default async function EditorPage(props: PageProps<"/admin/contenido/[id]">) {
  const { id } = await props.params;

  // `nuevo` es un id reservado: comparte editor con la edición, sin contenido.
  if (id === "nuevo") return <ContentEditor contenido={null} />;

  const contenido = await obtenerContenido(id);
  if (!contenido) notFound();

  return <ContentEditor contenido={contenido} />;
}
