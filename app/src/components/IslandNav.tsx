"use client";

import { AnimatePresence, motion } from "framer-motion";
import { List, X } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { DaisyMark } from "@/components/DaisyLogo";

const LINKS = [
  { href: "/planner", label: "planner" },
  { href: "/leetcode", label: "leetcode" },
  { href: "/", label: "home" },
];

const EASE = [0.32, 0.72, 0, 1] as const;

function Hamburger({ open }: { open: boolean }) {
  return (
    <span className="relative block h-3 w-5">
      <span
        className={`absolute left-0 top-0 h-px w-full bg-current transition-all duration-500 ${
          open ? "top-1/2 rotate-45" : ""
        }`}
        style={{ transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)" }}
      />
      <span
        className={`absolute left-0 top-1/2 h-px w-full bg-current transition-all duration-500 ${
          open ? "opacity-0" : ""
        }`}
        style={{ transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)" }}
      />
      <span
        className={`absolute bottom-0 left-0 h-px w-full bg-current transition-all duration-500 ${
          open ? "bottom-1/2 -rotate-45" : ""
        }`}
        style={{ transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)" }}
      />
    </span>
  );
}

export function IslandNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-5 z-40 flex justify-center px-4">
        <nav className="pointer-events-auto flex w-max items-center gap-1 rounded-full border border-white/10 bg-daisy-surface/80 py-2 pl-4 pr-2 backdrop-blur-2xl">
          <Link href="/" className="flex items-center gap-2.5 pr-3" aria-label="daisy home">
            <DaisyMark size={26} />
            <span className="hidden font-display text-xl italic leading-none text-daisy-text sm:block">
              daisy
            </span>
          </Link>
          <div className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => {
              const active = pathname === l.href;
              return (
                <motion.span key={l.href} whileHover={{ y: -1 }} transition={{ duration: 0.3, ease: EASE }}>
                  <Link
                    href={l.href}
                    className={`rounded-full px-4 py-2 text-sm transition-colors duration-500 ${
                      active
                        ? "bg-white/10 text-daisy-text"
                        : "text-daisy-muted hover:bg-white/5 hover:text-daisy-text"
                    }`}
                    style={{ transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)" }}
                  >
                    {l.label}
                  </Link>
                </motion.span>
              );
            })}
          </div>
          <button
            type="button"
            aria-label="menu"
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-daisy-text transition-colors duration-500 hover:bg-white/10 md:hidden"
          >
            <Hamburger open={open} />
          </button>
        </nav>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-2 bg-daisy-bg/85 backdrop-blur-3xl"
          >
            <button
              type="button"
              aria-label="close menu"
              onClick={() => setOpen(false)}
              className="absolute right-5 top-6 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-daisy-text"
            >
              <X size={18} weight="light" />
            </button>
            {LINKS.map((l, i) => (
              <motion.div
                key={l.href}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.6, ease: EASE, delay: i * 0.08 }}
              >
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`block py-3 text-center font-display text-4xl italic transition-colors duration-500 ${
                    pathname === l.href ? "text-daisy-greenhi" : "text-daisy-text hover:text-daisy-greenhi"
                  }`}
                  style={{ transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)" }}
                >
                  {l.label}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}