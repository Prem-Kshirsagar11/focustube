"use client";

import { useEffect, useRef } from "react";

interface Props {
  videoId: string;
  seekTo?: number;
  onPlay: () => void;
  onPause: () => void;
  playerRef: React.MutableRefObject<YT.Player | null>;
}

interface YTPlayer {
  new (element: HTMLElement, options: YT.PlayerOptions): YT.Player;
}

interface YTNamespace {
  Player: YTPlayer;
}

declare global {
  interface Window {
    YT: YTNamespace;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function VideoPlayer({ videoId, seekTo, onPlay, onPause, playerRef }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initPlayerRef = useRef<() => void>(() => {});

  useEffect(() => {
    let isMounted = true;
    const container = containerRef.current;

    function initPlayer() {
      if (!container || !isMounted) return;
      const el = document.createElement("div");
      container.innerHTML = "";
      container.appendChild(el);

      playerRef.current = new window.YT.Player(el, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: { autoplay: 0, modestbranding: 1, rel: 0 },
        events: {
          onReady: () => {
            if (seekTo != null) playerRef.current?.seekTo(seekTo, true);
          },
          onStateChange: (e: YT.OnStateChangeEvent) => {
            if (e.data === 1) onPlay();
            else if (e.data === 2 || e.data === 0 || e.data === 3) onPause();
          },
        },
      });
    }

    initPlayerRef.current = initPlayer;

    if (window.YT?.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
      if (!document.getElementById("yt-api")) {
        const s = document.createElement("script");
        s.id = "yt-api";
        s.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(s);
      }
    }

    return () => {
      isMounted = false;
      window.onYouTubeIframeAPIReady = () => {};
      try {
        playerRef.current?.destroy();
      } catch {}
      playerRef.current = null;
      if (container) container.innerHTML = "";
    };
  }, [videoId, seekTo, onPlay, onPause, playerRef]);

  return (
    <div style={{
      position: "relative", width: "100%", paddingBottom: "56.25%",
      minHeight: 0, maxHeight: "calc(100vh - 200px)"
    }}>
      <div ref={containerRef} style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
        width: "100%", height: "100%", overflow: "hidden", borderRadius: 8
      }} />
    </div>
  );
}