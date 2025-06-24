(() => {
  // ../france_declic/france_declic/public/js/venue_directory.bundle.js
  $(document).ready(function() {
    console.log("=== VENUE DIRECTORY DEBUG ===");
    console.log("Venue directory loaded with", $(".venue-table tbody tr").length, "venues");
    console.log("Found", $(".btn-details").length, "detail buttons");
    console.log("Frappe available:", typeof frappe !== "undefined");
    $(".btn-details").on("click", function(e) {
      e.preventDefault();
      e.stopPropagation();
      alert("Button clicked! Venue: " + $(this).data("venue"));
      const venueName = $(this).data("venue");
      console.log("Loading details for venue:", venueName);
      loadVenueDetails(venueName);
    });
    function loadVenueDetails(venueName) {
      console.log("loadVenueDetails called with:", venueName);
      alert("loadVenueDetails called with: " + venueName);
      if (typeof frappe === "undefined") {
        alert("Frappe is not available!");
        console.error("Frappe is not available");
        showModalError("System error: Frappe not loaded");
        return;
      }
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
      alert("About to call frappe.call");
      frappe.call({
        method: "france_declic.templates.pages.venue_directory.get_venue_details",
        args: {
          venue_name: venueName
        },
        callback: function(response) {
          alert("Got response: " + JSON.stringify(response));
          console.log("Backend response:", response);
          if (response.message) {
            renderVenueModal(response.message);
          } else {
            console.error("No message in response:", response);
            showModalError("Failed to load venue details - no data returned");
          }
        },
        error: function(xhr, status, error) {
          alert("Error occurred: " + error);
          console.error("Error loading venue details:", error);
          console.error("XHR:", xhr);
          console.error("Status:", status);
          showModalError("Error loading venue details: " + error);
        }
      });
    }
    function renderVenueModal(venue) {
      alert("Rendering modal");
      console.log("Rendering modal for venue:", venue);
      $("#venueModalLabel").text(venue.label || venue.name);
      if (venue.custom_telegram_channel) {
        $("#telegramLink").attr("href", venue.custom_telegram_channel).show();
      }
      let contactsHtml = "";
      if (venue.custom_point_of_contact && venue.custom_point_of_contact.length > 0) {
        contactsHtml = venue.custom_point_of_contact.map((contact) => `<span class="badge badge-light mr-1 mb-1">${contact.contact}</span>`).join("");
      } else {
        contactsHtml = '<span class="text-muted">No contacts listed</span>';
      }
      const accessibilityHtml = venue.custom_access_for_person_with_reduced_mobility ? '<span class="text-success"><svg class="wheelchair-icon" viewBox="0 0 448 512" style="width: 16px; height: 16px; fill: currentColor;"><path d="M224 48c26.5 0 48 21.5 48 48s-21.5 48-48 48s-48-21.5-48-48s21.5-48 48-48zM152 320c-22.1 0-40-17.9-40-40s17.9-40 40-40h48v-16c0-13.3 10.7-24 24-24s24 10.7 24 24v40c0 26.5-21.5 48-48 48h-48zm120 32c0-8.8 7.2-16 16-16h48c8.8 0 16 7.2 16 16s-7.2 16-16 16h-48c-8.8 0-16-7.2-16-16zM224 160c-44.2 0-80 35.8-80 80v8c0 17.7-14.3 32-32 32s-32-14.3-32-32v-8c0-79.5 64.5-144 144-144s144 64.5 144 144v8c0 17.7-14.3 32-32 32s-32-14.3-32-32v-8c0-44.2-35.8-80-80-80zm0 208c70.7 0 128-57.3 128-128v-8c0-8.8 7.2-16 16-16s16 7.2 16 16v8c0 88.4-71.6 160-160 160s-160-71.6-160-160v-8c0-8.8 7.2-16 16-16s16 7.2 16 16v8c0 70.7 57.3 128 128 128z"/></svg> Accessible for people with reduced mobility</span>' : '<span class="text-muted">Not accessible for people with reduced mobility</span>';
      const modalContent = `
            <div class="venue-details">
                <div class="row">
                    <div class="col-md-6">
                        <div class="detail-group">
                            <h6><i class="fa fa-building text-primary"></i> Company</h6>
                            <p>${venue.company || "Not specified"}</p>
                        </div>
                        
                        <div class="detail-group">
                            <h6><i class="fa fa-map-marker-alt text-primary"></i> Full Address</h6>
                            <p>${venue.published_address || "Not specified"}</p>
                        </div>
                        
                        <div class="detail-group">
                            <h6><i class="fa fa-users text-primary"></i> Capacity</h6>
                            <p>${venue.custom_capacity || "Not specified"}</p>
                        </div>
                        
                        <div class="detail-group">
                            <h6><i class="fa fa-universal-access text-primary"></i> Accessibility</h6>
                            <p>${accessibilityHtml}</p>
                        </div>
                    </div>
                    
                    <div class="col-md-6">
                        <div class="detail-group">
                            <h6><i class="fa fa-tag text-primary"></i> Venue Type</h6>
                            <p>${venue.custom_booking_venue_type || "Not specified"}</p>
                        </div>
                        
                        <div class="detail-group">
                            <h6><i class="fa fa-laptop text-primary"></i> Equipment</h6>
                            <p>${venue.custom_projection_equipement || "Not specified"}</p>
                        </div>
                        
                        <div class="detail-group">
                            <h6><i class="fa fa-wrench text-primary"></i> Hosted Workshops</h6>
                            <p>${venue.custom_hosted_workshops || "Not specified"}</p>
                        </div>
                        
                        <div class="detail-group">
                            <h6><i class="fa fa-user text-primary"></i> Point of Contact</h6>
                            <div>${contactsHtml}</div>
                        </div>
                    </div>
                </div>
                
                ${venue.description ? `
                    <div class="row mt-3">
                        <div class="col-12">
                            <div class="detail-group">
                                <h6><i class="fa fa-info-circle text-primary"></i> Description</h6>
                                <div class="p-3 bg-light rounded">
                                    ${venue.description}
                                </div>
                            </div>
                        </div>
                    </div>
                ` : ""}
            </div>
            
            <style>
                .detail-group {
                    margin-bottom: 20px;
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
                }
                .venue-details {
                    padding: 10px 0;
                }
            </style>
        `;
      $("#venueModalBody").html(modalContent);
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
//# sourceMappingURL=venue_directory.bundle.FLREUQCU.js.map
