"use client";

import { useEffect } from "react";

const ResetScroll = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return <></>;
};

export default ResetScroll;
