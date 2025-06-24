# venue_directory.py
# Place this file in: france_declic/templates/pages/venue_directory.py

import frappe
from frappe import _

no_cache = 1

def get_context(context):
    """
    Simple venue directory page - hardcoded fields, no filtering
    """
    # Basic authentication check
    if frappe.session.user == "Guest":
        frappe.throw(_("Please login to access this page"), frappe.PermissionError)
    
    context.no_cache = 1
    context.show_sidebar = True
    
    # Get all venues with specific fields - no filtering
    venues = frappe.get_all(
        "Booking Venue",
        fields=[
            "name",
            "label", 
            "custom_booking_venue_type",
            "company",
            "published_address",
            "custom_capacity",
            "custom_projection_equipement",
            "custom_access_for_person_with_reduced_mobility",
            "custom_telegram_channel",
            "description",
            "modified"
        ],
        order_by="modified desc"
    )
    
    context.venues = venues
    context.title = _("Venue Directory")
    
    # Add page breadcrumbs
    context.parents = [
        {"title": _("Home"), "route": "/"},
        {"title": _("Venue Directory"), "route": "/venue-directory"}
    ]
    
    return context