import { Supplier, ISupplier } from "../models/Supplier";
import { AppError } from "../errors/AppError";

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
        const supplier = await Supplier.create({
            name: data.name,
            contact: data.contact,
            phone: data.phone || "",
            categories: data.categories || [],
            notes: data.notes,
            status: "Under Review",
            reliability: 0
        });
        return supplier.toObject() as ISupplier;
    },

    async update(id: string, data: UpdateSupplierData): Promise<ISupplier> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const update: Record<string, any> = { ...data };
        if (data.lastDelivery) {
            update.lastDelivery = new Date(data.lastDelivery);
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
