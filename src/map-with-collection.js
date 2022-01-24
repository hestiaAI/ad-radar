/**
 * A Map where values are collections and getting a non-existing key returns an empty collection.
 * @returns {Map<any, Iterable<any>>}
 * @constructor creates an empty map
 */
class MapWithCollectionValues {
  constructor() {
    this.map = new Map()
  }
  emptyElement() {
    throw new Error("emptyElement not implemented")
  }
  addOperation(collection, element) {
    throw new Error("addOperation not implemented")
  }
  get(key) {
    return this.map.has(key) ? this.map.get(key) : this.emptyElement()
  }
  add(key, value) {
    this.map.set(key, this.addOperation(this.get(key), value))
  }
  set(key, values) {
    this.map.set(key, values)
  }
  entries() {
    return [...this.map.entries()]
  }
  keys() {
    return [...this.map.keys()]
  }
  values() {
    return [...this.map.values()]
  }
  mapValues(key, func) {
    this.set(key, this.get(key).map(func))
  }
}

/**
 * A Map where values are sets and getting a non-existing key returns an empty set.
 * @returns {Map<any, Set<any>>}
 * @constructor creates an empty map
 */
class MapWithSetValues extends MapWithCollectionValues {
  constructor() {
    super()
  }
  emptyElement() {
    return new Set()
  }
  addOperation(set, element) {
    return set.add(element)
  }
}

/**
 * A Map where values are arrays and getting a non-existing key returns an empty array.
 * @returns {Map<any, Array<any>>}
 * @constructor creates an empty map
 */
class MapWithArrayValues extends MapWithCollectionValues {
  constructor() {
    super()
  }
  emptyElement() {
    return []
  }
  addOperation(array, element) {
    return array.concat([element])
  }
}
