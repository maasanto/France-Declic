/**
 * Venue Directory JavaScript
 * Handles modal popup for venue details
 */

$(document).ready(function() {
    console.log("Venue directory JS loaded");
    console.log("Found", $('.btn-details').length, "detail buttons");
    console.log("Found", $('.venue-table tbody tr').length, "venue rows");
    
    // Handle details button clicks
    $('.btn-details').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation(); // Prevent row click event
        
        console.log("Button clicked!");
        
        const venueName = $(this).data('venue');
        console.log("Loading details for venue:", venueName);
        
        loadVenueDetails(venueName);
    });
    
    // Handle row clicks (excluding the details button column)
    $('.venue-table tbody tr').on('click', function(e) {
        // Don't trigger if clicking on the details button or its column
        if ($(e.target).closest('.btn-details, .details-column').length > 0) {
            return;
        }
        
        e.preventDefault();
        console.log("Row clicked!");
        
        const venueName = $(this).find('.btn-details').data('venue');
        console.log("Loading details for venue from row click:", venueName);
        
        if (venueName) {
            loadVenueDetails(venueName);
        }
    });
    
    function loadVenueDetails(venueName) {
        console.log("loadVenueDetails called for:", venueName);
        
        // Show the modal manually
        $('#venueModal').modal('show');
        
        // Reset modal content
        $('#venueModalBody').html(`
            <div class="text-center">
                <div class="spinner-border" role="status">
                    <span class="sr-only">Loading...</span>
                </div>
                <p class="mt-2">Loading venue details...</p>
            </div>
        `);
        
        $('#venueModalLabel').text('Loading...');
        $('#telegramLink').hide();
        
        console.log("About to make frappe call");
        
        // Fetch venue details
        frappe.call({
            method: 'france_declic.templates.pages.venue_directory.get_venue_details',
            args: {
                venue_name: venueName
            },
            callback: function(response) {
                console.log("Backend response received:", response);
                if (response.message) {
                    renderVenueModal(response.message);
                } else {
                    console.error("No message in response");
                    showModalError('Failed to load venue details');
                }
            },
            error: function(xhr, status, error) {
                console.error('Error loading venue details:', error);
                showModalError('Error loading venue details. Please try again.');
            }
        });
    }
    
    function renderVenueModal(venue) {
        console.log("Rendering modal for:", venue.name);
        
        $('#venueModalLabel').text(venue.label);
        
        // Hide Telegram link since we're not showing that info anymore
        $('#telegramLink').hide();
        
        const modalContent = `
            <div class="venue-details">
                
                ${venue.description ? `
                    <div class="detail-group">
                        <h6><i class="fa fa-info-circle text-primary"></i>${__("How to Book")}</h6>
                        <div class="description-content">
                            <p>${venue.description}</p>
                        </div>
                    </div>
                ` : ''}
                
                ${venue.full_address ? `
                    <div class="detail-group">
                        <h6><i class="fa fa-map-marker-alt text-primary"></i>${__("Address")}</h6>
                        <p>${venue.full_address}</p>
                    </div>
                ` : ''}
                
                ${venue.contacts && venue.contacts.length > 0 ? `
                    <div class="detail-group">
                        <h6><i class="fa fa-user text-primary"></i>${__("Point of Contacts")}</h6>
                        ${venue.contacts.map(contact => `
                            <div class="contact-item">
                                <div class="contact-name">${contact.name}</div>
                                ${contact.email ? `<div class="contact-detail"><i class="fa fa-envelope"></i> <a href="mailto:${contact.email}">${contact.email}</a></div>` : ''}
                                ${contact.phone ? `<div class="contact-detail"><i class="fa fa-phone"></i> <a href="tel:${contact.phone}">${contact.phone}</a></div>` : ''}
                                ${contact.telegram ? `<div class="contact-detail"><i class="fab fa-telegram"></i> <a href="${contact.telegram}" target="_blank">${contact.telegram}</a></div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                
                ${venue.custom_telegram_channel ? `
                    <div class="detail-group">
                        <h6><i class="fab fa-telegram text-primary"></i>Canal Telegram</h6>
                        <p><a href="${venue.custom_telegram_channel}" target="_blank" class="telegram-link">${venue.custom_telegram_channel}</a></p>
                    </div>
                ` : ''}
            </div>
            
            <style>
                .detail-group {
                    margin-bottom: 20px;
                }
                .detail-group h5 {
                    color: #333;
                    font-weight: 600;
                    margin-bottom: 15px;
                }
                .detail-group h6 {
                    color: #495057;
                    font-weight: 600;
                    margin-bottom: 8px;
                }
                .detail-group h6 i {
                    width: 20px;
                    margin-right: 8px;
                }
                .detail-group p {
                    margin-bottom: 0;
                    color: #6c757d;
                    line-height: 1.5;
                }
                .description-content {
                    color: #6c757d;
                    line-height: 1.6;
                    background: none;
                    border: none;
                }
                .telegram-link {
                    color: #007bff;
                    text-decoration: none;
                }
                .telegram-link:hover {
                    text-decoration: underline;
                }
                .venue-details {
                    padding: 10px;
                }
                .contact-item {
                    margin-bottom: 15px;
                    padding: 12px;
                    background-color: #f8f9fa;
                    border-radius: 6px;
                    border-left: 3px solid #007bff;
                }
                .contact-name {
                    font-weight: 600;
                    color: #333;
                    margin-bottom: 6px;
                }
                .contact-detail {
                    margin-bottom: 3px;
                    color: #6c757d;
                    font-size: 0.9em;
                }
                .contact-detail i {
                    width: 16px;
                    margin-right: 6px;
                    color: #007bff;
                }
                .contact-detail a {
                    color: #007bff;
                    text-decoration: none;
                }
                .contact-detail a:hover {
                    text-decoration: underline;
                }
            </style>
        `;
        
        $('#venueModalBody').html(modalContent);
        console.log("Modal content rendered");
    }
    
    function showModalError(message) {
        $('#venueModalBody').html(`
            <div class="alert alert-danger" role="alert">
                <i class="fa fa-exclamation-triangle"></i> ${message}
            </div>
        `);
    }
});