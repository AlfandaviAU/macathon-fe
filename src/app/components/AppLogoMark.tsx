import { cn } from "./ui/utils";

type AppLogoMarkProps = {
  className?: string;
};

/** Mark asset: `public/dwllr-mark.svg` (tight viewBox, brand-aligned gradients). */
export function AppLogoMark({ className }: AppLogoMarkProps) {
  return (
    <img
      src="/dwllr-mark.svg"
      alt=""
      aria-hidden
      draggable={false}
      className={cn("block max-h-full max-w-full select-none object-contain object-center pointer-events-none", className)}
    />
  );
}
