import { redirect } from "next/navigation";

export default function CMSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: Add CMS auth check
  // const session = await getSession();
  // if (!session || !['admin', 'editor'].includes(session.role)) redirect("/login");

  return (
    <div className="min-h-screen bg-surface">
      {/* CMS sidebar and header will go here */}
      <main className="p-6">{children}</main>
    </div>
  );
}
