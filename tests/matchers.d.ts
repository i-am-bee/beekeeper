import type { PatternBuilder } from '@/utils/patternBuilder';
import 'vitest';

declare module 'vitest' {
  interface ExpectStatic {
    /** Asymmetric matcher: matches a string against a PatternBuilder */
    matchPattern(pattern: PatternBuilder): any;
  }
  
  interface Assertion<T = any> {
    toMatchPattern(pattern: PatternBuilder): T;
  }
}