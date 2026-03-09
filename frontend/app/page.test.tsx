import React from "react";
import { render, screen } from "@testing-library/react";
import Home from "./page";

describe("Home page", () => {
  it("renders service list and deployment message", () => {
    render(<Home />);

    expect(screen.getByText("Green-Cart Frontend")).toBeInTheDocument();
    expect(
      screen.getByText(/standalone frontend microservice is ready/i)
    ).toBeInTheDocument();

    expect(screen.getByText(/Authentication:/)).toBeInTheDocument();
    expect(screen.getByText(/Inventory:/)).toBeInTheDocument();
    expect(screen.getByText(/Payment:/)).toBeInTheDocument();
    expect(screen.getByText(/Notification:/)).toBeInTheDocument();
  });
});
