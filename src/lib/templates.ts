/**
 * Visual treatments for the customer menu.
 *
 * The slugs match the rows seeded in `templates` (see the
 * seed_reference_data migration). Menu *data* is untouched by the choice —
 * only presentation changes, per PRD section 32.
 */
export type TemplateStyle = {
  /** Wrapper classes for the whole menu page. */
  page: string;
  /** Classes for each menu item row. */
  card: string;
  /** Category heading treatment. */
  heading: string;
  /** Restaurant name treatment. */
  title: string;
  /** Corner rounding applied to item images. */
  image: string;
  /** Whether this template prefers a dark surface. */
  dark?: boolean;
};

const MINIMAL: TemplateStyle = {
  page: "",
  card: "rounded-lg border",
  heading: "text-lg font-semibold",
  title: "text-xl font-semibold",
  image: "rounded-md",
};

export const TEMPLATE_STYLES: Record<string, TemplateStyle> = {
  minimal: MINIMAL,

  classic: {
    page: "font-serif",
    card: "rounded-none border-b border-dashed bg-transparent px-0",
    heading: "text-lg font-semibold uppercase tracking-[0.2em] text-center",
    title: "text-2xl font-semibold tracking-wide",
    image: "rounded-sm",
  },

  modern: {
    page: "",
    card: "rounded-2xl border-0 bg-muted/60 shadow-sm",
    heading: "text-xl font-bold tracking-tight",
    title: "text-2xl font-bold tracking-tight",
    image: "rounded-xl",
  },

  luxury: {
    page: "font-serif",
    card: "rounded-none border border-[color:var(--brand)]/30 bg-transparent",
    heading: "text-lg font-normal uppercase tracking-[0.3em] text-center",
    title: "text-2xl font-normal uppercase tracking-[0.25em]",
    image: "rounded-none",
  },

  "premium-dark": {
    page: "bg-neutral-950 text-neutral-50",
    card: "rounded-xl border-neutral-800 bg-neutral-900",
    heading: "text-lg font-semibold tracking-tight",
    title: "text-2xl font-semibold",
    image: "rounded-lg",
    dark: true,
  },

  cafe: {
    page: "",
    card: "rounded-2xl border-2 border-dashed",
    heading: "text-lg font-semibold",
    title: "text-2xl font-semibold",
    image: "rounded-2xl",
  },

  indian: {
    page: "",
    card: "rounded-lg border-l-4 border-l-[color:var(--brand)]",
    heading: "text-lg font-bold uppercase tracking-wider",
    title: "text-2xl font-bold",
    image: "rounded-md",
  },

  "fast-food": {
    page: "",
    card: "rounded-xl border-2 bg-background shadow-[3px_3px_0_0_var(--brand)]",
    heading: "text-xl font-extrabold uppercase",
    title: "text-2xl font-extrabold uppercase",
    image: "rounded-lg",
  },

  coffee: {
    page: "",
    card: "rounded-lg border-0 bg-muted/50",
    heading: "text-base font-medium uppercase tracking-[0.2em]",
    title: "text-xl font-medium tracking-wide",
    image: "rounded-full",
  },

  "fine-dining": {
    page: "font-serif",
    card: "rounded-none border-0 border-b bg-transparent px-0",
    heading: "text-base font-normal uppercase tracking-[0.35em] text-center",
    title: "text-3xl font-light tracking-[0.2em]",
    image: "rounded-none",
  },

  editorial: {
    page: "",
    card: "rounded-none border-0 border-t-2 border-t-foreground bg-transparent px-0",
    heading: "text-2xl font-black tracking-tighter",
    title: "text-3xl font-black tracking-tighter",
    image: "rounded-none",
  },
};

export function templateStyle(slug: string | null | undefined): TemplateStyle {
  return (slug && TEMPLATE_STYLES[slug]) || MINIMAL;
}
