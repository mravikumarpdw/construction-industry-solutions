import { FolderKanban } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { txWhere } from "@/lib/scope";
import { formatDate, cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TR, TH, TD } from "@/components/ui/table";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Reveal } from "@/components/ui/motion";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

const FOLDER_ORDER = ["Drawings", "Contracts", "Correspondence", "General"];

export default async function DocumentsPage() {
  const user = (await getCurrentUser())!;

  const documents = await db.document.findMany({
    where: txWhere(user),
    include: { project: true },
    orderBy: { createdAt: "desc" },
  });

  const total = documents.length;
  const goodForConstruction = documents.filter((d) => d.status === "Good For Construction").length;
  const forApproval = documents.filter((d) => d.status === "For Approval").length;
  const superseded = documents.filter((d) => d.status === "Superseded").length;

  // Group by folder, ordered with known folders first, then any others.
  const byFolder = new Map<string, typeof documents>();
  for (const d of documents) {
    const list = byFolder.get(d.folder) ?? [];
    list.push(d);
    byFolder.set(d.folder, list);
  }
  const folders = [
    ...FOLDER_ORDER.filter((f) => byFolder.has(f)),
    ...[...byFolder.keys()].filter((f) => !FOLDER_ORDER.includes(f)),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Document & Drawing Management"
        subtitle="Controlled register of drawings, contracts and site correspondence"
        icon={<FolderKanban className="h-5 w-5" />}
      />

      <Reveal className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Documents" value={total} format="number" tone="brand" />
        <StatCard label="Good For Construction" value={goodForConstruction} format="number" tone="success" />
        <StatCard label="For Approval" value={forApproval} format="number" tone="info" />
        <StatCard label="Superseded" value={superseded} format="number" tone="neutral" />
      </Reveal>

      {total === 0 ? (
        <EmptyState icon={<FolderKanban className="h-5 w-5" />} title="No documents uploaded yet" />
      ) : (
        <div className="space-y-6">
          {folders.map((folder) => {
            const docs = byFolder.get(folder)!;
            return (
              <Card key={folder}>
                <CardHeader>
                  <CardTitle>{folder}</CardTitle>
                  <Badge tone="neutral">{docs.length}</Badge>
                </CardHeader>
                <CardBody>
                  <Table>
                    <THead>
                      <TR>
                        <TH>Name</TH>
                        <TH>Project</TH>
                        <TH>Revision</TH>
                        <TH>Status</TH>
                        <TH>Uploaded</TH>
                      </TR>
                    </THead>
                    <tbody>
                      {docs.map((d) => {
                        const muted = d.status === "Superseded";
                        return (
                          <TR key={d.id} className={cn(muted && "opacity-50")}>
                            <TD className={cn("font-medium", muted ? "text-muted" : "text-fg")}>
                              {d.name}
                            </TD>
                            <TD>{d.project.name}</TD>
                            <TD>
                              <Badge tone={muted ? "neutral" : "purple"}>{d.revision}</Badge>
                            </TD>
                            <TD>
                              <StatusBadge status={d.status} />
                            </TD>
                            <TD>{formatDate(d.createdAt)}</TD>
                          </TR>
                        );
                      })}
                    </tbody>
                  </Table>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
