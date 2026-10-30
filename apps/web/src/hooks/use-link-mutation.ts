import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";

/** A write through a Host or Performer link. Errors become toasts and the page refetches either way. */
export function useLinkMutation<TVariables>(
  queryKey: QueryKey,
  mutationFn: (variables: TVariables) => Promise<unknown>,
  onSuccess?: (variables: TVariables) => void,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (_data, variables) => onSuccess?.(variables),
    onError: (error) => toast.error(error.message),
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}
