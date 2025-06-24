(() => {
  // ../france_declic/france_declic/public/js/venue_directory.bundle.js
  $(document).ready(function() {
    console.log("Venue directory JS loaded");
    console.log("Found", $(".btn-details").length, "detail buttons");
    $(".btn-details").on("click", function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log("Button clicked!");
      const venueName = $(this).data("venue");
      console.log("Loading details for venue:", venueName);
      loadVenueDetails(venueName);
    });
    function loadVenueDetails(venueName) {
      console.log("loadVenueDetails called for:", venueName);
      $("#venueModal").modal("show");
      $("#venueModalBody").html(`
            <div class="text-center">
                <div class="spinner-border" role="status">
                    <span class="sr-only">Loading...</span>
                </div>
                <p class="mt-2">Loading venue details...</p>
            </div>
        `);
      $("#venueModalLabel").text("Loading...");
      $("#telegramLink").hide();
      console.log("About to make frappe call");
      frappe.call({
        method: "france_declic.templates.pages.venue_directory.get_venue_details",
        args: {
          venue_name: venueName
        },
        callback: function(response) {
          console.log("Backend response received:", response);
          if (response.message) {
            renderVenueModal(response.message);
          } else {
            console.error("No message in response");
            showModalError("Failed to load venue details");
          }
        },
        error: function(xhr, status, error) {
          console.error("Error loading venue details:", error);
          showModalError("Error loading venue details. Please try again.");
        }
      });
    }
    function renderVenueModal(venue) {
      console.log("Rendering modal for:", venue.name);
      $("#venueModalLabel").text(venue.label);
      $("#telegramLink").hide();
      const modalContent = `
            <div class="venue-details">
                <div class="detail-group">
                    <h5>${venue.label}</h5>
                </div>
                
                ${venue.description ? `
                    <div class="detail-group">
                        <h6><i class="fa fa-info-circle text-primary"></i> Proc\xE9dure \xE0 suivre</h6>
                        <div class="description-content">
                            ${venue.description}
                        </div>
                    </div>
                ` : ""}
                
                ${venue.full_address ? `
                    <div class="detail-group">
                        <h6><i class="fa fa-map-marker-alt text-primary"></i> Adresse</h6>
                        <p>${venue.full_address}</p>
                    </div>
                ` : ""}
                
                ${venue.custom_telegram_channel ? `
                    <div class="detail-group">
                        <h6><i class="fa fa-at text-primary"></i> Telegram</h6>
                        <p><a href="${venue.custom_telegram_channel}" target="_blank" class="telegram-link">${venue.custom_telegram_channel}</a></p>
                    </div>
                ` : ""}
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
                    padding: 15px;
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
                    padding: 10px 0;
                }
            </style>
        `;
      $("#venueModalBody").html(modalContent);
      console.log("Modal content rendered");
    }
    function showModalError(message) {
      $("#venueModalBody").html(`
            <div class="alert alert-danger" role="alert">
                <i class="fa fa-exclamation-triangle"></i> ${message}
            </div>
        `);
    }
  });
})();
//# sourceMappingURL=venue_directory.bundle.3HOAQMBY.js.map
