import type { CatalystData, WorkspaceData } from "./types";

// Fictional fixtures for the explicitly labeled public design preview only.
export const sampleWorkspace: WorkspaceData = {
  asOf: "2026-10-03T23:59:59Z",
  viewer: { id: "sample-planter", display_name: "Daniel Park", role: "planter" },
  planter: { id: "sample-planter", display_name: "Daniel Park", role: "planter" },
  people: [{ id: "sample-planter", display_name: "Daniel Park", role: "planter" }, { id: "sample-catalyst", display_name: "Alex Morgan", role: "catalyst" }],
  church: { name: "Hope Community Church", city: "Vancouver, BC", vision: "A community where neighbours become friends, and friends discover the hope of Jesus." },
  categories: [
    { id: "city", title: "Engage the City", description: null, kind: "objective" },
    { id: "disciples", title: "Make Disciples", description: null, kind: "objective" },
    { id: "church", title: "Plant the Church", description: null, kind: "objective" },
    { id: "personal", title: "Personal Relationship with Jesus", description: null, kind: "objective" },
    { id: "prayer", title: "Prayer Requests", description: null, kind: "prayer" },
  ],
  objectives: [
    { id: "neighbours", planter_id: "sample-planter", category_id: "city", title: "Build deeper roots in our neighbourhood", description: "Make space for genuine relationships with the people who call this neighbourhood home.", cadence: "weekly", status: "active", created_at: "2026-09-20T12:00:00Z" },
    { id: "table", planter_id: "sample-planter", category_id: "disciples", title: "Make room around the table", description: "Start a small group where questions are welcome and people can explore faith together.", cadence: "weekly", status: "active", created_at: "2026-09-21T12:00:00Z" },
    { id: "team", planter_id: "sample-planter", category_id: "church", title: "Grow a team that serves together", description: "Help our core team discover their gifts and find meaningful ways to serve.", cadence: "monthly", status: "active", created_at: "2026-09-22T12:00:00Z" },
  ],
  activities: [
    { id: "coffee", objective_id: "neighbours", description: "Share coffee with two neighbours", cadence: "weekly", status: "active" },
    { id: "walk", objective_id: "neighbours", description: "Walk the neighbourhood and listen", cadence: "weekly", status: "active" },
    { id: "meal", objective_id: "table", description: "Host a meal and a conversation about faith", cadence: "weekly", status: "active" },
    { id: "serve", objective_id: "team", description: "Serve at the community food pantry together", cadence: "monthly", status: "active" },
  ],
  progress: [
    { id: "p1", objective_id: "neighbours", activity_id: "coffee", note: "Had coffee with two neighbours this week. One shared that they’ve been looking for a place to belong. We’re meeting again next Tuesday.", value: 2, created_at: "2026-10-02T15:30:00Z" },
    { id: "p2", objective_id: "table", activity_id: "meal", note: "Our first dinner brought six people around the table. So many thoughtful questions, and a lot of laughter.", value: 6, created_at: "2026-09-30T18:00:00Z" },
    { id: "p3", objective_id: "team", activity_id: "serve", note: "We found a Saturday that works for the core team to serve together.", value: null, created_at: "2026-09-28T12:00:00Z" },
  ],
  messages: [
    { id: "m1", objective_id: "neighbours", author_id: "sample-catalyst", body: "I love how you’re making space to listen. Those small conversations matter. How can I support you as these relationships grow?", created_at: "2026-10-02T17:00:00Z" },
    { id: "m2", objective_id: "neighbours", author_id: "sample-planter", body: "Thank you! I’d appreciate prayer for wisdom and patience. I want these friendships to grow naturally.", created_at: "2026-10-02T18:20:00Z" },
  ],
  checkIns: [{ id: "c1", planter_id: "sample-planter", feeling: "encouraged", momentum: "moving", note: "Grateful for the connections this week. Finding a rhythm between family, work, and planting is still a challenge, but we’re taking it one day at a time.", support: "Please pray for a sustainable rhythm for our family.", created_at: "2026-10-02T12:00:00Z" }],
  prayers: [
    { id: "r1", planter_id: "sample-planter", body: "For the families we’re getting to know, that they would feel seen and welcomed in our community.", visibility: "organization", resolved: false, created_at: "2026-10-02T12:00:00Z" },
    { id: "r2", planter_id: "sample-planter", body: "For wisdom as we look for a gathering space, and peace as we wait for the right opportunity.", visibility: "private", resolved: false, created_at: "2026-10-01T12:00:00Z" },
  ],
};

export const sampleCatalyst: CatalystData = {
  viewer: sampleWorkspace.people[1],
  organization: "British Columbia · Demo community",
  people: sampleWorkspace.people,
  churches: [{ pastor_id: sampleWorkspace.planter.id, name: sampleWorkspace.church!.name, city: sampleWorkspace.church!.city }],
  categories: sampleWorkspace.categories,
  objectives: sampleWorkspace.objectives,
  checkIns: sampleWorkspace.checkIns,
  prayers: sampleWorkspace.prayers,
  progress: sampleWorkspace.progress,
  messages: [...sampleWorkspace.messages].reverse(),
};
