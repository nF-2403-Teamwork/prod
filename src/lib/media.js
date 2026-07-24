// Voice / video message capture helpers built on MediaRecorder. Recordings are
// encoded to compact data URLs so they ride the same socket path as image/file
// attachments — no separate upload service. Callers cap size (the server socket
// buffer is ~5MB) and duration.

export const supportsRecording = () =>
  typeof navigator !== "undefined" &&
  Boolean(navigator.mediaDevices?.getUserMedia) &&
  typeof window !== "undefined" &&
  typeof window.MediaRecorder !== "undefined";

export function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error("Could not read the recording"));
    r.readAsDataURL(blob);
  });
}

// First MIME type the browser can actually record from a candidate list.
function pickMime(candidates) {
  if (typeof MediaRecorder === "undefined") return "";
  for (const t of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(t)) return t;
    } catch {
      /* isTypeSupported can throw on odd inputs — keep looking */
    }
  }
  return "";
}

const audioMime = () =>
  pickMime(["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"]);
const videoMime = () =>
  pickMime([
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ]);

// Open the mic (and camera when `video`) and start a MediaRecorder. Returns a
// controller: `stream` for a live preview, `stop()` → recorded Blob, `cancel()`
// to discard. Both stop paths release the camera/mic tracks.
export async function startRecording({ video = false } = {}) {
  const constraints = video
    ? { audio: true, video: { facingMode: "user", width: 480, height: 480 } }
    : { audio: true };
  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  const mimeType = video ? videoMime() : audioMime();

  let rec;
  try {
    rec = new MediaRecorder(stream, {
      ...(mimeType ? { mimeType } : {}),
      ...(video ? { videoBitsPerSecond: 800_000 } : { audioBitsPerSecond: 64_000 }),
    });
  } catch {
    // Some browsers reject the options bag — fall back to defaults.
    rec = new MediaRecorder(stream);
  }

  const chunks = [];
  rec.ondataavailable = (e) => {
    if (e.data && e.data.size) chunks.push(e.data);
  };
  const releaseTracks = () => stream.getTracks().forEach((t) => t.stop());
  rec.start();

  return {
    stream,
    mimeType: mimeType || (video ? "video/webm" : "audio/webm"),
    stop() {
      return new Promise((resolve) => {
        rec.onstop = () => {
          releaseTracks();
          resolve(new Blob(chunks, { type: mimeType || undefined }));
        };
        try {
          rec.stop();
        } catch {
          releaseTracks();
          resolve(new Blob(chunks, { type: mimeType || undefined }));
        }
      });
    },
    cancel() {
      rec.onstop = null;
      try {
        rec.stop();
      } catch {
        /* already stopped */
      }
      releaseTracks();
    },
  };
}

// "m:ss" clock for durations / elapsed time.
export const fmtClock = (s) => {
  const sec = Math.max(0, Math.round(s || 0));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
};
