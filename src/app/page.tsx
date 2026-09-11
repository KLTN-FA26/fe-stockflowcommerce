import {
  HomeFeatureStrip,
  HomeFooter,
  HomeHeader,
  HomeHero,
  WarehouseSceneLazy,
} from "@/features/home";

/**
 * Trang chủ vừa đúng một khung hình, không có thanh cuộn.
 *
 * `min-h-0` trên <main> là bắt buộc: thiếu nó thì flex child không co lại được và
 * nội dung tràn ra ngoài viewport. `dvh` thay `vh` để thanh địa chỉ trên mobile
 * không cắt mất footer.
 */
export default function Home() {
  return (
    <div className="bg-bg-base text-ink-primary flex h-dvh flex-col overflow-hidden">
      <HomeHeader />

      <main className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col justify-center gap-6 px-6 py-6 lg:px-8">
        <div className="grid min-h-0 flex-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
          <HomeHero />
          <div className="hidden h-full min-h-0 lg:block">
            <WarehouseSceneLazy />
          </div>
        </div>

        <HomeFeatureStrip />
      </main>

      <HomeFooter />
    </div>
  );
}
