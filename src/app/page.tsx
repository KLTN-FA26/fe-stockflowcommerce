import { HomeFooter, HomeHero, WarehouseSceneLazy } from "@/features/home";

/**
 * Trang chủ vừa đúng một khung hình, không có thanh cuộn.
 *
 * `min-h-0` trên <main> là bắt buộc: thiếu nó thì flex child không co lại được và
 * nội dung tràn ra ngoài viewport. `dvh` thay `vh` để thanh địa chỉ trên mobile
 * không cắt mất footer.
 */
export default function Home() {
  return (
    <div className="bg-bg-base text-ink-primary relative isolate flex min-h-dvh flex-col overflow-x-hidden">
      <div className="absolute inset-0" aria-hidden="true">
        <WarehouseSceneLazy />
        <div className="from-bg-base/65 via-bg-base/20 dark:from-bg-base/82 dark:via-bg-base/50 absolute inset-0 bg-gradient-to-r to-transparent" />
        <div className="from-bg-base/25 dark:from-bg-base/55 absolute inset-0 bg-gradient-to-t via-transparent to-transparent" />
      </div>

      <div className="relative z-10 flex min-h-dvh flex-col">
        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-5 py-10 sm:px-6 lg:px-8">
          <HomeHero />
        </main>

        <HomeFooter />
      </div>
    </div>
  );
}
