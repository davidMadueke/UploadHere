# UploadHere

A standalone app for one gig night. The Host builds a Gig, each Performer has a link for their own Tracks, and the Host plays that Gig from a browser.

## People

**Host**:
The person who holds the Host link for one Gig. There is no account behind a Host.
_Avoid_: Admin, Editor, user

**Performer**:
One invited party stored on a Gig, with a Performer name and a Performer link. The same party later in the night is another Performer, and removing a Performer removes their Tracks and stops their link.
_Avoid_: Act, Guest, Musician, User, Section

**Host link**:
The secret link that is a Host's entire authority over one Gig. Whoever has it can change that Gig, play it, and download its Tracks.
_Avoid_: Account, login, password

**Performer link**:
The secret link for one Performer. Whoever has it can add, rename, replace, remove, and download that Performer's Tracks, and cannot rename the Performer, remove them, or see the rest of the Gig.
_Avoid_: Host link, Act link, shared upload link

## The night

**Gig**:
The named night a Host creates. It may have no Performers yet, and its Running order is the order of its Performers.
_Avoid_: Setlist, Show, Event

**Gig name**:
The required name of a Gig, shown to each Performer. Only the Host can change it.
_Avoid_: Performer name, Track name

**Performer name**:
The required name of a Performer, unique on that Gig. Only the Host can set or change it.
_Avoid_: Track name, Guest name

**Running order**:
The order of Performers on a Gig. The Host sets it and can move to any Performer in it, and a Track has no place in it.
_Avoid_: Setlist, track order

**Track**:
One item a Performer adds for the Host to play: an uploaded WAV, MP3, or M4A file, or a YouTube link. Replacing the file keeps the same Track, the Tracks on a Performer have no order, and the Performer may have none yet.
_Avoid_: Backing, Cue, Song

**Track name**:
The required name typed for a Track. It is unique among that Performer's Tracks, it may repeat on another Performer, and editing it keeps the same Track.
_Avoid_: Filename, optional label

**Filename**:
The name of the uploaded file on a file Track. It is not the Track name, and it changes when the file is replaced. A YouTube Track has no Filename.
_Avoid_: Track name

**Preview**:
Listening to a Track that is already on the Gig.
_Avoid_: Draft, private copy, unpublished take
