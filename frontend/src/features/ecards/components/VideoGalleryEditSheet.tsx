import { useState } from "react";
import { Clapperboard, Plus, Trash2, Video } from "lucide-react";
import EmptyStepState from "@components/EmptyStepState";
import EditSheetShell from "@components/EditSheetShell";
import {
  ECARD_CAPTION_MAX_LENGTH,
  ECARD_MAX_VIDEO_SUB_GALLERIES,
  ECARD_MAX_VIDEOS_PER_GALLERY,
  ECARD_TEXT_SHORT_MAX_LENGTH,
} from "@features/ecards/config/ecardBuilder.config";
import type {
  VideoGalleryComponentDraft,
  VideoGallerySubGalleryDraft,
  VideoGalleryVideoDraft,
} from "@features/ecards/types/ecardBuilder.types";
import {
  getEcardVideoThumbnailUrl,
  normalizeEcardVideoUrl,
} from "@features/ecards/utils/normalizeVideoUrl";

interface VideoGalleryEditSheetProps {
  open: boolean;
  draft: VideoGalleryComponentDraft;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (draft: VideoGalleryComponentDraft) => void;
}

function emptyVideoDraft(): VideoGalleryVideoDraft {
  return { videoUrl: "", caption: "" };
}

export default function VideoGalleryEditSheet({
  open,
  draft,
  isSubmitting,
  error,
  onClose,
  onSave,
}: VideoGalleryEditSheetProps) {
  const [subGalleries, setSubGalleries] = useState<VideoGallerySubGalleryDraft[]>(
    draft.subGalleries,
  );

  const hasInvalidVideo = subGalleries.some((sub) =>
    sub.videos.some(
      (video) => video.videoUrl.trim() !== "" && !normalizeEcardVideoUrl(video.videoUrl),
    ),
  );

  function addSubGallery() {
    if (subGalleries.length >= ECARD_MAX_VIDEO_SUB_GALLERIES) return;
    setSubGalleries([...subGalleries, { title: "", videos: [] }]);
  }

  function removeSubGallery(index: number) {
    setSubGalleries(subGalleries.filter((_, i) => i !== index));
  }

  function updateSubGalleryTitle(index: number, title: string) {
    setSubGalleries(
      subGalleries.map((sub, i) => (i === index ? { ...sub, title } : sub)),
    );
  }

  function addVideo(subIndex: number) {
    setSubGalleries(
      subGalleries.map((sub, i) =>
        i === subIndex ? { ...sub, videos: [...sub.videos, emptyVideoDraft()] } : sub,
      ),
    );
  }

  function updateVideoUrl(subIndex: number, videoIndex: number, videoUrl: string) {
    setSubGalleries(
      subGalleries.map((sub, i) =>
        i === subIndex
          ? {
              ...sub,
              videos: sub.videos.map((video, j) =>
                j === videoIndex ? { ...video, videoUrl } : video,
              ),
            }
          : sub,
      ),
    );
  }

  function updateVideoCaption(subIndex: number, videoIndex: number, caption: string) {
    setSubGalleries(
      subGalleries.map((sub, i) =>
        i === subIndex
          ? {
              ...sub,
              videos: sub.videos.map((video, j) =>
                j === videoIndex ? { ...video, caption } : video,
              ),
            }
          : sub,
      ),
    );
  }

  function removeVideo(subIndex: number, videoIndex: number) {
    setSubGalleries(
      subGalleries.map((sub, i) =>
        i === subIndex
          ? { ...sub, videos: sub.videos.filter((_, j) => j !== videoIndex) }
          : sub,
      ),
    );
  }

  function handleSave() {
    if (hasInvalidVideo) return;
    onSave({ type: "VIDEO_GALLERY", subGalleries });
  }

  return (
    <EditSheetShell
      open={open}
      icon={Clapperboard}
      title="Video Gallery"
      onClose={onClose}
      onSave={handleSave}
      isSubmitting={isSubmitting}
      canSave={!hasInvalidVideo}
      error={error}
    >
      {subGalleries.length === 0 && (
        <EmptyStepState icon={Clapperboard} message="No video galleries yet." />
      )}

      {subGalleries.map((subGallery, subIndex) => (
        <div
          key={subIndex}
          className="rounded-field border border-base-300 bg-base-200/50 p-3"
        >
          <div className="mb-3 flex items-center gap-2">
            <input
              value={subGallery.title}
              onChange={(event) => updateSubGalleryTitle(subIndex, event.target.value)}
              maxLength={ECARD_TEXT_SHORT_MAX_LENGTH}
              placeholder="Video gallery title (optional)"
              className="flex-1 rounded-field border border-base-300 bg-base-100 px-3 py-2 text-sm text-base-content focus:border-primary focus:outline-none"
            />
            <button
              type="button"
              onClick={() => removeSubGallery(subIndex)}
              aria-label="Remove video gallery"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-field text-error hover:bg-error/10"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {subGallery.videos.map((video, videoIndex) => {
              const trimmed = video.videoUrl.trim();
              const normalized = trimmed ? normalizeEcardVideoUrl(trimmed) : null;
              const isInvalid = trimmed !== "" && !normalized;
              const thumbnailUrl = normalized
                ? getEcardVideoThumbnailUrl(normalized)
                : null;

              return (
                <div
                  key={videoIndex}
                  className="flex items-start gap-2 rounded-field border border-base-300 bg-base-100 p-2"
                >
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-base-200">
                    {thumbnailUrl ? (
                      <img
                        src={thumbnailUrl}
                        alt="Video thumbnail"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Video className="h-6 w-6 text-base-content/40" />
                    )}
                  </div>

                  <div className="flex flex-1 flex-col gap-1">
                    <input
                      value={video.videoUrl}
                      onChange={(event) =>
                        updateVideoUrl(subIndex, videoIndex, event.target.value)
                      }
                      placeholder="https://youtube.com/watch?v=... or vimeo.com/..."
                      aria-invalid={isInvalid}
                      className={`w-full rounded-field border bg-base-100 px-3 py-2 text-sm text-base-content focus:outline-none ${
                        isInvalid
                          ? "border-error focus:border-error"
                          : "border-base-300 focus:border-primary"
                      }`}
                    />
                    {isInvalid && (
                      <p className="text-xs text-error">
                        Enter a valid YouTube or Vimeo link
                      </p>
                    )}
                    <input
                      value={video.caption}
                      onChange={(event) =>
                        updateVideoCaption(subIndex, videoIndex, event.target.value)
                      }
                      maxLength={ECARD_CAPTION_MAX_LENGTH}
                      placeholder="Caption (optional)"
                      aria-label="Video caption"
                      className="w-full rounded-field border border-base-300 bg-base-100 px-2 py-1 text-xs text-base-content focus:border-primary focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeVideo(subIndex, videoIndex)}
                    aria-label="Remove video"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-field text-error hover:bg-error/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}

            {subGallery.videos.length < ECARD_MAX_VIDEOS_PER_GALLERY && (
              <button
                type="button"
                onClick={() => addVideo(subIndex)}
                className="btn min-h-11 gap-2 rounded-field border border-dashed border-base-300 bg-base-100 text-sm text-base-content hover:bg-base-200"
              >
                <Plus className="h-4 w-4" />
                Add video
              </button>
            )}
          </div>
        </div>
      ))}

      {subGalleries.length < ECARD_MAX_VIDEO_SUB_GALLERIES && (
        <button
          type="button"
          onClick={addSubGallery}
          className="btn min-h-11 gap-2 rounded-field border border-dashed border-base-300 bg-base-100 text-sm text-base-content hover:bg-base-200"
        >
          <Plus className="h-4 w-4" />
          Add video gallery
        </button>
      )}
    </EditSheetShell>
  );
}
