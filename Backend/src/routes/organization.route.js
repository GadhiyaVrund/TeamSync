import express from 'express';
import { verifyJwt } from '../middleware/auth.middleware.js';
import {
  createOrganization,
  getMyOrganization,
  joinOrganization,
  leaveOrganization,
  regenerateJoinCode
} from '../controllers/organization.controller.js';

const router = express.Router();

router.use(verifyJwt);

router.route('/')
  .post(createOrganization);

router.route('/join')
  .post(joinOrganization);

router.route('/leave')
  .post(leaveOrganization);

router.route('/regenerate-code')
  .patch(regenerateJoinCode);

router.route('/me')
  .get(getMyOrganization);

export default router;