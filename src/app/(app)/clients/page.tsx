import { getClients } from "@/app/actions/clients";
import { ClientsView } from "./clients-view";

export default async function ClientsPage() {
  const clients = await getClients();
  return <ClientsView clients={clients as Parameters<typeof ClientsView>[0]["clients"]} />;
}
