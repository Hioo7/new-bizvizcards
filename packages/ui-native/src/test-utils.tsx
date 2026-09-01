import type { ReactElement } from "react";
import { render } from "@testing-library/react-native";
import { ThemeRoot } from "./provider/ThemeRoot";

/** RNTL `render`, wrapped in `ThemeRoot` so gluestack context/tokens resolve. */
export function renderWithTheme(ui: ReactElement) {
  return render(<ThemeRoot>{ui}</ThemeRoot>);
}

export * from "@testing-library/react-native";
