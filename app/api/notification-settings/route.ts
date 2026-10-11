import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const NOTIFICATION_EVENTS = [
  "ASSIGNED",
  "MENTIONED",
  "COMMENTED",
  "DUE_SOON",
  "OVERDUE",
  "SPRINT_STARTING",
  "SPRINT_ENDING",
  "TASK_MOVED",
  "TASK_UPDATED",
  "DEPENDENCY_BLOCKED",
];

const NOTIFICATION_CHANNELS = ["email", "push", "in_app"];

// GET /api/notification-settings - Get user notification settings
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await prisma.notificationSetting.findMany({
      where: { userId: session.user.id },
    });

    // Build default settings structure if empty
    const defaultSettings: Record<string, Record<string, boolean>> = {};
    for (const channel of NOTIFICATION_CHANNELS) {
      defaultSettings[channel] = {};
      for (const event of NOTIFICATION_EVENTS) {
        defaultSettings[channel][event] = true;
      }
    }

    // Override with user settings
    for (const setting of settings) {
      if (defaultSettings[setting.channel] && defaultSettings[setting.channel][setting.eventType] !== undefined) {
        defaultSettings[setting.channel][setting.eventType] = setting.enabled;
      }
    }

    return NextResponse.json({
      settings: defaultSettings,
      events: NOTIFICATION_EVENTS,
      channels: NOTIFICATION_CHANNELS,
    });
  } catch (error) {
    console.error("Error fetching notification settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification settings" },
      { status: 500 }
    );
  }
}

// POST /api/notification-settings - Update user notification settings
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { settings } = await req.json(); // { channel: { eventType: enabled } }

    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ error: "Invalid settings format" }, { status: 400 });
    }

    // Validate settings structure
    for (const channel of Object.keys(settings)) {
      if (!NOTIFICATION_CHANNELS.includes(channel)) {
        return NextResponse.json({ error: `Invalid channel: ${channel}` }, { status: 400 });
      }
      for (const eventType of Object.keys(settings[channel])) {
        if (!NOTIFICATION_EVENTS.includes(eventType)) {
          return NextResponse.json({ error: `Invalid event type: ${eventType}` }, { status: 400 });
        }
      }
    }

    // Upsert all settings
    const operations = [];
    for (const channel of NOTIFICATION_CHANNELS) {
      for (const eventType of NOTIFICATION_EVENTS) {
        const enabled = settings[channel]?.[eventType] ?? true;
        operations.push(
          prisma.notificationSetting.upsert({
            where: {
              userId_channel_eventType: {
                userId: session.user.id,
                channel,
                eventType,
              },
            },
            update: { enabled },
            create: {
              userId: session.user.id,
              channel,
              eventType,
              enabled,
            },
          })
        );
      }
    }

    await prisma.$transaction(operations);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating notification settings:", error);
    return NextResponse.json(
      { error: "Failed to update notification settings" },
      { status: 500 }
    );
  }
}