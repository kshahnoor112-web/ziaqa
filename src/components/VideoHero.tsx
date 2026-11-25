import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, Play, ShoppingBag, Volume2, VolumeX } from 'lucide-react';
import { MEDIA_ASSETS } from '../data/seedData';

interface VideoHeroProps {
  onQuickOrder: () => void;
  onBrowseMenu: () => void;
}

export const VideoHero: React.FC<VideoHeroProps> = ({ onQuickOrder, onBrowseMenu }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    videoEl.muted = true;
    const playPromise = videoEl.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        setAutoplayBlocked(true);
      });
    }
  }, []);

  const toggleMute = () => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    const nextMuted = !isMuted;
    videoEl.muted = nextMuted;
    setIsMuted(nextMuted);
    if (videoEl.paused) {
      videoEl.play().catch(() => {});
    }
  };

  const handleManualPlay = () => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    videoEl
      .play()
      .then(() => setAutoplayBlocked(false))
      .catch(() => setVideoFailed(true));
  };

  return (
    <section
      aria-label="Zaiqa Flame-Grilled Showcase"
      className="relative w-full min-h-[540px] lg:min-h-[600px] bg-[#141210] overflow-hidden flex items-end"
    >
      {/* Poster Fallback Layer */}
      <img
        src={MEDIA_ASSETS.shawarma}
        alt="Zaiqa signature flame-grilled shawarma and artisan food"
        referrerPolicy="no-referrer"
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
          videoReady && !videoFailed ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {/* Continuous Looping Showcase Video */}
      {!videoFailed && (
        <video
          ref={videoRef}
          src={MEDIA_ASSETS.showcaseVideo}
          poster={MEDIA_ASSETS.shawarma}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          preload="auto"
          onCanPlay={() => setVideoReady(true)}
          onPlaying={() => {
            setVideoReady(true);
            setAutoplayBlocked(false);
          }}
          onError={() => setVideoFailed(true)}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Measured Contrast Scrim */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-[#141210]/95 via-[#141210]/65 to-[#141210]/40"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-[#141210]/85 via-[#141210]/35 to-transparent"
        aria-hidden="true"
      />

      {/* Top-Right Video Audio & Playback Controls */}
      <div className="absolute top-5 right-5 z-20 flex items-center gap-2">
        {autoplayBlocked && !videoFailed && (
          <button
            type="button"
            onClick={handleManualPlay}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-semibold text-stone-950 shadow-sm hover:bg-amber-400 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Play className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Play Showcase</span>
          </button>
        )}
        {!videoFailed && (
          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute showcase video' : 'Mute showcase video'}
            className="inline-flex items-center gap-2 rounded-lg bg-[#141210]/75 backdrop-blur-sm border border-white/15 px-3.5 py-2 text-xs font-medium text-stone-100 hover:bg-[#141210]/90 hover:border-amber-400/50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {isMuted ? (
              <>
                <VolumeX className="w-4 h-4 text-amber-400" aria-hidden="true" />
                <span>Unmute Video</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-amber-400" aria-hidden="true" />
                <span>Mute Video</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Hero Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-12 lg:py-16">
        <div className="max-w-2xl">
          <p className="text-xs font-medium tracking-wider text-amber-400 mb-3">
            ZAIQA Kitchen · Fresh Dispatch · Lahore
          </p>
          <h1
            className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-white leading-[1.1] tracking-tight mb-4"
            style={{ textWrap: 'balance' }}
          >
            Flame-Grilled Taste, Delivered Hot to Your Door
          </h1>
          <p className="text-base sm:text-lg text-stone-200 leading-relaxed max-w-xl mb-8">
            Charcoal shawarma, double smash burgers, and wood-fired pizzas crafted fresh to order.
            Place a quick order or track your active ZAIQA delivery in real time.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={onQuickOrder}
              className="inline-flex items-center gap-2.5 rounded-lg bg-amber-500 px-6 py-3 text-sm font-semibold text-stone-950 hover:bg-amber-400 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <ShoppingBag className="w-4 h-4" aria-hidden="true" />
              <span>Place Quick Order</span>
            </button>

            <button
              type="button"
              onClick={onBrowseMenu}
              className="inline-flex items-center gap-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 px-5 py-3 text-sm font-medium text-white hover:bg-white/20 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>Explore Menu</span>
              <ArrowDown className="w-4 h-4 text-amber-400" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
