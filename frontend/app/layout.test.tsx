import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import RootLayout from "./layout";

describe("RootLayout", () => {
  it("wraps children in html/body tags", () => {
    const markup = renderToStaticMarkup(
      <RootLayout>
        <div>child-content</div>
      </RootLayout>
    );

    expect(markup).toContain("<html");
    expect(markup).toContain("<body>");
    expect(markup).toContain("child-content");
  });
});
