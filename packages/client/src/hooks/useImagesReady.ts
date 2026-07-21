import { useEffect, useMemo, useState } from "react";

const normalizeImageSources = (sources: Array<string | null | undefined>) =>
  Array.from(new Set(sources.map((source) => source?.trim()).filter(Boolean) as string[]));

export const useImagesReady = (
  sources: Array<string | null | undefined>,
  enabled = true,
) => {
  const sourceKey = sources.join("\n");
  const imageSources = useMemo(
    () => normalizeImageSources(sources),
    [sourceKey],
  );
  const [ready, setReady] = useState(!enabled || imageSources.length === 0);

  useEffect(() => {
    if (!enabled || imageSources.length === 0) {
      setReady(true);
      return;
    }

    let cancelled = false;
    setReady(false);

    const preload = async () => {
      await Promise.all(
        imageSources.map(
          (source) =>
            new Promise<void>((resolve) => {
              const image = new Image();
              image.onload = () => resolve();
              image.onerror = () => resolve();
              image.src = source;
              if (image.complete) resolve();
            }),
        ),
      );

      if (!cancelled) {
        setReady(true);
      }
    };

    void preload();

    return () => {
      cancelled = true;
    };
  }, [enabled, imageSources]);

  return ready;
};
