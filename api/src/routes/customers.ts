import { Router } from "express";
import { db } from "../db";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

// GET /api/customers?stage=
router.get("/", async (req, res) => {
  const { stage } = req.query;
  const userId = res.locals.userId;

  let query = db
    .from("customers")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (stage && stage !== "all") {
    query = query.eq("stage", String(stage));
  }

  const { data, error } = await query;

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json(data);
});

// POST /api/customers
// client sends its own UUID so optimistic updates don't need ID reconciliation
router.post("/", async (req, res) => {
  const userId = res.locals.userId;
  const {
    id,
    name,
    email,
    company,
    stage = "lead",
    notes,
  } = req.body as {
    id?: string;
    name: string;
    email: string;
    company: string;
    stage?: string;
    notes?: string;
  };

  if (!name?.trim() || !email?.trim() || !company?.trim()) {
    res.status(400).json({ error: "name, email, and company are required" });
    return;
  }

  const { data, error } = await db
    .from("customers")
    .insert({
      ...(id ? { id } : {}),
      user_id: userId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      company: company.trim(),
      stage,
      notes: notes?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  // track initial placement too, not just moves
  await db.from("stage_history").insert({
    customer_id: data.id,
    user_id: userId,
    from_stage: null,
    to_stage: stage,
  });

  res.status(201).json(data);
});

// PUT /api/customers/:id
router.put("/:id", async (req, res) => {
  const userId = res.locals.userId;
  const { id } = req.params;
  const { name, email, company, stage, notes } = req.body as {
    name?: string;
    email?: string;
    company?: string;
    stage?: string;
    notes?: string;
  };

  // need existing stage to know whether to record a history entry
  const { data: existing, error: fetchError } = await db
    .from("customers")
    .select("stage, stage_changed_at")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (fetchError || !existing) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  const stageChanged = stage !== undefined && stage !== existing.stage;
  const now = new Date().toISOString();

  const { data, error } = await db
    .from("customers")
    .update({
      ...(name !== undefined && { name: name.trim() }),
      ...(email !== undefined && { email: email.trim().toLowerCase() }),
      ...(company !== undefined && { company: company.trim() }),
      ...(stage !== undefined && { stage }),
      ...(notes !== undefined && { notes: notes.trim() || null }),
      ...(stageChanged && { stage_changed_at: now }),
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  if (stageChanged) {
    await db.from("stage_history").insert({
      customer_id: id,
      user_id: userId,
      from_stage: existing.stage,
      to_stage: stage,
    });
  }

  res.json(data);
});

// PATCH /api/customers/:id/stage
// separate from PUT so every stage move always gets a history entry
router.patch("/:id/stage", async (req, res) => {
  const userId = res.locals.userId;
  const { id } = req.params;
  const { stage } = req.body as { stage: string };

  if (!stage) {
    res.status(400).json({ error: "stage is required" });
    return;
  }

  const { data: existing, error: fetchError } = await db
    .from("customers")
    .select("stage")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (fetchError || !existing) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  if (existing.stage === stage) {
    res.status(200).json({ message: "No change" });
    return;
  }

  const now = new Date().toISOString();

  const { data, error } = await db
    .from("customers")
    .update({ stage, stage_changed_at: now })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  await db.from("stage_history").insert({
    customer_id: id,
    user_id: userId,
    from_stage: existing.stage,
    to_stage: stage,
  });

  res.json(data);
});

// DELETE /api/customers/:id
router.delete("/:id", async (req, res) => {
  const userId = res.locals.userId;
  const { id } = req.params;

  const { error } = await db
    .from("customers")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(204).end();
});

export default router;
