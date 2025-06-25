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

	// Override the onEventClick method with enhanced functionality
	onEventClick(event) {
		console.log("click!")
		// For now, use hardcoded data - replace with API call later
		const mockEventData = this.getMockEventData(event);
		this.showEnhancedModal(event, mockEventData);
	}

	// Mock data for testing - replace with real API call later
	getMockEventData(event) {
		return {
			name: event.event.id,
			subject: event.event.title,
			description: event.event.extendedProps.description || "Sample event description",
			starts_on: "2025-06-26 09:00:00",
			ends_on: "2025-06-26 17:00:00",
			location: "Conference Room A",
			workshop_type: "Technical Workshop",
			image: event.event.extendedProps.image,
			slots: [
				{
					name: "slot-1",
					slot_name: "Morning Session",
					start_time: "2025-06-26 09:00:00",
					end_time: "2025-06-26 12:00:00",
					description: "Introduction and basic concepts",
					max_capacity: 20,
					registered_count: 15,
					status: "Open"
				},
				{
					name: "slot-2", 
					slot_name: "Afternoon Session",
					start_time: "2025-06-26 13:00:00",
					end_time: "2025-06-26 16:00:00",
					description: "Advanced topics and hands-on practice",
					max_capacity: 15,
					registered_count: 15,
					status: "Open"
				},
				{
					name: "slot-3",
					slot_name: "Evening Q&A",
					start_time: "2025-06-26 16:30:00", 
					end_time: "2025-06-26 17:30:00",
					description: "Questions and networking",
					max_capacity: 25,
					registered_count: 8,
					status: "Open"
				}
			]
		};
	}

	showEnhancedModal(event, eventData) {
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

		// Render the enhanced content
		dialog.fields_dict.event_content.$wrapper.html(
			this.renderEnhancedEventContent(event, eventData)
		);

		// Bind event handlers for sign-up buttons
		this.bindSlotSignupHandlers(dialog, eventData);

		dialog.show();
	}

	renderEnhancedEventContent(event, eventData) {
		const eventProps = event.event.extendedProps;
		
		// Event header with image
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
					${eventData.workshop_type ? `
						<span class="badge badge-primary mb-2">${eventData.workshop_type}</span>
					` : ''}
					<div class="event-meta text-muted">
						<div><i class="fa fa-calendar"></i> ${frappe.datetime.str_to_user(eventData.starts_on)}</div>
						${eventData.ends_on ? `
							<div><i class="fa fa-clock"></i> ${frappe.datetime.str_to_user(eventData.ends_on)}</div>
						` : ''}
						${eventData.location ? `
							<div><i class="fa fa-map-marker"></i> ${eventData.location}</div>
						` : ''}
					</div>
				</div>
			</div>
		`;

		// Event description
		const eventDescription = `
			<div class="event-description mb-4">
				<h5>${__("Description")}</h5>
				<div class="text-muted">
					${eventProps.description || __("No description available")}
				</div>
			</div>
		`;

		// Event slots section
		const slotsSection = this.renderEventSlots(eventData.slots || []);

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
			const isFullyBooked = slot.max_capacity && slot.registered_count >= slot.max_capacity;
			const availableSpots = slot.max_capacity ? slot.max_capacity - slot.registered_count : null;
			
			return `
				<div class="event-slot-card border rounded p-3 mb-3 ${isFullyBooked ? 'bg-light' : ''}">
					<div class="d-flex justify-content-between align-items-start">
						<div class="slot-info flex-grow-1">
							<h6 class="slot-title mb-1">${slot.slot_name || __("Time Slot")}</h6>
							<div class="slot-time text-muted mb-2">
								<i class="fa fa-clock"></i>
								${frappe.datetime.str_to_user(slot.start_time)} - 
								${frappe.datetime.str_to_user(slot.end_time)}
							</div>
							${slot.description ? `
								<div class="slot-description text-muted small mb-2">
									${slot.description}
								</div>
							` : ''}
							<div class="slot-capacity">
								${slot.max_capacity ? `
									<span class="badge ${isFullyBooked ? 'badge-danger' : 'badge-success'}">
										${availableSpots} ${__("spots remaining")} 
										(${slot.registered_count}/${slot.max_capacity})
									</span>
								` : `
									<span class="badge badge-info">
										${slot.registered_count} ${__("registered")}
									</span>
								`}
							</div>
						</div>
						<div class="slot-actions ml-3">
							${!isFullyBooked ? `
								<button class="btn btn-primary btn-sm signup-btn" 
										data-slot-name="${slot.name}"
										data-slot-title="${slot.slot_name || 'Time Slot'}">
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

	bindSlotSignupHandlers(dialog, eventData) {
		// Bind click handlers for signup buttons
		dialog.$wrapper.find('.signup-btn').on('click', (e) => {
			const button = $(e.currentTarget);
			const slotName = button.data('slot-name');
			const slotTitle = button.data('slot-title');
			
			this.handleSlotSignup(slotName, slotTitle, button, eventData);
		});
	}

	handleSlotSignup(slotName, slotTitle, button, eventData) {
		// Confirm signup
		frappe.confirm(
			__("Are you sure you want to sign up for '{0}'?", [slotTitle]),
			() => {
				// Disable button and show loading
				button.prop('disabled', true).html('<i class="fa fa-spinner fa-spin"></i> ' + __("Signing up..."));

				// Mock API call - replace with real call later
				setTimeout(() => {
					// Simulate successful signup
					frappe.show_alert({
						message: __("Successfully signed up for {0}!", [slotTitle]),
						indicator: "green"
					});
					
					// Update button state
					button.removeClass('btn-primary').addClass('btn-success')
						  .html('<i class="fa fa-check"></i> ' + __("Signed Up"));
				}, 1500); // 1.5 second delay to simulate API call
			}
		);
	}
};