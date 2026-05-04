// backend/utils/orderStatus.js
const ORDER_STATUS_FLOW = {
    'pending':            { next: ['processing', 'cancelled'],              display: 'Chờ xử lý' },
    'processing':         { next: ['shipped', 'cancelled'],                 display: 'Đang xử lý' },
    'shipped':            { next: ['out_for_delivery', 'cancelled'],        display: 'Đang giao' },
    'out_for_delivery':   { next: ['delivery_confirmed'],                   display: 'Shipper đang giao' },
    'delivery_confirmed': { next: ['delivered', 'shipped'],                 display: 'Chờ xác nhận giao' },
    'delivered':          { next: [],                                       display: 'Đã giao' },
    'cancelled':          { next: [],                                       display: 'Đã hủy' }
};

const canTransitionStatus = (currentStatus, newStatus) => {
    if (currentStatus === newStatus) return false;
    if (currentStatus === 'delivered' || currentStatus === 'cancelled') return false;
    if (newStatus === 'cancelled') {
        return ['pending', 'processing', 'shipped'].includes(currentStatus);
    }
    return ORDER_STATUS_FLOW[currentStatus]?.next.includes(newStatus) || false;
};

const getAvailableNextStatuses = (currentStatus) => {
    if (currentStatus === 'delivered' || currentStatus === 'cancelled') return [];
    return ORDER_STATUS_FLOW[currentStatus]?.next || [];
};

module.exports = { ORDER_STATUS_FLOW, canTransitionStatus, getAvailableNextStatuses };