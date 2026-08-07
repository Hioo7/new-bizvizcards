export interface VirtualBackgroundPlatformInstructions {
  id: "google-meet" | "zoom" | "teams";
  name: string;
  steps: string[];
}

export const VIRTUAL_BACKGROUND_PLATFORM_INSTRUCTIONS: VirtualBackgroundPlatformInstructions[] =
  [
    {
      id: "google-meet",
      name: "Google Meet",
      steps: [
        "Join or start a meeting.",
        'Click the three-dot "More options" menu, then "Apply visual effects".',
        'Select "Add" under Backgrounds and choose the image you downloaded.',
        "Your virtual background is applied for the rest of the call.",
      ],
    },
    {
      id: "zoom",
      name: "Zoom",
      steps: [
        "Open Zoom Settings and go to \"Background & Filters\".",
        'Click the "+" icon under Virtual Backgrounds and select "Add Image".',
        "Choose the image you downloaded, then select it to apply.",
        "You can also switch backgrounds mid-meeting from the same menu.",
      ],
    },
    {
      id: "teams",
      name: "Microsoft Teams",
      steps: [
        'Before or during a call, open "Background filters".',
        'Click "Add new" and select the image you downloaded.',
        "Select the uploaded image as your background and apply.",
      ],
    },
  ];
