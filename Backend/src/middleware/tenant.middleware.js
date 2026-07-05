import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";


const verifyTenant = asyncHandler(async (req, res, next) => {

    const user = req.user;
        
    if (!user) {
        throw new ApiError(401, "Unauthorized");
    }

    const tenantId = req.params.organizationId;

    if (!tenantId) {
        throw new ApiError(400, "Organization ID is required.");
    }

    if (!user.organizationId.equals(tenantId)) {
        throw new ApiError(403, "Access denied.");
    }

    const organization = await Organization.findById(tenantId);

    if (!organization) {
        throw new ApiError(404, "Organization not found.");
    }

    req.organization = organization;

    next();
});