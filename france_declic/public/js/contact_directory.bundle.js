class ContactDirectory {
	constructor(wrapper) {
		this.ready = false
		this.wrapper = wrapper
		this.contact_section = null
		this.search_type = "server"

		this.debounced_show_contacts = frappe.utils.throttle(this.show_contacts.bind(this), 250)
		this.build()
	}

	async build() {
		this.add_layout()
		await this.add_filters()
		await this.set_field_values_from_url()

		this.ready = true
		this.refresh_search(true)
	}

	add_layout() {
		this.toolbar = document.createElement("div")
		this.toolbar.setAttribute("class", "toolbar")
		this.wrapper.append(this.toolbar)

		this.contacts_section = document.createElement("div")
		this.contacts_section.setAttribute("class", "contacts-grid")
		this.wrapper.appendChild(this.contacts_section)
	}

	async add_filters() {
		this.add_filter_search()
		await this.add_filter_workshop()
	}

	add_filter_search() {
		const search_label = __("Search contacts...")
		const search = $(this.toolbar).append(`
			<div class="search-input">
				<input type="search" class="form-control"
					placeholder="${frappe.utils.escape_html(search_label)}"
					aria-label="${frappe.utils.escape_html(search_label)}"
					autocomplete="off"
				>
				<div class="search-icon">
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor" stroke-width="2" stroke-linecap="round"
						stroke-linejoin="round"
						class="feather feather-search">
						<circle cx="11" cy="11" r="8"></circle>
						<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
					</svg>
				</div>
			</div>
		`).find(".search-input")
		
		this.search_field = search.get(0).querySelector("input")
		const search_now = frappe.utils.debounce(() => this.refresh_search(), 250)
		this.search_field.addEventListener("keyup", search_now)
		this.search_field.addEventListener("input", search_now)
		this.search_field.addEventListener("change", search_now)
	}

	async add_filter_workshop() {
		// Get workshop types first
		const workshop_response = await frappe.call({
			method: "france_declic.templates.pages.contact-directory.get_workshop_types"
		});
		
		// Backend now returns a simple list of strings
		this.workshop_types = workshop_response.message || [];

		const workshop_wrapper = document.createElement("div")
		workshop_wrapper.setAttribute("class", "workshop-filter")
		this.toolbar.appendChild(workshop_wrapper)

		this.workshop_filter = frappe.ui.form.make_control({
			parent: workshop_wrapper,
			df: {
				fieldtype: 'Autocomplete',
				fieldname: 'workshop_type',
				placeholder: __('Filter by workshop type...'),
				options: this.workshop_types,
				change: () => this.refresh_search(),
			},
			render_input: true,
		});
	}

	get_filters() {
		const filter_values = {}

		if (this.workshop_filter && this.workshop_filter.get_value()) {
			filter_values.workshop_type = this.workshop_filter.get_value()
		}

		if (this.search_field && this.search_field.value) {
			filter_values.search = this.search_field.value
		}

		return filter_values
	}

	refresh_search(now = false) {
		if (!this.ready) return;

		this.filter_values = this.get_filters();
		this.update_url_with_filter_values();

		if (now) {
			this.show_contacts()
		} else {
			this.debounced_show_contacts()
		}
	}

	async show_contacts() {
		// Show loading
		this.contacts_section.innerHTML = `
			<div class="loading">
				<div class="spinner-border" role="status">
					<span class="sr-only">${__('Loading...')}</span>
				</div>
				<div class="mt-2">${__('Loading contacts...')}</div>
			</div>
		`;

		try {
			const response = await frappe.call({
				method: 'france_declic.templates.pages.contact-directory.get_contacts',
				args: {
					filters: this.filter_values
				}
			});
			
			const contacts = response.message?.contacts || [];
			this.render_contacts(contacts);
			
		} catch (error) {
			console.error('Error loading contacts:', error);
			this.show_error();
		}
	}

	render_contacts(contacts) {
		if (!contacts || contacts.length === 0) {
			this.show_no_results();
			return;
		}

		const contacts_html = contacts.map(contact => this.render_contact_card(contact)).join('');
		this.contacts_section.innerHTML = contacts_html;
	}

	show_no_results() {
		const message = this.filter_values?.search || this.filter_values?.workshop_type ? 
			__('No contacts found matching your criteria') : 
			__('No contacts found');
			
		this.contacts_section.innerHTML = `
			<div class="no-results">
				${frappe.utils.icon('users')}
				<div class="mt-2">${message}</div>
				${(this.filter_values?.search || this.filter_values?.workshop_type) ? 
					`<button class="btn btn-sm btn-secondary mt-2" onclick="contact_directory.clear_filters()">
						${__('Clear Filters')}
					</button>` : ''
				}
			</div>
		`;
	}

	show_error() {
		this.contacts_section.innerHTML = `
			<div class="no-results">
				<div class="text-danger">
					${frappe.utils.icon('alert-circle')}
					<div class="mt-2">${__('Error loading contacts')}</div>
				</div>
			</div>
		`;
	}

	render_contact_card(contact) {
		const workshops_html = contact.workshops?.map(workshop => 
			`<span class="workshop-badge">${frappe.utils.escape_html(workshop.workshop)}</span>`
		).join('') || '';

		// Email info with icon
		const email_html = contact.email_id ? `
			<div class="contact-info-item">
				<svg class="contact-info-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
					<polyline points="22,6 12,13 2,6"></polyline>
				</svg>
				<a href="mailto:${frappe.utils.escape_html(contact.email_id)}">${frappe.utils.escape_html(contact.email_id)}</a>
			</div>
		` : '';

		// Phone info with icon
		const phone_html = contact.phone ? `
			<div class="contact-info-item">
				<svg class="contact-info-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
				</svg>
				<span>${frappe.utils.escape_html(contact.phone)}</span>
			</div>
		` : '';

		// Telegram info with icon
		const telegram_html = contact.custom_telegram_alias ? `
			<div class="contact-info-item">
				<svg class="contact-info-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
				</svg>
				<span>${frappe.utils.escape_html(contact.custom_telegram_alias)}</span>
			</div>
		` : '';

		// Location info (City + Pincode) with icon
		const location_parts = [];
		if (contact.custom_city) location_parts.push(contact.custom_city);
		if (contact.custom_pincode) location_parts.push(contact.custom_pincode);
		
		const location_html = location_parts.length > 0 ? `
			<div class="contact-info-item">
				<svg class="contact-info-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
					<circle cx="12" cy="10" r="3"></circle>
				</svg>
				<span>${frappe.utils.escape_html(location_parts.join(', '))}</span>
			</div>
		` : '';

		return `
			<div class="contact-card">
				<div class="contact-name">
					${frappe.utils.escape_html(contact.full_name || 'Unknown')}
				</div>
				<div class="contact-info">
					${email_html}
					${phone_html}
					${telegram_html}
					${location_html}
				</div>
				${workshops_html ? `
					<div class="contact-workshops">
						${workshops_html}
					</div>
				` : `
					<div class="contact-workshops">
						<div class="no-workshops">
							No workshops listed
						</div>
					</div>
				`}
			</div>
		`;
	}

	clear_filters() {
		if (this.search_field) this.search_field.value = '';
		if (this.workshop_filter) this.workshop_filter.set_value('');
		this.refresh_search(true);
	}

	update_url_with_filter_values() {
		const url = new URL(window.location.href)
		const params = new URLSearchParams(url.search)
		const kv = {
			workshop_type: this.filter_values.workshop_type,
			search: this.filter_values.search,
		}
		for (const [key, value] of Object.entries(kv)) {
			if (value) {
				params.set(key, value)
			} else {
				params.delete(key)
			}
		}
		url.search = params.toString()
		window.history.replaceState({}, "", url.toString())
	}

	async set_field_values_from_url() {
		const params = new URLSearchParams(window.location.search)

		if (params.get("workshop_type")) {
			this.workshop_filter.set_value(params.get("workshop_type"))
		}
		if (params.get("search")) {
			this.search_field.value = params.get("search")
		}
	}
}

class ContactDirectorySidebar {
	constructor(wrapper) {
		this.wrapper = wrapper
		this.get_stats().then(() => {
			this.build()
		})
	}

	get_stats() {
		return frappe.call({
			method: "france_declic.templates.pages.contact-directory.get_contact_stats"
		}).then(r => {
			this.stats = r.message || {};
		})
	}

	build() {
		const html = `<div id="contact-stats" class="card frappe-card p-4 sticky-top flex-grow-1">
			<h6 class="title">${__("Directory Stats")}</h6>
			<div class="h-100">
				<div class="card-body p-0">
					<div class="row text-center">
						<div class="col-6">
							<div class="h4 mb-0">${this.stats.total_contacts || 0}</div>
							<small class="text-muted">${__('Contacts')}</small>
						</div>
						<div class="col-6">
							<div class="h4 mb-0">${this.stats.total_workshops || 0}</div>
							<small class="text-muted">${__('Workshop Records')}</small>
						</div>
					</div>
				</div>
			</div>
		</div>`

		this.wrapper.innerHTML = html;
	}
}

let contact_directory;

$(document).ready(() => {
	contact_directory = new ContactDirectory(document.getElementById("contact-directory"))
	new ContactDirectorySidebar(document.getElementById("contact-directory-sidebar"))
})