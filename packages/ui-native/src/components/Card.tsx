import type { ReactNode } from "react";
import { View, Pressable } from "react-native";
import { cn } from "../utils/cn";

export interface CardProps {
  children: ReactNode;
  /** Renders the whole card as a pressable and adds a press affordance. */
  onPress?: () => void;
  /** Remove the inner padding (for edge-to-edge media or lists). */
  flush?: boolean;
}

/** A surface container — the default frame for grouped content on a screen. */
export function Card({ children, onPress, flush = false }: CardProps) {
  const className = cn(
    "w-full rounded-box border border-outline-100 bg-background-0",
    !flush && "p-4",
  );
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className={cn(className, "active:bg-background-50")}
      >
        {children}
      </Pressable>
    );
  }
  return <View className={className}>{children}</View>;
}
