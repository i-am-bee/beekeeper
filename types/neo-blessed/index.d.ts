declare module "neo-blessed" {
  export * from "blessed";
}

declare module "neo-blessed/lib/unicode.js" {
  const unicode: {
    isSurrogate(str: string, i: number): boolean;
  };

  export default unicode;
}
