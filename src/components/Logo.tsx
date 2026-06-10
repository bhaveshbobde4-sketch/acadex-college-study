import mark from "../assets/acadex-mark.png";

type LogoProps = {
  size?: number;
  showWordmark?: boolean;
  showTagline?: boolean;
  className?: string;
};

export function Logo({ size = 36, showWordmark = true, showTagline = false, className = "" }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img
        src={mark}
        alt="Acadex"
        width={size}
        height={size}
        className="rounded-xl shrink-0"
        style={{ width: size, height: size }}
      />
      {showWordmark && (
        <div className="leading-tight">
          <div className="text-lg font-semibold tracking-tight">Acadex</div>
          {showTagline && (
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Study Smarter. Learn Faster.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
