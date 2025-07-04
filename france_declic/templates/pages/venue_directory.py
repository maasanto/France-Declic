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
    context.full_width = True
    
    # Get all venues with specific fields - no filtering
    venues = frappe.get_all(
        "Booking Venue",
        filters=[
            {"enabled": True}
		],
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
            "custom_hosted_workshops",
            "modified"
        ],
        order_by="modified desc",
    )
    
    # Extract city from address and get contacts separately
    for venue in venues:
        # Get city from linked Address document
        if venue.get("published_address"):
            try:
                # If published_address is a Link field to Address doctype
                address_doc = frappe.get_doc("Address", venue["published_address"])
                venue["city"] = address_doc.get("city") or ""
            except:
                # Fallback: if it's just text, extract from comma-separated format
                address_parts = venue["published_address"].split(",")
                venue["city"] = address_parts[-1].strip() if address_parts else venue["published_address"]
        else:
            venue["city"] = ""
        
        # Get point of contact from child table
        try:
            contacts = frappe.get_all(
                "Booking Venue Contact",
                filters={"parent": venue.name},
                fields=["contact"],
                order_by="idx"
            )
            venue["contacts_list"] = [c.contact for c in contacts] if contacts else []
            venue["primary_contact"] = contacts[0].contact if contacts else ""
        except:
            venue["contacts_list"] = []
            venue["primary_contact"] = ""
    
    context.venues = venues
    context.title = _("Venue Directory")

    return context


@frappe.whitelist()
def get_venue_details(venue_name):
    """
    Get detailed venue information for the modal popup
    """
    venue = frappe.get_doc("Booking Venue", venue_name)
    
    # Get full address using Frappe's built-in address formatting
    full_address = ""
    if venue.get("published_address"):
        try:
            # Use Frappe's get_address_display function
            from frappe.contacts.doctype.address.address import get_address_display
            full_address = get_address_display(venue.published_address)
        except:
            # Fallback to the linked address name if formatting fails
            full_address = venue.published_address
    
    # Get detailed contact information
    contacts = []
    try:
        # Get contact details from the child table
        contact_records = frappe.get_all(
            "Booking Venue Contact",
            filters={"parent": venue_name},
            fields=["contact", "idx"],
            order_by="idx"
        )
        
        for contact_record in contact_records:
            contact_name = contact_record.get("contact")
            if contact_name:
                # Try to get contact details from Contact doctype
                try:
                    contact_doc = frappe.get_doc("Contact", contact_name)
                    contact_info = {
                        "name": contact_doc.get("first_name", "") + " " + contact_doc.get("last_name", ""),
                        "email": None,
                        "phone": None,
                        "telegram": None
                    }
                    
                    # Get email from contact
                    if contact_doc.get("email_ids"):
                        contact_info["email"] = contact_doc.email_ids[0].email_id
                    
                    # Get phone from contact
                    if contact_doc.get("phone_nos"):
                        contact_info["phone"] = contact_doc.phone_nos[0].phone
                    
                    # Get telegram from custom field (if exists)
                    if hasattr(contact_doc, 'custom_telegram_username') and contact_doc.get("custom_telegram_username"):
                        telegram_username = contact_doc.custom_telegram_username
                        # Format telegram URL if it's just a username
                        if not telegram_username.startswith('http'):
                            if telegram_username.startswith('@'):
                                telegram_username = telegram_username[1:]
                            contact_info["telegram"] = f"https://t.me/{telegram_username}"
                        else:
                            contact_info["telegram"] = telegram_username
                    
                    contacts.append(contact_info)
                    
                except frappe.DoesNotExistError:
                    # If contact doesn't exist as a Contact document, just use the name
                    contacts.append({
                        "name": contact_name,
                        "email": None,
                        "phone": None,
                        "telegram": None
                    })
                except Exception as e:
                    frappe.log_error(f"Error getting contact details for {contact_name}: {str(e)}")
                    contacts.append({
                        "name": contact_name,
                        "email": None,
                        "phone": None,
                        "telegram": None
                    })
    
    except Exception as e:
        frappe.log_error(f"Error getting venue contacts: {str(e)}")
        contacts = []
    
    return {
        "name": venue.name,
        "label": venue.get("label") or venue.name,
        "description": venue.get("description"),
        "full_address": full_address,
        "custom_telegram_channel": venue.get("custom_telegram_channel"),
        "contacts": contacts
    }