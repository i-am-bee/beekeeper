export interface Disposable {
  get disposed(): boolean;
  dispose(): void;
}
