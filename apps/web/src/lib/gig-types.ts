/** A Gig as the home page lists it. The Host link is included because this version has no accounts. */
export type GigListItem = {
  id: string;
  name: string;
  hostToken: string;
  createdAt: string;
  performerCount: number;
};

export type TrackView = {
  id: string;
  name: string;
  updatedAt: string;
} & (
  | { source: "file"; filename: string; sizeBytes: number; youtubeVideoId: null }
  | { source: "youtube"; filename: null; sizeBytes: null; youtubeVideoId: string }
);

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
