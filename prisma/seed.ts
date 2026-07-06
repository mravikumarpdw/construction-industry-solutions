/**
 * Seed — creates a complete demo tenant ("Apex Infra Projects") with data
 * flowing through every module and posting into the single cost ledger, so the
 * connected flows (SRS §7) are demonstrable end-to-end.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_ROLES } from "../src/lib/rbac";

const db = new PrismaClient();

const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const rand = (min: number, max: number) => min + Math.random() * (max - min);
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));
const pick = <T>(arr: T[]): T => arr[randInt(0, arr.length - 1)];
const daysAgo = (d: number) => new Date(Date.now() - d * 86400000);
const daysAhead = (d: number) => new Date(Date.now() + d * 86400000);

async function main() {
  console.log("🌱 Seeding Construction Industry Solutions…");

  // ── Reset (idempotent) ────────────────────────────────────────────────
  // Order respects FK dependencies.
  const deletions = [
    db.attachment.deleteMany(),
    db.activityEvent.deleteMany(),
    db.auditLog.deleteMany(),
    db.alert.deleteMany(),
    db.counter.deleteMany(),
    db.payment.deleteMany(),
    db.vendorInvoice.deleteMany(),
    db.mbEntry.deleteMany(),
    db.raBill.deleteMany(),
    db.workOrderLine.deleteMany(),
    db.workOrder.deleteMany(),
    db.wageLine.deleteMany(),
    db.wageSheet.deleteMany(),
    db.attendancePunch.deleteMany(),
    db.materialIssue.deleteMany(),
    db.stockLedgerEntry.deleteMany(),
    db.stockItem.deleteMany(),
    db.grnLine.deleteMany(),
    db.grn.deleteMany(),
    db.purchaseOrderLine.deleteMany(),
    db.purchaseOrder.deleteMany(),
    db.indentLine.deleteMany(),
    db.indent.deleteMany(),
    db.equipmentLog.deleteMany(),
    db.inspection.deleteMany(),
    db.ncr.deleteMany(),
    db.safetyIncident.deleteMany(),
    db.document.deleteMany(),
    db.clientRaBill.deleteMany(),
    db.tender.deleteMany(),
    db.progressUpdate.deleteMany(),
    db.milestone.deleteMany(),
    db.costLedgerEntry.deleteMany(),
    db.budgetLine.deleteMany(),
    db.task.deleteMany(),
    db.boqItem.deleteMany(),
    db.worker.deleteMany(),
    db.equipment.deleteMany(),
    db.item.deleteMany(),
    db.contractor.deleteMany(),
    db.vendor.deleteMany(),
    db.projectAssignment.deleteMany(),
    db.project.deleteMany(),
    db.costHead.deleteMany(),
    db.client.deleteMany(),
    db.user.deleteMany(),
    db.role.deleteMany(),
    db.tenant.deleteMany(),
  ];
  for (const d of deletions) await d;

  // ── Tenant ────────────────────────────────────────────────────────────
  const tenant = await db.tenant.create({
    data: {
      name: "Apex Infra Projects Pvt Ltd",
      code: "APEX",
      financialYear: "2026-27",
      gstin: "27AAPCA1234A1Z5",
      settings: JSON.stringify({ budgetGuard: "warn", currency: "INR" }),
    },
  });
  const tid = tenant.id;

  // ── Roles ─────────────────────────────────────────────────────────────
  const roleByKey: Record<string, string> = {};
  for (const r of DEFAULT_ROLES) {
    const role = await db.role.create({
      data: {
        tenantId: tid,
        key: r.key,
        name: r.name,
        description: r.description,
        permissions: JSON.stringify(r.permissions),
        isSystem: r.key === "admin",
      },
    });
    roleByKey[r.key] = role.id;
  }

  // ── Cost heads ──────────────────────────────────────────────────────────
  const headDefs = [
    { code: "MAT", name: "Material", sort: 1 },
    { code: "LAB", name: "Labour", sort: 2 },
    { code: "SUB", name: "Subcontract", sort: 3 },
    { code: "EQP", name: "Equipment", sort: 4 },
    { code: "OH", name: "Overheads", sort: 5 },
  ];
  const headByCode: Record<string, string> = {};
  for (const h of headDefs) {
    const head = await db.costHead.create({ data: { tenantId: tid, ...h } });
    headByCode[h.code] = head.id;
  }

  // ── Clients ─────────────────────────────────────────────────────────────
  const clientA = await db.client.create({
    data: { tenantId: tid, name: "Horizon Realty Ltd", gstin: "27AAACH1111B1Z2", contact: "R. Mehta", email: "projects@horizonrealty.in", phone: "+91 98200 11111" },
  });
  const clientB = await db.client.create({
    data: { tenantId: tid, name: "State Highways Authority", gstin: "27AAAGS2222C1Z3", contact: "Er. Deshmukh", email: "pmu@sha.gov.in", phone: "+91 98200 22222" },
  });
  const clientC = await db.client.create({
    data: { tenantId: tid, name: "NexGen Technologies", gstin: "27AAACN3333D1Z4", contact: "S. Iyer", email: "facilities@nexgen.io", phone: "+91 98200 33333" },
  });

  // ── Users ───────────────────────────────────────────────────────────────
  const pwHash = await bcrypt.hash("password123", 10);
  const userDefs = [
    { key: "md", name: "Vikram Malhotra", email: "md@apexinfra.in", designation: "Managing Director" },
    { key: "pm", name: "Anita Rao", email: "pm@apexinfra.in", designation: "Project Manager" },
    { key: "planner", name: "Karan Shah", email: "planner@apexinfra.in", designation: "Planning Engineer" },
    { key: "site", name: "Suresh Patil", email: "site@apexinfra.in", designation: "Site Engineer" },
    { key: "store", name: "Ramesh Gupta", email: "store@apexinfra.in", designation: "Storekeeper" },
    { key: "purchase", name: "Neha Verma", email: "purchase@apexinfra.in", designation: "Purchase Officer" },
    { key: "billing", name: "Farhan Khan", email: "billing@apexinfra.in", designation: "Billing Engineer / QS" },
    { key: "hr", name: "Priya Nair", email: "hr@apexinfra.in", designation: "HR / Time Office" },
    { key: "accounts", name: "Deepak Joshi", email: "accounts@apexinfra.in", designation: "Accounts Manager" },
    { key: "qhse", name: "Sneha Kulkarni", email: "qhse@apexinfra.in", designation: "QHSE Officer" },
    { key: "admin", name: "System Admin", email: "admin@apexinfra.in", designation: "Administrator" },
  ];
  const userByKey: Record<string, string> = {};
  for (const u of userDefs) {
    const user = await db.user.create({
      data: {
        tenantId: tid,
        roleId: roleByKey[u.key],
        name: u.name,
        email: u.email,
        phone: "+91 90000 0000" + randInt(1, 9),
        passwordHash: pwHash,
        designation: u.designation,
        lastLoginAt: daysAgo(randInt(0, 3)),
      },
    });
    userByKey[u.key] = user.id;
  }

  // ── Projects ────────────────────────────────────────────────────────────
  const projectDefs = [
    {
      code: "SKY-01", name: "Skyline Residency — Tower A & B", clientId: clientA.id,
      type: "residential", status: "Active", lat: 19.076, lng: 72.8777,
      location: "Powai, Mumbai", contractValue: 245000000, utilisation: 0.72,
      start: daysAgo(240), end: daysAhead(320),
    },
    {
      code: "MTR-03", name: "Metro Flyover — Package 3", clientId: clientB.id,
      type: "infra", status: "Active", lat: 18.5204, lng: 73.8567,
      location: "Hinjewadi, Pune", contractValue: 512000000, utilisation: 0.93,
      start: daysAgo(300), end: daysAhead(180),
    },
    {
      code: "TPK-02", name: "TechPark Commercial Block C", clientId: clientC.id,
      type: "commercial", status: "Active", lat: 12.9716, lng: 77.5946,
      location: "Whitefield, Bengaluru", contractValue: 178000000, utilisation: 0.41,
      start: daysAgo(120), end: daysAhead(400),
    },
  ];

  // BOQ template (per project, scaled by contract value)
  const boqTemplate = [
    { code: "1.1", description: "Earthwork excavation in foundation", unit: "cum", head: "SUB", qtyBase: 4200, rate: 220, norm: 0 },
    { code: "1.2", description: "PCC 1:4:8 in foundation", unit: "cum", head: "MAT", qtyBase: 380, rate: 4800, norm: 7.5 },
    { code: "2.1", description: "RCC M30 in raft & columns", unit: "cum", head: "MAT", qtyBase: 2650, rate: 8200, norm: 7.9 },
    { code: "2.2", description: "TMT reinforcement steel Fe500D", unit: "MT", head: "MAT", qtyBase: 480, rate: 68000, norm: 1.02 },
    { code: "2.3", description: "Formwork / shuttering", unit: "sqm", head: "SUB", qtyBase: 18500, rate: 340, norm: 0 },
    { code: "3.1", description: "Blockwork 200mm AAC", unit: "sqm", head: "MAT", qtyBase: 12400, rate: 720, norm: 12.5 },
    { code: "3.2", description: "Internal cement plaster 12mm", unit: "sqm", head: "SUB", qtyBase: 28600, rate: 190, norm: 0 },
    { code: "4.1", description: "Waterproofing to terrace & wet areas", unit: "sqm", head: "SUB", qtyBase: 6200, rate: 480, norm: 0 },
    { code: "5.1", description: "Structural steel fabrication", unit: "MT", head: "EQP", qtyBase: 120, rate: 92000, norm: 0 },
    { code: "6.1", description: "Site establishment & overheads", unit: "LS", head: "OH", qtyBase: 1, rate: 4200000, norm: 0 },
  ];

  const projects: { id: string; code: string; utilisation: number; lat: number; lng: number; boq: { id: string; head: string; amount: number; description: string; code: string }[] }[] = [];

  for (const p of projectDefs) {
    const scale = p.contractValue / 245000000;
    const project = await db.project.create({
      data: {
        tenantId: tid, code: p.code, name: p.name, clientId: p.clientId,
        type: p.type, status: p.status, lat: p.lat, lng: p.lng,
        geofenceRadius: 250, location: p.location, contractValue: p.contractValue,
        startDate: p.start, endDate: p.end,
      },
    });

    // Assign all users to every project (demo simplicity)
    for (const key of Object.keys(userByKey)) {
      await db.projectAssignment.create({
        data: { userId: userByKey[key], projectId: project.id },
      });
    }

    // BOQ + budget lines + Budget ledger
    const boq: { id: string; head: string; amount: number; description: string; code: string }[] = [];
    let budgetTotal = 0;
    for (const b of boqTemplate) {
      const qty = round(b.qtyBase * scale);
      const amount = round(qty * b.rate);
      budgetTotal += amount;
      const item = await db.boqItem.create({
        data: {
          projectId: project.id, costHeadId: headByCode[b.head], code: b.code,
          description: b.description, unit: b.unit, quantity: qty, rate: b.rate,
          amount, norm: b.norm || null, sort: Number(b.code.replace(".", "")),
        },
      });
      await db.budgetLine.create({
        data: { projectId: project.id, boqItemId: item.id, costHeadId: headByCode[b.head], amount, version: 1, approved: true },
      });
      boq.push({ id: item.id, head: b.head, amount, description: b.description, code: b.code });
    }

    // Tasks / WBS mapped to BOQ
    const taskNames = [
      "Foundation & Raft", "Columns up to plinth", "Superstructure — Podium",
      "Superstructure — Typical floors", "Blockwork & Plaster", "Waterproofing",
      "MEP rough-in", "Finishes & handover",
    ];
    for (let i = 0; i < taskNames.length; i++) {
      const prog = Math.min(100, Math.max(0, Math.round(p.utilisation * 100 - i * 9 + randInt(-6, 6))));
      const status = prog >= 100 ? "Completed" : prog <= 0 ? "Not Started" : prog < 40 && i > 4 ? "Delayed" : "In Progress";
      await db.task.create({
        data: {
          projectId: project.id, boqItemId: boq[i % boq.length].id,
          name: taskNames[i], wbsCode: `WBS-${i + 1}`,
          plannedStart: daysAgo(200 - i * 22), plannedEnd: daysAgo(200 - i * 22 - 30),
          baselineStart: daysAgo(200 - i * 22), baselineEnd: daysAgo(200 - i * 22 - 30),
          actualStart: prog > 0 ? daysAgo(198 - i * 22) : null,
          plannedQty: 100, actualQty: prog, unit: "%", progress: Math.max(0, prog),
          weight: round(boq[i % boq.length].amount / budgetTotal * 100),
          status, assigneeId: userByKey["site"], sort: i,
        },
      });
    }

    // Milestones
    const msNames = ["Foundation complete", "Structure topped out", "Finishes handover"];
    for (let i = 0; i < msNames.length; i++) {
      const target = daysAhead(-60 + i * 120);
      const achieved = target < new Date() && i === 0;
      await db.milestone.create({
        data: {
          projectId: project.id, name: msNames[i], targetDate: target,
          actualDate: achieved ? daysAgo(5) : null,
          status: achieved ? "Achieved" : target < new Date() ? "Slipped" : "Pending",
          billingStage: true,
        },
      });
    }

    projects.push({ id: project.id, code: p.code, utilisation: p.utilisation, lat: p.lat, lng: p.lng, boq });
  }

  // ── Masters: Vendors, Items, Contractors, Workers, Equipment ────────────
  const vendorDefs = [
    { name: "UltraTech Cement Ltd", category: "Cement", gstin: "27AAACU1234C1Z1" },
    { name: "Tata Steel — Retail", category: "Steel", gstin: "27AAACT5678D1Z2" },
    { name: "Deccan RMC Suppliers", category: "Ready Mix Concrete", gstin: "27AAACD9012E1Z3" },
    { name: "Sahyadri Aggregates", category: "Aggregates & Sand", gstin: "27AAACS3456F1Z4" },
    { name: "Bright Electricals", category: "Electrical", gstin: "27AAACB7890G1Z5", expySoon: true },
    { name: "AquaSeal Waterproofing", category: "Chemicals", gstin: "27AAACA2345H1Z6" },
  ];
  const vendors: string[] = [];
  for (const v of vendorDefs) {
    const vendor = await db.vendor.create({
      data: { tenantId: tid, name: v.name, category: v.category, gstin: v.gstin, pan: v.gstin.slice(2, 12), bank: "HDFC Bank ****" + randInt(1000, 9999), rating: round(rand(3.5, 4.9)), docExpiry: v.expySoon ? daysAhead(12) : daysAhead(randInt(120, 400)) },
    });
    vendors.push(vendor.id);
  }

  const itemDefs = [
    { code: "CEM-OPC53", name: "OPC 53 Grade Cement", unit: "bag", hsn: "2523", rate: 395, min: 200, max: 2000 },
    { code: "STL-TMT12", name: "TMT Bar Fe500D 12mm", unit: "MT", hsn: "7214", rate: 67500, min: 5, max: 60 },
    { code: "STL-TMT16", name: "TMT Bar Fe500D 16mm", unit: "MT", hsn: "7214", rate: 67200, min: 5, max: 60 },
    { code: "AGG-20MM", name: "Coarse Aggregate 20mm", unit: "cum", hsn: "2517", rate: 1450, min: 40, max: 400 },
    { code: "SND-RIVER", name: "River Sand (washed)", unit: "cum", hsn: "2505", rate: 2600, min: 30, max: 300 },
    { code: "BLK-AAC200", name: "AAC Block 200mm", unit: "nos", hsn: "6810", rate: 62, min: 500, max: 8000 },
    { code: "RMC-M30", name: "Ready Mix Concrete M30", unit: "cum", hsn: "3824", rate: 6200, min: 0, max: 200 },
    { code: "WPF-APP", name: "APP Membrane 4mm", unit: "sqm", hsn: "6807", rate: 210, min: 100, max: 2000 },
    { code: "BND-WIRE", name: "Binding Wire", unit: "kg", hsn: "7217", rate: 78, min: 100, max: 1500 },
    { code: "SHT-PLY", name: "Shuttering Plywood 12mm", unit: "nos", hsn: "4412", rate: 1150, min: 50, max: 600 },
  ];
  const items: { id: string; rate: number; name: string; unit: string }[] = [];
  for (const it of itemDefs) {
    const item = await db.item.create({
      data: { tenantId: tid, code: it.code, name: it.name, category: "Construction", unit: it.unit, hsn: it.hsn, minStock: it.min, maxStock: it.max },
    });
    items.push({ id: item.id, rate: it.rate, name: it.name, unit: it.unit });
  }

  const contractorDefs = [
    { name: "Shree Construction Co.", trade: "Civil / RCC", expySoon: false },
    { name: "Perfect Plaster Works", trade: "Plaster & Blockwork", expySoon: false },
    { name: "Steel Structures India", trade: "Structural Steel", expySoon: true },
    { name: "AquaGuard Applicators", trade: "Waterproofing", expySoon: false },
    { name: "Spark Electrical Contractors", trade: "MEP — Electrical", expySoon: false },
  ];
  const contractors: { id: string; name: string; trade: string }[] = [];
  for (const c of contractorDefs) {
    const contractor = await db.contractor.create({
      data: { tenantId: tid, name: c.name, trade: c.trade, gstin: "27AAAC" + randInt(1000, 9999) + "X1Z" + randInt(1, 9), pan: "AAAC" + randInt(1000, 9999) + "X", bank: "ICICI ****" + randInt(1000, 9999), rating: round(rand(3.2, 4.8)), docExpiry: c.expySoon ? daysAhead(9) : daysAhead(randInt(90, 380)) },
    });
    contractors.push({ id: contractor.id, name: c.name, trade: c.trade });
  }

  // Workers (some tagged to contractors) — spread across projects
  const trades = ["Mason", "Bar Bender", "Carpenter", "Helper", "Electrician", "Fitter", "Painter"];
  const firstNames = ["Ravi", "Sanjay", "Mohan", "Iqbal", "Rakesh", "Vijay", "Ganesh", "Salim", "Dinesh", "Prakash", "Arjun", "Kishan", "Naresh", "Balaji", "Imran"];
  const workers: { id: string; rate: number; projectIdx: number; contractorId: string | null }[] = [];
  let wCount = 0;
  for (let i = 0; i < 45; i++) {
    const trade = pick(trades);
    const rate = trade === "Helper" ? randInt(520, 620) : randInt(750, 1050);
    const contractorId = Math.random() > 0.35 ? pick(contractors).id : null;
    const projectIdx = randInt(0, projects.length - 1);
    const worker = await db.worker.create({
      data: {
        tenantId: tid, contractorId, code: `W${String(++wCount).padStart(4, "0")}`,
        name: `${pick(firstNames)} ${pick(["Kumar", "Yadav", "Singh", "Shaikh", "Patil", "Das", "Reddy"])}`,
        trade, category: contractorId ? "contractor" : "own",
        wageType: "daily", rate, aadhaarRef: "XXXX-XXXX-" + randInt(1000, 9999),
        bank: "SBI ****" + randInt(1000, 9999),
        pfApplicable: !contractorId, esiApplicable: !contractorId,
      },
    });
    workers.push({ id: worker.id, rate, projectIdx, contractorId });
  }

  const equipDefs = [
    { code: "EX-01", name: "Excavator JCB 220LC", cat: "Earthmoving", own: "owned", rate: 1200 },
    { code: "CR-01", name: "Tower Crane Potain MC85", cat: "Lifting", own: "hired", rate: 3800 },
    { code: "BP-01", name: "Concrete Boom Pump 36m", cat: "Concrete", own: "hired", rate: 2400 },
    { code: "TM-01", name: "Transit Mixer 6cum", cat: "Concrete", own: "owned", rate: 900 },
    { code: "DG-01", name: "Diesel Generator 250kVA", cat: "Power", own: "owned", rate: 700 },
    { code: "VR-01", name: "Vibratory Roller 10T", cat: "Compaction", own: "hired", rate: 1600, expySoon: true },
  ];
  const equipment: { id: string; rate: number; name: string }[] = [];
  for (const e of equipDefs) {
    const eq = await db.equipment.create({
      data: { tenantId: tid, code: e.code, name: e.name, category: e.cat, ownership: e.own, hireRate: e.rate, status: pick(["Available", "Deployed", "Deployed", "Maintenance"]), docExpiry: e.expySoon ? daysAhead(7) : daysAhead(randInt(60, 300)) },
    });
    equipment.push({ id: eq.id, rate: e.rate, name: e.name });
  }

  // Helpers for doc numbers
  const seqs: Record<string, number> = {};
  const docNo = (prefix: string) => {
    seqs[prefix] = (seqs[prefix] ?? 0) + 1;
    return `${prefix}/2026-27/${String(seqs[prefix]).padStart(5, "0")}`;
  };
  const ledger: any[] = [];
  const activity: any[] = [];
  const pushActivity = (a: any) => activity.push({ tenantId: tid, ...a });

  // ── PROCUREMENT: Indents → PO (Committed) → GRN (Actual + stock) ─────────
  for (const proj of projects) {
    const matBoq = proj.boq.filter((b) => b.head === "MAT");
    const numPOs = randInt(3, 4);
    for (let k = 0; k < numPOs; k++) {
      const vendorId = pick(vendors);
      const lineItems = [pick(items), pick(items)].filter((v, idx, arr) => arr.findIndex((x) => x.id === v.id) === idx);
      let subTotal = 0;
      const poLines: any[] = [];
      for (const it of lineItems) {
        const qty = randInt(20, 120);
        const rate = round(it.rate * rand(0.98, 1.05));
        const amount = round(qty * rate);
        subTotal += amount;
        poLines.push({ item: it, qty, rate, amount });
      }
      const tax = round(subTotal * 0.18);
      const total = round(subTotal + tax);
      const received = Math.random() > 0.3; // most received
      const po = await db.purchaseOrder.create({
        data: {
          tenantId: tid, projectId: proj.id, vendorId, number: docNo("PO"),
          status: received ? "Received" : "Approved", subTotal, taxAmount: tax, total,
          deliveryTo: "Site Store", terms: "30 days credit", createdAt: daysAgo(randInt(10, 90)),
          lines: {
            create: poLines.map((l) => ({
              itemId: l.item.id, boqItemId: matBoq.length ? pick(matBoq).id : null,
              quantity: l.qty, receivedQty: received ? l.qty : 0, rate: l.rate, gstPct: 18, amount: l.amount,
            })),
          },
        },
        include: { lines: true },
      });

      // Committed ledger for the PO material value
      const matHeadId = headByCode["MAT"];
      ledger.push({ tenantId: tid, projectId: proj.id, boqItemId: matBoq.length ? matBoq[0].id : null, costHeadId: matHeadId, type: "Committed", amount: subTotal, sourceType: "PO", sourceId: po.id, description: `PO ${po.number}`, createdAt: po.createdAt });

      pushActivity({ projectId: proj.id, actorId: userByKey["purchase"], actorName: "Neha Verma", type: "po", title: `PO ${po.number} issued`, detail: `₹${total.toLocaleString("en-IN")} to vendor`, source: "WEB", createdAt: po.createdAt });

      if (received) {
        const grn = await db.grn.create({
          data: {
            tenantId: tid, projectId: proj.id, poId: po.id, number: docNo("GRN"),
            vehicleNo: "MH" + randInt(10, 40) + "AB" + randInt(1000, 9999),
            weighbridge: `${randInt(8, 30)}.${randInt(10, 99)} MT`, challanNo: "CH" + randInt(10000, 99999),
            status: "Accepted", receivedById: userByKey["store"], source: pick(["WEB", "MOBILE"]),
            createdAt: new Date(po.createdAt.getTime() + 3 * 86400000),
            lines: {
              create: po.lines.map((pl) => ({
                poLineId: pl.id, itemId: pl.itemId, receivedQty: pl.quantity, acceptedQty: pl.quantity, rejectedQty: 0, rate: pl.rate,
              })),
            },
          },
          include: { lines: true },
        });

        // Stock receipt + Actual ledger (Committed → Actual)
        for (const gl of grn.lines) {
          // stock upsert
          const existing = await db.stockItem.findUnique({ where: { projectId_itemId: { projectId: proj.id, itemId: gl.itemId } } });
          const prevQty = existing?.quantity ?? 0;
          const prevValue = existing?.value ?? 0;
          const addValue = round(gl.acceptedQty * gl.rate);
          const newQty = round(prevQty + gl.acceptedQty);
          const newValue = round(prevValue + addValue);
          const wavg = newQty > 0 ? round(newValue / newQty) : 0;
          await db.stockItem.upsert({
            where: { projectId_itemId: { projectId: proj.id, itemId: gl.itemId } },
            create: { tenantId: tid, projectId: proj.id, itemId: gl.itemId, quantity: newQty, wavgRate: wavg, value: newValue },
            update: { quantity: newQty, wavgRate: wavg, value: newValue },
          });
          await db.stockLedgerEntry.create({
            data: { tenantId: tid, projectId: proj.id, itemId: gl.itemId, direction: "in", quantity: gl.acceptedQty, rate: gl.rate, balanceQty: newQty, wavgRate: wavg, sourceType: "GRN", sourceId: grn.id, createdAt: grn.createdAt },
          });
        }
        const grnValue = round(grn.lines.reduce((s, l) => s + l.acceptedQty * l.rate, 0));
        // Contra the commitment and post actual
        ledger.push({ tenantId: tid, projectId: proj.id, boqItemId: matBoq.length ? matBoq[0].id : null, costHeadId: matHeadId, type: "Committed", amount: -grnValue, sourceType: "GRN", sourceId: grn.id, description: `Commitment released by GRN ${grn.number}`, createdAt: grn.createdAt });
        ledger.push({ tenantId: tid, projectId: proj.id, boqItemId: matBoq.length ? matBoq[0].id : null, costHeadId: matHeadId, type: "Actual", amount: grnValue, sourceType: "GRN", sourceId: grn.id, description: `GRN ${grn.number} received`, createdAt: grn.createdAt });

        pushActivity({ projectId: proj.id, actorId: userByKey["store"], actorName: "Ramesh Gupta", type: "grn", title: `GRN ${grn.number} received`, detail: grn.vehicleNo, source: grn.source, lat: proj.lat, lng: proj.lng, createdAt: grn.createdAt });

        // Vendor invoice (three-way match)
        const base = grnValue;
        const gst = round(base * 0.18);
        const tds = round(base * 0.02);
        await db.vendorInvoice.create({
          data: { tenantId: tid, vendorId, poId: po.id, number: "INV" + randInt(10000, 99999), baseAmount: base, gstAmount: gst, tdsPct: 2, tdsAmount: tds, netPayable: round(base + gst - tds), status: pick(["Booked", "Approved", "Paid"]), createdAt: new Date(grn.createdAt.getTime() + 5 * 86400000) },
        });
      }
    }

    // Some open indents awaiting action
    for (let k = 0; k < randInt(1, 3); k++) {
      const it = pick(items);
      await db.indent.create({
        data: {
          tenantId: tid, projectId: proj.id, number: docNo("IND"),
          requiredBy: daysAhead(randInt(3, 15)), status: pick(["Raised", "Approved", "Ordered"]),
          remarks: "Required for slab casting", raisedById: userByKey["site"], raisedByName: "Suresh Patil",
          source: pick(["MOBILE", "WEB"]), createdAt: daysAgo(randInt(1, 8)),
          lines: { create: [{ itemId: it.id, boqItemId: matBoq.length ? pick(matBoq).id : null, quantity: randInt(20, 100), unit: it.unit, remarks: "Site requirement" }] },
        },
      });
    }
  }

  // ── CONSUMPTION: issue stock to work → Actual + wastage baseline ─────────
  const stockPositions = await db.stockItem.findMany({ where: { tenantId: tid }, include: { item: true } });
  for (const sp of stockPositions) {
    if (sp.quantity <= 0) continue;
    const proj = projects.find((p) => p.id === sp.projectId)!;
    const issueQty = round(sp.quantity * rand(0.35, 0.7));
    if (issueQty <= 0) continue;
    const value = round(issueQty * sp.wavgRate);
    const matBoq = proj.boq.filter((b) => b.head === "MAT");
    const boqItemId = matBoq.length ? pick(matBoq).id : null;
    await db.materialIssue.create({
      data: { tenantId: tid, projectId: sp.projectId, itemId: sp.itemId, boqItemId, quantity: issueQty, rate: sp.wavgRate, value, issuedToType: "work", source: pick(["WEB", "MOBILE"]), createdAt: daysAgo(randInt(1, 40)) },
    });
    // reduce stock
    const newQty = round(sp.quantity - issueQty);
    await db.stockItem.update({ where: { id: sp.id }, data: { quantity: newQty, value: round(newQty * sp.wavgRate) } });
    await db.stockLedgerEntry.create({ data: { tenantId: tid, projectId: sp.projectId, itemId: sp.itemId, direction: "out", quantity: issueQty, rate: sp.wavgRate, balanceQty: newQty, wavgRate: sp.wavgRate, sourceType: "Issue", createdAt: daysAgo(randInt(1, 40)) } });
    ledger.push({ tenantId: tid, projectId: sp.projectId, boqItemId, costHeadId: headByCode["MAT"], type: "Actual", amount: value, sourceType: "Issue", description: `Consumption ${sp.item.name}`, createdAt: daysAgo(randInt(1, 40)) });
  }

  // ── ATTENDANCE → WAGES (Actual labour cost) ─────────────────────────────
  for (let pi = 0; pi < projects.length; pi++) {
    const proj = projects[pi];
    const projWorkers = workers.filter((w) => w.projectIdx === pi);
    const punchRows: any[] = [];
    let wageGross = 0;
    for (let d = 1; d <= 18; d++) {
      const date = daysAgo(d);
      if (date.getDay() === 0) continue; // weekly off Sunday
      for (const w of projWorkers) {
        if (Math.random() < 0.12) continue; // ~88% attendance
        const half = Math.random() < 0.06;
        const ot = Math.random() < 0.15 ? randInt(1, 3) : 0;
        const flagged = Math.random() < 0.04;
        punchRows.push({
          tenantId: tid, projectId: proj.id, workerId: w.id, date,
          status: half ? "Half" : "P", hours: half ? 4 : 8, otHours: ot,
          checkInAt: new Date(date.getTime() + 8 * 3600000), checkOutAt: new Date(date.getTime() + (half ? 12 : 17) * 3600000),
          lat: proj.lat + rand(-0.001, 0.001), lng: proj.lng + rand(-0.001, 0.001),
          deviceId: "AND-" + randInt(1000, 9999), withinGeofence: !flagged, source: "MOBILE",
          flagged, flagReason: flagged ? "Outside geofence" : null,
        });
        const dayWage = (half ? 0.5 : 1) * w.rate + ot * (w.rate / 8) * 1.5;
        wageGross += dayWage;
      }
    }
    if (punchRows.length) await db.attendancePunch.createMany({ data: punchRows });
    wageGross = round(wageGross);

    // Wage sheet (period = last 18 days) — actual labour cost to ledger
    const labBoq = proj.boq.find((b) => b.head === "SUB") || proj.boq[0];
    const deductions = round(wageGross * 0.03);
    const net = round(wageGross - deductions);
    const ws = await db.wageSheet.create({
      data: { tenantId: tid, projectId: proj.id, periodStart: daysAgo(18), periodEnd: daysAgo(1), status: pick(["Approved", "Paid", "Draft"]), gross: wageGross, deductions, net, createdAt: daysAgo(1) },
    });
    ledger.push({ tenantId: tid, projectId: proj.id, boqItemId: labBoq.id, costHeadId: headByCode["LAB"], type: "Actual", amount: wageGross, sourceType: "WageSheet", sourceId: ws.id, description: `Wages for period ending ${ws.periodEnd.toLocaleDateString("en-IN")}`, createdAt: ws.createdAt });

    pushActivity({ projectId: proj.id, actorId: userByKey["hr"], actorName: "Priya Nair", type: "wages", title: `Wage sheet prepared`, detail: `${projWorkers.length} workers · ₹${wageGross.toLocaleString("en-IN")}`, source: "WEB", createdAt: ws.createdAt });
  }

  // ── CONTRACTOR: WO (Committed) → MB → RA bill (Actual) ──────────────────
  for (const proj of projects) {
    const subBoq = proj.boq.filter((b) => b.head === "SUB" || b.head === "MAT");
    const numWO = randInt(1, 2);
    for (let k = 0; k < numWO; k++) {
      const contractor = pick(contractors);
      const woLinesData: any[] = [];
      let woValue = 0;
      const chosen = [pick(subBoq), pick(subBoq)].filter((v, idx, arr) => arr.findIndex((x) => x.id === v.id) === idx);
      for (const b of chosen) {
        const qty = randInt(200, 1200);
        const rate = round(rand(180, 520));
        const amount = round(qty * rate);
        woValue += amount;
        woLinesData.push({ boqItemId: b.id, description: b.description, unit: "sqm", quantity: qty, rate, amount });
      }
      const wo = await db.workOrder.create({
        data: {
          tenantId: tid, projectId: proj.id, contractorId: contractor.id, number: docNo("WO"),
          type: "item-rate", status: "Active", retentionPct: 5, advancePct: 10,
          advancePaid: round(woValue * 0.1), value: woValue, deviationPct: 5, createdAt: daysAgo(randInt(30, 80)),
          lines: { create: woLinesData },
        },
        include: { lines: true },
      });

      ledger.push({ tenantId: tid, projectId: proj.id, boqItemId: chosen[0].id, costHeadId: headByCode["SUB"], type: "Committed", amount: woValue, sourceType: "WO", sourceId: wo.id, description: `WO ${wo.number} — ${contractor.name}`, createdAt: wo.createdAt });
      pushActivity({ projectId: proj.id, actorId: userByKey["pm"], actorName: "Anita Rao", type: "wo", title: `Work Order ${wo.number}`, detail: `${contractor.name} · ₹${woValue.toLocaleString("en-IN")}`, source: "WEB", createdAt: wo.createdAt });

      // MB entries (cumulative ≤ WO qty) + RA bills
      let raSeq = 0;
      let prevCumulative = 0;
      const numRA = randInt(1, 2);
      for (let r = 0; r < numRA; r++) {
        let billGross = 0;
        for (const wl of wo.lines) {
          const fraction = rand(0.25, 0.45);
          const mbQty = round(wl.quantity * fraction);
          const mbValue = round(mbQty * wl.rate);
          billGross += mbValue;
          await db.mbEntry.create({
            data: { tenantId: tid, woLineId: wl.id, date: daysAgo(randInt(2, 25)), location: "Grid " + pick(["A-1", "B-2", "C-3", "D-4"]), nos: 1, length: round(rand(3, 8)), breadth: round(rand(2, 5)), height: round(rand(3, 3.2)), quantity: mbQty, status: "Approved", source: pick(["WEB", "MOBILE"]), createdBy: userByKey["site"] },
          });
          await db.workOrderLine.update({ where: { id: wl.id }, data: { measuredQty: { increment: mbQty } } });
        }
        billGross = round(billGross);
        const cumulative = round(prevCumulative + billGross);
        const retention = round(billGross * 0.05);
        const advanceRec = round(billGross * 0.1);
        const materialRec = round(billGross * rand(0.01, 0.04));
        const gst = round(billGross * 0.18);
        const tds = round(billGross * 0.02);
        const net = round(billGross - retention - advanceRec - materialRec + gst - tds);
        raSeq++;
        const ra = await db.raBill.create({
          data: {
            tenantId: tid, projectId: proj.id, woId: wo.id, number: `${wo.number}/RA-${raSeq}`,
            seq: raSeq, grossThisBill: billGross, cumulativeValue: cumulative, previousValue: prevCumulative,
            retention, advanceRecovery: advanceRec, materialRecovery: materialRec, otherRecovery: 0,
            gstAmount: gst, tdsAmount: tds, netPayable: net, status: pick(["Approved", "Paid", "Submitted"]),
            createdAt: daysAgo(randInt(1, 20)),
          },
        });
        prevCumulative = cumulative;
        ledger.push({ tenantId: tid, projectId: proj.id, boqItemId: chosen[0].id, costHeadId: headByCode["SUB"], type: "Committed", amount: -billGross, sourceType: "RABill", sourceId: ra.id, description: `Commitment released by ${ra.number}`, createdAt: ra.createdAt });
        ledger.push({ tenantId: tid, projectId: proj.id, boqItemId: chosen[0].id, costHeadId: headByCode["SUB"], type: "Actual", amount: billGross, sourceType: "RABill", sourceId: ra.id, description: `${ra.number} certified`, createdAt: ra.createdAt });
        pushActivity({ projectId: proj.id, actorId: userByKey["billing"], actorName: "Farhan Khan", type: "rabill", title: `RA Bill ${ra.number}`, detail: `Net ₹${net.toLocaleString("en-IN")}`, source: "WEB", createdAt: ra.createdAt });
      }
    }
  }

  // ── EQUIPMENT logs (Actual equipment cost) ──────────────────────────────
  for (const proj of projects) {
    const eqpBoq = proj.boq.find((b) => b.head === "EQP") || proj.boq[0];
    for (let d = 0; d < 12; d++) {
      const eq = pick(equipment);
      const hours = randInt(4, 10);
      const cost = round(hours * eq.rate);
      await db.equipmentLog.create({
        data: { tenantId: tid, projectId: proj.id, equipmentId: eq.id, date: daysAgo(d + 1), runningHours: hours, idleHours: randInt(0, 3), fuelIssued: round(hours * rand(4, 9)), operator: "Operator " + randInt(1, 8), cost, source: pick(["WEB", "MOBILE"]) },
      });
      ledger.push({ tenantId: tid, projectId: proj.id, boqItemId: eqpBoq.id, costHeadId: headByCode["EQP"], type: "Actual", amount: cost, sourceType: "EquipmentLog", description: `${eq.name} ${hours}h`, createdAt: daysAgo(d + 1) });
    }
  }

  // ── QHSE, Documents, Client bills, Tenders, Progress updates ────────────
  for (const proj of projects) {
    for (let i = 0; i < randInt(2, 4); i++) {
      await db.inspection.create({
        data: { tenantId: tid, projectId: proj.id, type: pick(["pre-concrete", "waterproofing", "electrical"]), title: pick(["Slab pre-pour checklist", "Column reinforcement check", "Waterproofing acceptance"]), checklist: JSON.stringify([{ item: "Cover blocks placed", ok: true }, { item: "Reinforcement as per drawing", ok: true }, { item: "Shuttering leak-proof", ok: Math.random() > 0.2 }]), result: Math.random() > 0.15 ? "Pass" : "Fail", inspectedBy: userByKey["qhse"], source: pick(["WEB", "MOBILE"]), createdAt: daysAgo(randInt(1, 30)) },
      });
    }
    for (let i = 0; i < randInt(1, 3); i++) {
      await db.ncr.create({
        data: { tenantId: tid, projectId: proj.id, number: docNo("NCR"), title: pick(["Honeycombing in column", "Plaster crack observed", "Cover not maintained"]), description: "Rectification required per QA standard.", contractorId: pick(contractors).id, reworkCost: round(rand(15000, 90000)), status: pick(["Open", "Assigned", "Rectified", "Closed"]), createdAt: daysAgo(randInt(1, 40)) },
      });
    }
    await db.safetyIncident.create({
      data: { tenantId: tid, projectId: proj.id, type: pick(["near-miss", "first-aid"]), title: pick(["Worker slipped near excavation", "Minor cut during bar bending"]), severity: "low", status: pick(["Open", "Closed"]), createdAt: daysAgo(randInt(1, 25)) },
    });
    const folders = ["Drawings", "Contracts", "Correspondence", "Drawings"];
    for (let i = 0; i < 4; i++) {
      await db.document.create({
        data: { tenantId: tid, projectId: proj.id, folder: folders[i], name: pick(["GA Plan Rev", "Structural Detail", "Agreement", "Site Instruction"]) + " " + randInt(1, 40), revision: "R" + randInt(0, 3), status: pick(["Good For Construction", "For Approval", "Superseded"]), uploadedBy: userByKey["planner"], createdAt: daysAgo(randInt(1, 60)) },
      });
    }
    // Client RA bill
    const gross = round(proj.boq.reduce((s, b) => s + b.amount, 0) * proj.utilisation * 0.4);
    const ret = round(gross * 0.05);
    const gst = round(gross * 0.18);
    await db.clientRaBill.create({
      data: { tenantId: tid, projectId: proj.id, number: docNo("CRA"), seq: 1, grossThisBill: gross, cumulativeValue: gross, retention: ret, advanceRecovery: round(gross * 0.1), gstAmount: gst, netClaim: round(gross - ret - gross * 0.1 + gst), certifiedAmount: round(gross * 0.92), receivedAmount: round(gross * 0.7), status: pick(["Submitted", "Certified", "Received"]), createdAt: daysAgo(randInt(3, 30)) },
    });
    // A couple of progress updates (DPR)
    const someTasks = await db.task.findMany({ where: { projectId: proj.id }, take: 2 });
    for (const t of someTasks) {
      await db.progressUpdate.create({
        data: { tenantId: tid, projectId: proj.id, taskId: t.id, qtyToday: randInt(5, 20), manpower: randInt(15, 60), machinery: "1 Crane, 1 Pump", weather: pick(["Clear", "Cloudy", "Light rain"]), remarks: "Progress as planned", source: "MOBILE", createdBy: userByKey["site"], date: daysAgo(randInt(1, 5)) },
      });
    }
  }

  // Tenders (pipeline)
  const tenderDefs = [
    { name: "IT SEZ Phase-2, Hyderabad", client: "NexGen Technologies", value: 320000000, status: "Bidding", prob: 60 },
    { name: "Riverside Township, Nashik", client: "Horizon Realty Ltd", value: 890000000, status: "Bidding", prob: 40 },
    { name: "Ring Road Elevated Corridor", client: "State Highways Authority", value: 1250000000, status: "Identified", prob: 25 },
    { name: "Hospital Block, Nagpur", client: "State Health Dept", value: 210000000, status: "Won", prob: 100 },
    { name: "Warehouse Cluster, Bhiwandi", client: "LogiCorp", value: 145000000, status: "Lost", prob: 0 },
  ];
  for (const t of tenderDefs) {
    await db.tender.create({
      data: { tenantId: tid, name: t.name, clientName: t.client, estimatedValue: t.value, emd: round(t.value * 0.02), submissionDate: daysAhead(randInt(-20, 30)), status: t.status, probability: t.prob, createdAt: daysAgo(randInt(5, 60)) },
    });
  }

  // ── Post all cost ledger entries ────────────────────────────────────────
  if (ledger.length) await db.costLedgerEntry.createMany({ data: ledger });

  // ── Activity feed ───────────────────────────────────────────────────────
  // Add mobile attendance activity highlights + misc
  for (const proj of projects) {
    for (let i = 0; i < 6; i++) {
      pushActivity({
        projectId: proj.id, actorId: userByKey["site"], actorName: pick(["Suresh Patil", "Site Supervisor"]),
        type: "attendance", title: `${randInt(20, 60)} workers checked in`, detail: "Geo-verified · selfie captured",
        source: "MOBILE", deviceId: "AND-" + randInt(1000, 9999), lat: proj.lat + rand(-0.001, 0.001), lng: proj.lng + rand(-0.001, 0.001),
        createdAt: daysAgo(randInt(0, 6)),
      });
      pushActivity({
        projectId: proj.id, actorId: userByKey["site"], actorName: "Suresh Patil",
        type: "progress", title: `Progress updated on site`, detail: pick(["Slab casting 60% done", "Blockwork L3 completed", "Plaster started W2"]),
        source: "MOBILE", deviceId: "AND-" + randInt(1000, 9999), lat: proj.lat, lng: proj.lng,
        createdAt: daysAgo(randInt(0, 4)),
      });
    }
  }
  if (activity.length) await db.activityEvent.createMany({ data: activity });

  // ── Alerts (exception engine) ───────────────────────────────────────────
  const metroProj = projects.find((p) => p.code === "MTR-03")!;
  await db.alert.createMany({
    data: [
      { tenantId: tid, projectId: metroProj.id, type: "budget_breach", severity: "high", title: "Budget utilisation 93%", message: "Metro Flyover Pkg-3 is approaching budget ceiling on RCC works.", entityType: "Project", entityId: metroProj.id },
      { tenantId: tid, projectId: metroProj.id, type: "milestone_slip", severity: "medium", title: "Milestone slipped", message: "Structure top-out target date has passed on Metro Flyover Pkg-3." },
      { tenantId: tid, type: "doc_expiry", severity: "medium", title: "Vendor document expiring", message: "Bright Electricals licence expires in 12 days." },
      { tenantId: tid, type: "doc_expiry", severity: "high", title: "Contractor insurance expiring", message: "Steel Structures India WC insurance expires in 9 days." },
      { tenantId: tid, projectId: projects[0].id, type: "low_stock", severity: "medium", title: "Low stock alert", message: "OPC 53 Cement below minimum level at Skyline Residency." },
      { tenantId: tid, type: "attendance_anomaly", severity: "low", title: "Attendance flagged", message: "3 punches outside geofence flagged for review today." },
    ],
  });

  // ── Summary ─────────────────────────────────────────────────────────────
  const counts = {
    users: userDefs.length,
    projects: projects.length,
    boq: await db.boqItem.count(),
    ledger: ledger.length,
    workers: workers.length,
    punches: await db.attendancePunch.count(),
    activity: activity.length,
  };
  console.log("✅ Seed complete:", counts);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
