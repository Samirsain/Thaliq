import { notFound } from "next/navigation";

import { CustomerMenu } from "@/components/menu/customer-menu";
import { getMenuData } from "@/lib/menu-data";

export default async function BranchMenuPage(props: PageProps<"/menu/[restaurant]/[branch]">) {
  const { restaurant: restaurantSlug, branch: branchSlug } = await props.params;
  const data = await getMenuData(restaurantSlug, branchSlug);

  if (!data) notFound();

  return <CustomerMenu restaurant={data.restaurant} categories={data.categories} />;
}
