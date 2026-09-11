import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { APP_ROUTES } from "@/constants";

import { ThemeProvider } from "@/components/theme-provider";

import { HOME_COPY, HOME_FEATURES } from "./constants";

import { HomeFeatureStrip, HomeFooter, HomeHeader, HomeHero } from "./index";

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
});

describe("HomeFeatureStrip", () => {
  it("hiện đủ ba điểm chạm vận hành", () => {
    renderWithTheme(<HomeFeatureStrip />);
    for (const feature of HOME_FEATURES) {
      expect(screen.getByRole("heading", { name: feature.title })).toBeInTheDocument();
    }
  });
});

describe("HomeHeader", () => {
  it("có link đăng nhập", () => {
    renderWithTheme(<HomeHeader />);
    expect(screen.getByRole("link", { name: HOME_COPY.loginLabel })).toHaveAttribute(
      "href",
      APP_ROUTES.login,
    );
  });

  it("nút đổi theme đặt data-theme trên documentElement", async () => {
    const user = userEvent.setup();
    renderWithTheme(<HomeHeader />);

    await user.click(screen.getByRole("button", { name: /Chuyển sang Dark/i }));

    expect(document.documentElement.dataset.theme).toBe("dark");
  });
});

describe("HomeFooter", () => {
  it("hiện dòng bản quyền", () => {
    renderWithTheme(<HomeFooter />);
    expect(screen.getByText(HOME_COPY.footerLeft)).toBeInTheDocument();
  });
});
