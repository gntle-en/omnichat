import { registerHooks } from 'node:module';

registerHooks({
  /**
   * Resolve extensionless relative TypeScript imports when running Node tests directly.
   */
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (err) {
      if (
        err &&
        err.code === 'ERR_MODULE_NOT_FOUND' &&
        (specifier.startsWith('./') || specifier.startsWith('../')) &&
        !/\.[a-z]+$/i.test(specifier)
      ) {
        for (const candidate of [`${specifier}.ts`, `${specifier}/index.ts`]) {
          try {
            return nextResolve(candidate, context);
          } catch {
            // Try next extensionless TS candidate.
          }
        }
      }
      throw err;
    }
  },
});
