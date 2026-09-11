import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { APP_ROUTES } from "@/constants";

import { ThemeProvider } from "@/components/theme-provider";

import { HOME_COPY, HOME_FEATURES } from "./constants";

import { HomeFeatureStrip, HomeFooter, HomeHero } from "./index";

import type { ReactElement } from "react";

/**
 * Không test render 3D thật: jsdom không có WebGL context nên `<Canvas>` của R3F
 * không khởi tạo được. Đây là giới hạn môi trường test, không phải chỗ bỏ sót.
 * Scene được cách ly sau `next/dynamic({ ssr: false })` nên không lọt vào test này.
 */
function renderWithTheme(ui: ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

afterEach(() => {
  delete document.documentElement.dataset.theme;
  document.documentElement.classList.remove("dark");
});

describe("HomeHero", () => {
  it("hiện tiêu đề chính", () => {
    renderWithTheme(<HomeHero />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(HOME_COPY.title);
  });

  it("CTA chính trỏ về trang đăng nhập", () => {
    renderWithTheme(<HomeHero />);
    expect(screen.getByRole("link", { name: new RegExp(HOME_COPY.ctaLabel) })).toHaveAttribute(
      "href",
      APP_ROUTES.login,
    );
  });

  it("đặt logo trong hero và không lặp lại CTA đăng nhập", () => {
    renderWithTheme(<HomeHero />);
    expect(screen.getByRole("link", { name: /StockFlowCommerce/i })).toHaveAttribute(
      "href",
      APP_ROUTES.home,
    );
    expect(screen.queryByRole("link", { name: HOME_COPY.loginLabel })).not.toBeInTheDocument();
  });
});

describe("HomeFeatureStrip", () => {
  it("hiện đủ ba điểm chạm vận hành", () => {
    renderWithTheme(<HomeFeatureStrip />);
    for (const feature of HOME_FEATURES) {
      expect(screen.getByRole("heading", { name: feature.title })).toBeInTheDocument();
    }
  });
});

describe("HomeFooter", () => {
  it("hiện dòng bản quyền", () => {
    renderWithTheme(<HomeFooter />);
    expect(screen.getByText(HOME_COPY.footerLeft)).toBeInTheDocument();
  });

  it("đặt nút theme ở footer và chuyển từ Dark sang Light", async () => {
    const user = userEvent.setup();
    renderWithTheme(<HomeFooter />);

    expect(screen.getByRole("button", { name: /Chuyển sang Light/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Chuyển sang Light/i }));

    expect(document.documentElement.dataset.theme).toBe("light");
  });
});
