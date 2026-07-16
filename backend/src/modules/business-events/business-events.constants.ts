export const EVENT_NAME_MAX_LENGTH = 200;
export const EVENT_DESCRIPTION_MAX_LENGTH = 2000;
export const EVENT_LOCATION_MAX_LENGTH = 300;

// System safeguards, not plan-gated — small fixed ceilings on how many
// co-hosts/volunteers a single event can have, independent of any customer's
// plan (unlike maxEvents/maxGuestsPerEvent, which come from the host's Plan).
export const EVENT_MAX_CO_HOSTS = 5;
export const EVENT_MAX_VOLUNTEERS = 20;

export const EVENT_LIST_DEFAULT_PAGE = 1;
export const EVENT_LIST_DEFAULT_PAGE_SIZE = 20;
export const EVENT_LIST_MAX_PAGE_SIZE = 100;
export const EVENT_SEARCH_MAX_LENGTH = 150;

// Per-request cap on a single bulk-add-guests call — a sanity guardrail on
// payload size, independent of maxGuestsPerEvent (the plan-gated cap).
export const EVENT_BULK_ADD_GUESTS_MAX_PER_REQUEST = 100;

export const EVENT_TRACKABLE_NAME_MAX_LENGTH = 150;
export const EVENT_TRACKABLE_DESCRIPTION_MAX_LENGTH = 1000;

// System safeguard, not user-specified — a sanity ceiling on how many other
// trackables a single trackable can declare as dependencies.
export const EVENT_TRACKABLE_MAX_DEPENDENCIES = 10;

export const EVENT_NOT_FOUND_MESSAGE = 'Event not found';
export const EVENT_MEMBER_NOT_FOUND_MESSAGE = 'Event member not found';
export const EVENT_GUEST_NOT_FOUND_MESSAGE = 'Guest not found on this event';
export const EVENT_TRACKABLE_NOT_FOUND_MESSAGE = 'Trackable not found';

export const EVENT_HOST_ROLE_IMMUTABLE_MESSAGE =
  'The event host cannot be removed or reassigned';
export const EVENT_ONLY_HOST_OR_EMPLOYEE_CAN_MANAGE_CO_HOSTS_MESSAGE =
  'Only the event host or an employee can manage co-hosts';
export const EVENT_ONLY_HOST_CAN_EDIT_MESSAGE =
  'Only the event host or an employee can edit this event';
export const EVENT_ONLY_HOST_COHOST_OR_EMPLOYEE_MESSAGE =
  "Only the event's host, a co-host, or an employee can perform this action";
export const EVENT_ONLY_HOST_COHOST_OR_VOLUNTEER_CAN_SCAN_MESSAGE =
  "Only the event's host, a co-host, or a volunteer can scan";
export const EVENT_ALREADY_MEMBER_MESSAGE =
  'This customer is already a member of this event';
export const EVENT_CO_HOST_LIMIT_REACHED_MESSAGE =
  'This event has reached its co-host limit';
export const EVENT_VOLUNTEER_LIMIT_REACHED_MESSAGE =
  'This event has reached its volunteer limit';

export const EVENT_ALREADY_GUEST_MESSAGE =
  'This customer is already on the guest list';
export const EVENT_GUEST_NOT_WHITELISTED_MESSAGE =
  'This customer is not on the guest list for this event';
export const EVENT_GUEST_ALREADY_CHECKED_IN_MESSAGE =
  'This guest has already checked in';
export const EVENT_TRACKABLE_ALREADY_REDEEMED_MESSAGE =
  'This guest has already redeemed this trackable';
export const EVENT_TRACKABLE_SELF_DEPENDENCY_MESSAGE =
  'A trackable cannot depend on itself';
export const EVENT_TRACKABLE_DEPENDENCY_NOT_IN_EVENT_MESSAGE =
  'A trackable can only depend on other trackables from the same event';
export const EVENT_TRACKABLE_CIRCULAR_DEPENDENCY_MESSAGE =
  'This dependency would create a circular chain between trackables';
export const EVENT_TRACKABLE_DEPENDENCY_NOT_MET_MESSAGE =
  'This guest must first redeem';

export const EVENT_CARD_NOT_FOUND_MESSAGE = 'Card not found';
export const EVENT_CARD_UNCLAIMED_MESSAGE =
  'This card has no owner and cannot be used as a ticket';
