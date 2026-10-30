import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { linkTokenSchema, nameSchema } from "@/lib/validation";
import * as store from "@/server/store";

// Every call is POST so link tokens travel in the body, not in server-function URLs.

export const createGig = createServerFn({ method: "POST" })
  .validator(z.object({ name: nameSchema }))
  .handler(({ data }) => store.createGig(data.name));

export const getHostGig = createServerFn({ method: "POST" })
  .validator(z.object({ token: linkTokenSchema }))
  .handler(({ data }) => store.getHostGig(data.token));

export const renameGig = createServerFn({ method: "POST" })
  .validator(z.object({ token: linkTokenSchema, name: nameSchema }))
  .handler(({ data }) => store.renameGig(data.token, data.name));

export const addPerformer = createServerFn({ method: "POST" })
  .validator(z.object({ token: linkTokenSchema, name: nameSchema }))
  .handler(({ data }) => store.addPerformer(data.token, data.name));

export const renamePerformer = createServerFn({ method: "POST" })
  .validator(z.object({ token: linkTokenSchema, performerId: z.uuid(), name: nameSchema }))
  .handler(({ data }) => store.renamePerformer(data.token, data.performerId, data.name));

export const removePerformer = createServerFn({ method: "POST" })
  .validator(z.object({ token: linkTokenSchema, performerId: z.uuid() }))
  .handler(({ data }) => store.removePerformer(data.token, data.performerId));

export const setRunningOrder = createServerFn({ method: "POST" })
  .validator(z.object({ token: linkTokenSchema, performerIds: z.array(z.uuid()) }))
  .handler(({ data }) => store.setRunningOrder(data.token, data.performerIds));

export const getHostTrackUrl = createServerFn({ method: "POST" })
  .validator(z.object({ token: linkTokenSchema, trackId: z.uuid(), download: z.boolean() }))
  .handler(({ data }) => store.hostTrackUrl(data.token, data.trackId, data.download));
