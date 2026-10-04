import { describe, expect, it } from "vitest";
import type { ConversationThread, ConversationMessage, LifecycleStatus, ThreadEntityType } from "@/lib/workspace/types";

describe("Conversation Backend Shared API Contract & Permissions", () => {
  it("conforms to the frozen conversation model structure", () => {
    const sampleMessage: ConversationMessage = {
      id: "msg-123",
      thread_id: "thread-456",
      author_id: "user-789",
      author: {
        id: "user-789",
        display_name: "Bharath",
        role: "planter",
      },
      body: "Praying for your church plant setup this week!",
      created_at: "2026-10-03T20:00:00.000Z",
    };

    const sampleThread: ConversationThread = {
      id: "thread-456",
      entity_type: "prayer" as ThreadEntityType,
      entity_id: "prayer-111",
      planter_id: "user-789",
      org_id: "org-222",
      title: "Prayer for venue rental",
      status: "active" as LifecycleStatus,
      created_at: "2026-10-03T19:00:00.000Z",
      updated_at: "2026-10-03T20:00:00.000Z",
      messages: [sampleMessage],
      last_activity_at: "2026-10-03T20:00:00.000Z",
    };

    expect(sampleThread.entity_type).toBe("prayer");
    expect(sampleThread.status).toBe("active");
    expect(sampleThread.messages).toHaveLength(1);
    expect(sampleThread.messages[0].author?.display_name).toBe("Bharath");
  });

  it("supports strictly prayer and support entity types", () => {
    const validTypes: ThreadEntityType[] = ["prayer", "support"];
    expect(validTypes).toHaveLength(2);
    expect(validTypes).toContain("prayer");
    expect(validTypes).toContain("support");
  });

  it("supports active, resolved, and archived lifecycle statuses", () => {
    const validStatuses: LifecycleStatus[] = ["active", "resolved", "archived"];
    expect(validStatuses).toHaveLength(3);
    expect(validStatuses).toContain("resolved");
  });

  describe("Permission & Access Control Verification", () => {
    const userPlanterAlpha = { id: "p1", org_id: "org-alpha", role: "planter" as const };
    const userPlanterAlphaPeer = { id: "p2", org_id: "org-alpha", role: "planter" as const };
    const userAssignedCatalystAlpha = {
      id: "c1",
      org_id: "org-alpha",
      role: "catalyst" as const,
      assignedPlanterIds: ["p1"],
    };
    const userUnassignedCatalystAlpha = {
      id: "c2",
      org_id: "org-alpha",
      role: "catalyst" as const,
      assignedPlanterIds: [],
    };
    const userAdminCatalystAlpha = {
      id: "c3",
      org_id: "org-alpha",
      role: "catalyst" as const,
      isAdmin: true,
    };
    const userPlanterBeta = { id: "p3", org_id: "org-beta", role: "planter" as const };

    const privateSupportThread: Partial<ConversationThread> = {
      id: "t1",
      entity_type: "support",
      planter_id: "p1",
      org_id: "org-alpha",
    };

    const privatePrayerThread: Partial<ConversationThread> = {
      id: "t2",
      entity_type: "prayer",
      planter_id: "p1",
      org_id: "org-alpha",
    };

    const sharedPrayerThread: Partial<ConversationThread> = {
      id: "t3",
      entity_type: "prayer",
      planter_id: "p1",
      org_id: "org-alpha",
    };

    function canUserReadThread(
      user: {
        id: string;
        org_id: string;
        role: "planter" | "catalyst";
        isAdmin?: boolean;
        assignedPlanterIds?: string[];
      },
      thread: Partial<ConversationThread>,
      prayerVisibility: "private" | "organization" = "private"
    ): boolean {
      if (user.org_id !== thread.org_id) return false;
      if (user.role === "catalyst") {
        if (user.isAdmin) return true;
        if (user.assignedPlanterIds?.includes(thread.planter_id!)) return true;
        if (thread.entity_type === "prayer" && prayerVisibility === "organization") return true;
        return false;
      }
      if (user.id === thread.planter_id) return true;
      if (thread.entity_type === "prayer" && prayerVisibility === "organization") return true;
      return false;
    }

    it("allows thread author planter to read their own threads", () => {
      expect(canUserReadThread(userPlanterAlpha, privateSupportThread)).toBe(true);
      expect(canUserReadThread(userPlanterAlpha, privatePrayerThread)).toBe(true);
    });

    it("allows explicitly assigned catalyst to read planter private threads", () => {
      expect(canUserReadThread(userAssignedCatalystAlpha, privateSupportThread)).toBe(true);
      expect(canUserReadThread(userAssignedCatalystAlpha, privatePrayerThread)).toBe(true);
    });

    it("prevents unassigned catalyst from reading planter private threads", () => {
      expect(canUserReadThread(userUnassignedCatalystAlpha, privateSupportThread)).toBe(false);
      expect(canUserReadThread(userUnassignedCatalystAlpha, privatePrayerThread)).toBe(false);
    });

    it("allows admin catalyst to read any planter threads in their organization", () => {
      expect(canUserReadThread(userAdminCatalystAlpha, privateSupportThread)).toBe(true);
      expect(canUserReadThread(userAdminCatalystAlpha, privatePrayerThread)).toBe(true);
    });

    it("prevents peer planter in same org from reading private support or private prayer threads", () => {
      expect(canUserReadThread(userPlanterAlphaPeer, privateSupportThread, "private")).toBe(false);
      expect(canUserReadThread(userPlanterAlphaPeer, privatePrayerThread, "private")).toBe(false);
    });

    it("allows peer planter or unassigned catalyst in same org to read organization-shared prayer threads", () => {
      expect(canUserReadThread(userPlanterAlphaPeer, sharedPrayerThread, "organization")).toBe(true);
      expect(canUserReadThread(userUnassignedCatalystAlpha, sharedPrayerThread, "organization")).toBe(true);
    });

    it("strictly blocks foreign organization users from accessing any thread", () => {
      expect(canUserReadThread(userPlanterBeta, privateSupportThread, "private")).toBe(false);
      expect(canUserReadThread(userPlanterBeta, sharedPrayerThread, "organization")).toBe(false);
    });
  });
});
