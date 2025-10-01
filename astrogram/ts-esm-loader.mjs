import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const TS_EXTENSIONS = ['.ts', '.tsx'];
const RESOLVE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

export async function resolve(specifier, context, defaultResolve) {
  try {
    return await defaultResolve(specifier, context, defaultResolve);
  } catch (error) {
    if (error.code !== 'ERR_MODULE_NOT_FOUND') {
      throw error;
    }

    if (specifier.startsWith('node:') || specifier.startsWith('data:')) {
      throw error;
    }

    for (const ext of RESOLVE_EXTENSIONS) {
      const candidate = specifier.endsWith(ext) ? specifier : `${specifier}${ext}`;
      try {
        const resolved = await defaultResolve(candidate, context, defaultResolve);
        return { ...resolved, shortCircuit: true };
      } catch {
        continue;
      }
    }

    throw error;
  }
}

export async function load(url, context, defaultLoad) {
  if (TS_EXTENSIONS.some((ext) => url.endsWith(ext))) {
    const filename = fileURLToPath(url);
    const source = await readFile(filename, 'utf8');
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
      fileName: filename,
    });

    return {
      format: 'module',
      source: outputText,
      shortCircuit: true,
    };
  }

  return defaultLoad(url, context, defaultLoad);
}
