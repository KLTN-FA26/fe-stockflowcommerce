import { HOME_COPY } from "../constants";

export function HomeFooter() {
  return (
    <footer className="border-border-default bg-bg-surface shrink-0 border-t">
      <div className="text-ink-tertiary mx-auto flex max-w-7xl items-center justify-between px-6 py-3 text-xs lg:px-8">
        <span>{HOME_COPY.footerLeft}</span>
        <span className="hidden sm:inline">{HOME_COPY.footerRight}</span>
      </div>
    </footer>
  );
}
