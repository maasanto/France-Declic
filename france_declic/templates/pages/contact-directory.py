# Copyright (c) 2023, Dokos SAS and Contributors
# License: GNU General Public License v3. See license.txt

import frappe
from frappe import _


def get_context(context):
	context.no_cache = 1
	context.show_sidebar = True
	context.full_width = True

	if frappe.session.user == "Guest":
		frappe.throw(_("You need to be logged in to access this page"), frappe.PermissionError)


@frappe.whitelist()
def get_workshop_types():
	"""Get all unique workshop types from Workshop Type doctype"""
	workshop_types = frappe.get_all(
		"Workshop Type", 
		fields=["name"],
		filters={"name": ["!=", ""]},  # Filter out empty names
		order_by="name"
	)
	# Return just the names as a list of strings
	return [workshop.name for workshop in workshop_types if workshop.name]


@frappe.whitelist()
def get_contacts(filters=None):
	"""Get filtered list of all contacts with their workshop qualifications"""
	if filters:
		filters = frappe.parse_json(filters)
	else:
		filters = {}

	query_filters = []
	
	# Workshop filter using child table - correct syntax
	if filters.get("workshop_type"):
		query_filters.append(["Hosted Workshop", "workshop", "=", filters.get("workshop_type")])

	search_term = filters.get("search", "")

	# Get contacts
	or_filters = None
	if search_term:
		or_filters = [
			["first_name", "like", f"%{search_term}%"],
			["last_name", "like", f"%{search_term}%"],
			["email_id", "like", f"%{search_term}%"]
		]

	contacts = frappe.get_all(
		"Contact",
		filters=query_filters,
		fields=["name", "first_name", "last_name", "email_id", "phone", "mobile_no", "custom_telegram_alias", "custom_pincode", "custom_city"],
		or_filters=or_filters,
		order_by="first_name, last_name"
	)
	
	# Get workshop qualifications for each contact
	for contact in contacts:
		contact.workshops = frappe.get_all(
			"Hosted Workshop",
			filters={"parent": contact.name},
			fields=["workshop"],
			order_by="workshop"
		)
		
		# Create full name for display
		contact.full_name = f"{contact.first_name or ''} {contact.last_name or ''}".strip()
		
		# Use mobile if phone is empty
		if not contact.phone and contact.mobile_no:
			contact.phone = contact.mobile_no
	
	return {"contacts": contacts}


@frappe.whitelist()
def get_contact_stats():
	"""Get basic stats for the contact directory"""
	total_contacts = frappe.db.count("Contact")
	total_workshops = frappe.db.count("Hosted Workshop")
	
	return {
		"total_contacts": total_contacts,
		"total_workshops": total_workshops
	}