import React from "react";
import { View } from "react-native";
import { Mail, User, Lock, Eye, EyeOff, Sparkles } from "./_icons";
import {
  TextField,
  TextareaField,
  PasswordField,
  Select,
  Switch,
  Checkbox,
  RadioGroup,
  SegmentedControl,
  IconButton,
} from "@bizvizcards/ui-native";

export default { title: "Inputs" };

const noop = () => {};

export const TextField_WithValue = () => (
  <View className="w-80">
    <TextField
      label="Work email"
      leadingIcon={<Mail size={16} color="#64748b" />}
      value="chitra@narayan.co"
      onChangeText={noop}
    />
  </View>
);
export const TextField_Error = () => (
  <View className="w-80">
    <TextField
      label="Work email"
      leadingIcon={<Mail size={16} color="#dc2626" />}
      value="chitra@narayan"
      onChangeText={noop}
      errorText="Enter a valid email address"
    />
  </View>
);
export const TextField_Empty = () => (
  <View className="w-80">
    <TextField
      label="Full name"
      leadingIcon={<User size={16} color="#64748b" />}
      placeholder="Chitra Narayan"
      onChangeText={noop}
    />
  </View>
);

export const Textarea_WithValue = () => (
  <View className="w-80">
    <TextareaField
      label="Notes"
      value={"Met at the Bangalore trade show.\n123 MG Road, Bengaluru 560001"}
      onChangeText={noop}
    />
  </View>
);

export const Password_Default = () => (
  <View className="w-80">
    <PasswordField
      label="Password"
      leadingIcon={<Lock size={16} color="#64748b" />}
      revealIcon={<Eye size={16} color="#64748b" />}
      hideIcon={<EyeOff size={16} color="#64748b" />}
      value="sathvik@123"
      onChangeText={noop}
    />
  </View>
);
export const Password_TextFallback = () => (
  <View className="w-80">
    <PasswordField label="Password" value="sathvik@123" onChangeText={noop} />
  </View>
);

const FOLDERS = [
  { label: "All leads", value: "all" },
  { label: "Trade show 2026", value: "ts26" },
  { label: "Website enquiries", value: "web" },
];
export const Select_WithValue = () => (
  <View className="w-80">
    <Select
      label="Folder"
      options={FOLDERS}
      selectedValue="ts26"
      onValueChange={noop}
    />
  </View>
);
export const Select_Error = () => (
  <View className="w-80">
    <Select
      label="Move to folder"
      options={FOLDERS}
      placeholder="Choose a folder"
      onValueChange={noop}
      errorText="Pick a folder to continue"
    />
  </View>
);

export const Switch_List = () => (
  <View className="w-80">
    <Switch label="Show my phone number" value onValueChange={noop} />
    <Switch label="Show my email" value onValueChange={noop} />
    <Switch
      label="Allow contact download"
      description="Visitors can save your details as a vCard"
      value={false}
      onValueChange={noop}
    />
  </View>
);

export const Checkbox_Group = () => (
  <View className="w-80">
    <Checkbox label="Name" value="name" isChecked onChange={noop} />
    <Checkbox label="Email address" value="email" isChecked onChange={noop} />
    <Checkbox
      label="Phone number"
      value="phone"
      description="Only if the card has one"
      isChecked={false}
      onChange={noop}
    />
  </View>
);

export const Radio_CardTheme = () => (
  <View className="w-80">
    <RadioGroup
      label="Card theme"
      value="LIGHT"
      onChange={noop}
      options={[
        { label: "Legacy dark", value: "LEGACY" },
        { label: "Light", value: "LIGHT" },
        { label: "Navy teal", value: "NAVY_TEAL", description: "Deep teal gradient" },
      ]}
    />
  </View>
);

export const Segmented_DateRange = () => (
  <SegmentedControl
    accessibilityLabel="Date range"
    value="30"
    onChange={noop}
    options={[
      { label: "7 days", value: "7" },
      { label: "30 days", value: "30" },
      { label: "All time", value: "all" },
    ]}
  />
);
export const Segmented_Block = () => (
  <View className="w-80">
    <SegmentedControl
      block
      value="new"
      onChange={noop}
      options={[
        { label: "New", value: "new" },
        { label: "Contacted", value: "contacted" },
        { label: "Won", value: "won" },
      ]}
    />
  </View>
);

export const TextField_WithTrailing = () => (
  <View className="w-80">
    <TextField
      label="Card handle"
      value="chitra-narayan"
      onChangeText={noop}
      trailingSlot={
        <IconButton
          label="Suggest a handle"
          size="sm"
          variant="ghost"
          icon={<Sparkles size={16} color="#2D2DE0" />}
        />
      }
    />
  </View>
);
