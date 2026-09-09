/**
 * @file ExtendedAttributes.ts
 * @description POSIX Extended Attributes (xattr) manager (user.*, security.*, system.*).
 */

export class ExtendedAttributes {
  private readonly xattrs = new Map<string, Map<string, string>>(); // path -> (attrName -> value)

  public setXAttr(path: string, name: string, value: string): void {
    let attrs = this.xattrs.get(path);
    if (!attrs) {
      attrs = new Map();
      this.xattrs.set(path, attrs);
    }
    attrs.set(name, value);
  }

  public getXAttr(path: string, name: string): string | undefined {
    return this.xattrs.get(path)?.get(name);
  }

  public listXAttrs(path: string): readonly string[] {
    const attrs = this.xattrs.get(path);
    return attrs ? Array.from(attrs.keys()) : [];
  }

  public removeXAttr(path: string, name: string): boolean {
    const attrs = this.xattrs.get(path);
    return attrs ? attrs.delete(name) : false;
  }

  public removeAll(path: string): void {
    this.xattrs.delete(path);
  }
}
