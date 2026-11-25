(() => {
  const spanish = document.documentElement.lang.toLowerCase().startsWith("es");
  const t = (english, spanishText) => spanish ? spanishText : english;
  const contact = document.querySelector("#contact");
  if (!document.querySelector("main") || !contact) return;

  const form = document.createElement("form");
  form.className = "lr-estimator";
  form.id = "lr-estimator";
  const contactForm = document.querySelector("#quoteform");
  const context = document.querySelector("#lr-estimate-context");
  const catalog = {
    "house": ["House Cleaning", "Limpieza residencial", 225],
    "recurring": ["Recurring House Cleaning", "Limpieza recurrente", 225],
    "apartment": ["Apartment Cleaning", "Limpieza de apartamentos", 225],
    "deep": ["Deep Cleaning", "Limpieza profunda", 279],
    "move-in": ["Move-In Cleaning", "Limpieza antes de mudarte", 299],
    "move-out": ["Move-Out Cleaning", "Limpieza después de mudarte", 299],
    "rental": ["Short-Term Rental Cleaning", "Limpieza de Airbnb", 239],
    "office": ["Office Cleaning", "Limpieza de oficinas", 249],
    "construction": ["Post-Construction Cleaning", "Limpieza posconstrucción", 399],
    "commercial": ["Commercial Cleaning", "Limpieza comercial", null]
  };
  const services = new Map(Object.values(catalog).map(([en, es, price]) => [t(en, es), price]));
  const selected = contactForm?.querySelector('select[name="service"] option[selected]')?.value;
  const legacyService = {
    "Limpieza de Airbnb y alquileres temporales": "Limpieza de Airbnb",
    "Commercial & Office Cleaning": "Commercial Cleaning",
    "Limpieza comercial y de oficinas": "Limpieza comercial"
  }[selected] ?? selected;
  const configuredService = catalog[context?.dataset.service];
  const initial = context ? (configuredService && t(...configuredService)) : legacyService;
  if (initial && !services.has(initial)) services.set(initial, null);

  const section = document.createElement("section");
  section.className = "section lr-estimate-section";
  section.innerHTML = '<div class="wrap"><h2>' +
    t("Get a free cleaning estimate", "Calcula cuánto puede costar tu limpieza") + '</h2><p>' +
    t("Choose a 4-, 5-, or 6-hour package, or get a starting price for the cleaning service you need.",
      "Elige un paquete de 4, 5 o 6 horas, o consulta el precio inicial del servicio que necesitas.") +
    '</p></div>';
  const wrap = section.querySelector(".wrap");
  if (context) wrap.replaceChildren(context.content.cloneNode(true));

  function addSelect(label, name, choices) {
    const field = document.createElement("label");
    field.textContent = label;
    const select = document.createElement("select");
    select.name = name;
    for (const choice of choices) select.add(new Option(choice, choice));
    field.append(select);
    form.append(field);
    return select;
  }

  const mode = addSelect(t("Would you like to book by the hour?", "¿Prefieres contratar la limpieza por horas?"),
    "pricing", [t("No, choose a service", "No, elegir un servicio"), t("Yes, choose a package", "Sí, elegir un paquete")]);
  const hours = addSelect(t("How many hours?", "¿Cuántas horas necesitas?"), "hours", ["4", "5", "6"]);
  const hoursPrompt = new Option(t("Choose the hours", "Elige las horas"), "");
  hoursPrompt.disabled = true;
  hours.add(hoursPrompt, 0);
  hours.value = "";
  hours.required = true;
  const service = addSelect(t("What cleaning service do you need?", "¿Qué servicio de limpieza necesitas?"),
    "service", services.keys());
  if (context && !initial) {
    const prompt = new Option(t("Choose a cleaning service", "Elige un servicio de limpieza"), "");
    prompt.disabled = true;
    service.add(prompt, 0);
    service.value = "";
  }
  if (initial) service.value = initial;
  service.required = true;
  const welcome = addSelect(t("Is this your first cleaning with La Roca?", "¿Es tu primera limpieza con La Roca?"),
    "welcome", ["No", t("Yes", "Sí")]);
  const city = addSelect(t("Service city", "Ciudad del servicio"), "city", ["Houston", ...Object.values(QUOTE_CITIES)]);
  city.value = quoteCityFromUrl();
  const property = addSelect(t("Property type", "Tipo de propiedad"), "property",
    [t("House", "Casa"), t("Apartment", "Apartamento"), t("Office or business", "Oficina o negocio")]);
  if (context?.dataset.service === "apartment") property.selectedIndex = 1;
  if (["office", "commercial"].includes(context?.dataset.service)) property.selectedIndex = 2;
  const size = addSelect(t("Approximate size", "Tamaño aproximado"), "size",
    [t("Under 1,000 sq ft", "Menos de 1,000 pies²"), t("1,000–1,999 sq ft", "1,000–1,999 pies²"),
      t("2,000–2,999 sq ft", "2,000–2,999 pies²"), t("3,000+ sq ft", "3,000 pies² o más"), t("Not sure", "No sé")]);
  const frequency = addSelect(t("How often do you need cleaning?", "¿Cada cuánto necesitas la limpieza?"), "frequency",
    [t("One time", "Una sola vez"), t("Weekly", "Cada semana"), t("Biweekly", "Cada dos semanas"),
      t("Monthly", "Cada mes")]);
  if (context?.dataset.service === "recurring") {
    frequency.remove(0);
    const prompt = new Option(t("Choose a schedule", "Elige una frecuencia"), "");
    prompt.disabled = true;
    frequency.add(prompt, 0);
    frequency.value = "";
    frequency.required = true;
  }

  const summary = document.createElement("p");
  summary.className = "lr-estimate-summary";
  summary.setAttribute("role", "status");
  const headline = document.createElement("strong");
  const detail = document.createElement("span");
  const terms = document.createElement("span");
  summary.append(headline, detail, terms);
  form.append(summary);
  const button = document.createElement("button");
  button.type = "submit";
  button.className = "button";
  button.textContent = t("See my estimate", "Ver mi estimado");
  form.append(button);
  const continueButton = document.createElement("button");
  continueButton.type = "button";
  continueButton.className = "button";
  continueButton.textContent = t("Continue to the quote form", "Continuar al formulario de cotización");
  continueButton.hidden = true;
  form.append(continueButton);

  const hourlyPrices = {4: 225, 5: 270, 6: 315};
  function update() {
    headline.textContent = "";
    detail.textContent = "";
    terms.textContent = "";
    continueButton.hidden = true;
    const hourly = mode.selectedIndex === 1;
    hours.disabled = !hourly;
    hours.parentElement.hidden = !hourly;
    for (const field of [service, size, frequency]) {
      field.disabled = hourly;
      field.parentElement.hidden = hourly;
    }

  }

  function showEstimate() {
    const hourly = mode.selectedIndex === 1;
    const base = hourly ? hourlyPrices[hours.value] : services.get(service.value);
    const firstCleaning = welcome.selectedIndex === 1;
    const estimate = base != null && firstCleaning ? Math.max(180, base * 0.8) : base;
    const prefix = hourly
      ? t("Estimated package price", "Precio estimado del paquete")
      : t("Estimated starting price", "Precio inicial estimado");
    headline.textContent = base == null
      ? t("Personalized quote", "Cotización personalizada")
      : `${prefix}: $${estimate.toFixed(2)}`;
    detail.textContent = hourly
      ? t(`You selected a ${hours.value}-hour package in ${city.value}.`, `Elegiste un paquete de ${hours.value} horas en ${city.value}.`)
      : t(`You selected ${service.value.toLowerCase()} in ${city.value}.`, `Elegiste ${service.value.toLowerCase()} en ${city.value}.`);
    terms.textContent = base == null
      ? t("Tell us about your property so we can quote your cleaning.",
          "Cuéntanos cómo es la propiedad para preparar tu cotización.")
      : firstCleaning
        ? t(`Regular price: $${base.toFixed(2)}. We’ll confirm your first-cleaning offer and price before booking.`,
            `Precio regular: $${base.toFixed(2)}. Confirmaremos la promoción de primera limpieza y el precio antes de reservar.`)
        : t("We’ll confirm what’s included and the final price before booking.",
            "Confirmaremos qué incluye la limpieza y el precio final antes de reservar.");
  }

  form.addEventListener("change", update);
  for (const link of document.querySelectorAll("[data-price-mode]")) {
    link.addEventListener("click", () => {
      mode.selectedIndex = link.dataset.priceMode === "hourly" ? 1 : 0;
      update();
    });
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    showEstimate();
    continueButton.hidden = false;
  });

  continueButton.addEventListener("click", () => {
    const modal = document.querySelector("#quote-modal");
    const target = modal?.querySelector("form") || contactForm;
    if (!target) return;

    const hourly = mode.selectedIndex === 1;
    const requested = hourly ? t("Hourly Cleaning Package", "Paquete de limpieza por horas") : service.value;
    const serviceField = target.querySelector('[name="service"]');
    if (serviceField) {
      if (![...serviceField.options].some(option => option.value === requested)) {
        serviceField.add(new Option(requested, requested));
      }
      serviceField.value = requested;
    }

    const message = target.querySelector('[name="message"]');
    if (message) {
      const details = [detail.textContent, headline.textContent,
        t(`Property: ${property.value}`, `Propiedad: ${property.value}`),
        t(`First cleaning: ${welcome.value}`, `Primera limpieza: ${welcome.value}`)];
      if (!hourly) {
        details.push(t(`Size: ${size.value}`, `Tamaño: ${size.value}`),
          t(`Frequency: ${frequency.value}`, `Frecuencia: ${frequency.value}`));
      }
      const previous = message.dataset.estimatorSummary;
      const notes = previous && message.value.startsWith(previous)
        ? message.value.slice(previous.length).trimStart()
        : message.value;
      message.dataset.estimatorSummary = details.join("\n");
      message.value = [message.dataset.estimatorSummary, notes].filter(Boolean).join("\n\n");
    }
    target.dataset.quoteSummary = [detail.textContent, headline.textContent].join("\n");
    target.dataset.quoteCity = city.value;
    if (modal && !modal.open) modal.showModal();
    else if (!modal) target.scrollIntoView();
    target.querySelector('[name="name"]')?.focus();
    if (typeof window.gtag === "function") window.gtag("event", "quote_calculator_complete", {page_path: location.pathname});
  });

  wrap.append(form);
  contact.before(section);
  update();
  for (const link of document.querySelectorAll(".mobile a[href='#contact']")) link.href = "#lr-estimator";

  const checks = [...document.querySelectorAll(".lr-checklist input")];
  const count = document.querySelector("#lr-check-count");
  function showCount() {
    if (count) count.textContent = checks.filter(input => input.checked).length + " " + t("tasks selected", "tareas seleccionadas");
  }
  for (const input of checks) input.addEventListener("change", showCount);
  showCount();
  document.querySelector("#lr-check-quote")?.addEventListener("click", () => {
    const modal = document.querySelector("#quote-modal");
    const target = modal?.querySelector("form") || contactForm;
    const message = target?.querySelector('[name="message"]');
    if (message) message.value = checks.filter(input => input.checked).map(input => input.value).join("\n");
    if (modal && !modal.open) modal.showModal();
    else target?.scrollIntoView();
  });
})();
