import { notFound } from "next/navigation";

import { CustomerMenu } from "@/components/menu/customer-menu";
import { getMenuData, resolveTable } from "@/lib/menu-data";

export default async function TableMenuPage(
  props: PageProps<"/menu/[restaurant]/[branch]/[table]">,
) {
  const { restaurant: restaurantSlug, branch: branchSlug, table: tableId } = await props.params;
  const data = await getMenuData(restaurantSlug, branchSlug);

  if (!data) notFound();

  const table = await resolveTable(data.branch.id, tableId);

  if (!table) notFound();

  return (
    <CustomerMenu
      restaurant={data.restaurant}
      categories={data.categories}
      tableLabel={table.label}
      branchId={data.branch.id}
      tableId={table.id}
      theme={data.theme}
    />
  );
}
