/**
 * A Map where values are collections and getting a non-existing key returns an empty collection.
 */
export class MapWithCollectionValues<K, V, C extends Iterable<V>> {
  private map: Map<K, C>;

  constructor() {
    this.map = new Map();
  }

  emptyElement(): C {
    throw new Error('emptyElement not implemented');
  }

  collectionConstructor(_values: Iterable<V>): C {
    throw new Error('collectionConstructor not implemented');
  }

  addOperation(_collection: C, _element: V): C {
    throw new Error('addOperation not implemented');
  }

  get(key: K): C {
    return this.map.get(key) ?? this.emptyElement();
  }

  add(key: K, value: V): void {
    this.map.set(key, this.addOperation(this.get(key), value));
  }

  set(key: K, values: C): void {
    this.map.set(key, values);
  }

  entries(): [K, C][] {
    return Array.from(this.map.entries());
  }

  keys(): K[] {
    return Array.from(this.map.keys());
  }

  values(): C[] {
    return Array.from(this.map.values());
  }

  mapValues(key: K, func: (v: V) => V): void {
    this.set(
      key,
      this.collectionConstructor(Array.from(this.get(key)).map(func))
    );
  }
}

/**
 * A Map where values are sets and getting a non-existing key returns an empty set.
 * @returns {Map<any, Set<any>>}
 * @constructor creates an empty map
 */
export class MapWithSetValues<K, V> extends MapWithCollectionValues<
  K,
  V,
  Set<V>
> {
  emptyElement(): Set<V> {
    return new Set();
  }

  collectionConstructor(values: Iterable<V>): Set<V> {
    return new Set(values);
  }

  addOperation(set: Set<V>, element: V): Set<V> {
    return set.add(element);
  }
}

/**
 * A Map where values are arrays and getting a non-existing key returns an empty array.
 * @returns {Map<any, Array<any>>}
 * @constructor creates an empty map
 */
export class MapWithArrayValues<K, V> extends MapWithCollectionValues<
  K,
  V,
  V[]
> {
  emptyElement(): V[] {
    return [];
  }

  collectionConstructor(values: Iterable<V>): V[] {
    return Array.from(values);
  }

  addOperation(array: V[], element: V): V[] {
    return array.concat([element]);
  }
}
