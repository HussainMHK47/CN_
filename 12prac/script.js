$(function () {
  const trips = [
    { id: "dolomites", name: "Dolomites Hut-to-Hut", location: "Dolomites, Italy", type: "Hiking", duration: "4 days", level: "Moderate", price: 489, rating: "4.98", dates: ["Jun 14–17", "Jul 05–08", "Aug 16–19"], image: "one" },
    { id: "alpine-camp", name: "Alpine Lakes Campout", location: "Swiss Alps, Switzerland", type: "Camping", duration: "3 days", level: "Easy", price: 325, rating: "4.96", dates: ["Jun 21–23", "Jul 12–14", "Aug 09–11"], image: "two" },
    { id: "ridge-climb", name: "The Ridge Climb", location: "Chamonix, France", type: "Climbing", duration: "2 days", level: "Challenging", price: 375, rating: "4.99", dates: ["Jun 28–29", "Jul 19–20", "Aug 23–24"], image: "three" },
    { id: "banff-trails", name: "Banff Wild Trails", location: "Banff, Canada", type: "Hiking", duration: "5 days", level: "Moderate", price: 620, rating: "4.97", dates: ["Jul 02–06", "Jul 23–27", "Aug 13–17"], image: "four" },
    { id: "glacier-camp", name: "Glacier Basecamp", location: "Tyrol, Austria", type: "Camping", duration: "3 days", level: "Easy", price: 295, rating: "4.93", dates: ["Jun 20–22", "Jul 18–20", "Aug 15–17"], image: "five" },
    { id: "powder-days", name: "High Alpine Powder", location: "Verbier, Switzerland", type: "Skiing", duration: "4 days", level: "Challenging", price: 710, rating: "4.99", dates: ["Dec 12–15", "Jan 09–12", "Feb 06–09"], image: "six" }
  ];

  let activeFilter = "All";
  let selectedTrip = null;
  let toastTimer;

  function escapeHtml(value) {
    return $("<div>").text(String(value)).html();
  }

  function renderTrips() {
    const locationQuery = $("#searchLocation").val().trim().toLowerCase();
    const selectedDate = $("#searchDate").val();
    const selectedType = $("#searchType").val();

    const filteredTrips = trips.filter(function (trip) {
      const matchesFilter = activeFilter === "All" || trip.type === activeFilter;
      const matchesLocation = !locationQuery || trip.location.toLowerCase().includes(locationQuery) || trip.name.toLowerCase().includes(locationQuery);
      const matchesType = !selectedType || trip.type === selectedType;
      const matchesDate = !selectedDate || new Date(selectedDate + "T12:00:00") >= new Date();

      return matchesFilter && matchesLocation && matchesType && matchesDate;
    });

    const $grid = $("#tripGrid").empty();

    filteredTrips.forEach(function (trip) {
      const card = `
        <article class="trip-card">
          <div class="trip-image image-${escapeHtml(trip.image)}">
            <span class="trip-tag">${escapeHtml(trip.type.toUpperCase())}</span>
            <span class="trip-rating">★ ${escapeHtml(trip.rating)}</span>
          </div>
          <div class="trip-details">
            <span class="trip-location">⌖ ${escapeHtml(trip.location)}</span>
            <h3>${escapeHtml(trip.name)}</h3>
            <div class="trip-facts"><span>◷ ${escapeHtml(trip.duration)}</span><span>↗ ${escapeHtml(trip.level)}</span></div>
            <div class="trip-bottom">
              <span class="trip-price">From <strong>$${escapeHtml(trip.price)}</strong> / person</span>
              <button class="book-button" type="button" data-trip-id="${escapeHtml(trip.id)}">Book now ↗</button>
            </div>
          </div>
        </article>
      `;
      $grid.append(card);
    });

    $("#noResults").toggle(filteredTrips.length === 0);
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    $("#toast").text(message).addClass("visible");
    toastTimer = setTimeout(function () {
      $("#toast").removeClass("visible");
    }, 3500);
  }

  function openBooking(trip) {
    selectedTrip = trip;
    $("#modalTripName").text(`${trip.name} · ${trip.location}`);
    $("#guestDate").empty();

    trip.dates.forEach(function (date) {
      $("#guestDate").append($("<option>").val(date).text(date));
    });

    $("#bookingModal").addClass("open").attr("aria-hidden", "false");
    $("body").css("overflow", "hidden");
    setTimeout(function () {
      $("#guestName").trigger("focus");
    }, 50);
  }

  function closeBooking() {
    $("#bookingModal").removeClass("open").attr("aria-hidden", "true");
    $("body").css("overflow", "");
    selectedTrip = null;
  }

  $("#filterRow").on("click", ".filter-chip", function () {
    activeFilter = $(this).data("filter");
    $(".filter-chip").removeClass("selected");
    $(this).addClass("selected");
    renderTrips();
  });

  $("#searchButton").on("click", function () {
    activeFilter = "All";
    $(".filter-chip").removeClass("selected");
    $('.filter-chip[data-filter="All"]').addClass("selected");
    renderTrips();
    document.querySelector("#adventures").scrollIntoView({ behavior: "smooth" });
  });

  $("#searchLocation, #searchDate, #searchType").on("input change", renderTrips);

  $("#tripGrid").on("click", ".book-button", function () {
    const trip = trips.find(item => item.id === $(this).data("trip-id"));
    if (trip) {
      openBooking(trip);
    }
  });

  $("#closeModal").on("click", closeBooking);

  $("#bookingModal").on("click", function (event) {
    if (event.target === this) {
      closeBooking();
    }
  });

  $(document).on("keydown", function (event) {
    if (event.key === "Escape" && $("#bookingModal").hasClass("open")) {
      closeBooking();
    }
  });

  $("#bookingForm").on("submit", function (event) {
    event.preventDefault();

    if (!selectedTrip) {
      return;
    }

    const booking = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      tripId: selectedTrip.id,
      tripName: selectedTrip.name,
      location: selectedTrip.location,
      name: $("#guestName").val().trim(),
      email: $("#guestEmail").val().trim(),
      travelers: Number($("#guestCount").val()),
      date: $("#guestDate").val(),
      bookedAt: new Date().toISOString()
    };

    let bookings = [];

    try {
      bookings = JSON.parse(localStorage.getItem("summitBookings")) || [];
    } catch {
      bookings = [];
    }

    bookings.push(booking);
    localStorage.setItem("summitBookings", JSON.stringify(bookings));

    const tripName = selectedTrip.name;
    closeBooking();
    this.reset();
    showToast(`You're on the list for ${tripName}. Booking saved!`);
  });

  renderTrips();
});