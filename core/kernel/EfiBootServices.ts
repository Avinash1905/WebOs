/**
 * @file EfiBootServices.ts
 * @description UEFI / EFI boot services: memory map allocation and NVRAM variable storage.
 */

export interface EfiMemoryDescriptor {
  type: 'EfiReserved' | 'EfiLoaderCode' | 'EfiLoaderData' | 'EfiBootServicesCode' | 'EfiConventionalMemory';
  physicalStart: number;
  virtualStart: number;
  numberOfPages: number;
  attribute: number;
}

export class EfiBootServices {
  private readonly _nvram = new Map<string, string>();
  private readonly _memoryMap: EfiMemoryDescriptor[] = [];
  private _bootServicesExited = false;

  constructor() {
    // Initial EFI memory map
    this._memoryMap.push({
      type: 'EfiConventionalMemory',
      physicalStart: 0x100000,
      virtualStart: 0x100000,
      numberOfPages: 65536, // 256MB
      attribute: 0x8,
    });
  }

  public getVariable(name: string, guid: string = 'global'): string | undefined {
    return this._nvram.get(`${guid}:${name}`);
  }

  public setVariable(name: string, value: string, guid: string = 'global'): void {
    this._nvram.set(`${guid}:${name}`, value);
  }

  public exitBootServices(): boolean {
    if (this._bootServicesExited) return false;
    this._bootServicesExited = true;
    return true;
  }

  public getMemoryMap(): readonly EfiMemoryDescriptor[] {
    return this._memoryMap;
  }

  public get isExited(): boolean {
    return this._bootServicesExited;
  }
}
