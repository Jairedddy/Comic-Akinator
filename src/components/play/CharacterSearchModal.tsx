"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Fuse from "fuse.js";
import { useMemo, useRef, useState } from "react";
import type { Character } from "@/lib/engine/types";

type Props = {
  open: boolean;
  characters: readonly Character[];
  onPick: (characterId: string) => void;
  onClose: () => void;
};

const MAX_RESULTS = 20;
const FUSE_OPTIONS: ConstructorParameters<typeof Fuse<Character>>[1] = {
  keys: [
    { name: "name", weight: 0.6 },
    { name: "aliases", weight: 0.25 },
    { name: "realName", weight: 0.15 },
  ],
  threshold: 0.35,
  ignoreLocation: true,
  minMatchCharLength: 1,
};

export function CharacterSearchModal({ open, characters, onPick, onClose }: Props) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const fuse = useMemo(
    () => new Fuse(characters as Character[], FUSE_OPTIONS),
    [characters],
  );

  const results = useMemo<Character[]>(() => {
    const q = query.trim();
    if (!q) {
      // Empty query → preview a few mainstream picks so the panel isn't blank.
      return characters.slice(0, 12) as Character[];
    }
    return fuse.search(q, { limit: MAX_RESULTS }).map((r) => r.item);
  }, [fuse, query, characters]);

  // Note: parent passes a fresh `key` whenever the modal re-opens so this
  // component remounts and useState defaults to "". Avoids a setState-in-effect
  // cascade.

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => {
            // Default would focus the close button; we want the input.
            e.preventDefault();
            inputRef.current?.focus();
          }}
          className={[
            "fixed left-1/2 top-1/2 z-50 w-[min(92vw,560px)] -translate-x-1/2 -translate-y-1/2",
            "border-border-strong bg-bg-detail border-[3px] p-5 sm:p-6",
            "shadow-[8px_8px_0_var(--color-bg-card)] -rotate-[0.3deg]",
            "focus:outline-none",
          ].join(" ")}
        >
          <span
            aria-hidden
            className="border-accent/40 pointer-events-none absolute inset-1.5 border border-dashed"
          />

          <Dialog.Title asChild>
            <h2 className="text-accent font-display text-2xl tracking-[2px] sm:text-3xl">
              WHO WAS IT?
            </h2>
          </Dialog.Title>
          <p className="text-ink-dim mt-1 text-xs tracking-wide">
            Type a name and pick the one you had in mind.
          </p>

          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Marvel + DC characters…"
            autoComplete="off"
            spellCheck={false}
            aria-label="Search characters"
            className={[
              "border-border-soft bg-bg-card text-ink mt-4 w-full border-2 px-4 py-2 text-base",
              "focus-visible:ring-accent focus-visible:ring-offset-bg-detail",
              "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
              "placeholder:text-ink-dimmer",
            ].join(" ")}
          />

          <div
            role="listbox"
            aria-label="Character results"
            className="mt-4 max-h-[50vh] overflow-y-auto"
          >
            {results.length === 0 ? (
              <p className="text-ink-dimmer px-1 py-6 text-center text-sm">
                No matches. Try a shorter name or an alias.
              </p>
            ) : (
              <ul className="grid gap-1.5">
                {results.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={false}
                      onClick={() => onPick(c.id)}
                      className={[
                        "border-border-soft bg-bg-card hover:border-accent hover:text-accent",
                        "flex w-full items-center gap-3 border px-3 py-2 text-left transition-colors",
                        "focus-visible:ring-accent focus-visible:ring-offset-bg-detail",
                        "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                      ].join(" ")}
                    >
                      <span className="font-display text-ink text-base">{c.name}</span>
                      <span className="text-ink-dimmer text-xs uppercase tracking-wider">
                        {c.publisher}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-4 flex justify-end">
            <Dialog.Close asChild>
              <button
                type="button"
                className={[
                  "border-border-soft text-ink-dim hover:text-ink hover:border-accent",
                  "font-display border-2 px-4 py-1.5 text-sm tracking-[2px] transition-colors",
                  "focus-visible:ring-accent focus-visible:ring-offset-bg-detail",
                  "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                ].join(" ")}
              >
                CANCEL
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
