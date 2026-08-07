"use client";

/** Controles de formulario del backoffice. Uniformes y sin dependencias. */

const BASE_INPUT =
  "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-[14px] text-ink outline-none transition-colors focus:border-cyan placeholder:text-ink-faint";

export function Etiqueta({
  children,
  ayuda,
  error,
}: {
  children: React.ReactNode;
  ayuda?: string;
  error?: string;
}) {
  return (
    <span className="mb-1.5 block">
      <span className="label-tech block text-ink-faint">{children}</span>
      {ayuda && !error && (
        <span className="mt-1 block text-[11.5px] leading-snug text-ink-faint">{ayuda}</span>
      )}
      {error && <span className="mt-1 block text-[11.5px] text-amber">{error}</span>}
    </span>
  );
}

export function Campo({
  etiqueta,
  ayuda,
  error,
  value,
  onChange,
  ...rest
}: {
  etiqueta: string;
  ayuda?: string;
  error?: string;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return (
    <label className="block">
      <Etiqueta ayuda={ayuda} error={error}>
        {etiqueta}
      </Etiqueta>
      <input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${BASE_INPUT} ${error ? "border-amber/60" : ""}`}
      />
    </label>
  );
}

export function Area({
  etiqueta,
  ayuda,
  error,
  value,
  onChange,
  rows = 4,
  ...rest
}: {
  etiqueta: string;
  ayuda?: string;
  error?: string;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange" | "value">) {
  return (
    <label className="block">
      <Etiqueta ayuda={ayuda} error={error}>
        {etiqueta}
      </Etiqueta>
      <textarea
        {...rest}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${BASE_INPUT} resize-y leading-relaxed ${error ? "border-amber/60" : ""}`}
      />
    </label>
  );
}

export function Selector<T extends string>({
  etiqueta,
  ayuda,
  value,
  onChange,
  opciones,
}: {
  etiqueta: string;
  ayuda?: string;
  value: T;
  onChange: (v: T) => void;
  opciones: { valor: T; texto: string }[];
}) {
  return (
    <label className="block">
      <Etiqueta ayuda={ayuda}>{etiqueta}</Etiqueta>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className={BASE_INPUT}
      >
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor} className="bg-surface">
            {o.texto}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Interruptor({
  etiqueta,
  descripcion,
  value,
  onChange,
}: {
  etiqueta: string;
  descripcion?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="flex w-full items-center justify-between gap-4 rounded-lg border border-line bg-surface px-3.5 py-3 text-left transition-colors hover:border-cyan/40"
    >
      <span>
        <span className="block text-[13px] font-medium text-ink">{etiqueta}</span>
        {descripcion && (
          <span className="mt-0.5 block text-[11.5px] text-ink-faint">{descripcion}</span>
        )}
      </span>
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          value ? "bg-cyan" : "bg-line"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-abyss transition-transform ${
            value ? "translate-x-4.5" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}

export function Boton({
  children,
  variante = "secundario",
  ...rest
}: {
  children: React.ReactNode;
  variante?: "primario" | "secundario" | "peligro";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const estilos = {
    primario: "bg-cyan text-abyss hover:opacity-90",
    secundario: "border border-line text-ink-soft hover:border-cyan/50 hover:text-cyan",
    peligro: "border border-amber/40 text-amber hover:bg-amber/10",
  }[variante];

  return (
    <button
      {...rest}
      className={`label-tech rounded-lg px-3.5 py-2.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${estilos} ${rest.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function Seccion({
  titulo,
  descripcion,
  children,
  acciones,
}: {
  titulo: string;
  descripcion?: string;
  children: React.ReactNode;
  acciones?: React.ReactNode;
}) {
  return (
    <section className="panel p-5 md:p-6">
      <header className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-ink">{titulo}</h2>
          {descripcion && (
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink-soft">{descripcion}</p>
          )}
        </div>
        {acciones}
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
