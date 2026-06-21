import { useEffect, useState } from "react";

const CountdownTimer = ({ onExpire }) => {
  const [time, setTime] = useState(600);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (time === 0 && onExpire) onExpire();
  }, [time, setTime]);

  const minutes = Math.floor(time / 60);
  const seconds = time % 60;

  return (
    <h2>
      {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
    </h2>
  );
};

export default CountdownTimer;
