#!/usr/bin/env node
/**
 * import.js
 *
 * Fetches variable collections from Figma files and generates
 * W3C Design Token Format (DTCG) compatible JSON files.
 *
 * Usage:
 *   FIGMA_ACCESS_TOKEN=<token> node scripts/import.js
 *
 * Output:
 *   tokens/primitives.json
 *   tokens/semantic.json
 *   tokens/etx.json
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ── Config ──────────────────────────────────────────────────────────────────

const FIGMA_API = 'https://api.figma.com/v1';
const TOKEN     = process.env.FIGMA_ACCESS_TOKEN;

const FILES = {
  primitives: 'nFZZKbwZjwWtGhcto3Bew4',
  semantic:   'X9TzGj6LUcQo65RXeV6GHL',
  etx:        'IZiHUj1t0VIuw3UOroUhgF',
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR   = join(__dirname, '..', 'tokens');

// ── Figma API ────────────────────────────────────────────────────────────────

async function fetchVariables(fileKey) {
  if (!TOKEN) throw new Error('FIGMA_ACCESS_TOKEN environment variable is required.');
  const res = await fetch(`${FIGMA_API}/files/${fileKey}/variables/local`, {
    headers: { 'X-Figma-Token': TOKEN },
  });
  if (!res.ok) throw new Error(`Figma API error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.meta;
}

// ── Type helpers ─────────────────────────────────────────────────────────────

const DIMENSION_SCOPES = new Set([
  'FONT_SIZE', 'LINE_HEIGHT', 'LETTER_SPACING',
  'CORNER_RADIUS', 'WIDTH_HEIGHT', 'GAP', 'FONT_VARIATIONS',
]);

function inferW3cType(resolvedType, scopes = [], varName = '') {
  if (resolvedType === 'COLOR') return 'color';
  if (resolvedType === 'FLOAT') {
    return scopes.some(s => DIMENSION_SCOPES.has(s)) ? 'dimension' : 'number';
  }
  if (resolvedType === 'STRING') {
    if (scopes.includes('FONT_FAMILY')) return 'fontFamily';
    if (scopes.includes('FONT_STYLE')) return 'fontWeight';
    if (varName.includes('Weight'))    return 'fontWeight';
    return 'fontFamily';
  }
  return 'string';
}

function rgbaToHex({ r, g, b, a = 1 }) {
  const hex = [r, g, b].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
  if (a < 1) return `#${hex}${Math.round(a * 255).toString(16).padStart(2, '0')}`.toUpperCase();
  return `#${hex}`.toUpperCase();
}

function roundFloat(v) {
  const r = Math.round(v * 10000) / 10000;
  return r === Math.trunc(r) ? Math.trunc(r) : r;
}

function formatValue(resolvedType, scopes, rawValue) {
  if (resolvedType === 'COLOR')  return rgbaToHex(rawValue);
  if (resolvedType === 'FLOAT') {
    const v = roundFloat(rawValue);
    return scopes.some(s => DIMENSION_SCOPES.has(s)) ? `${v}px` : v;
  }
  return rawValue;
}

function makeTokenPath(collectionName, varName) {
  return '{' + [collectionName, ...varName.split('/')].join('.') + '}';
}

// ── Token tree ───────────────────────────────────────────────────────────────

function setNested(obj, keys, value) {
  let cur = obj;
  for (const key of keys.slice(0, -1)) {
    if (!(key in cur)) cur[key] = {};
    cur = cur[key];
  }
  cur[keys.at(-1)] = value;
}

// ── Collection filter ────────────────────────────────────────────────────────

/**
 * The Figma `/variables/local` endpoint returns ALL collections visible in a
 * file, including remote ones that are merely linked from external libraries.
 * Remote collections must be excluded from the output — they are not owned by
 * this file and would produce spurious top-level groups in the token JSON.
 *
 * A collection is remote when `remote === true` in the API response.
 */
function localCollections(cols) {
  const local  = Object.entries(cols).filter(([, c]) => !c.remote);
  const remote = Object.entries(cols).filter(([, c]) =>  c.remote);
  if (remote.length) {
    console.log(`  Skipping ${remote.length} remote collection(s): ${remote.map(([, c]) => `"${c.name}"`).join(', ')}`);
  }
  return Object.fromEntries(local);
}

/**
 * Returns collections that have at least one non-null value across all modes,
 * plus all extended variable collections (isExtension === true).
 *
 * Extended collections store their values in the parent collection's variables
 * (via parentModeId mapping) and in variableOverrides — their own modes always
 * appear null in valuesByMode. They must NOT be filtered out here.
 *
 * A collection is excluded when hiddenFromPublishing === true, which signals
 * an internal implementation detail not meant for consumers.
 */
function publishableCollections(localCols, vars) {
  const result   = {};
  const skipped  = [];

  for (const [cid, col] of Object.entries(localCols)) {
    // Skip explicitly hidden collections
    if (col.hiddenFromPublishing) {
      skipped.push({ name: col.name, reason: 'hiddenFromPublishing' });
      continue;
    }

    // Extended variable collections: values live in the parent collection's
    // variables + variableOverrides — always include them.
    if (col.isExtension) {
      result[cid] = col;
      continue;
    }

    // Skip non-extended collections where every variable value is null
    const hasValue = col.variableIds.some(vid => {
      const variable = vars[vid];
      if (!variable) return false;
      return col.modes.some(mode => variable.valuesByMode[mode.modeId] != null);
    });

    if (!hasValue) {
      skipped.push({ name: col.name, reason: 'all values null' });
      continue;
    }

    result[cid] = col;
  }

  if (skipped.length) {
    console.log(`  Skipping ${skipped.length} unpublishable collection(s):`);
    for (const { name, reason } of skipped) {
      console.log(`    "${name}" — ${reason}`);
    }
  }

  return result;
}

// ── Primitives ───────────────────────────────────────────────────────────────

function buildPrimitives(meta) {
  const { variableCollections: cols, variables: vars } = meta;

  const localCols = localCollections(cols);

  const colName = Object.fromEntries(Object.entries(localCols).map(([id, c]) => [id, c.name]));
  const colMode = Object.fromEntries(Object.entries(localCols).map(([id, c]) => [id, c.modes[0].modeId]));

  // Build ID → raw value resolver (handles intra-file aliases)
  function resolveAlias(varId, visited = new Set()) {
    if (visited.has(varId)) return null;
    visited.add(varId);
    const v = vars[varId];
    if (!v) return null;
    const val = v.valuesByMode[colMode[v.variableCollectionId]];
    if (typeof val === 'object' && val?.type === 'VARIABLE_ALIAS') {
      return resolveAlias(val.id, visited);
    }
    return val;
  }

  const output = {};

  for (const [, variable] of Object.entries(vars)) {
    const cid        = variable.variableCollectionId;
    const collection = colName[cid];
    if (!collection) continue; // skip remote vars

    const mode = colMode[cid];
    let rawValue = variable.valuesByMode[mode];

    if (typeof rawValue === 'object' && rawValue?.type === 'VARIABLE_ALIAS') {
      rawValue = resolveAlias(rawValue.id);
    }
    if (rawValue == null) continue;

    const scopes   = variable.scopes ?? [];
    const w3cType  = inferW3cType(variable.resolvedType, scopes, variable.name);
    const w3cValue = formatValue(variable.resolvedType, scopes, rawValue);

    setNested(output, [collection, ...variable.name.split('/')], {
      $type: w3cType,
      $value: w3cValue,
    });
  }

  return output;
}

// ── Alias resolver (shared by semantic and product token builders) ────────────

function makeAliasResolver(ownVars, ownColName, primKeyToInfo) {
  // Own var ID → { path, type }
  const ownIdToInfo = {};
  for (const [id, v] of Object.entries(ownVars)) {
    const col = ownColName[v.variableCollectionId] ?? '?';
    ownIdToInfo[id] = {
      path: makeTokenPath(col, v.name),
      type: inferW3cType(v.resolvedType, v.scopes ?? [], v.name),
    };
  }

  return function resolveRef(aliasId) {
    const idPart   = aliasId.replace('VariableID:', '');
    const segments = idPart.split('/');
    if (segments.length === 2 && segments[0].length > 20) {
      // Remote reference — look up by variable key hash
      const keyHash = segments[0];
      if (primKeyToInfo[keyHash]) return primKeyToInfo[keyHash];
      // Fallback: library copy within this file
      for (const [, v] of Object.entries(ownVars)) {
        if (v.key === keyHash) {
          const col = ownColName[v.variableCollectionId] ?? '?';
          return {
            path: makeTokenPath(col, v.name),
            type: inferW3cType(v.resolvedType, v.scopes ?? [], v.name),
          };
        }
      }
      return null;
    }
    // Local reference
    return ownIdToInfo[aliasId] ?? null;
  };
}

// ── Build token output from a set of collections ─────────────────────────────

function buildTokenOutput(publishCols, vars, resolveRef) {
  const output = {};

  // Shared value processor — resolves aliases and formats raw values.
  function processValue(variable, rawValue) {
    if (typeof rawValue === 'object' && rawValue?.type === 'VARIABLE_ALIAS') {
      const info = resolveRef(rawValue.id);
      if (info) return { type: info.type, value: info.path };
      return { type: 'unknown', value: `UNRESOLVED:${rawValue.id}` };
    }
    const scopes = variable.scopes ?? [];
    return {
      type:  inferW3cType(variable.resolvedType, scopes, variable.name),
      value: formatValue(variable.resolvedType, scopes, rawValue),
    };
  }

  for (const [, col] of Object.entries(publishCols)) {
    const [primaryMode, ...secondaryModes] = col.modes;

    if (col.isExtension) {
      // ── Extended variable collection ──────────────────────────────────────
      // Values are NOT stored in the variables' valuesByMode under the
      // extended mode IDs. Instead:
      //   1. Each extended mode has a parentModeId that maps to the parent
      //      collection's mode. The parent's value is found via:
      //        vars[vid].valuesByMode[parentModeId]
      //   2. col.variableOverrides[vid][extModeId] replaces the parent value
      //      for specific variables/modes.
      const extToParent = Object.fromEntries(
        col.modes.map(m => [m.modeId, m.parentModeId])
      );

      const getExtValue = (vid, variable, extModeId) => {
        const override = col.variableOverrides?.[vid]?.[extModeId];
        if (override != null) return override;
        return variable.valuesByMode[extToParent[extModeId]] ?? null;
      };

      for (const vid of col.variableIds) {
        const variable = vars[vid];
        if (!variable) continue;

        const primaryRaw = getExtValue(vid, variable, primaryMode.modeId);
        if (primaryRaw == null) continue;

        const { type, value } = processValue(variable, primaryRaw);
        const token = { $type: type, $value: value };

        const modesExt = {};
        for (const secMode of secondaryModes) {
          const secRaw = getExtValue(vid, variable, secMode.modeId);
          if (secRaw == null) continue;
          const { value: secValue } = processValue(variable, secRaw);
          modesExt[secMode.name.toLowerCase()] = secValue;
        }
        if (Object.keys(modesExt).length > 0) {
          token.$extensions = { modes: modesExt };
        }

        setNested(output, [col.name, ...variable.name.split('/')], token);
      }
    } else {
      // ── Regular collection ────────────────────────────────────────────────
      for (const vid of col.variableIds) {
        const variable = vars[vid];
        if (!variable) continue;

        const primaryRaw = variable.valuesByMode[primaryMode.modeId];
        if (primaryRaw == null) continue;

        const { type, value } = processValue(variable, primaryRaw);
        const token = { $type: type, $value: value };

        const modesExt = {};
        for (const secMode of secondaryModes) {
          const secRaw = variable.valuesByMode[secMode.modeId];
          if (secRaw == null) continue;
          const { value: secValue } = processValue(variable, secRaw);
          modesExt[secMode.name.toLowerCase()] = secValue;
        }
        if (Object.keys(modesExt).length > 0) {
          token.$extensions = { modes: modesExt };
        }

        setNested(output, [col.name, ...variable.name.split('/')], token);
      }
    }
  }

  return output;
}

// ── Primitives key map builder ────────────────────────────────────────────────

function buildPrimKeyMap(primMeta) {
  const primColName = Object.fromEntries(
    Object.entries(primMeta.variableCollections).map(([id, c]) => [id, c.name])
  );
  const map = {};
  for (const [, v] of Object.entries(primMeta.variables)) {
    const col = primColName[v.variableCollectionId] ?? '?';
    map[v.key] = {
      path: makeTokenPath(col, v.name),
      type: inferW3cType(v.resolvedType, v.scopes ?? [], v.name),
    };
  }
  return map;
}

// ── ETX: remap product-file Colors to primitives paths ───────────────────────

/**
 * ETX (and other product files) link a remote Colors collection that is a
 * subset of the primitives Colors. Rather than generating aliases like
 * {Colors.Ramps.red.50} that point to the product file's own remote copy,
 * we remap them directly to the canonical primitives token paths:
 *
 *   ETX Colors/Ramps/X/N  →  {Colors.Ramps.X.N}   (primitives)
 *   ETX Colors/Key/black  →  {Colors.Base.black}   (primitives)
 *   ETX Colors/Key/white  →  {Colors.Base.white}   (primitives)
 */
function buildProductColorKeyMap(productMeta, primKeyMap) {
  const map = {};
  for (const [, col] of Object.entries(productMeta.variableCollections)) {
    if (!col.remote || col.name !== 'Colors') continue;
    const primaryMode = col.modes[0].modeId;
    for (const vid of col.variableIds) {
      const v = productMeta.variables[vid];
      if (!v) continue;
      let primPath;
      if (v.name.startsWith('Key/')) {
        // Key/black → {Colors.Base.black}
        primPath = makeTokenPath('Colors', 'Base/' + v.name.replace('Key/', ''));
      } else {
        // Ramps/X/N → {Colors.Ramps.X.N}
        primPath = makeTokenPath('Colors', v.name);
      }
      map[v.key] = { path: primPath, type: 'color' };
    }
  }
  return map;
}

// ── Semantic ─────────────────────────────────────────────────────────────────

function buildSemantic(semMeta, primMeta) {
  const { variableCollections: semCols, variables: semVars } = semMeta;

  const primKeyToInfo = buildPrimKeyMap(primMeta);
  const semColName    = Object.fromEntries(Object.entries(semCols).map(([id, c]) => [id, c.name]));
  const resolveRef    = makeAliasResolver(semVars, semColName, primKeyToInfo);

  const localCols     = localCollections(semCols);
  const publishCols   = publishableCollections(localCols, semVars);

  return buildTokenOutput(publishCols, semVars, resolveRef);
}

// ── ETX product tokens ────────────────────────────────────────────────────────

function buildEtx(etxMeta, primMeta, semMeta) {
  const { variableCollections: etxCols, variables: etxVars } = etxMeta;

  // Key map: primitives + ETX remote Colors remapped to primitives paths
  const primKeyToInfo    = buildPrimKeyMap(primMeta);
  const productColorMap  = buildProductColorKeyMap(etxMeta, primKeyToInfo);
  const combinedKeyMap   = { ...primKeyToInfo, ...productColorMap };

  // Also add semantic variables to the key map (Typography/Space aliases chain through them)
  const semColName = Object.fromEntries(
    Object.entries(semMeta.variableCollections).map(([id, c]) => [id, c.name])
  );
  for (const [, v] of Object.entries(semMeta.variables)) {
    const col = semColName[v.variableCollectionId] ?? '?';
    combinedKeyMap[v.key] = {
      path: makeTokenPath(col, v.name),
      type: inferW3cType(v.resolvedType, v.scopes ?? [], v.name),
    };
  }

  const etxColName  = Object.fromEntries(Object.entries(etxCols).map(([id, c]) => [id, c.name]));
  const resolveRef  = makeAliasResolver(etxVars, etxColName, combinedKeyMap);

  const localCols   = localCollections(etxCols);
  const publishCols = publishableCollections(localCols, etxVars);

  return buildTokenOutput(publishCols, etxVars, resolveRef);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Fetching Figma variables…');

  const [primMeta, semMeta, etxMeta] = await Promise.all([
    fetchVariables(FILES.primitives),
    fetchVariables(FILES.semantic),
    fetchVariables(FILES.etx),
  ]);

  console.log(`  primitives: ${Object.keys(primMeta.variables).length} variables`);
  console.log(`  semantic:   ${Object.keys(semMeta.variables).length} variables`);
  console.log(`  etx:        ${Object.keys(etxMeta.variables).length} variables`);

  console.log('\nBuilding primitives…');
  const primitives = buildPrimitives(primMeta);

  console.log('\nBuilding semantic…');
  const semantic = buildSemantic(semMeta, primMeta);

  console.log('\nBuilding etx…');
  const etx = buildEtx(etxMeta, primMeta, semMeta);

  mkdirSync(OUT_DIR, { recursive: true });

  const paths = {
    primitives: join(OUT_DIR, 'primitives.json'),
    semantic:   join(OUT_DIR, 'semantic.json'),
    etx:        join(OUT_DIR, 'etx.json'),
  };

  writeFileSync(paths.primitives, JSON.stringify(primitives, null, 2) + '\n', 'utf-8');
  writeFileSync(paths.semantic,   JSON.stringify(semantic,   null, 2) + '\n', 'utf-8');
  writeFileSync(paths.etx,        JSON.stringify(etx,        null, 2) + '\n', 'utf-8');

  console.log('\nWritten:');
  for (const p of Object.values(paths)) console.log(`  ${p}`);
  console.log('\nDone.');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
