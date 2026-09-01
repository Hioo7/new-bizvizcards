import "@bizvizcards/ui-native/global.css";
import React from "react";
import { ScrollView, Text, View, SafeAreaView } from "react-native";
import {
  Mail,
  User,
  Lock,
  Eye,
  EyeOff,
  Plus,
  ScanLine,
  Trash2,
  Check,
  Phone,
  Inbox,
  CircleAlert,
  CircleCheck,
  Info,
  House,
  Contact,
  ChartNoAxesColumn,
  ShoppingBag,
  LayoutGrid,
  Eye as EyeIcon,
  Users,
  QrCode,
} from "../stories/_icons";
import {
  ThemeRoot,
  Button,
  IconButton,
  TextField,
  TextareaField,
  PasswordField,
  Select,
  Switch,
  Checkbox,
  RadioGroup,
  SegmentedControl,
  Card,
  ListRow,
  Sheet,
  BottomNav,
  Tabs,
  Badge,
  Avatar,
  StatCard,
  Chip,
  EmptyState,
  Toast,
  Spinner,
} from "@bizvizcards/ui-native";

const noop = () => {};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-3 border-b border-outline-100 px-5 py-6">
      <Text className="text-xs font-semibold uppercase tracking-wide text-typography-500">
        {title}
      </Text>
      {children}
    </View>
  );
}

export default function App() {
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [seg, setSeg] = React.useState("30");
  const [tab, setTab] = React.useState("overview");
  const [nav, setNav] = React.useState("leads");
  const [sw, setSw] = React.useState(true);

  return (
    <ThemeRoot>
      <SafeAreaView className="flex-1 bg-background-50">
        <ScrollView contentContainerClassName="pb-24">
          <Text className="px-5 pt-6 text-2xl font-bold text-typography-900">
            BizViz UI Native
          </Text>

          <Section title="Actions">
            <View className="flex-row flex-wrap gap-2">
              <Button variant="primary">Save</Button>
              <Button variant="secondary">Preview</Button>
              <Button variant="outline">Edit</Button>
              <Button variant="ghost">Cancel</Button>
              <Button variant="error" leadingIcon={<Trash2 size={16} color="#fff" />}>
                Delete
              </Button>
            </View>
            <Button block leadingIcon={<ScanLine size={16} color="#fff" />}>
              Scan a business card
            </Button>
            <View className="flex-row items-center gap-2">
              <Button isLoading>Saving</Button>
              <IconButton
                label="Scan"
                variant="primary"
                icon={<ScanLine size={20} color="#fff" />}
              />
              <IconButton
                label="Add"
                variant="outline"
                icon={<Plus size={20} color="#2D2DE0" />}
              />
            </View>
          </Section>

          <Section title="Inputs">
            <TextField
              label="Work email"
              leadingIcon={<Mail size={16} color="#64748b" />}
              value="chitra@narayan.co"
              onChangeText={noop}
            />
            <TextField
              label="Full name"
              leadingIcon={<User size={16} color="#dc2626" />}
              value="Chitra"
              onChangeText={noop}
              errorText="Enter your full name"
            />
            <PasswordField
              label="Password"
              leadingIcon={<Lock size={16} color="#64748b" />}
              revealIcon={<Eye size={16} color="#64748b" />}
              hideIcon={<EyeOff size={16} color="#64748b" />}
              value="sathvik@123"
              onChangeText={noop}
            />
            <TextareaField
              label="Notes"
              value={"Met at the Bangalore trade show.\n123 MG Road, Bengaluru"}
              onChangeText={noop}
            />
            <Select
              label="Folder"
              options={[
                { label: "All leads", value: "all" },
                { label: "Trade show 2026", value: "ts26" },
              ]}
              selectedValue="ts26"
              onValueChange={noop}
            />
            <SegmentedControl
              block
              value={seg}
              onChange={setSeg}
              options={[
                { label: "7 days", value: "7" },
                { label: "30 days", value: "30" },
                { label: "All time", value: "all" },
              ]}
            />
            <Switch
              label="Public profile"
              description="Anyone with the link can view your card"
              value={sw}
              onValueChange={setSw}
            />
            <Checkbox
              label="I agree to the terms"
              value="tos"
              isChecked
              onChange={noop}
            />
            <RadioGroup
              label="Card theme"
              value="LIGHT"
              onChange={noop}
              options={[
                { label: "Legacy dark", value: "LEGACY" },
                { label: "Light", value: "LIGHT" },
                { label: "Navy teal", value: "NAVY_TEAL" },
              ]}
            />
          </Section>

          <Section title="Containers">
            <Card>
              <Text className="text-sm font-semibold text-typography-900">Team plan</Text>
              <Text className="mt-1 text-sm text-typography-500">
                Unlimited cards, shared lead folders, analytics for 10 seats.
              </Text>
            </Card>
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
                  leading={<Phone size={20} color="#64748b" />}
                  title="+91 98450 12345"
                  subtitle="Mobile"
                  trailing={
                    <IconButton
                      label="Remove"
                      size="sm"
                      variant="ghost"
                      icon={<Trash2 size={16} color="#dc2626" />}
                    />
                  }
                />
              </View>
            </Card>
            <Button onPress={() => setSheetOpen(true)}>Open a bottom sheet</Button>
          </Section>

          <Section title="Navigation">
            <Tabs
              block
              activeKey={tab}
              onSelect={setTab}
              items={[
                { key: "overview", label: "Overview" },
                { key: "activity", label: "Activity" },
                { key: "settings", label: "Settings" },
              ]}
            />
            <View className="overflow-hidden rounded-box border border-outline-100">
              <BottomNav
                activeKey={nav}
                onSelect={setNav}
                items={[
                  { key: "home", label: "Home", icon: <House size={24} color="#2D2DE0" /> },
                  { key: "leads", label: "Leads", icon: <Contact size={24} color="#2D2DE0" /> },
                  {
                    key: "analytics",
                    label: "Analytics",
                    icon: <ChartNoAxesColumn size={24} color="#2D2DE0" />,
                  },
                  { key: "cart", label: "Cart", icon: <ShoppingBag size={24} color="#2D2DE0" /> },
                  { key: "apps", label: "Apps", icon: <LayoutGrid size={24} color="#2D2DE0" /> },
                ]}
              />
            </View>
          </Section>

          <Section title="Feedback">
            <View className="flex-row flex-wrap gap-2">
              <Badge tone="neutral">Draft</Badge>
              <Badge tone="primary">Team plan</Badge>
              <Badge tone="success">Published</Badge>
              <Badge tone="warning">Payment due</Badge>
              <Badge tone="error">Suspended</Badge>
              <Badge tone="success" outline icon={<Check size={12} color="#16a34a" />}>
                Card Scanner
              </Badge>
            </View>
            <Toast action="success" icon={<CircleCheck size={18} color="#fff" />} onDismiss={noop}>
              Lead saved to “Trade show 2026”
            </Toast>
            <Toast action="error" icon={<CircleAlert size={18} color="#fff" />}>
              Too many scans — wait a few seconds
            </Toast>
            <View className="flex-row items-center gap-6">
              <Spinner size="sm" />
              <Spinner size="md" />
              <Spinner size="lg" label="Reading card…" showLabel />
            </View>
            <EmptyState
              icon={<Inbox size={24} color="#94a3b8" />}
              title="No leads yet"
              description="Scan a business card or add one by hand."
              action={
                <Button leadingIcon={<Plus size={16} color="#fff" />} onPress={noop}>
                  Add lead
                </Button>
              }
            />
          </Section>

          <Section title="Data display">
            <View className="flex-row items-center gap-3">
              <Avatar name="Chitra Narayan" size="sm" />
              <Avatar name="Chitra Narayan" size="md" />
              <Avatar name="Priya" size="lg" />
            </View>
            <View className="flex-row flex-wrap gap-3">
              <View className="w-44">
                <StatCard
                  label="Card views"
                  value={1284}
                  icon={<EyeIcon size={20} color="#2D2DE0" />}
                  trend="up"
                  trendLabel="+12%"
                />
              </View>
              <View className="w-44">
                <StatCard
                  label="QR scans"
                  value={318}
                  icon={<QrCode size={20} color="#2D2DE0" />}
                />
              </View>
            </View>
            <View className="flex-row flex-wrap gap-2">
              <Chip label="All" selected onPress={noop} />
              <Chip label="New" onPress={noop} />
              <Chip label="Trade show 2026" selected onRemove={noop} />
            </View>
          </Section>
        </ScrollView>

        <Sheet
          isOpen={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title="Review scanned lead"
          titleIcon={<ScanLine size={20} color="#2D2DE0" />}
          description="Check the details we read from the card"
          footer={
            <>
              <Button variant="ghost" onPress={() => setSheetOpen(false)}>
                Discard
              </Button>
              <Button onPress={() => setSheetOpen(false)}>Save lead</Button>
            </>
          }
        >
          <View className="gap-3">
            <TextField label="Full name" value="Chitra Narayan" onChangeText={noop} />
            <TextField label="Work email" value="chitra@narayan.co" onChangeText={noop} />
          </View>
        </Sheet>
      </SafeAreaView>
    </ThemeRoot>
  );
}
