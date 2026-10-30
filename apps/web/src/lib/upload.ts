import type { PreparedUpload } from "./gig-types";

/** PUTs the raw file to a Supabase signed upload URL. XHR rather than fetch because fetch
 *  can't report upload progress. */
export function putFile(
  prepared: PreparedUpload,
  file: File,
  onProgress: (fraction: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", prepared.signedUrl);
    request.setRequestHeader("content-type", prepared.contentType);
    request.setRequestHeader("x-upsert", "false");
    request.setRequestHeader("apikey", prepared.apiKey);

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress(1);
        resolve();
      } else {
        reject(new Error(`The upload was refused (${request.status}). Try again.`));
      }
    };
    request.onerror = () => reject(new Error("The upload failed. Check your connection and try again."));
    request.send(file);
  });
}
