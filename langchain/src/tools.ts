import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { apiCall } from './api.js'

const DEFAULT_SITE_OPTIONS = {
  darkColor: '#EEEEEE',
  lightColor: '#292929',
  darkBackColor: '#1f1f1f',
  lightBackColor: '#EEEEEE',
  darkAccentColor: '#ff368c',
  lightAccentColor: '#2e90c8',
  fontSize: 1,
  lineHeight: 1.4,
  darkMode: true,
  mobileBP: 767,
  mobileTextZoom: 2.6,
  tabletBP: 1024,
  tabletTextZoom: 1,
  desktopTextZoom: 1,
  desktopWidth: 1260,
  desktopMargin: 10,
  mobileMargin: 10,
  tabletMargin: 10,
  fonts: [
    { family: 'Montserrat', weights: [400], italics: [] },
    { family: 'Inter', weights: [400, 800], italics: [400, 800] }
  ],
  globalFontFamily: { family: 'Montserrat', weight: 400, italic: false },
  headers: {
    H1: { size: 2.5, lineHeight: 1, family: 'Inter', weight: 800, italic: true },
    H2: { size: 2.2, lineHeight: 1, family: 'Inter', weight: 800, italic: true },
    H3: { size: 1.9, lineHeight: 1, family: 'Inter', weight: 800, italic: true },
    H4: { size: 1.6, lineHeight: 1, family: 'Inter', weight: 800, italic: true },
    H5: { size: 1.3, lineHeight: 1, family: 'Inter', weight: 800, italic: true },
    H6: { size: 0.9, lineHeight: 1, family: 'Inter', weight: 800, italic: true }
  },
  header: {
    id: 1,
    blocks: [
      {
        d: { h: 1, w: 4, x: 1, y: 1 },
        m: { h: 1, w: 3, x: 1, y: 1 },
        t: { h: 1, w: 5, x: 1, y: 1 },
        id: 1,
        type: 'Text',
        locales: { text: '<h2>Header</h2>' },
        style: {
          hideOn: [],
          background: {
            mode: 'none',
            lightColor: '',
            darkcolorColor: '',
            url_desk: '',
            url_tab: '',
            url_mob: '',
            opacity: '1',
            fix_img_back: false,
            pos: 'cover',
            size: '',
            repeat: false,
            lightGradA: '',
            lightGradB: '',
            darkGradA: '',
            darkGradB: '',
            gradDeg: '',
            focalX: '50',
            focalY: '50',
            zoom: '100'
          },
          border: {
            radius: { tl: '0', tr: '0', br: '0', bl: '0' },
            allBorders: { active: false, thick: '0', color: 'transparent', mode: 'none' },
            sidesBorders: {
              l: { active: false, thick: '0', color: 'transparent', mode: 'none' },
              t: { active: false, thick: '0', color: 'transparent', mode: 'none' },
              r: { active: false, thick: '0', color: 'transparent', mode: 'none' },
              b: { active: false, thick: '0', color: 'transparent', mode: 'none' }
            }
          },
          padding: { t: '0', r: '0', b: '0', l: '0' }
        }
      },
      {
        d: { h: 1, w: 1, x: 24, y: 1 },
        m: { h: 1, w: 1, x: 8, y: 1 },
        t: { h: 1, w: 1, x: 20, y: 1 },
        id: 3,
        type: 'DarkMode',
        color: null,
        style: {
          border: {
            radius: { bl: '0', br: '0', tl: '0', tr: '0' },
            allBorders: { mode: 'none', color: 'transparent', thick: '0', active: false },
            sidesBorders: {
              b: { mode: 'none', color: 'transparent', thick: '0', active: false },
              l: { mode: 'none', color: 'transparent', thick: '0', active: false },
              r: { mode: 'none', color: 'transparent', thick: '0', active: false },
              t: { mode: 'none', color: 'transparent', thick: '0', active: false }
            }
          },
          hideOn: [],
          padding: { b: '0', l: '0', r: '0', t: '0' },
          background: {
            pos: 'cover',
            mode: 'none',
            size: '',
            zoom: '100',
            focalX: '50',
            focalY: '50',
            repeat: false,
            gradDeg: '',
            opacity: '',
            url_mob: '',
            url_tab: '',
            url_desk: '',
            darkGradA: '',
            darkGradB: '',
            lightColor: '',
            lightGradA: '',
            lightGradB: '',
            fix_img_back: false,
            darkcolorColor: ''
          }
        },
        fontSize: null,
        darkColor: null
      },
      {
        d: { h: 1, w: 1, x: 23, y: 1 },
        m: { h: 1, w: 1, x: 7, y: 1 },
        t: { h: 1, w: 1, x: 19, y: 1 },
        id: 4,
        type: 'LanguageSwitcher',
        style: {
          border: {
            radius: { bl: '0', br: '0', tl: '0', tr: '0' },
            allBorders: { mode: 'none', color: 'transparent', thick: '0', active: false },
            sidesBorders: {
              b: { mode: 'none', color: 'transparent', thick: '0', active: false },
              l: { mode: 'none', color: 'transparent', thick: '0', active: false },
              r: { mode: 'none', color: 'transparent', thick: '0', active: false },
              t: { mode: 'none', color: 'transparent', thick: '0', active: false }
            }
          },
          hideOn: [],
          padding: { b: '0', l: '0', r: '0', t: '0' },
          background: {
            pos: 'cover',
            mode: 'none',
            size: '',
            zoom: '100',
            focalX: '50',
            focalY: '50',
            repeat: false,
            gradDeg: '',
            opacity: '',
            url_mob: '',
            url_tab: '',
            url_desk: '',
            darkGradA: '',
            darkGradB: '',
            lightColor: '',
            lightGradA: '',
            lightGradB: '',
            fix_img_back: false,
            darkcolorColor: ''
          }
        }
      }
    ],
    mobile: { gap: 6, cols: 8, rows: 1 },
    tablet: { gap: 8, cols: 20, rows: 1 },
    desktop: { gap: 10, cols: 24, rows: 1 },
    style: {
      maxWidth: null,
      fullWidth: false,
      hideOn: [],
      background: {
        mode: 'none',
        lightColor: '',
        darkcolorColor: '',
        url_desk: '',
        url_tab: '',
        url_mob: '',
        opacity: '1',
        fix_img_back: false,
        pos: 'cover',
        size: '',
        repeat: false,
        lightGradA: '',
        lightGradB: '',
        darkGradA: '',
        darkGradB: '',
        gradDeg: '',
        focalX: '50',
        focalY: '50',
        zoom: '100'
      },
      section_background: {
        mode: 'none',
        lightColor: '',
        darkcolorColor: '',
        url_desk: '',
        url_tab: '',
        url_mob: '',
        opacity: '1',
        fix_img_back: false,
        pos: 'cover',
        size: '',
        repeat: false,
        lightGradA: '',
        lightGradB: '',
        darkGradA: '',
        darkGradB: '',
        gradDeg: '',
        focalX: '50',
        focalY: '50',
        zoom: '100'
      },
      padding: { t: '0', r: '0', b: '0', l: '0' },
      margin: { t: '5px', r: '0', b: '5px', l: '0' }
    }
  },
  footer: {
    id: 2,
    blocks: [
      {
        d: { h: 2, w: 4, x: 1, y: 1 },
        m: { h: 2, w: 6, x: 1, y: 1 },
        t: { h: 3, w: 6, x: 1, y: 1 },
        id: 2,
        type: 'Text',
        locales: { text: '<h3>Footer</h3>' },
        style: {
          hideOn: [],
          background: {
            mode: 'none',
            lightColor: '',
            darkcolorColor: '',
            url_desk: '',
            url_tab: '',
            url_mob: '',
            opacity: '1',
            fix_img_back: false,
            pos: 'cover',
            size: '',
            repeat: false,
            lightGradA: '',
            lightGradB: '',
            darkGradA: '',
            darkGradB: '',
            gradDeg: '',
            focalX: '50',
            focalY: '50',
            zoom: '100'
          },
          border: {
            radius: { tl: '0', tr: '0', br: '0', bl: '0' },
            allBorders: { active: false, thick: '0', color: 'transparent', mode: 'none' },
            sidesBorders: {
              l: { active: false, thick: '0', color: 'transparent', mode: 'none' },
              t: { active: false, thick: '0', color: 'transparent', mode: 'none' },
              r: { active: false, thick: '0', color: 'transparent', mode: 'none' },
              b: { active: false, thick: '0', color: 'transparent', mode: 'none' }
            }
          },
          padding: { t: '0', r: '0', b: '0', l: '0' }
        }
      }
    ],
    mobile: { gap: 6, cols: 8, rows: 2 },
    tablet: { gap: 8, cols: 20, rows: 2 },
    desktop: { gap: 10, cols: 24, rows: 2 },
    style: {
      maxWidth: null,
      fullWidth: false,
      hideOn: [],
      background: {
        mode: 'none',
        lightColor: '',
        darkcolorColor: '',
        url_desk: '',
        url_tab: '',
        url_mob: '',
        opacity: '1',
        fix_img_back: false,
        pos: 'cover',
        size: '',
        repeat: false,
        lightGradA: '',
        lightGradB: '',
        darkGradA: '',
        darkGradB: '',
        gradDeg: '',
        focalX: '50',
        focalY: '50',
        zoom: '100'
      },
      section_background: {
        mode: 'none',
        lightColor: '',
        darkcolorColor: '',
        url_desk: '',
        url_tab: '',
        url_mob: '',
        opacity: '1',
        fix_img_back: false,
        pos: 'cover',
        size: '',
        repeat: false,
        lightGradA: '',
        lightGradB: '',
        darkGradA: '',
        darkGradB: '',
        gradDeg: '',
        focalX: '50',
        focalY: '50',
        zoom: '100'
      },
      padding: { t: '0', r: '0', b: '0', l: '0' },
      margin: { t: '5px', r: '0', b: '5px', l: '0' }
    }
  }
}

export const searchSites = tool(
  async ({ name, domain }) => {
    const params = new URLSearchParams()
    params.set('limit', '100')
    if (name) params.set('filter[name_like]', name)
    if (domain) params.set('filter[domain_like]', domain)
    const result = await apiCall(`/api/sites?${params.toString()}`)
    const sites = result.data ?? result
    if (!sites.length) return 'No se encontraron sites.'
    return sites
      .map(
        (s: any) =>
          `id:${s.id} name:"${s.name}" domain:"${s.domain}" locales:${s.locales?.map((l: any) => l.code).join(',')}`
      )
      .join('\n')
  },
  {
    name: 'search_sites',
    description:
      'BUSCA sites por nombre o dominio. Retorna lista con id, name, domain y locales. Es una tool INTERNA para obtener el ID de un site antes de actualizarlo o eliminarlo. NO la menciones al usuario, simplemente úsala cuando necesites un ID.',
    schema: z.object({
      name: z.string().optional().describe('Filtrar por nombre (parcial, case-insensitive)'),
      domain: z.string().optional().describe('Filtrar por dominio (parcial, case-insensitive)')
    })
  }
)

export const createSite = tool(
  async ({ name, domain, locales, options }) => {
    const body: Record<string, any> = { name, domain, locales, options: { ...DEFAULT_SITE_OPTIONS } }
    const defaultLoc = locales.find((l: { code: string; is_default: boolean }) => l.is_default)
    const query = defaultLoc ? `?locale=${defaultLoc.code}` : ''
    await apiCall(`/api/sites${query}`, {
      method: 'POST',
      body: JSON.stringify(body)
    })
    return `Site "${name}" creado correctamente con dominio ${domain} e idiomas: ${locales.map((l: any) => l.code).join(', ')}.`
  },
  {
    name: 'create_site',
    description:
      'Crea un nuevo site. REQUIERE: name (string), domain (string), locales (array con al menos un objeto {code, is_default}). El locale code es ISO 639-1 (ej: es, en, ca). Solo uno puede ser is_default: true. Se crean automáticamente las páginas raíz y 404. Úsala cuando el usuario quiera crear un site nuevo.',
    schema: z.object({
      name: z.string().describe('Nombre del site (ej: "Mi Blog")'),
      domain: z.string().describe('Dominio del site, debe ser único (ej: "miblog.com")'),
      locales: z
        .array(
          z.object({
            code: z.string().describe('Código ISO 639-1 del idioma (ej: es, en, ca)'),
            is_default: z.boolean().describe('true para el idioma por defecto del site')
          })
        )
        .describe('Array de locales. Al menos uno requerido. Solo uno con is_default: true.'),
      options: z.record(z.any()).optional().describe('Opciones JSON del site. Opcional, por defecto {}.')
    })
  }
)

export const updateSite = tool(
  async ({ id, name, domain, options }) => {
    const current = await apiCall(`/api/sites/${id}`)
    const defaultLocale = current.locales?.find((l: any) => l.is_default)?.code ?? current.locales?.[0]?.code
    const body: Record<string, any> = {
      name: name ?? current.name,
      domain: domain ?? current.domain,
      options: options ?? current.options ?? {}
    }
    await apiCall(`/api/sites/${id}?locale=${defaultLocale}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    })
    const changes: string[] = []
    if (name && name !== current.name) changes.push(`nombre: "${current.name}" → "${name}"`)
    if (domain && domain !== current.domain) changes.push(`dominio: "${current.domain}" → "${domain}"`)
    return `Site "${body.name}" actualizado correctamente. ${changes.length ? changes.join('. ') : ''}`.trim()
  },
  {
    name: 'update_site',
    description:
      'Actualiza un site existente por su ID. El locale se obtiene automáticamente (el default del site). Opcionalmente: name, domain, options. Si no se proporciona un campo, se mantiene el valor actual. NO pidas el locale al usuario. Úsala cuando el usuario quiera modificar un site.',
    schema: z.object({
      id: z.number().describe('ID del site a actualizar'),
      name: z.string().optional().describe('Nuevo nombre del site'),
      domain: z.string().optional().describe('Nuevo dominio del site'),
      options: z.record(z.any()).optional().describe('Nuevas opciones JSON del site')
    })
  }
)

export const deleteSite = tool(
  async ({ id }) => {
    const current = await apiCall(`/api/sites/${id}`)
    await apiCall(`/api/sites/${id}`, { method: 'DELETE' })
    return `Site "${current.name}" eliminado correctamente.`
  },
  {
    name: 'delete_site',
    description:
      'Elimina un site por su ID. El delete es en cascada: se eliminan locales, páginas, bloques y datos relacionados. Úsala cuando el usuario quiera borrar un site.',
    schema: z.object({
      id: z.number().describe('ID del site a eliminar')
    })
  }
)

export const allTools = [searchSites, createSite, updateSite, deleteSite] as const
