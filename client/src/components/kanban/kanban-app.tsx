"use client";

import {
  type Dispatch,
  type SetStateAction,
  useDeferredValue,
  useEffect,
  useState,
  useTransition,
} from "react";
import {
  DndContext,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  Building2,
  CirclePlus,
  GripVertical,
  LoaderCircle,
  Mail,
  MoveRight,
  Pencil,
  Search,
  Trash2,
  Users,
} from "lucide-react";

import {
  createCustomer,
  pipelineStages,
  stageLabelMap,
  type Customer,
  type CustomerDraft,
  type PipelineStage,
} from "@/lib/board";
import { apiClient, setApiToken } from "@/lib/api-client";
import { getLocalCustomers, setLocalCustomers } from "@/lib/local-store";
import { getSupabaseClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type PersistenceMode = "local" | "api";

type SessionState = {
  mode: PersistenceMode;
  userId: string;
};

type CustomerDialogState = CustomerDraft & {
  open: boolean;
  customerId: string | null;
};

const initialDialogState: CustomerDialogState = {
  open: false,
  customerId: null,
  name: "",
  email: "",
  company: "",
  stage: "lead",
  notes: "",
};

export function KanbanApp() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [session, setSession] = useState<SessionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<PipelineStage | "all">("all");
  const [draft, setDraft] = useState<CustomerDialogState>(initialDialogState);
  const [isPending, startTransition] = useTransition();

  const deferredSearch = useDeferredValue(search);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    let isMounted = true;

    async function initializeBoard() {
      const supabase = getSupabaseClient();

      if (!supabase) {
        if (!isMounted) {
          return;
        }

        setSession({ mode: "local", userId: "local-demo-user" });
        setCustomers(getLocalCustomers());
        setLoading(false);
        return;
      }

      try {
        let sessionResponse = await supabase.auth.getSession();

        if (!sessionResponse.data.session) {
          const anonymous = await supabase.auth.signInAnonymously();

          if (anonymous.error) {
            throw anonymous.error;
          }

          sessionResponse = await supabase.auth.getSession();
        }

        const userId = sessionResponse.data.session?.user.id;

        if (!userId) {
          throw new Error("Could not establish an anonymous session.");
        }

        // set the token before any API calls go out
        setApiToken(sessionResponse.data.session!.access_token);

        const rows = await apiClient.customers.list();

        if (!isMounted) {
          return;
        }

        setSession({ mode: "api", userId });
        setCustomers(
          rows.map((row) => ({
            id: row.id,
            name: row.name,
            email: row.email,
            company: row.company,
            stage: row.stage,
            notes: row.notes ?? "",
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            stageChangedAt: row.stage_changed_at,
          })),
        );
      } catch (initError) {
        if (!isMounted) {
          return;
        }

        setSession({ mode: "local", userId: "local-demo-user" });
        setCustomers(getLocalCustomers());
        setError(
          initError instanceof Error
            ? `${initError.message} Falling back to local demo mode until Supabase is configured.`
            : "Falling back to local demo mode until Supabase is configured.",
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void initializeBoard();

    return () => {
      isMounted = false;
    };
  }, []);

  function handleSaveCustomer() {
    if (!draft.name.trim() || !draft.email.trim() || !draft.company.trim() || !session) {
      return;
    }

    const now = new Date().toISOString();

    if (draft.customerId) {
      // optimistic update, sync in background
      const previousCustomers = customers;
      const existing = customers.find((c) => c.id === draft.customerId);
      const nextCustomers = customers.map((customer) =>
        customer.id === draft.customerId
          ? {
              ...customer,
              name: draft.name.trim(),
              email: draft.email.trim().toLowerCase(),
              company: draft.company.trim(),
              stage: draft.stage,
              notes: draft.notes.trim(),
              updatedAt: now,
              stageChangedAt: existing?.stage !== draft.stage ? now : customer.stageChangedAt,
            }
          : customer,
      );

      startTransition(() => {
        setCustomers(nextCustomers);
        setDraft(initialDialogState);
      });

      if (session.mode === "local") {
        setLocalCustomers(nextCustomers);
        return;
      }

      void apiClient.customers
        .update(draft.customerId, {
          name: draft.name.trim(),
          email: draft.email.trim().toLowerCase(),
          company: draft.company.trim(),
          stage: draft.stage,
          notes: draft.notes.trim(),
        })
        .catch((err) => {
          setCustomers(previousCustomers);
          setError(err instanceof Error ? err.message : "We couldn't save that customer.");
        });
    } else {
      // generate client-side so the card appears instantly, client UUID matches server
      const newCustomer = createCustomer(draft);
      const previousCustomers = customers;
      const nextCustomers = [newCustomer, ...customers];

      startTransition(() => {
        setCustomers(nextCustomers);
        setDraft(initialDialogState);
      });

      if (session.mode === "local") {
        setLocalCustomers(nextCustomers);
        return;
      }

      void apiClient.customers
        .create({
          id: newCustomer.id,
          name: newCustomer.name,
          email: newCustomer.email,
          company: newCustomer.company,
          stage: newCustomer.stage,
          notes: newCustomer.notes || undefined,
        })
        .catch((err) => {
          setCustomers(previousCustomers);
          setError(err instanceof Error ? err.message : "We couldn't create that customer.");
        });
    }
  }

  function handleDeleteCustomer(customerId: string) {
    const previousCustomers = customers;
    const nextCustomers = customers.filter((customer) => customer.id !== customerId);

    startTransition(() => {
      setCustomers(nextCustomers);
    });

    if (session?.mode === "local") {
      setLocalCustomers(nextCustomers);
      return;
    }

    void apiClient.customers.delete(customerId).catch((err) => {
      setCustomers(previousCustomers);
      setError(err instanceof Error ? err.message : "We couldn't delete that customer.");
    });
  }

  function openCustomerEditor(customer: Customer) {
    setDraft({
      open: true,
      customerId: customer.id,
      name: customer.name,
      email: customer.email,
      company: customer.company,
      stage: customer.stage,
      notes: customer.notes,
    });
  }

  function updateCustomerStage(customerId: string, stage: PipelineStage) {
    const previousCustomers = customers;
    const now = new Date().toISOString();
    const nextCustomers = customers.map((customer) =>
      customer.id === customerId && customer.stage !== stage
        ? {
            ...customer,
            stage,
            updatedAt: now,
            stageChangedAt: now,
          }
        : customer,
    );

    startTransition(() => {
      setCustomers(nextCustomers);
    });

    if (session?.mode === "local") {
      setLocalCustomers(nextCustomers);
      return;
    }

    void apiClient.customers.moveStage(customerId, stage).catch((err) => {
      setCustomers(previousCustomers);
      setError(err instanceof Error ? err.message : "We couldn't update that customer.");
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const customerId = String(event.active.id);
    const nextStage = event.over?.data.current?.stage as PipelineStage | undefined;

    if (!nextStage) {
      return;
    }

    updateCustomerStage(customerId, nextStage);
  }

  const normalizedQuery = deferredSearch.trim().toLowerCase();
  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      !normalizedQuery ||
      customer.name.toLowerCase().includes(normalizedQuery) ||
      customer.company.toLowerCase().includes(normalizedQuery) ||
      customer.email.toLowerCase().includes(normalizedQuery);

    const matchesStage =
      stageFilter === "all" || customer.stage === stageFilter;

    return matchesSearch && matchesStage;
  });

  const activePipelineCount = customers.filter((customer) => customer.stage !== "closed").length;

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-4">
        <section className="rounded-2xl border bg-background p-5 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="gap-1.5 rounded-md">
                  Customer Pipeline Tracker
                </Badge>
                <Badge variant="outline" className="rounded-md">
                  Fullstack path
                </Badge>
                <Badge variant="outline" className="rounded-md">
                  {session?.mode === "api" ? "API live" : "Local fallback"}
                </Badge>
              </div>

              <div className="space-y-2">
                <h1 className="font-heading text-4xl tracking-tight text-foreground sm:text-5xl">
                  Customer pipeline tracker for the take-home assessment.
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Customers are grouped by pipeline stage, searchable by name, company, or email,
                  and persisted through Supabase when it is configured.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[540px]">
              <MiniStat label="Total customers" value={String(customers.length)} />
              <MiniStat label="Open pipeline" value={String(activePipelineCount)} />
              <MiniStat label="Closed" value={String(customers.length - activePipelineCount)} />
            </div>
          </div>

          <div className="mt-6 grid gap-3 border-t pt-5 lg:grid-cols-[minmax(0,1fr)_220px_auto]">
            <div className="flex min-w-0 items-center gap-2 rounded-md border bg-transparent px-4">
              <Search className="size-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by customer, company, or email"
                className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              />
            </div>

            <Select
              value={stageFilter}
              onValueChange={(value) => setStageFilter(value as PipelineStage | "all")}
            >
              <SelectTrigger className="h-11 rounded-md">
                <SelectValue placeholder="Filter by stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stages</SelectItem>
                {pipelineStages.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <CustomerDialog
              draft={draft}
              isPending={isPending}
              onDraftChange={setDraft}
              onSave={handleSaveCustomer}
            />
          </div>
        </section>

        {error ? (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <p>{error}</p>
          </div>
        ) : null}

        <section className="rounded-2xl border bg-background p-3 shadow-sm">
          {loading ? (
            <div className="flex min-h-[280px] items-center justify-center text-sm text-muted-foreground">
              Loading customer pipeline...
            </div>
          ) : (
            <ScrollArea className="w-full">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragEnd={handleDragEnd}
              >
                <div className="flex min-w-max items-start gap-3 pb-3">
                  {pipelineStages.filter((stage) => stageFilter === "all" || stage.id === stageFilter).map((stage) => (
                    <BoardColumn
                      key={stage.id}
                      stage={stage.id}
                      customers={filteredCustomers.filter((customer) => customer.stage === stage.id)}
                      onEditCustomer={openCustomerEditor}
                      onDeleteCustomer={handleDeleteCustomer}
                    />
                  ))}
                </div>
              </DndContext>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}
        </section>
      </div>
    </main>
  );
}

function CustomerDialog({
  draft,
  isPending,
  onDraftChange,
  onSave,
}: {
  draft: CustomerDialogState;
  isPending: boolean;
  onDraftChange: Dispatch<SetStateAction<CustomerDialogState>>;
  onSave: () => void;
}) {
  return (
    <Dialog
      open={draft.open}
      onOpenChange={(open) =>
        onDraftChange((current) => ({
          ...(open ? current : initialDialogState),
          open,
        }))
      }
    >
      <DialogTrigger render={<Button className="h-11 rounded-2xl px-5" />}>
        <CirclePlus className="size-4" />
        Add customer
      </DialogTrigger>
      <DialogContent className="sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle>{draft.customerId ? "Edit customer" : "Add a customer"}</DialogTitle>
          <DialogDescription>
            Capture the required customer fields and keep the current pipeline stage editable.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="customer-name">Name</Label>
              <Input
                id="customer-name"
                value={draft.name}
                placeholder="Avery Morgan"
                onChange={(event) =>
                  onDraftChange((current) => ({ ...current, name: event.target.value }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="customer-email">Email</Label>
              <Input
                id="customer-email"
                type="email"
                value={draft.email}
                placeholder="avery@northwind.com"
                onChange={(event) =>
                  onDraftChange((current) => ({ ...current, email: event.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="customer-company">Company</Label>
              <Input
                id="customer-company"
                value={draft.company}
                placeholder="Northwind"
                onChange={(event) =>
                  onDraftChange((current) => ({ ...current, company: event.target.value }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label>Stage</Label>
              <Select
                value={draft.stage}
                onValueChange={(value) =>
                  onDraftChange((current) => ({
                    ...current,
                    stage: value as PipelineStage,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pipelineStages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="customer-notes">Notes</Label>
            <Textarea
              id="customer-notes"
              rows={4}
              value={draft.notes}
              placeholder="Optional context for outreach, qualification, or the demo."
              onChange={(event) =>
                onDraftChange((current) => ({ ...current, notes: event.target.value }))
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onDraftChange(initialDialogState)}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={
              isPending ||
              !draft.name.trim() ||
              !draft.email.trim() ||
              !draft.company.trim()
            }
            className="rounded-xl"
          >
            {isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {draft.customerId ? "Save changes" : "Create customer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BoardColumn({
  stage,
  customers,
  onEditCustomer,
  onDeleteCustomer,
}: {
  stage: PipelineStage;
  customers: Customer[];
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customerId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
    data: { stage },
  });

  const stageMeta = pipelineStages.find((entry) => entry.id === stage);

  if (!stageMeta) {
    return null;
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "w-[320px] shrink-0 rounded-2xl border bg-muted/40 p-3 transition",
        isOver && "border-primary/40 bg-muted",
      )}
    >
      <div className={cn("rounded-xl border p-4", stageMeta.tone)}>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={cn("size-2.5 rounded-full", stageMeta.accent)} />
              <h2 className="text-base font-semibold text-foreground">{stageMeta.label}</h2>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">{stageMeta.description}</p>
          </div>
          <Badge variant="secondary" className="rounded-full bg-background/80">
            {customers.length}
          </Badge>
        </div>
      </div>

      <div className="mt-3 space-y-3">
        {customers.length ? (
          customers.map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              onEdit={() => onEditCustomer(customer)}
              onDelete={() => onDeleteCustomer(customer.id)}
            />
          ))
        ) : (
          <div className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            Drop a customer here.
          </div>
        )}
      </div>
    </div>
  );
}

function CustomerCard({
  customer,
  onEdit,
  onDelete,
}: {
  customer: Customer;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: customer.id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-xl shadow-sm transition",
        isDragging && "rotate-1 border-primary/40 shadow-xl",
      )}
    >
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-foreground">
              <Users className="size-4 text-muted-foreground" />
              <h3 className="font-medium">{customer.name}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{customer.company}</p>
          </div>

          <button
            type="button"
            className="rounded-lg border p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            aria-label={`Drag ${customer.name}`}
            {...listeners}
            {...attributes}
          >
            <GripVertical className="size-4" />
          </button>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Mail className="size-4 text-muted-foreground" />
            <span className="truncate">{customer.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-muted-foreground" />
            <span>{stageLabelMap[customer.stage]}</span>
          </div>
          <div className="flex items-center gap-2">
            <MoveRight className="size-4 text-muted-foreground" />
            <span>
              Moved {formatDistanceToNow(new Date(customer.stageChangedAt), { addSuffix: true })}
            </span>
          </div>
        </div>

        {customer.notes ? (
          <div className="rounded-xl bg-muted px-3 py-2 text-sm leading-6 text-muted-foreground">
            {customer.notes}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-2 border-t pt-3">
          <span className="text-xs text-muted-foreground">
            Updated {formatDistanceToNow(new Date(customer.updatedAt), { addSuffix: true })}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="size-8 rounded-full" onClick={onEdit}>
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-full"
              onClick={onDelete}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-background p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
    </div>
  );
}
