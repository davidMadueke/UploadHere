import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { linkTokenSchema, nameSchema } from "@/lib/validation";
import * as store from "@/server/store";

const filename = z.string().trim().min(1).max(255);
const sizeBytes = z.number().int().positive();
const storagePath = z.string().min(1).max(200);

export const getPerformerPage = createServerFn({ method: "POST" })
  .validator(z.object({ token: linkTokenSchema }))
  .handler(({ data }) => store.getPerformerPage(data.token));

export const prepareNewTrack = createServerFn({ method: "POST" })
  .validator(z.object({ token: linkTokenSchema, name: nameSchema, filename, sizeBytes }))
  .handler(({ data: { token, ...input } }) => store.prepareNewTrack(token, input));

export const saveNewTrack = createServerFn({ method: "POST" })
  .validator(z.object({ token: linkTokenSchema, path: storagePath, name: nameSchema, filename }))
  .handler(({ data: { token, ...input } }) => store.saveNewTrack(token, input));

export const prepareReplacement = createServerFn({ method: "POST" })
  .validator(z.object({ token: linkTokenSchema, trackId: z.uuid(), filename, sizeBytes }))
  .handler(({ data: { token, ...input } }) => store.prepareReplacement(token, input));

export const saveReplacement = createServerFn({ method: "POST" })
  .validator(z.object({ token: linkTokenSchema, trackId: z.uuid(), path: storagePath, filename }))
  .handler(({ data: { token, ...input } }) => store.saveReplacement(token, input));

export const renameTrack = createServerFn({ method: "POST" })
  .validator(z.object({ token: linkTokenSchema, trackId: z.uuid(), name: nameSchema }))
  .handler(({ data }) => store.renameTrack(data.token, data.trackId, data.name));

export const removeTrack = createServerFn({ method: "POST" })
  .validator(z.object({ token: linkTokenSchema, trackId: z.uuid() }))
  .handler(({ data }) => store.removeTrack(data.token, data.trackId));

export const getPerformerTrackUrl = createServerFn({ method: "POST" })
  .validator(z.object({ token: linkTokenSchema, trackId: z.uuid(), download: z.boolean() }))
  .handler(({ data }) => store.performerTrackUrl(data.token, data.trackId, data.download));
