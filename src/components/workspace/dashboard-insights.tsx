"use client";
import type { Objective, WorkspaceData } from "@/lib/workspace/types";
import { summarizeProgress } from "@/lib/workspace/progress-summary";

export function DashboardInsights({ data, openObjective, openSupport }: {
  data: WorkspaceData;
  openObjective: (objective: Objective) => void;
  openSupport: () => void;
}) {
  const weeks = summarizeProgress(data.progress, data.asOf);
  const max = Math.max(1, ...weeks.map(week => week.count));
  const completed = data.objectives.filter(objective => objective.status === "done").length;
  const latestSupport = data.checkIns.find(checkIn => checkIn.support.trim());
  const latestReplies = data.messages.filter(message => message.author_id !== data.planter.id).slice(-3).reverse();
  return <div className="ff-insights-grid">
    <section className="ff-panel">
      <div className="ff-section-heading"><div><p className="ff-eyebrow">THE STEPS ADD UP</p><h2>Your progress rhythm</h2></div><span className="ff-status">Last 4 weeks</span></div>
      <p className="ff-muted">A record of the updates you’ve shared. Every journey has its own pace.</p>
      <div className="ff-progress-chart" role="img" aria-label={weeks.map(week => `Week of ${week.label}: ${week.count} progress updates`).join(". ")}>
        {weeks.map(week => <div className="ff-chart-column" key={week.start}><strong>{week.count}</strong><div className="ff-chart-track"><span style={{ height: `${Math.max(3, week.count / max * 100)}%` }} className={week.count ? "has-progress" : ""}/></div><small>{week.label}</small></div>)}
      </div>
      <p className="ff-chart-caption">{completed} completed objectives · {data.objectives.filter(objective => objective.status === "active").length} in progress</p>
    </section>
    <section className="ff-panel">
      <div className="ff-section-heading"><div><p className="ff-eyebrow">YOU’RE NOT WALKING ALONE</p><h2>From your Catalyst</h2></div></div>
      {latestReplies.length ? latestReplies.map(message => {
        const objective = data.objectives.find(item => item.id === message.objective_id);
        if (!objective) return null;
        return <button key={message.id} className="ff-reply-preview" onClick={() => openObjective(objective)}><small>{objective.title}</small><p>{message.body}</p><span>Continue conversation →</span></button>;
      }) : <p className="ff-empty">Encouragement and replies from your Catalyst will appear here. You can start a conversation under any objective.</p>}
      <button className="ff-support-preview" onClick={openSupport}><strong>{latestSupport ? "A need you’ve shared" : "There’s room for your needs"}</strong><p>{latestSupport?.support || "Ask for prayer, share a challenge, or let your Catalyst know how they can help."}</p><span>Open prayer & support →</span></button>
    </section>
  </div>;
}
