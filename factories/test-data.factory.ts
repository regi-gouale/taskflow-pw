export interface TestDataFactory<TData, TOverrides = Partial<TData>> {
  build(overrides?: TOverrides): TData;
  buildMany(count: number, overrides?: TOverrides): TData[];
}
