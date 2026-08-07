import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export default function CartAnimation() {
  const cartRef = useRef(null);
  const mustardRef = useRef(null);
  const meatRef = useRef(null);
  const sodaRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline({
      repeat: -1,
      defaults: {
        ease: "power1.out",
      },
    });

    gsap.set(mustardRef.current, {
      x: -250,
      scale: 2,
      opacity: 0,
    });

    gsap.set(meatRef.current, {
      x: 250,
      scale: 2,
      opacity: 0,
    });

    gsap.set(sodaRef.current, {
      x: -170,
      scale: 2,
      opacity: 0,
    });

    tl.to(
      cartRef.current,
      {
        duration: 2.2,
        x: 700,
        ease: "slow(0.5,0.5,false)",
      },
      0
    )

      .to(
        mustardRef.current,
        {
          duration: 0.8,
          opacity: 1,
          scale: 1,
          motionPath: {
            path: [
              { x: -250, y: 0 },
              { x: -100, y: -90 },
              { x: 0, y: 0 },
            ],
          },
        },
        0.4
      )

      .to(
        mustardRef.current,
        {
          duration: 0.2,
          scale: 0,
        },
        0.8
      )

      .to(
        meatRef.current,
        {
          duration: 0.8,
          opacity: 1,
          scale: 1,
          motionPath: {
            path: [
              { x: 250, y: 0 },
              { x: 150, y: -80 },
              { x: 60, y: 0 },
            ],
          },
        },
        0.8
      )

      .to(
        meatRef.current,
        {
          duration: 0.2,
          scale: 0,
        },
        1.2
      )

      .to(
        sodaRef.current,
        {
          duration: 0.7,
          opacity: 1,
          scale: 1,
          motionPath: {
            path: [
              { x: -170, y: 0 },
              { x: -80, y: -70 },
              { x: 70, y: 0 },
            ],
          },
        },
        1.2
      )

      .to(
        sodaRef.current,
        {
          duration: 0.15,
          scale: 0,
        },
        1.5
      );
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center py-20 overflow-hidden">
      {/* Flying Items */}

      {/* <div
        ref={mustardRef}
        className="absolute left-1/2 top-10 w-16 origin-center"
      >
        <Mustard />
      </div>

      <div
        ref={meatRef}
        className="absolute left-1/2 top-10 w-16 origin-center"
      >
        <Meat />
      </div>

      <div
        ref={sodaRef}
        className="absolute left-1/2 top-10 w-16 origin-center"
      >
        <Soda />
      </div> */}

      {/* Cart */}

      <div ref={cartRef} className="mt-28 w-40">
        <Cart />
      </div>
    </div>
  );
}

/* ---------------- SVG Components ---------------- */

function Cart() {
  return (
    <svg viewBox="0 0 512 512" className="w-full">
      <circle cx="376.8" cy="440" r="55" />
      <circle cx="192" cy="440" r="55" />
      <polygon points="128,0 0.8,0 0.8,32 104.8,32 136.8,124.8 170.4,124.8" />
      <polygon
        fill="#32BEA6"
        points="250.4,49.6 224,124.8 411.2,124.8"
      />
      <polygon
        fill="#FF583E"
        points="411.2,124.8 224,124.8 170.4,124.8 136.8,124.8 68,124.8 141.6,361.6 427.2,361.6 511.2,124.8"
      />
      <rect x="166.4" y="185.6" width="255.2" height="16" fill="white" />
      <rect x="166.4" y="237.6" width="166.4" height="16" fill="white" />
    </svg>
  );
}

function Mustard() {
  return (
    <svg viewBox="0 0 58 58" className="w-full">
      <rect x="16" y="11" width="26" height="47" rx="2" fill="#ED7161" />
      <circle cx="29" cy="36" r="10" fill="#D13834" />
    </svg>
  );
}

function Meat() {
  return (
    <svg viewBox="0 0 50 50" className="w-full">
      <ellipse cx="25" cy="25" rx="23" ry="20" fill="#D75A4A" />
      <circle cx="33" cy="13" r="4" fill="white" />
    </svg>
  );
}

function Soda() {
  return (
    <svg viewBox="0 0 49 49" className="w-full">
      <rect
        x="10"
        y="2"
        width="29"
        height="45"
        rx="3"
        fill="#E22F37"
      />
      <rect x="10" y="20" width="29" height="18" fill="#F9D70B" />
    </svg>
  );
}