import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Chatbot from "./Chatbot";
import * as api from "./api";

jest.mock("./api");

function renderWithRouter(ui) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

test("shows initial placeholder", () => {
  renderWithRouter(<Chatbot />);
  expect(
    screen.getByPlaceholderText("👋 Start by saying hi...")
  ).toBeInTheDocument();
});

test("sends message and shows bot reply", async () => {
  api.chatApi.mockResolvedValueOnce({ reply: "Hello traveler!" });

  renderWithRouter(<Chatbot />);

  const input = screen.getByPlaceholderText("👋 Start by saying hi...");
  fireEvent.change(input, { target: { value: "hi" } });
  fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

  await waitFor(() => {
    expect(screen.getByText("hi")).toBeInTheDocument(); // user message
    expect(screen.getByText("Hello traveler!")).toBeInTheDocument(); // bot reply
  });
});

test("shows action button when API returns action", async () => {
  api.chatApi.mockResolvedValueOnce({
    reply: "Hospitals near Dhanmondi:\n1. Test Hospital",
    action: { type: "OPEN_SERVICES", category: "HOSPITAL", area: "Dhanmondi" },
  });

  renderWithRouter(<Chatbot />);

  const input = screen.getByPlaceholderText("👋 Start by saying hi...");
  fireEvent.change(input, {
    target: { value: "hospitals near Dhanmondi" },
  });
  fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

  const btn = await screen.findByText("Open Services page");
  expect(btn).toBeInTheDocument();
});
