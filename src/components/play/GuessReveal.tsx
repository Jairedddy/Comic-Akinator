"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import type { Character } from "@/lib/engine/types";

type Props = {
  character: Character;
  turn: number;
  onYes: () => void;
  onNo: () => void;
};

// Esc and outside-click are intentionally swallowed: every dismissal must go
// through Yes or Nope so the engine sees a deliberate answer.
//
// NOTE: parent must pass `key={character.id}` so a new suspect remounts this
// component — that resets the image-load and pending flags without an effect.

export function GuessReveal({ character, turn, onYes, onNo }: Props) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [pending, setPending] = useState(false);

  const handleYes = () => {
    if (pending) return;
    setPending(true);
    onYes();
  };
  const handleNo = () => {
    if (pending) return;
    setPending(true);
    onNo();
  };

  const showImage = !imgFailed;

  return (
    <Dialog.Root open modal>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in"
        />
        <Dialog.Content
          aria-describedby={undefined}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          className={[
            "fixed left-1/2 top-1/2 z-50 w-[min(92vw,520px)] -translate-x-1/2 -translate-y-1/2",
            "border-border-strong bg-bg-detail border-[3px] p-6 sm:p-8",
            "shadow-[8px_8px_0_var(--color-bg-card)] -rotate-[0.4deg]",
            "focus:outline-none",
          ].join(" ")}
        >
          <span
            aria-hidden
            className="border-accent/40 pointer-events-none absolute inset-1.5 border border-dashed"
          />

          <span className="bg-villain font-display inline-block -rotate-2 px-3 py-1 text-sm tracking-[0.2em] text-white shadow-[3px_3px_0_var(--color-bg-card)]">
            IS IT…?
          </span>

          <Dialog.Title asChild>
            <h2 className="text-accent font-display mt-3 text-3xl leading-none tracking-[2px] [text-shadow:3px_3px_0_var(--color-villain),6px_6px_0_var(--color-bg-card)] sm:text-4xl">
              {character.name.toUpperCase()}
            </h2>
          </Dialog.Title>

          <p className="text-ink-dim mt-2 text-sm">
            Guessed in {turn} question{turn === 1 ? "" : "s"}.
          </p>

          <div className="border-border-soft bg-bg relative mt-5 aspect-[5/6] w-full overflow-hidden border-2">
            {!imgLoaded && showImage && (
              <div
                aria-hidden
                className="bg-bg-card/60 absolute inset-0 animate-pulse"
              />
            )}
            {showImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={character.image}
                alt={character.name}
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgFailed(true)}
                className={[
                  "h-full w-full object-cover transition-opacity duration-300",
                  imgLoaded ? "opacity-100" : "opacity-0",
                ].join(" ")}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src="/silhouette.svg"
                alt=""
                aria-hidden
                className="h-full w-full object-cover"
              />
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              autoFocus
              onClick={handleYes}
              disabled={pending}
              className={[
                "border-victory text-victory hover:bg-victory hover:text-bg",
                "font-display border-2 px-5 py-2 text-xl tracking-[2px] transition-colors",
                "focus-visible:ring-victory focus-visible:ring-offset-bg-detail",
                "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                "disabled:cursor-not-allowed disabled:opacity-50",
              ].join(" ")}
            >
              YES!
            </button>
            <button
              type="button"
              onClick={handleNo}
              disabled={pending}
              className={[
                "border-villain text-villain hover:bg-villain hover:text-white",
                "font-display border-2 px-5 py-2 text-xl tracking-[2px] transition-colors",
                "focus-visible:ring-villain focus-visible:ring-offset-bg-detail",
                "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                "disabled:cursor-not-allowed disabled:opacity-50",
              ].join(" ")}
            >
              NOPE
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
