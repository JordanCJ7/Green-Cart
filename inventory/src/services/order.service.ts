import { Order, IOrder, IOrderItem } from "../models/Order.js";
import { Cart } from "../models/Cart.js";
import { InventoryItem } from "../models/InventoryItem.js";
import { AppError } from "../errors/AppError.js";

export class OrderService {
    /**
     * Create order from cart
     */
    async createOrderFromCart(customerId: string): Promise<IOrder> {
        const cart = await Cart.findOne({ customerId });

        if (!cart || cart.items.length === 0) {
            throw new AppError("Cart is empty", 400, "EMPTY_CART");
        }

        // Verify all items still exist and have sufficient stock
        for (const cartItem of cart.items) {
            const item = await InventoryItem.findById(cartItem.itemId);
            
            if (!item) {
                throw new AppError(`Item ${cartItem.name} is no longer available`, 400, "ITEM_NOT_FOUND");
            }

            if (item.stock < cartItem.quantity) {
                throw new AppError(`Insufficient stock for ${item.name}. Available: ${item.stock}`, 400, "INSUFFICIENT_STOCK");
            }
        }

        // Create order items from cart
        const orderItems: IOrderItem[] = cart.items.map(item => ({
            itemId: item.itemId,
            name: item.name,
            sku: item.sku,
            price: item.price,
            quantity: item.quantity,
            image: item.image
        }));

        // Create order
        const order = new Order({
            customerId,
            items: orderItems,
            totalAmount: cart.totalPrice,
            currency: "LKR",
            status: "pending"
        });

        await order.save();

        // Note: Don't clear cart yet - clear only after payment confirmation
        return order;
    }

    /**
     * Get order by ID
     */
    async getOrder(orderId: string, customerId?: string): Promise<IOrder> {
        const query: { orderId: string; customerId?: string } = { orderId };
        if (customerId) {
            query.customerId = customerId;
        }

        const order = await Order.findOne(query);

        if (!order) {
            throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
        }

        return order;
    }

    /**
     * Get customer's orders
     */
    async getCustomerOrders(customerId: string, limit: number = 20, offset: number = 0): Promise<{
        orders: IOrder[];
        total: number;
    }> {
        const total = await Order.countDocuments({ customerId });
        const orders = await Order.find({ customerId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(offset);

        return { orders, total };
    }

    /**
     * Update order status
     */
    async updateOrderStatus(
        orderId: string,
        customerId: string,
        status: IOrder["status"],
        transactionId?: string,
        payHereId?: string
    ): Promise<IOrder> {
        const order = await this.getOrder(orderId, customerId);

        order.status = status;
        if (transactionId) {
            order.transactionId = transactionId;
        }
        if (payHereId) {
            order.payHereId = payHereId;
        }
        if (status === "paid") {
            order.paidAt = new Date();
        }

        await order.save();
        return order;
    }

    /**
     * Complete order and clear cart (called after payment success)
     */
    async completeOrder(orderId: string, customerId: string): Promise<IOrder> {
        const order = await this.getOrder(orderId, customerId);

        if (order.status === "paid") {
            // Clear customer's cart
            await Cart.updateOne(
                { customerId },
                {
                    $set: {
                        items: [],
                        totalItems: 0,
                        totalPrice: 0
                    }
                }
            );
        }

        return order;
    }

    /**
     * Get orders by transaction ID
     */
    async getOrderByTransaction(transactionId: string): Promise<IOrder | null> {
        return await Order.findOne({ transactionId });
    }
}

export const orderService = new OrderService();
