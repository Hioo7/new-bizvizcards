import { Button } from "./Button";
import { renderWithTheme, screen, fireEvent } from "../test-utils";

// jest is deferred (Expo SDK 57 / RN 0.86 jest-preset skew — see NOTES.md).
// These run once that's resolved; until then `npm run typecheck` is the gate.

test("renders its label", () => {
  renderWithTheme(<Button>Add lead</Button>);
  expect(screen.getByText("Add lead")).toBeOnTheScreen();
});

test("fires onPress", () => {
  const onPress = jest.fn();
  renderWithTheme(<Button onPress={onPress}>Save</Button>);
  fireEvent.press(screen.getByText("Save"));
  expect(onPress).toHaveBeenCalledTimes(1);
});

test("does not fire onPress while loading", () => {
  const onPress = jest.fn();
  renderWithTheme(
    <Button onPress={onPress} isLoading>
      Saving
    </Button>,
  );
  fireEvent.press(screen.getByText("Saving"));
  expect(onPress).not.toHaveBeenCalled();
});
