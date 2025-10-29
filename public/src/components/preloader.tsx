// "use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useLayoutEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePageLoaderStore } from "@/store/page-loader";
import { MotionDiv } from "./motion-components";
import Image from "next/image";

const Preloader = ({ reactLoaded }: { reactLoaded: boolean }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { initialLoad, setInitialLoad } = usePageLoaderStore();

  // Set up useEffect to toggle initialLoad state based on loading prop
  useEffect(() => {
    // @ts-expect-error
    window.__SETINITL = setInitialLoad;

    if (reactLoaded) {
      setTimeout(() => {
        setInitialLoad(false);

        document.documentElement.classList.add("ready");
      }, 500); // Delay hiding preloader after loading completes
    }
  }, [reactLoaded, setInitialLoad]);

  useEffect(() => {
    console.debug(`[Preloader]: Pathname: ${pathname}`);

    // TODO: Page Transition
    // setInitialLoad(true);
    // setTimeout(() => setInitialLoad(false), 500); // Delay hiding preloader after loading completes
  }, [pathname, router]);

  return (
    <AnimatePresence mode="wait">
      {initialLoad && (
        <motion.div
          key="preloader"
          initial={reactLoaded ? { clipPath: "inset(0 100% 0 0%)" } : { clipPath: "inset(0 0% 0 0%)" }}
          animate={{ clipPath: "inset(0 0% 0 0%)" }}
          exit={{ clipPath: "inset(0 0% 0 100%)" }}
          transition={{
            type: "spring",
            damping: 20,
            stiffness: 100,
            duration: 0.3,
          }}
          // @ts-ignore
          className="preloader z-[1499] fixed inset-0 bg-black text-white py-3 px-5 flex items-center justify-center"
        >
          <div>
            <div className="flex gap-3 md:gap-4 lg:gap-6 items-center">
              <Image
                src="/favicon.png"
                alt="DeVolt"
                width={64}
                height={64}
                className="w-7 md:w-10 lg:w-12 xl:w-16"
              />
              <h1 className="text-2xl md:text-4xl lg:text-5xl xl:text-7xl font-black text-white">
                DeVolt
              </h1>
            </div>
            <div className="preloader-progress h-1 w-full bg-gray-800/30 rounded-md mt-3">
              <motion.div
                animate={{ width: `100%` }}
                transition={{
                  type: "spring",
                  damping: 20,
                  stiffness: 100,
                  duration: 0.3,
                  delay: reactLoaded ? 0.5 : 0,
                }}
                // @ts-ignore
                className="preloader-bar w-0 h-full bg-white rounded-md shadow-lg shadow-white/20"
              ></motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Preloader;
