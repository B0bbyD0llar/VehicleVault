import { Request, Response } from 'express';
import { ShowcaseService } from '../services/showcaseService.js';
import { ShowcaseZipService } from '../services/showcaseZipService.js';
import { ShowcasePdfService } from '../services/showcasePdfService.js';
import { getVehicleAccess } from '../utils/vehicleAccess.js';

export class ShowcaseController {
  /**
   * Retrieves or auto-initializes the showcase for a vehicle.
   */
  public static async get(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const userId = req.user?.userId || (req as any).user?.id;
    const isAdmin = req.user?.role === 'admin';

    const access = getVehicleAccess(id, userId);
    if (!access.hasAccess && !isAdmin) {
      res.status(403).json({ error: 'Geen toegang tot dit voertuig' });
      return;
    }

    try {
      const showcase = ShowcaseService.getOrInitShowcase(id);
      if (!showcase) {
        res.status(404).json({ error: 'Voertuig niet gevonden' });
        return;
      }
      res.json({ showcase });
    } catch (err: any) {
      console.error('Error fetching showcase:', err);
      res.status(500).json({ error: err?.message || 'Fout bij het ophalen van verkooppagina' });
    }
  }

  /**
   * Updates showcase settings and details.
   */
  public static async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const userId = req.user?.userId || (req as any).user?.id;
    const isAdmin = req.user?.role === 'admin';

    const access = getVehicleAccess(id, userId);
    if ((!access.hasAccess || access.role === 'viewer') && !isAdmin) {
      res.status(403).json({ error: 'Geen bewerkrechten voor dit voertuig' });
      return;
    }

    try {
      const updated = ShowcaseService.updateShowcase(id, req.body);
      if (!updated) {
        res.status(404).json({ error: 'Voertuig niet gevonden' });
        return;
      }
      res.json({ showcase: updated });
    } catch (err: any) {
      console.error('Error updating showcase:', err);
      res.status(500).json({ error: err?.message || 'Fout bij het opslaan van verkooppagina' });
    }
  }

  /**
   * Generates and downloads a self-contained static website zip package.
   */
  public static async exportZip(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const userId = req.user?.userId || (req as any).user?.id;
    const isAdmin = req.user?.role === 'admin';

    const access = getVehicleAccess(id, userId);
    if (!access.hasAccess && !isAdmin) {
      res.status(403).json({ error: 'Geen toegang tot dit voertuig' });
      return;
    }

    try {
      const showcase = ShowcaseService.getOrInitShowcase(id);
      if (!showcase) {
        res.status(404).json({ error: 'Voertuig niet gevonden' });
        return;
      }

      const zipBuffer = await ShowcaseZipService.generateZip(showcase);
      const safePlate = (showcase.vehicle.license_plate || showcase.public_slug || 'auto').replace(/[^a-zA-Z0-9-]/g, '');

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="verkoopdossier-${safePlate}.zip"`);
      res.send(zipBuffer);
    } catch (err: any) {
      console.error('Error exporting showcase zip:', err);
      res.status(500).json({ error: err?.message || 'Fout bij het genereren van ZIP archief' });
    }
  }

  /**
   * Generates and downloads a complete PDF brochure including all vehicle photos.
   */
  public static async exportPdf(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const userId = req.user?.userId || (req as any).user?.id;
    const isAdmin = req.user?.role === 'admin';

    const access = getVehicleAccess(id, userId);
    if (!access.hasAccess && !isAdmin) {
      res.status(403).json({ error: 'Geen toegang tot dit voertuig' });
      return;
    }

    try {
      const showcase = ShowcaseService.getOrInitShowcase(id);
      if (!showcase) {
        res.status(404).json({ error: 'Voertuig niet gevonden' });
        return;
      }

      const publicUrl = showcase.is_active ? ShowcaseController.buildPublicUrl(req, showcase.public_slug) : undefined;
      const pdfBuffer = await ShowcasePdfService.generatePdf(showcase, publicUrl);
      const safePlate = (showcase.vehicle.license_plate || showcase.public_slug || 'auto').replace(/[^a-zA-Z0-9-]/g, '');

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="voertuigpresentatie-${safePlate}.pdf"`);
      res.send(pdfBuffer);
    } catch (err: any) {
      console.error('Error exporting showcase pdf:', err);
      res.status(500).json({ error: err?.message || 'Fout bij het genereren van PDF dossier' });
    }
  }

  private static buildPublicUrl(req: Request, slug?: string | null): string | undefined {
    const host = req.get('host');
    if (!host || !slug) return undefined;
    const forwardedProto = req.headers['x-forwarded-proto'];
    const proto = (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto)?.split(',')[0]?.trim() || req.protocol || 'https';
    return `${proto}://${host}/showcase/${encodeURIComponent(slug)}`;
  }

  /**
   * Public unauthenticated view for the showcase by slug or token.
   */
  public static async getPublic(req: Request, res: Response): Promise<void> {
    const { slug } = req.params;

    try {
      const showcase = ShowcaseService.getPublicShowcase(slug);
      if (!showcase) {
        res.status(404).json({ error: 'Verkooppagina niet gevonden of niet openbaar actief' });
        return;
      }

      res.json({ showcase });
    } catch (err: any) {
      console.error('Error fetching public showcase:', err);
      res.status(500).json({ error: err?.message || 'Fout bij het laden van openbare verkooppagina' });
    }
  }

  /**
   * Public unauthenticated PDF export for an active showcase by slug.
   */
  public static async exportPublicPdf(req: Request, res: Response): Promise<void> {
    const { slug } = req.params;

    try {
      const showcase = ShowcaseService.getPublicShowcase(slug);
      if (!showcase) {
        res.status(404).json({ error: 'Verkooppagina niet gevonden of niet openbaar actief' });
        return;
      }

      const publicUrl = showcase.is_active ? ShowcaseController.buildPublicUrl(req, showcase.public_slug) : undefined;
      const pdfBuffer = await ShowcasePdfService.generatePdf(showcase, publicUrl);
      const safePlate = (showcase.vehicle.license_plate || showcase.public_slug || 'auto').replace(/[^a-zA-Z0-9-]/g, '');

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="voertuigpresentatie-${safePlate}.pdf"`);
      res.send(pdfBuffer);
    } catch (err: any) {
      console.error('Error exporting public showcase pdf:', err);
      res.status(500).json({ error: err?.message || 'Fout bij het genereren van PDF dossier' });
    }
  }
}

