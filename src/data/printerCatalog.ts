export interface PrinterCatalogModel {
  brand: string
  model: string
  spec: string
}

/**
 * Curated reference catalog of well-known 3D printer brands/models.
 * There's no single public API that lists "every printer on the market",
 * so this ships as static local data instead of a live external call —
 * it works offline and never depends on a third party being up.
 * Specs are approximate build volumes; double-check against the
 * manufacturer's page before relying on exact numbers.
 */
export const PRINTER_CATALOG: PrinterCatalogModel[] = [
  { brand: 'Creality', model: 'Ender 3', spec: 'FDM • 220x220x250mm' },
  { brand: 'Creality', model: 'Ender 3 V2', spec: 'FDM • 220x220x250mm' },
  { brand: 'Creality', model: 'Ender 3 S1', spec: 'FDM • 220x220x270mm' },
  { brand: 'Creality', model: 'Ender 3 V3 SE', spec: 'FDM • 220x220x250mm' },
  { brand: 'Creality', model: 'CR-10', spec: 'FDM • 300x300x400mm' },
  { brand: 'Creality', model: 'CR-10 Max', spec: 'FDM • 450x450x470mm' },
  { brand: 'Creality', model: 'K1', spec: 'FDM • 220x220x250mm' },
  { brand: 'Creality', model: 'K1 Max', spec: 'FDM • 300x300x300mm' },

  { brand: 'Prusa Research', model: 'MK3S+', spec: 'FDM • 250x210x210mm' },
  { brand: 'Prusa Research', model: 'MK4', spec: 'FDM • 250x210x220mm' },
  { brand: 'Prusa Research', model: 'MINI+', spec: 'FDM • 180x180x180mm' },
  { brand: 'Prusa Research', model: 'XL', spec: 'FDM • 360x360x360mm' },
  { brand: 'Prusa Research', model: 'SL1S Speed', spec: 'Resina • 128x80x150mm' },

  { brand: 'Bambu Lab', model: 'A1 Mini', spec: 'FDM • 180x180x180mm' },
  { brand: 'Bambu Lab', model: 'A1', spec: 'FDM • 256x256x256mm' },
  { brand: 'Bambu Lab', model: 'P1P', spec: 'FDM • 256x256x256mm' },
  { brand: 'Bambu Lab', model: 'P1S', spec: 'FDM • 256x256x256mm' },
  { brand: 'Bambu Lab', model: 'X1 Carbon', spec: 'FDM • 256x256x256mm' },
  { brand: 'Bambu Lab', model: 'X1E', spec: 'FDM • 256x256x256mm' },

  { brand: 'Anycubic', model: 'Kobra 2', spec: 'FDM • 220x220x250mm' },
  { brand: 'Anycubic', model: 'Kobra 2 Pro', spec: 'FDM • 220x220x250mm' },
  { brand: 'Anycubic', model: 'Kobra 3', spec: 'FDM • 250x250x260mm' },
  { brand: 'Anycubic', model: 'Vyper', spec: 'FDM • 245x245x260mm' },
  { brand: 'Anycubic', model: 'Photon Mono M5s', spec: 'Resina • 218x123x235mm' },

  { brand: 'Elegoo', model: 'Neptune 3 Pro', spec: 'FDM • 225x225x280mm' },
  { brand: 'Elegoo', model: 'Neptune 4 Pro', spec: 'FDM • 225x225x265mm' },
  { brand: 'Elegoo', model: 'Mars 4 Ultra', spec: 'Resina • 153x87x165mm' },
  { brand: 'Elegoo', model: 'Saturn 4 Ultra', spec: 'Resina • 218x122x260mm' },

  { brand: 'FlashForge', model: 'Adventurer 4', spec: 'FDM • 220x200x250mm' },
  { brand: 'FlashForge', model: 'Adventurer 5M Pro', spec: 'FDM • 220x220x220mm' },
  { brand: 'FlashForge', model: 'Creator Pro 2', spec: 'FDM • 200x148x150mm (dual)' },

  { brand: 'Qidi Tech', model: 'X-Max 3', spec: 'FDM • 325x325x315mm' },
  { brand: 'Qidi Tech', model: 'X-Plus 3', spec: 'FDM • 280x280x270mm' },

  { brand: 'Artillery', model: 'Sidewinder X2', spec: 'FDM • 300x300x400mm' },
  { brand: 'Artillery', model: 'Genius Pro', spec: 'FDM • 220x220x250mm' },

  { brand: 'Raise3D', model: 'Pro3', spec: 'FDM • 300x300x300mm' },
  { brand: 'Raise3D', model: 'E2', spec: 'FDM • 330x240x240mm (dual)' },

  { brand: 'Ultimaker', model: 'S5', spec: 'FDM • 330x240x300mm' },
  { brand: 'Ultimaker', model: 'S3', spec: 'FDM • 230x190x200mm' },

  { brand: 'Formlabs', model: 'Form 3+', spec: 'Resina • 145x145x185mm' },
  { brand: 'Formlabs', model: 'Form 4', spec: 'Resina • 200x125x210mm' },

  { brand: 'Snapmaker', model: 'Artisan', spec: 'FDM • 400x400x400mm' },
  { brand: 'Snapmaker', model: '2.0 A350', spec: 'FDM • 320x350x330mm' },

  { brand: 'Sovol', model: 'SV06', spec: 'FDM • 220x220x250mm' },
  { brand: 'Sovol', model: 'SV07', spec: 'FDM • 220x220x250mm' },
]

export const PRINTER_BRANDS: string[] = [...new Set(PRINTER_CATALOG.map((m) => m.brand))].sort((a, b) =>
  a.localeCompare(b),
)
