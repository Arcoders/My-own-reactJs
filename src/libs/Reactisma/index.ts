import {
  createElement,
  render,
  Fragment,
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
  useReducer,
  useContext,
  useImperativeHandle,
  useId,
  useTransition,
  useDeferredValue,
  useDeepCompareEffect,
  createContext,
  withErrorBoundary,
} from './core';
import { startTransition, runWithPriority } from './scheduler';
import { DevTools } from './devtools';
import { Suspense, lazy } from './concurrent';
import { renderToString, hydrate, extractCritical } from './ssr';

const Reactisma = {
  createElement,
  render,
  Fragment,
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
  useReducer,
  useContext,
  useImperativeHandle,
  useId,
  useTransition,
  useDeferredValue,
  useDeepCompareEffect,
  createContext,
  withErrorBoundary,
  startTransition,
  runWithPriority,
  DevTools,
  Suspense,
  lazy,
  renderToString,
  hydrate,
  extractCritical,
};

export default Reactisma;
