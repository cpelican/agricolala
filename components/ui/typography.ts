// Shared text and action styles, taken from the welcome page and used by the app too.

// Large brand title: dark green, bold, tight letter-spacing. Add a size (see PAGE_TITLE).
export const TITLE_BASE =
	"m-0 leading-[1.1] font-bold tracking-[-0.02em] text-primary-700";
// Screen title of an app page: about 30px on phones.
export const PAGE_TITLE = `${TITLE_BASE} text-[30px]`;
// Section title inside a page (e.g. "Used this year" on the dashboard).
export const SUBSECTION_TITLE = `${TITLE_BASE} text-2xl leading-[1.15]`;
// Small uppercase label above a title.
export const EYEBROW =
	"text-xs font-medium tracking-[0.06em] text-neutral-600 uppercase";
// Body text under a title.
export const SECTION_TEXT = "m-0 text-base text-neutral-700";
// The soft green shadow of the primary action.
export const PRIMARY_SHADOW =
	"shadow-[0_1px_2px_rgb(0_43_11/0.2),0_4px_12px_-4px_rgb(0_75_20/0.45)]";
// Main call to action: sized to its label, never stretched across a phone screen.
export const PRIMARY_BUTTON = `group inline-flex h-12 items-center gap-2 rounded-lg bg-primary pr-5 pl-6 text-base font-medium text-primary-foreground no-underline ${PRIMARY_SHADOW} hover:bg-primary-600`;
export const PRIMARY_BUTTON_ARROW =
	"size-[18px] transition-transform motion-safe:group-hover:translate-x-0.5";
