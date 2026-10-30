import { queryOptions } from "@tanstack/react-query";

import { getHostGig } from "@/functions/host";
import { getPerformerPage } from "@/functions/performer";

/** Performers add Tracks during the night, so the Host's view polls. */
const HOST_REFRESH_MS = 15_000;

export const hostGigQuery = (token: string) =>
  queryOptions({
    queryKey: ["host-gig", token],
    queryFn: () => getHostGig({ data: { token } }),
    refetchInterval: HOST_REFRESH_MS,
  });

export const performerPageQuery = (token: string) =>
  queryOptions({
    queryKey: ["performer-page", token],
    queryFn: () => getPerformerPage({ data: { token } }),
  });
