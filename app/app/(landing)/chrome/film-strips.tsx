"use client";

import { useEffect, useState } from "react";

function Strip({ position }: { position: "top" | "bottom" }) {
  const [count, setCount] = useState(80);

  useEffect(() => {
    const compute = () => setCount(Math.ceil(window.innerWidth / 17) + 6);
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  return (
    <div
      className={`lv2-filmstrip lv2-filmstrip--${position}`}
      aria-hidden="true"
    >
      <div className="lv2-filmstrip__track">
        {Array.from({ length: count }).map((_, i) => (
          <span key={i} className="lv2-sprocket" />
        ))}
      </div>
    </div>
  );
}

export function FilmStrips() {
  return (
    <>
      <Strip position="top" />
      <Strip position="bottom" />
    </>
  );
}
