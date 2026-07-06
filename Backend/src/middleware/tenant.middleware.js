import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Organization } from '../models/organization.model.js';

const verifyTenant = asyncHandler(async (req, _res, next) => {
    const organizationId = req.organizationId;

    if (!organizationId) {
        throw new ApiError(401, 'Tenant context is missing from authentication');
    }

    const organization = await Organization.findById(organizationId);

    if (!organization || organization.isActive === false) {
        throw new ApiError(403, 'Organization is not available.');
    }

    req.organization = organization;

    next();
});

export { verifyTenant };