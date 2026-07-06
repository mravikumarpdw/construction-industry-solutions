import { db } from "./db";
import { money } from "./money";
import { ApiError } from "./api";

type Db = typeof db | Parameters<Parameters<typeof db.$transaction>[0]>[0];

// Receive stock into a site store, recomputing weighted-average rate atomically
// (V-04). Returns the new stock position.
export async function receiveStock(
  client: Db,
  input: {
    tenantId: string;
    projectId: string;
    itemId: string;
    quantity: number;
    rate: number;
    sourceType: string;
    sourceId?: string;
  }
) {
  const existing = await client.stockItem.findUnique({
    where: { projectId_itemId: { projectId: input.projectId, itemId: input.itemId } },
  });

  const prevQty = existing?.quantity ?? 0;
  const prevValue = existing?.value ?? 0;
  const addValue = money(input.quantity * input.rate);
  const newQty = money(prevQty + input.quantity);
  const newValue = money(prevValue + addValue);
  const wavg = newQty > 0 ? money(newValue / newQty) : 0;

  const stock = await client.stockItem.upsert({
    where: { projectId_itemId: { projectId: input.projectId, itemId: input.itemId } },
    create: {
      tenantId: input.tenantId,
      projectId: input.projectId,
      itemId: input.itemId,
      quantity: newQty,
      wavgRate: wavg,
      value: newValue,
    },
    update: { quantity: newQty, wavgRate: wavg, value: newValue },
  });

  await client.stockLedgerEntry.create({
    data: {
      tenantId: input.tenantId,
      projectId: input.projectId,
      itemId: input.itemId,
      direction: "in",
      quantity: input.quantity,
      rate: input.rate,
      balanceQty: newQty,
      wavgRate: wavg,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
    },
  });

  return stock;
}

// Issue stock from a site store at weighted-average rate. Blocks negative
// stock (V-04). Returns the rate used and value issued.
export async function issueStock(
  client: Db,
  input: {
    tenantId: string;
    projectId: string;
    itemId: string;
    quantity: number;
    sourceType: string;
    sourceId?: string;
  }
) {
  const existing = await client.stockItem.findUnique({
    where: { projectId_itemId: { projectId: input.projectId, itemId: input.itemId } },
  });

  const available = existing?.quantity ?? 0;
  if (input.quantity > available) {
    throw new ApiError(
      `Insufficient stock: ${available} available, ${input.quantity} requested`,
      400
    );
  }

  const rate = existing?.wavgRate ?? 0;
  const value = money(input.quantity * rate);
  const newQty = money(available - input.quantity);
  const newValue = money((existing?.value ?? 0) - value);

  await client.stockItem.update({
    where: { projectId_itemId: { projectId: input.projectId, itemId: input.itemId } },
    data: { quantity: newQty, value: newValue },
  });

  await client.stockLedgerEntry.create({
    data: {
      tenantId: input.tenantId,
      projectId: input.projectId,
      itemId: input.itemId,
      direction: "out",
      quantity: input.quantity,
      rate,
      balanceQty: newQty,
      wavgRate: rate,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
    },
  });

  return { rate, value };
}
