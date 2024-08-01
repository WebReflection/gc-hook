/**
 * The goal of this file is to "allocate" references
 * via `alloc(ref)` and return a "pointer" as unique id.
 * The reference is held in memory until that "pointer"
 * is passed to `dealloc(ptr)` hence freed.
 */

let i = 0;

const ids = new Map;
const values = new Map;

/**
 * Create once a unique identifier that can easily travel or be serialized.
 * It traps the reference until that identifier is passed to `dealloc` helper.
 * @param {object | function} value a reference to relate via a unique identifier
 * @returns {number} the unique identifier for the reference
 */
export const alloc = value => {
  let id = values.get(value);
  if (id == null) {
    /* c8 ignore next */
    while (ids.has(id = i++));
    ids.set(id, value);
    values.set(value, id);
  }
  return id;
};

/**
 * Free any previously stored reference associated to the unique identifier.
 * @param {number} id the unique identifier previously used to allocate memory
 * @returns {boolean} `true` if the identifier was known and successfully freed
 */
export const dealloc = id => {
  const value = ref(id);
  if (value) {
    ids.delete(id);
    values.delete(value);
  }
  return !!value;
};

/**
 * Return any previously stored reference associated to the unique identifier.
 * @param {number} id the unique identifier previously used to allocate memory
 * @returns {object | function | null} the identifier related reference, if any
 */
export const ref = id => ids.get(id);
