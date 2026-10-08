const transitions = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

function getNextOrderStatuses(currentStatus, includePending = false) {
  const nextStatuses = transitions[currentStatus] || [];
  if (includePending && currentStatus === 'pending') return nextStatuses;
  return nextStatuses;
}

function isValidOrderTransition(currentStatus, nextStatus) {
  return getNextOrderStatuses(currentStatus).includes(nextStatus);
}

module.exports = { getNextOrderStatuses, isValidOrderTransition };
