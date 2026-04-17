import React from "react";
import Confetti from "react-confetti";

export default function ConfettiOnly({ isActive = true }) {
  if (!isActive) return null;

  return (
    <Confetti
      width={window.innerWidth}
      height={window.innerHeight}
      numberOfPieces={500}
      recycle={false}
      gravity={0.2}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 1500,
        pointerEvents: "none",
      }}
    />
  );
}
