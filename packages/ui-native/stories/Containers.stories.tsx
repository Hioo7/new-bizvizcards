import React from "react";
import { View, Text } from "react-native";
import { Mail, Phone, Trash2, ScanLine, LogOut } from "./_icons";
import {
  Card,
  ListRow,
  Sheet,
  Avatar,
  Badge,
  IconButton,
  Button,
  TextField,
  TextareaField,
} from "@bizvizcards/ui-native";

export default { title: "Containers" };
const noop = () => {};

export const Card_Basic = () => (
  <View className="w-80">
    <Card>
      <Text className="text-sm font-semibold text-typography-900">Team plan</Text>
      <Text className="mt-1 text-sm text-typography-500">
        Unlimited cards, shared lead folders, and analytics for up to 10 seats.
      </Text>
    </Card>
  </View>
);

export const Card_Tappable = () => (
  <View className="w-80">
    <Card onPress={noop}>
      <View className="flex-row items-center gap-3">
        <Avatar name="Chitra Narayan" />
        <View className="min-w-0 flex-1">
          <Text className="text-sm font-semibold text-typography-900">
            Chitra Narayan
          </Text>
          <Text className="text-xs text-typography-500">Narayan &amp; Co.</Text>
        </View>
        <Badge tone="success" size="sm">
          New
        </Badge>
      </View>
    </Card>
  </View>
);

export const ListRow_InAList = () => (
  <View className="w-80">
    <Card flush>
      <View className="px-3">
        <ListRow
          leading={<Avatar name="Chitra Narayan" />}
          title="Chitra Narayan"
          subtitle="Narayan & Co."
          showChevron
          onPress={noop}
        />
        <ListRow
          leading={<Avatar name="Sathvik Rao" />}
          title="Sathvik Rao"
          subtitle="Trade show 2026"
          showChevron
          onPress={noop}
        />
        <ListRow
          leading={<Mail size={20} color="#64748b" />}
          title="Email"
          subtitle="chitra@narayan.co"
          trailing={<Badge tone="success" size="sm">Verified</Badge>}
        />
        <ListRow
          leading={<Phone size={20} color="#64748b" />}
          title="+91 98450 12345"
          subtitle="Mobile"
          trailing={
            <IconButton
              label="Remove number"
              size="sm"
              variant="ghost"
              icon={<Trash2 size={16} color="#dc2626" />}
            />
          }
        />
      </View>
    </Card>
  </View>
);

export const Sheet_ReviewScannedLead = () => (
  <View className="h-[560px] w-[340px] overflow-hidden rounded-box bg-background-50">
    <Sheet
      isOpen
      onClose={noop}
      title="Review scanned lead"
      titleIcon={<ScanLine size={20} color="#2D2DE0" />}
      description="Check the details we read from the card"
      footer={
        <>
          <Button variant="ghost" onPress={noop}>
            Discard
          </Button>
          <Button variant="primary" onPress={noop}>
            Save lead
          </Button>
        </>
      }
    >
      <View className="gap-3">
        <TextField label="Full name" value="Chitra Narayan" onChangeText={noop} />
        <TextField label="Work email" value="chitra@narayan.co" onChangeText={noop} />
        <TextareaField
          label="Notes"
          value="123 MG Road, Bengaluru 560001"
          onChangeText={noop}
          numberOfLines={2}
        />
      </View>
    </Sheet>
  </View>
);

export const Sheet_Confirm = () => (
  <View className="h-[420px] w-[340px] overflow-hidden rounded-box bg-background-50">
    <Sheet
      isOpen
      onClose={noop}
      title="Log out?"
      titleIcon={<LogOut size={20} color="#2D2DE0" />}
      description="You'll need to sign in again to manage your cards."
      footer={
        <>
          <Button variant="ghost" onPress={noop}>
            Cancel
          </Button>
          <Button variant="error" onPress={noop}>
            Log out
          </Button>
        </>
      }
    >
      <Text className="text-sm text-typography-500">
        Any unsaved changes on this device will be lost.
      </Text>
    </Sheet>
  </View>
);
