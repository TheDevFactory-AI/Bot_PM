export interface CustomerRecord {
  id: string;
  companyName: string;
  persona?: string;
  stage?: string;
  pains: string[];
}

export interface ConversationRecord {
  id: string;
  customerId?: string;
  summary: string;
  pains: string[];
  objections: string[];
  featureRequests: string[];
  nextSteps: string[];
  sourceUrl?: string;
}

export interface WorkItemRecord {
  id: string;
  title: string;
  status: string;
  owner?: string;
  linkedCustomers: string[];
  linkedConversationIds: string[];
  linkedCommitShas: string[];
}

export interface CommitRecord {
  sha: string;
  author: string;
  linkedWorkItems: string[];
}

export interface ReadinessGateRecord {
  id: string;
  name: string;
  status: "healthy" | "at-risk" | "blocked";
  blockers: string[];
}

export interface DailyBriefSection {
  title: string;
  items: string[];
}

export interface DailyBrief {
  generatedAt: string;
  sections: DailyBriefSection[];
}
