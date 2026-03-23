import { useParams, useNavigate } from "react-router-dom";
import { useUpdateEndpoint } from "@/hooks/useEndpoints.ts";
import { useEndpoint } from "@/hooks/useEndpointDetails.ts";
import { EndpointForm } from "@/components/endpoint/EndpointForm.tsx";
import type { ApiEndpointUpdate } from "@/types/index.ts";
import { Skeleton } from "@/components/common/Skeleton.tsx";
import { ErrorState } from "@/components/common/ErrorState.tsx";
import toast from "react-hot-toast";

export function EditEndpointPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: endpoint, isLoading, isError, refetch } = useEndpoint(id!);
  const mutation = useUpdateEndpoint();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <Skeleton className="h-4 w-32" />
        <div className="card p-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !endpoint) {
    return (
      <ErrorState
        message="Failed to load endpoint."
        onRetry={() => refetch()}
      />
    );
  }

  async function handleSubmit(payload: ApiEndpointUpdate) {
    await mutation.mutateAsync({ id: id!, payload });
    toast.success("Endpoint updated successfully");
    navigate(`/endpoints/${id}`);
  }

  return (
    <EndpointForm
      mode="edit"
      initialData={endpoint}
      onSubmit={handleSubmit}
      isSubmitting={mutation.isPending}
      submitLabel="Save Changes"
      backLink={{ to: `/endpoints/${id}`, label: "Back to Endpoint" }}
      headerTitle="Edit Endpoint"
    />
  );
}
