import type { ReactNode } from "react";
import { View, Text, Pressable } from "react-native";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from "./ui/actionsheet";

export interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  /** Icon shown beside the title (dialog titles always get one). */
  titleIcon?: ReactNode;
  /** Optional supporting line under the title. */
  description?: string;
  children: ReactNode;
  /** Action row pinned to the bottom (typically one or two `Button`s). */
  footer?: ReactNode;
}

/**
 * A bottom sheet (gluestack `Actionsheet` — native drag-to-dismiss + backdrop).
 * Controlled via `isOpen`. Keep the sheet a fixed size; scroll the body, don't
 * grow the sheet to fit dynamic content.
 */
export function Sheet({
  isOpen,
  onClose,
  title,
  titleIcon,
  description,
  children,
  footer,
}: SheetProps) {
  return (
    <Actionsheet isOpen={isOpen} onClose={onClose}>
      <ActionsheetBackdrop />
      <ActionsheetContent className="rounded-t-box bg-background-0 px-4 pb-6">
        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator />
        </ActionsheetDragIndicatorWrapper>

        <View className="mt-2 w-full flex-row items-start gap-2">
          {titleIcon ? (
            <View className="mt-0.5 h-5 w-5 items-center justify-center">
              {titleIcon}
            </View>
          ) : null}
          <View className="min-w-0 flex-1">
            <Text className="text-lg font-semibold text-typography-900">
              {title}
            </Text>
            {description ? (
              <Text className="mt-0.5 text-sm text-typography-500">
                {description}
              </Text>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={onClose}
            className="h-8 w-8 items-center justify-center"
          >
            <Text className="text-typography-500">✕</Text>
          </Pressable>
        </View>

        <View className="mt-4 w-full">{children}</View>

        {footer ? (
          <View className="mt-4 w-full flex-row justify-end gap-2">{footer}</View>
        ) : null}
      </ActionsheetContent>
    </Actionsheet>
  );
}
