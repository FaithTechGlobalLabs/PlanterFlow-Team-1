export type Category = { id: string; title: string; description: string | null; kind: "objective" | "prayer" };
export type Objective = { id: string; planter_id: string; category_id: string; title: string; description: string | null; cadence: "weekly" | "monthly"; status: "active" | "paused" | "done"; created_at: string };
export type Activity = { id: string; objective_id: string; description: string; cadence: "weekly" | "monthly"; status: "active" | "done" };
export type Progress = { id: string; objective_id: string; activity_id: string | null; note: string; value: number | null; created_at: string };
export type Message = { id: string; objective_id: string; author_id: string; body: string; created_at: string };
export type CheckIn = { id: string; planter_id: string; note: string; feeling: string; momentum: string; support: string; created_at: string };
export type Prayer = { id: string; planter_id: string; body: string; visibility: "private" | "organization"; resolved: boolean; created_at: string };
export type Person = { id: string; display_name: string; role: "planter" | "catalyst" };
export type WorkspaceData = {
  asOf: string;
  viewer: Person; planter: Person; people: Person[]; church: { name: string; city: string | null; vision: string | null } | null;
  categories: Category[]; objectives: Objective[]; activities: Activity[]; progress: Progress[];
  messages: Message[]; checkIns: CheckIn[]; prayers: Prayer[]; sharedPrayers?: Prayer[];
};
export type SaveResult = { ok: boolean; error?: string; id?: string };
export type CatalystData = {
  viewer: Person;
  organization: string;
  people: Person[];
  churches: { pastor_id: string; name: string; city: string | null }[];
  categories: Category[];
  objectives: Objective[];
  checkIns: CheckIn[];
  prayers: Prayer[];
  progress: Progress[];
  messages: Message[];
};
