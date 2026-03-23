import { Router } from 'express';
import { adminAuthRouter } from './auth.routes';
import { adminStatsRouter } from './stats.routes';
import { adminUsersRouter } from './users.routes';
import { adminPresaleRouter } from './presale.routes';
import { adminNftsRouter } from './nfts.routes';
import { adminCapsulesRouter } from './capsules.routes';
import { adminMarketplaceRouter } from './marketplace.routes';
import { adminPartnersRouter } from './partners.routes';
import { adminSettingsRouter } from './settings.routes';
import { adminWaitlistRouter } from './waitlist.routes';
import { adminNotificationsRouter } from './notifications.routes';
import { adminAdminsRouter } from './admins.routes';
import { adminAuditRouter } from './audit.routes';
import { adminAnalyticsRouter } from './analytics.routes';

export const runtime = 'nodejs';

const router = Router();

// Auth routes (no admin middleware needed for login)
router.use('/auth', adminAuthRouter);

// Protected admin routes
router.use('/stats', adminStatsRouter);
router.use('/users', adminUsersRouter);
router.use('/presale', adminPresaleRouter);
router.use('/nfts', adminNftsRouter);
router.use('/capsules', adminCapsulesRouter);
router.use('/marketplace', adminMarketplaceRouter);
router.use('/partners', adminPartnersRouter);
router.use('/settings', adminSettingsRouter);
router.use('/waitlist', adminWaitlistRouter);
router.use('/notifications', adminNotificationsRouter);
router.use('/admins', adminAdminsRouter);
router.use('/audit-logs', adminAuditRouter);
router.use('/analytics', adminAnalyticsRouter);

export { router as adminRouter };
