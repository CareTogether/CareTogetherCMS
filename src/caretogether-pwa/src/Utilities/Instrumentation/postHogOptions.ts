import { PostHogConfig } from 'posthog-js';

export const postHogOptions: Partial<PostHogConfig> = {
  session_recording: {
    // `maskTextFn` only applies to selected elements, so make sure to set to "*" if you want this to work globally.
    maskTextSelector: '*',
    maskTextFn: (text, element) => {
      // To unmask text in a specific element, add the class `ph-unmask` to that element or the closest possible parent.
      // Sometimes adding the class to the element itself is difficult due to how the 3rd party component was implemented,
      // so you may need to add it to a parent.
      // Adding it to an element too high up in the DOM tree may unmask more text than you want and cause performance issues,
      // as the browser will have to work more to find an element with that class in the elements tree.
      if (element?.closest('.ph-unmask') !== null) {
        return text;
      }

      return '*'.repeat(text.length);
    },
    maskInputFn: (text, element) => {
      // See note on `maskTextFn` above.
      if (element?.closest('.ph-unmask') !== null) {
        return text;
      }

      return '*'.repeat(text.length);
    },
  },
  mask_all_text: true,
};
