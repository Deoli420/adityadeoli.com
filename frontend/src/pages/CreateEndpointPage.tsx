import { useNavigate } from "react-router-dom";
import { useCreateEndpoint } from "@/hooks/useEndpoints.ts";
import { EndpointForm } from "@/components/endpoint/EndpointForm.tsx";
import type { ApiEndpointCreate } from "@/types/index.ts";
import toast from "react-hot-toast";

export function CreateEndpointPage() {
  const navigate = useNavigate();
  const mutation = useCreateEndpoint();

  async function handleSubmit(payload: ApiEndpointCreate) {
    await mutation.mutateAsync(payload);
    toast.success("Endpoint created successfully");
    navigate("/");
  }

  return (
    <EndpointForm
      mode="create"
      onSubmit={handleSubmit}
      isSubmitting={mutation.isPending}
      submitLabel="Create Endpoint"
      backLink={{ to: "/", label: "Back to Dashboard" }}
      headerTitle="Add Endpoint"
    />
  );
}
