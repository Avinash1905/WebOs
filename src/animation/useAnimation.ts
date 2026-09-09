import { useThemeStore } from '../stores/themeStore';
import { MOTION_DURATIONS, MOTION_EASINGS } from './motionTokens';

export interface TransitionOptions {
  duration?: keyof typeof MOTION_DURATIONS | number;
  easing?: keyof typeof MOTION_EASINGS | string;
  property?: string;
}

export const useAnimation = () => {
  const reducedMotion = useThemeStore((state) => state.reducedMotion);

  const getTransitionStyle = (options?: TransitionOptions): string => {
    if (reducedMotion) return 'none';

    const duration =
      typeof options?.duration === 'number'
        ? `${options.duration}ms`
        : typeof options?.duration === 'string'
        ? `${MOTION_DURATIONS[options.duration]}ms`
        : `${MOTION_DURATIONS.normal}ms`;

    const easing =
      options?.easing && options.easing in MOTION_EASINGS
        ? MOTION_EASINGS[options.easing as keyof typeof MOTION_EASINGS]
        : options?.easing || MOTION_EASINGS.standard;

    const property = options?.property || 'all';

    return `${property} ${duration} ${easing}`;
  };

  return {
    reducedMotion,
    getTransitionStyle,
  };
};
