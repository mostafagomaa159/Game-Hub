import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

const Countdown = ({ targetDate, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const diff = new Date(targetDate) - now;

      if (diff <= 0) {
        setTimeLeft({ h: 0, m: 0, s: 0 });
        if (onExpire) onExpire();
        return true;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);

      setTimeLeft((prev) =>
        prev.h === h && prev.m === m && prev.s === s ? prev : { h, m, s }
      );
      return false;
    };

    const timer = setInterval(() => {
      if (updateCountdown()) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onExpire]);

  const formatTime = (value) => (value < 10 ? `0${value}` : value);

  return (
    <span className="font-mono font-semibold">
      {formatTime(timeLeft.h)}h {formatTime(timeLeft.m)}m{" "}
      {formatTime(timeLeft.s)}s
    </span>
  );
};

Countdown.propTypes = {
  targetDate: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(Date),
  ]).isRequired,
  onExpire: PropTypes.func,
};

export default Countdown;
