import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminUsersPage() {
  const admin = createAdminClient();
  const { data } = await admin.auth.admin.listUsers({ perPage: 50 });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-muted-foreground">Everyone with a THALIQ account.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All users</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {(data?.users ?? []).map((user) => (
            <div key={user.id} className="flex items-center justify-between border-b py-2 last:border-0">
              <div>
                <p className="font-medium">{user.email ?? user.phone ?? user.id}</p>
                <p className="text-xs text-muted-foreground">
                  Joined {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
          {(!data?.users || data.users.length === 0) && (
            <p className="text-sm text-muted-foreground">No users yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
