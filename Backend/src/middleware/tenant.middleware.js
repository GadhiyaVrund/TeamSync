import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Organization } from '../models/organization.model.js';


const getTenantIdFromRequest = (req) => {
    return (
        // pachhi je endpoint mokale ej rakhvanu baki remove kari devanu
        req.params?.organization ||
        req.params?.organizationId ||
        req.body?.organization ||
        req.body?.organizationId ||
        req.query?.organization ||
        req.query?.organizationId ||
        req.headers['x-organization-id'] ||
        req.headers['x-tenant-id']
    );
};

const verifyTenant = asyncHandler(async (req, _res, next) => {
    const user = req.user;

    if (!user) {
        throw new ApiError(401, 'Unauthorized');
    }

    // User model stores tenant reference in `organization`.
    const userOrganizationId = user.organization?.toString?.();

    if (!userOrganizationId) {
        throw new ApiError(403, 'User is not associated with any organization.');
    }

    const requestedTenantId = getTenantIdFromRequest(req);

    if (requestedTenantId) {
        if (!mongoose.Types.ObjectId.isValid(requestedTenantId)) {
            throw new ApiError(400, 'Invalid organization ID format.');
        }

        if (userOrganizationId !== requestedTenantId.toString()) {
            throw new ApiError(403, 'Access denied. Cross-tenant access is not allowed.');
        }
    }

    const organization = await Organization.findById(userOrganizationId);

    if (!organization || organization.isActive === false) {
        throw new ApiError(403, 'Organization is not available.');
    }

    req.organization = organization;

    next();
});

export { verifyTenant };