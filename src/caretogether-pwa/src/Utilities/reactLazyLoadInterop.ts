import * as ReactLazyLoad from 'react-lazyload';
import type LazyLoadDefault from 'react-lazyload';

// react-lazyload is published as CommonJS, while this app is bundled as ESM.
// Depending on how Vite optimizes the dependency, the component can appear as
// either module.default or module.default.default at runtime.
type LazyLoadComponent = typeof LazyLoadDefault;
type LazyLoadModule = {
  default?: LazyLoadComponent | LazyLoadModule;
  forceCheck?: () => void;
};

function isLazyLoadComponent(value: unknown): value is LazyLoadComponent {
  return typeof value === 'function';
}

function isLazyLoadModule(value: unknown): value is LazyLoadModule {
  return typeof value === 'object' && value !== null;
}

const moduleValue = ReactLazyLoad as unknown as LazyLoadModule;
const defaultValue = moduleValue.default;

// Normalize the import to the actual React component before JSX renders it.
// React throws "Element type is invalid" if it receives the module object.
const LazyLoad = (
  isLazyLoadComponent(defaultValue)
    ? defaultValue
    : isLazyLoadModule(defaultValue) &&
        isLazyLoadComponent(defaultValue.default)
      ? defaultValue.default
      : ReactLazyLoad
) as LazyLoadComponent;

// Keep forceCheck behind the same compatibility boundary so callers do not
// need to know which CommonJS/ESM shape Vite produced.
const forceCheck =
  moduleValue.forceCheck ??
  (isLazyLoadModule(defaultValue) ? defaultValue.forceCheck : undefined) ??
  (() => undefined);

export { forceCheck, LazyLoad };
