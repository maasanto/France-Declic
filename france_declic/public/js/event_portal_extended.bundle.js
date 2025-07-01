// File: apps/your_custom_app/your_custom_app/public/js/events_portal_extended.js

// Extend the existing EventsPortalView class
frappe.events.EventsPortalView = class EventsPortalView extends frappe.ui.BaseWebCalendar {
	constructor(opts) {
		opts.wrapper ??= opts.parent;
		super(opts);
	}

	calendar_options() {
		return Object.assign(super.calendar_options(), {
			eventClassNames: "events-calendar",
			initialView: frappe.is_mobile() ? "listDay" : "dayGridMonth",
		});
	}

	async getEvents(parameters) {
		return frappe
			.call({
				method: "frappe.desk.doctype.event.event.get_prepared_events",
				args: {
					start: this.format_ymd(parameters.start),
					end: this.format_ymd(parameters.end),
				},
			})
			.then((result) => {
				return result.message || [];
			});
	}

	// Override the onEventClick method with real API integration
	onEventClick(event) {

		frappe.call({
			method: "france_declic.templates.pages.event_slot.get_event_slots",
			args: { 
				event_name: event.event.id 
			},
			callback: (r) => {
				if (r.message) {
					this.showEnhancedModal(event, r.message);
				} else {
					frappe.msgprint({
						title: __("Error"),
						message: __("Could not load event slots"),
						indicator: "red"
					});
				}
			},
			error: () => {
				frappe.msgprint({
					title: __("Error"),
					message: __("Failed to fetch event slots"),
					indicator: "red"
				});
			}
		});
	}

	showEnhancedModal(event, slots) {
		const dialog = new frappe.ui.Dialog({
			size: "large",
			title: __(event.event.title),
			fields: [
				{
					fieldtype: "HTML",
					fieldname: "event_content",
				},
			],
		});

		// Add primary action if route exists
		if (event.event.extendedProps.route) {
			dialog.set_primary_action(__("See Full Details"), () => {
				window.location.href = "/" + event.event.extendedProps.route;
			});
		}

		// Render the enhanced content using existing event data and fetched slots
		dialog.fields_dict.event_content.$wrapper.html(
			this.renderEnhancedEventContent(event, slots)
		);

		// Bind event handlers for sign-up buttons
		this.bindSlotSignupHandlers(dialog, event.event.id, slots);

		dialog.show();
	}

	renderEnhancedEventContent(event, slots) {
		const eventProps = event.event.extendedProps;
		
		// Event header with image (using existing event data)
		const eventHeader = `
			<div class="event-header d-flex align-items-start mb-4">
				${eventProps.image ? `
					<div class="event-image mr-3">
						<img src="${eventProps.image}" alt="${eventProps.subject}" 
							 style="width: 120px; height: 120px; object-fit: cover; border-radius: 8px;">
					</div>
				` : ''}
				<div class="event-info flex-grow-1">
					<h4 class="event-title mb-2">${eventProps.subject}</h4>
					${eventProps.workshop_type ? `
						<span class="badge badge-primary mb-2">${eventProps.workshop_type}</span>
					` : ''}
					<div class="event-meta text-muted">
						<div><i class="fa fa-calendar"></i> ${frappe.datetime.str_to_user(event.event.start)}</div>
						${event.event.end ? `
							<div><i class="fa fa-clock"></i> ${frappe.datetime.str_to_user(event.event.end)}</div>
						` : ''}
						${eventProps.location ? `
							<div><i class="fa fa-map-marker"></i> ${eventProps.location}</div>
						` : ''}
					</div>
				</div>
			</div>
		`;

		// Event description (using existing event data)
		const eventDescription = `
			<div class="event-description mb-4">
				<h5>${__("Description")}</h5>
				<div class="text-muted">
					${eventProps.description || __("No description available")}
				</div>
			</div>
		`;

		// Event slots section (using fetched slots data)
		const slotsSection = this.renderEventSlots(slots);

		return `
			<div class="enhanced-event-modal">
				${eventHeader}
				${eventDescription}
				${slotsSection}
			</div>
		`;
	}

	renderEventSlots(slots) {
		if (!slots || slots.length === 0) {
			return `
				<div class="event-slots">
					<h5>${__("Event Slots")}</h5>
					<div class="alert alert-info">
						${__("No time slots available for this event")}
					</div>
				</div>
			`;
		}

		const slotsHtml = slots.map(slot => {
			const isFullyBooked = slot.is_full || false;
			
			// Generate user list HTML
			const userListHtml = slot.registered_users && slot.registered_users.length > 0 ? `
				<div class="registered-users mt-2">
					<small class="text-muted">${__("Registered")}:</small>
					<div class="user-list">
						${slot.registered_users.map(user => `
							<div class="user-item">
								<small><strong>${user.full_name}</strong> (${user.email})</small>
							</div>
						`).join('')}
					</div>
				</div>
			` : '';
			
			return `
				<div class="event-slot-card border rounded ${isFullyBooked ? 'slot-full' : ''}">
					<div class="d-flex justify-content-between align-items-start">
						<div class="slot-info flex-grow-1">
							<h6 class="slot-title">${slot.slot_title || __("Time Slot")}</h6>
							<div class="slot-capacity">
								<span class="capacity-indicator ${isFullyBooked ? 'capacity-full' : 'capacity-available'}">
									<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-user">
										<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
										<circle cx="12" cy="7" r="4"></circle>
									</svg>
									${slot.already_booked}/${slot.available_bookings}
								</span>
							</div>
							${userListHtml}
						</div>
						<div class="slot-actions">
							${!isFullyBooked ? `
								<button class="btn btn-primary btn-sm signup-btn" 
										data-slot-name="${slot.name}"
										data-slot-title="${slot.slot_title || 'Time Slot'}">
									<i class="fa fa-user-plus"></i> ${__("Sign Up")}
								</button>
							` : `
								<button class="btn btn-secondary btn-sm" disabled>
									<i class="fa fa-ban"></i> ${__("Full")}
								</button>
							`}
						</div>
					</div>
				</div>
			`;
		}).join('');

		return `
			<div class="event-slots">
				<h5>${__("Available Time Slots")}</h5>
				<div class="slots-container">
					${slotsHtml}
				</div>
			</div>
		`;
	}

	bindSlotSignupHandlers(dialog, eventId, slots) {
		// Bind click handlers for signup buttons
		dialog.$wrapper.find('.signup-btn').on('click', (e) => {
			const button = $(e.currentTarget);
			const slotName = button.data('slot-name');
			const slotTitle = button.data('slot-title');
			
			this.handleSlotSignup(slotName, slotTitle, button, eventId, slots);
		});
	}

	handleSlotSignup(slotName, slotTitle, button, eventId, slots) {
		// Confirm signup
		frappe.confirm(
			__("Are you sure you want to sign up for '{0}'?", [slotTitle]),
			() => {
				// Disable button and show loading
				button.prop('disabled', true).html('<i class="fa fa-spinner fa-spin"></i> ' + __("Signing up..."));

				// Use the existing registration method
				frappe.call({
					method: "erpnext.venue.doctype.event_slot_booking.event_slot_booking.register_for_slot",
					args: {
						slot: slotName
					},
					callback: (r) => {
						if (r.message || !r.exc) {
							frappe.show_alert({
								message: __("Successfully signed up for {0}!", [slotTitle]),
								indicator: "green"
							});
							
							// Update button state
							button.removeClass('btn-primary').addClass('btn-success')
								  .html('<i class="fa fa-check"></i> ' + __("Signed Up"));
								  
							// Optionally update the capacity display
							this.updateSlotCapacityDisplay(button, slotName, slots);
						} else {
							frappe.show_alert({
								message: r.message || __("Failed to sign up. Please try again."),
								indicator: "red"
							});
							
							// Re-enable button
							button.prop('disabled', false).html('<i class="fa fa-user-plus"></i> ' + __("Sign Up"));
						}
					},
					error: () => {
						frappe.show_alert({
							message: __("An error occurred. Please try again."),
							indicator: "red"
						});
						
						// Re-enable button
						button.prop('disabled', false).html('<i class="fa fa-user-plus"></i> ' + __("Sign Up"));
					}
				});
			}
		);
	}

	updateSlotCapacityDisplay(button, slotName, slots) {
		// Find the slot data
		const currentSlot = slots.find(s => s.name === slotName);
		if (currentSlot) {
			const slotCard = button.closest('.event-slot-card');
			const capacityIndicator = slotCard.find('.capacity-indicator');
			if (capacityIndicator.length) {
				// Increment the booked count
				const newBooked = currentSlot.already_booked + 1;
				const newAvailable = currentSlot.available_bookings - newBooked;
				
				// Update the text content (keep the SVG and update the count)
				const svg = capacityIndicator.find('svg').prop('outerHTML');
				capacityIndicator.html(`${svg} ${newBooked}/${currentSlot.available_bookings}`);
				
				// Change indicator style if now full
				if (newAvailable === 0) {
					capacityIndicator.removeClass('capacity-available').addClass('capacity-full');
					slotCard.addClass('slot-full');
				}
			}
		}
	}
};