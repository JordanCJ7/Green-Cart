import { Supplier, ISupplier } from "../models/Supplier";
import { AppError } from "../errors/AppError";

// Utility function to parse categories from string or array
function parseCategories(categories: unknown): string[] {
    if (Array.isArray(categories)) {
        return categories.filter((c): c is string => typeof c === 'string').map(c => c.trim()).filter(Boolean);
    }
    if (typeof categories === 'string') {
        return categories.split(',').map(c => c.trim()).filter(Boolean);
    }
    return [];
}

export interface CreateSupplierData {
    name: string;
    contact: string;
    phone?: string;
    categories?: string[];
    notes?: string;
}

export interface UpdateSupplierData {
    name?: string;
    contact?: string;
    phone?: string;
    status?: "Active" | "Inactive" | "Under Review";
    reliability?: number;
    lastDelivery?: string;
    categories?: string[];
    notes?: string;
}

export const supplierService = {
    async getAll(): Promise<ISupplier[]> {
        return Supplier.find().sort({ createdAt: -1 }).lean() as Promise<ISupplier[]>;
    },

    async getById(id: string): Promise<ISupplier> {
        const supplier = await Supplier.findById(id).lean();
        if (!supplier) throw new AppError("Supplier not found.", 404, "NOT_FOUND");
        return supplier as ISupplier;
    },

    async create(data: CreateSupplierData): Promise<ISupplier> {
        if (!data.name?.trim() || !data.contact?.trim()) {
            throw new AppError("Name and contact are required.", 422, "VALIDATION_ERROR");
        }

        const catArray = parseCategories(data.categories);
        const supplier = await Supplier.create({
            name: data.name,
            contact: data.contact,
            phone: data.phone || "",
            categories: catArray,
            notes: data.notes,
            status: "Under Review",
            reliability: 0
        });
        return supplier.toObject() as ISupplier;
    },

    async update(id: string, data: UpdateSupplierData): Promise<ISupplier> {
        // Build update object with proper type handling
        type UpdateFields = Partial<Omit<UpdateSupplierData, 'lastDelivery'>> & { lastDelivery?: Date };
        const update: UpdateFields = {};
        
        // Copy all fields except lastDelivery
        const { lastDelivery, ...rest } = data;
        Object.assign(update, rest);
        
        // Handle lastDelivery date conversion
        if (typeof lastDelivery === 'string') {
            const date = new Date(lastDelivery);
            if (Number.isNaN(date.getTime())) {
                throw new AppError("Invalid date format for lastDelivery.", 422, "VALIDATION_ERROR");
            }
            update.lastDelivery = date;
        }

        if (data.reliability !== undefined && (data.reliability < 0 || data.reliability > 100)) {
            throw new AppError("Reliability must be between 0 and 100.", 422, "VALIDATION_ERROR");
        }

        const supplier = await Supplier.findByIdAndUpdate(
            id,
            { $set: update },
            { new: true, runValidators: true }
        ).lean();

        if (!supplier) throw new AppError("Supplier not found.", 404, "NOT_FOUND");
        return supplier as ISupplier;
    },

    async delete(id: string): Promise<void> {
        const result = await Supplier.findByIdAndDelete(id);
        if (!result) throw new AppError("Supplier not found.", 404, "NOT_FOUND");
    },

    async getStats(): Promise<{ total: number; active: number; deliveriesThisWeek: number }> {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const [total, active, deliveriesThisWeek] = await Promise.all([
            Supplier.countDocuments(),
            Supplier.countDocuments({ status: "Active" }),
            Supplier.countDocuments({ lastDelivery: { $gte: weekAgo } })
        ]);

        return { total, active, deliveriesThisWeek };
    }
};
