import type { Metadata } from "next";
import { toggleUserActive } from "@/actions/users";
import { UserForm } from "@/components/user-form";
import { Badge, Card, CardHeader, PageHeader, Table, Td, Th, buttonClass } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Team" };
export const dynamic = "force-dynamic";

export default async function Users() {
  const me = await requireAdmin();
  const users = await db.user.findMany({ orderBy: { createdAt: "asc" } });
  return (
    <>
      <PageHeader title="Team" description="People who can sign in. Deactivate someone to revoke access immediately." />
      <Card>
        <Table>
          <thead><tr><Th>Name</Th><Th>Role</Th><Th>Added</Th><Th>Status</Th><Th><span className="sr-only">Actions</span></Th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <Td><span className="font-medium text-slate-900">{u.name}</span><div className="text-xs text-slate-500">{u.email}</div></Td>
                <Td>{u.role === "ADMIN" ? "Administrator" : "Staff"}</Td>
                <Td>{formatDate(u.createdAt)}</Td>
                <Td>{u.active ? <Badge tone="green">Active</Badge> : <Badge>Deactivated</Badge>}</Td>
                <Td className="text-right">
                  {u.id !== me.id && (
                    <form action={toggleUserActive.bind(null, u.id)}>
                      <button className={buttonClass(u.active ? "danger" : "secondary", "sm")}>{u.active ? "Deactivate" : "Reactivate"}</button>
                    </form>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
      <Card className="mt-6">
        <CardHeader title="Add team member" />
        <UserForm />
      </Card>
    </>
  );
}
