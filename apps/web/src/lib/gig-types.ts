export type TrackView = {
  id: string;
  name: string;
  filename: string;
  sizeBytes: number;
  updatedAt: string;
};

export type HostPerformer = {
  id: string;
  name: string;
  linkToken: string;
  tracks: TrackView[];
};

/** Everything the Host link can see. Performers are in Running order. */
export type HostGig = {
  id: string;
  name: string;
  performers: HostPerformer[];
};

/** Everything a Performer link can see: the Gig name and that Performer's own Tracks. */
export type PerformerPage = {
  gigName: string;
  performerName: string;
  tracks: TrackView[];
};

export type PreparedUpload = {
  path: string;
  signedUrl: string;
  contentType: string;
  apiKey: string;
};
