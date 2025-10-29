import { motion, MotionProps } from 'framer-motion';
import { HTMLAttributes, forwardRef } from 'react';

// Create properly typed motion components
export const MotionDiv = forwardRef<
  HTMLDivElement,
  MotionProps & HTMLAttributes<HTMLDivElement>
>((props, ref) => <motion.div ref={ref} {...props} />);

export const MotionForm = forwardRef<
  HTMLFormElement,
  MotionProps & HTMLAttributes<HTMLFormElement>
>((props, ref) => <motion.form ref={ref} {...props} />);

MotionDiv.displayName = 'MotionDiv';
MotionForm.displayName = 'MotionForm';