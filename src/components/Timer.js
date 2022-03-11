import React, { useState, useEffect } from 'react'
import { WAIT_TIME } from '../constants/constants.js';
import timer_0 from '../assets/img/timer/0.png';
import timer_1 from '../assets/img/timer/1.png';
import timer_2 from '../assets/img/timer/2.png';
import timer_3 from '../assets/img/timer/3.png';
import timer_4 from '../assets/img/timer/4.png';
import timer_5 from '../assets/img/timer/5.png';
import timer_6 from '../assets/img/timer/6.png';
import timer_7 from '../assets/img/timer/7.png';
import timer_8 from '../assets/img/timer/8.png';
import timer_9 from '../assets/img/timer/9.png';
import timer_10 from '../assets/img/timer/10.png';

const arrSecImg = [
  timer_0,
  timer_1,
  timer_2,
  timer_3,
  timer_4,
  timer_5,
  timer_6,
  timer_7,
  timer_8,
  timer_9,
  timer_10,
];

var interval;

export default function Timer({ quetionNumber, currentRound, stopTimer, handleFailModal }) {

  const [timer, setTimer] = useState(WAIT_TIME);
  useEffect(() => {
    function stopCounting() {
      setTimer(WAIT_TIME);
      clearInterval(interval);
    }
    if (stopTimer === 1) {
      stopCounting();
    }
  }, [stopTimer]);

  useEffect(() => {
    if (stopTimer === 0) {
      if (timer === 0) {
        handleFailModal(true);
      }
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval)
    }
  }, [timer, stopTimer]);

  useEffect(() => {
    setTimer(WAIT_TIME);
  }, [quetionNumber, currentRound]);



  return (
    <>
      {
        timer >= 0 ? (
          <img src={arrSecImg[timer]} className="w-100" />
        ) : (
          <img src={arrSecImg[10]} className="w-100" />
        )
      }
    </>
  );
}
