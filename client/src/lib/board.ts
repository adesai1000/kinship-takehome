export const pipelineStages = [
  {
    id: "lead",
    label: "Lead",
    description: "Initial customer record captured",
    tone: "bg-muted",
    accent: "bg-stone-500",
  },
  {
    id: "contacted",
    label: "Contacted",
    description: "Outreach sent and follow-up started",
    tone: "bg-muted",
    accent: "bg-sky-500",
  },
  {
    id: "qualified",
    label: "Qualified",
    description: "Team confirmed a strong fit",
    tone: "bg-muted",
    accent: "bg-amber-500",
  },
  {
    id: "trial_demo",
    label: "Trial / Demo",
    description: "Product experience is underway",
    tone: "bg-muted",
    accent: "bg-emerald-500",
  },
  {
    id: "closed",
    label: "Closed",
    description: "Outcome recorded as won or lost",
    tone: "bg-muted",
    accent: "bg-rose-500",
  },
] as const;

export type PipelineStage = (typeof pipelineStages)[number]["id"];

export type Customer = {
  id: string;
  name: string;
  email: string;
  company: string;
  stage: PipelineStage;
  notes: string;
  createdAt: string;
  updatedAt: string;
  stageChangedAt: string;
};

export type CustomerDraft = Pick<
  Customer,
  "name" | "email" | "company" | "stage" | "notes"
>;

export const stageLabelMap = Object.fromEntries(
  pipelineStages.map((stage) => [stage.id, stage.label]),
) as Record<PipelineStage, string>;

const now = new Date();

export const sampleCustomers: Customer[] = [
  {
    id: "cust-nimbus",
    name: "Maya Chen",
    email: "maya@nimbusbio.com",
    company: "Nimbus Bio",
    stage: "lead",
    notes: "Inbound website signup from the pricing page.",
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 36).toISOString(),
    updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 12).toISOString(),
    stageChangedAt: new Date(now.getTime() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: "cust-acorn",
    name: "Daniel Ruiz",
    email: "daniel@acornlogistics.co",
    company: "Acorn Logistics",
    stage: "contacted",
    notes: "Initial outreach sent after referral from operations advisor.",
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 52).toISOString(),
    updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 6).toISOString(),
    stageChangedAt: new Date(now.getTime() - 1000 * 60 * 60 * 6).toISOString(),
  },
  {
    id: "cust-spruce",
    name: "Priya Nair",
    email: "priya@sprucehealth.io",
    company: "Spruce Health",
    stage: "qualified",
    notes: "Good fit on team size, timeline, and implementation budget.",
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 72).toISOString(),
    updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 5).toISOString(),
    stageChangedAt: new Date(now.getTime() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: "cust-lattice",
    name: "Evan Brooks",
    email: "evan@latticeworks.ai",
    company: "Lattice Works",
    stage: "trial_demo",
    notes: "Demo scheduled with RevOps and product leadership this week.",
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 96).toISOString(),
    updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString(),
    stageChangedAt: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "cust-evergreen",
    name: "Sofia Patel",
    email: "sofia@evergreenlegal.com",
    company: "Evergreen Legal",
    stage: "closed",
    notes: "Pilot completed and account marked won pending kickoff.",
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 120).toISOString(),
    updatedAt: new Date(now.getTime() - 1000 * 60 * 90).toISOString(),
    stageChangedAt: new Date(now.getTime() - 1000 * 60 * 90).toISOString(),
  },
];

export function createCustomer(draft: CustomerDraft): Customer {
  const timestamp = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    name: draft.name.trim(),
    email: draft.email.trim().toLowerCase(),
    company: draft.company.trim(),
    stage: draft.stage,
    notes: draft.notes.trim(),
    createdAt: timestamp,
    updatedAt: timestamp,
    stageChangedAt: timestamp,
  };
}
