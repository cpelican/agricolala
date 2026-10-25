// Shared typography of the welcome page sections. The base styles live in
// components/ui/typography.ts so the logged-in app uses the same ones.
import { TITLE_BASE } from "@/components/ui/typography";

export {
	EYEBROW,
	PRIMARY_BUTTON,
	PRIMARY_BUTTON_ARROW,
	SECTION_TEXT,
} from "@/components/ui/typography";

export const SECTION_TITLE = `${TITLE_BASE} text-[28px] min-[900px]:text-[clamp(30px,3.4vw,42px)]`;
export const SECTION =
	"mx-auto max-w-[1200px] px-4 pt-[72px] min-[900px]:px-6 min-[900px]:pt-[120px]";
