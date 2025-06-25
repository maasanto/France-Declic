import frappe
from frappe import _

@frappe.whitelist()
def get_event_slots(event_name):
	"""
	Get event slots for a given event
	"""
	try:
		# Get associated event slots with the correct field names
		slots = frappe.get_all(
			"Event Slot",
			filters={"event": event_name},
			fields=[
				"name",
				"slot_title",
				"starts_on",
				"ends_on", 
				"available_bookings",  # Total capacity
				"already_booked",      # Number already registered
				"custom_workshop_type"
			],
			order_by="starts_on asc"
		)

		# Calculate remaining spots for each slot
		for slot in slots:
			slot["available_spots"] = slot["available_bookings"] - slot["already_booked"]
			slot["is_full"] = slot["already_booked"] >= slot["available_bookings"]

		return slots

	except Exception as e:
		frappe.log_error(f"Error fetching event slots: {str(e)}")
		frappe.throw(_("Failed to fetch event slots"))