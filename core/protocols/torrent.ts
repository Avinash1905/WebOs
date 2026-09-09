/**
 * WebOS Protocols - BitTorrent Bencode Parser & Magnet Link Resolver
 */

export class BencodeParser {
  public static decode(input: string): any {
    let index = 0;

    function parseValue(): any {
      const ch = input[index];
      if (ch === 'i') {
        index++;
        const end = input.indexOf('e', index);
        const val = parseInt(input.substring(index, end), 10);
        index = end + 1;
        return val;
      }
      if (ch === 'l') {
        index++;
        const list = [];
        while (input[index] !== 'e') {
          list.push(parseValue());
        }
        index++;
        return list;
      }
      if (ch === 'd') {
        index++;
        const dict: Record<string, any> = {};
        while (input[index] !== 'e') {
          const key = parseValue();
          const val = parseValue();
          dict[key] = val;
        }
        index++;
        return dict;
      }
      if (ch >= '0' && ch <= '9') {
        const colon = input.indexOf(':', index);
        const len = parseInt(input.substring(index, colon), 10);
        index = colon + 1;
        const str = input.substring(index, index + len);
        index += len;
        return str;
      }
      throw new Error(`Unexpected Bencode token '${ch}' at offset ${index}`);
    }

    return parseValue();
  }

  public static parseMagnetURI(uri: string): { infoHash: string; displayName?: string; trackers: string[] } {
    const url = new URL(uri);
    const xt = url.searchParams.get('xt') || '';
    const dn = url.searchParams.get('dn') || undefined;
    const tr = url.searchParams.getAll('tr');
    const infoHash = xt.replace('urn:btih:', '');

    return { infoHash, displayName: dn, trackers: tr };
  }
}
