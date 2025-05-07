declare module "neo-blessed" {
  export * from "blessed";
}

declare module "neo-blessed/lib/widgets/node" {
  const Node: any;

  export default Node;
}

declare module "neo-blessed/lib/unicode" {
  const unicode: {
    isSurrogate(str: string, i: number): boolean;
  };

  export default unicode;
}
