const FORM_ENDPOINT = "https://script.google.com/macros/s/AKfycbxdSijkZrqC1hef8MPY2D6OJU9Y4FLs53xPh33j9jcNy71MlNAkJ_5w_3iGGpVYexY3/exec";
const WHATSAPP_NUMBER = "17138789793";

// Formularios en todas las páginas (inglés y español).
(() => {
  const form = document.querySelector("#quoteform");
  if (!form) return;
  const es = document.documentElement.lang === "es";
  const label = (en, sp) => es ? sp : en;

  function cityFromUrl() {
    const path = location.pathname;
    if (path.includes("sugar-land-tx")) return "Sugar Land";
    if (path.includes("pearland-tx")) return "Pearland";
    if (path.includes("stafford-tx")) return "Stafford";
    if (path.includes("katy-tx")) return "Katy";
    return "Houston";
  }

  const receiver = document.createElement("iframe");
  receiver.name = "la-roca-google-form-receiver";
  receiver.title = "Google form receiver";
  receiver.style.display = "none";
  receiver.setAttribute("aria-hidden", "true");
  document.body.append(receiver);

  function setup(f) {
    const email = f.querySelector('[name="email"]');
    if (email) email.required = false;
    const emailLabel = f.querySelector('label[for="email"]');
    if (emailLabel) emailLabel.textContent = label("Email (optional)", "Email (opcional)");
    const locationField = f.querySelector('[name="location"]');
    if (locationField) {
      f.querySelector('label[for="location"]')?.remove();
      locationField.remove();
    }
    const detailsLabel = f.querySelector('label[for="message"]');
    if (detailsLabel) detailsLabel.textContent = label("Details (optional)", "Detalles (opcional)");
    f.querySelector(".note")?.remove();
    const select = f.querySelector('select[name="service"]');
    if (select && ![...select.options].some(o => o.value === "other")) {
      const option = document.createElement("option");
      option.value = "other";
      option.textContent = label("Other service", "Otro servicio");
      select.append(option);
    }
    const button = f.querySelector('[type="submit"]');
    if (button) button.textContent = label("Send quote request", "Enviar solicitud de cotización");

    f.addEventListener("submit", event => {
      event.preventDefault();
      if (!f.reportValidity()) return;

      let status = f.querySelector('[role="status"]');
      if (!status) {
        status = document.createElement("p");
        status.setAttribute("role", "status");
        status.setAttribute("aria-live", "polite");
        f.append(status);
      }

      const fields = Object.fromEntries(new FormData(f));
      const data = {
        name: fields.name || "",
        phone: fields.phone || "",
        email: fields.email || "",
        service: fields.service || "",
        area: cityFromUrl(),
        message: fields.message || "",
        page: location.href,
        website: ""
      };
      if (!data.name.trim() || !data.phone.trim() || !data.service.trim()) {
        status.textContent = label("Complete the required fields.", "Completa los campos obligatorios.");
        return;
      }

      // Apps Script recibe los campos en e.parameter. El navegador no puede
      // leer la confirmación interna de Google desde este iframe externo.
      const transport = document.createElement("form");
      transport.action = FORM_ENDPOINT;
      transport.method = "POST";
      transport.target = receiver.name;
      transport.acceptCharset = "UTF-8";
      transport.style.display = "none";
      for (const [key, value] of Object.entries(data)) {
        const field = document.createElement("input");
        field.type = "hidden";
        field.name = key;
        field.value = value;
        transport.append(field);
      }
      document.body.append(transport);
      if (button) button.disabled = true;
      status.textContent = label("Sending your request...", "Enviando tu solicitud...");

      let done = false;
      const finish = (message, success = false) => {
        if (done) return;
        done = true;
        status.textContent = message;
        status.style.cssText = success
          ? "margin-top:12px;padding:12px 14px;border-radius:10px;background:#e7f6ed;color:#176b36;border:1px solid #b7dfc4;font-weight:600"
          : "margin-top:12px;padding:12px 14px;border-radius:10px;background:#fff3ed;color:#8d3d16;border:1px solid #e8c6ae;font-weight:600";
        if (button) button.disabled = false;
        transport.remove();
      };
      // Iframe load indicates transport completion, not verified storage in Sheets.
      const onLoad = () => finish(label(
        "Thank you! Your request has been submitted. We will contact you shortly.",
        "¡Gracias! Tu solicitud ha sido enviada. En breve nos pondremos en contacto contigo."
      ), true);
      receiver.addEventListener("load", onLoad, { once: true });
      const timeout = setTimeout(() => {
        receiver.removeEventListener("load", onLoad);
        finish(label(
          "We could not confirm submission. Please try again.",
          "No pudimos confirmar el envío. Por favor, intenta nuevamente."
        ));
      }, 20000);

      receiver.addEventListener("load", () => clearTimeout(timeout), { once: true });
      try {
        transport.submit();
      } catch (error) {
        clearTimeout(timeout);
        receiver.removeEventListener("load", onLoad);
        finish(label(
          "Unable to submit. Please try again.",
          "No se pudo enviar. Por favor, intenta nuevamente."
        ));
      }
    });
  }

  setup(form);
  const modalForm = form.cloneNode(true);
  modalForm.removeAttribute("id");
  modalForm.querySelectorAll("[id]").forEach(el => el.id += "-modal");
  modalForm.querySelectorAll("label[for]").forEach(el => el.htmlFor += "-modal");
  setup(modalForm);

  const dialog = document.createElement("dialog");
  dialog.className = "quote-dialog";
  dialog.id = "quote-modal";
  dialog.setAttribute("aria-label", label("Free estimate", "Cotización gratis"));
  const panel = document.createElement("div");
  panel.className = "quote-panel";
  const close = document.createElement("button");
  close.type = "button";
  close.className = "quote-close";
  close.textContent = "×";
  close.setAttribute("aria-label", label("Close", "Cerrar"));
  close.addEventListener("click", () => dialog.close());
  panel.append(close, modalForm);
  dialog.append(panel);
  document.body.append(dialog);
  dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });

  const open = () => {
    if (!dialog.open) {
      dialog.showModal();
      modalForm.querySelector('[name="name"]')?.focus();
    }
  };
  document.querySelectorAll('a[href="#contact"],a[href="#quote-modal"]').forEach(a => {
    const title = a.textContent.trim().toLowerCase();
    const isQuote = /quote|estimate|cotizaci|cotizar|solicitar/.test(title)
      || a.closest(".servicecard") || a.classList.contains("button");
    if (!isQuote) return;
    a.addEventListener("click", e => { e.preventDefault(); open(); });
  });
})();

// Contacto y perfil oficial de Google: conservar el comportamiento anterior.
(() => {
  const section = document.querySelector("#contact");
  if (!section) return;
  const es = document.documentElement.lang === "es";
  const content = section.querySelector(".contactgrid>div");
  if (!content) return;
  content.innerHTML = '<span class="eyebrow">' + (es ? "CONTACTO" : "CONTACT") +
    '</span><h2>' + (es ? "Solicita tu próxima limpieza" : "Request your next cleaning") +
    '</h2><p>' + (es ? "Cuéntanos qué necesitas limpiar. Ofrecemos cotizaciones gratuitas para casas y negocios en Houston." : "Tell us what needs cleaning. Free estimates for homes and businesses in Houston.") +
    '</p><div class="contact-essentials"><a href="tel:+17138789793" class="contact-phone">(713) 878-9793</a><a href="https://maps.app.goo.gl/zSs6zKJANVEmfsdx8?g_st=ic" target="_blank" rel="noopener noreferrer">' +
    (es ? "Perfil y reseñas de Google" : "Google Profile & Reviews") + "</a></div>";
})();

// Secciones de detalle por ciudad y mapa, conservados del archivo original.
(() => {
  const es = document.documentElement.lang === "es";
  const seg = location.pathname.split("/").filter(Boolean);
  const slug = seg.includes("service-areas") ? seg[seg.indexOf("service-areas") + 1] :
    seg.includes("areas") ? seg[seg.indexOf("areas") + 1] : null;
  const places = {
    "bellaire-tx": ["Bellaire", "Residential kitchen and bathroom care", "Cocinas y baños residenciales", "Residential properties may need consistent bathroom care, kitchen surface cleaning and regular maintenance between visits.", "Las casas pueden necesitar limpieza constante de baños, superficies de cocina y mantenimiento regular.", "bathroom-vanity-cleaning-houston-tx.jpg"],
    "katy-tx": ["Katy", "Family homes and moving schedules", "Casas familiares y mudanzas", "For family households and properties preparing for new occupants, choose regular upkeep or a detailed one-time cleaning.", "Para hogares y propiedades que se preparan para nuevos ocupantes, elige limpieza recurrente o una limpieza detallada.", "living-room-cleaning-cinco-ranch-katy.jpg"],
    "memorial-houston": ["Memorial", "Detailed home interiors", "Interiores residenciales detallados", "Interior cleaning can include accessible shelves, blinds, bathrooms and living areas based on your property needs.", "La limpieza interior puede incluir estantes accesibles, persianas, baños y salas según la propiedad.", "window-blinds-cleaning-houston-tx.jpg"],
    "missouri-city-tx": ["Missouri City", "Apartments, bedrooms and living areas", "Apartamentos, habitaciones y salas", "Whether preparing a residence for guests or requesting ongoing cleaning, explain which rooms need attention.", "Ya sea para preparar una vivienda para visitas o solicitar limpieza frecuente, indica qué habitaciones necesitan atención.", "residential-entryway-cleaning-houston-tx.jpg"],
    "pearland-tx": ["Pearland", "Move-in and move-out preparation", "Preparación para mudanzas", "Vacant property cleaning focuses on accessible floors, bathrooms and interior spaces before moving in or out.", "La limpieza de propiedades vacías se enfoca en pisos accesibles, baños e interiores antes o después de mudarse.", "vacant-living-room-cleaning-houston-tx.jpg"],
    "sharpstown-houston": ["Sharpstown", "Apartment and floor cleaning", "Limpieza de apartamentos y pisos", "Discuss apartment cleaning, floors and everyday living areas according to the condition and size of the property.", "Consulta limpieza de apartamentos, pisos y áreas de uso diario según las condiciones y tamaño de la propiedad.", "limpieza-de-apartamentos-houston.jpg"],
    "stafford-tx": ["Stafford", "Workspaces and shared corridors", "Espacios de trabajo y pasillos", "Business clients can request cleaning for common areas, corridors and workspaces with a scope agreed before service.", "Los negocios pueden solicitar limpieza de áreas comunes, pasillos y zonas de trabajo con alcance acordado previamente.", "building-hallway-floor-cleaning-houston-tx.jpg"],
    "sugar-land-tx": ["Sugar Land", "Cabinets, shelves and interior details", "Gabinetes, estantes y detalles interiores", "Detailed residential cleaning may include accessible interior cabinets, shelves and kitchen surfaces when requested.", "La limpieza residencial detallada puede incluir interiores accesibles de gabinetes, estantes y superficies de cocina.", "closet-shelf-cleaning-sugar-land-tx.jpg"],
    "west-university-place-tx": ["West University Place", "Bathrooms and living spaces", "Baños y espacios residenciales", "Discuss bathroom fixtures, floors and living areas for one-time or recurring home cleaning.", "Consulta limpieza de accesorios del baño, pisos y salas para una visita o servicio recurrente.", "residential-bathtub-cleaning-houston-tx.jpg"],
    "westchase-houston": ["Westchase", "Kitchens and workplaces", "Cocinas y lugares de trabajo", "Residential and commercial customers can discuss kitchen appliances, common areas and workplace cleaning.", "Clientes residenciales y comerciales pueden consultar limpieza de electrodomésticos, áreas comunes y oficinas.", "kitchen-appliance-cleaning-houston-tx.jpg"]
  };
  const info = places[slug];
  const services = document.querySelector("#services");
  if (info && services && !(slug === "stafford-tx" && document.querySelector(".local-focus"))) {
    const block = document.createElement("section");
    block.className = "city-detail-section";
    block.innerHTML = '<div class="wrap city-detail-layout"><div><span class="eyebrow">' +
      info[0].toUpperCase() + '</span><h2>' + (es ? info[2] : info[1]) +
      '</h2><p>' + (es ? info[4] : info[3]) + '</p><p>' +
      (es ? "Cotizamos cada trabajo según las necesidades de la propiedad. Consulta disponibilidad para tu dirección." :
        "Each cleaning is quoted according to your property. Contact us to confirm availability at your address.") +
      '</p><a href="#quote-modal" class="button city-open-quote">' +
      (es ? "Solicitar cotización" : "Request an estimate") +
      '</a></div><img loading="lazy" src="/assets/' + info[5] + '" alt="' +
      (es ? info[2] : info[1]) + '"></div>';
    services.before(block);
    block.querySelector(".city-open-quote")?.addEventListener("click", e => {
      const modal = document.querySelector("#quote-modal");
      if (modal) { e.preventDefault(); modal.showModal(); }
    });
  }
  const contact = document.querySelector("#contact .contactgrid");
  if (contact) {
    const legal = document.createElement("section");
    legal.className = "company-credentials";
    legal.innerHTML = "<h3>" + (es ? "Licencia y seguro" : "Licensed and Insured") + "</h3>";
    contact.querySelector("div")?.append(legal);
    const map = document.createElement("div");
    map.className = "google-map-panel";
    map.innerHTML = "<h3>" + (es ? "Perfil y ubicación en Google" : "Google Business Profile & Location") +
      '</h3><iframe title="La Roca Cleaning Services Google Maps" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=La%20Roca%20Cleaning%20Services%20LLC%20Houston%20Texas&output=embed"></iframe><a href="https://maps.app.goo.gl/zSs6zKJANVEmfsdx8?g_st=ic" target="_blank" rel="noopener noreferrer">' +
      (es ? "Abrir perfil de Google y reseñas" : "Open Google Profile & Reviews") + "</a>";
    contact.after(map);
  }
})();

// Botón flotante de WhatsApp con vista previa antes de abrir el chat.
(() => {
  if (!WHATSAPP_NUMBER) return;
  const number = WHATSAPP_NUMBER.replace(/\D/g, "");
  const es = document.documentElement.lang === "es";
  const message = es
    ? "Hola, me gustaría solicitar una cotización de limpieza."
    : "Hello, I would like to request a cleaning estimate.";
  const url = "https://wa.me/" + number + "?text=" + encodeURIComponent(message);
  const wrapper = document.createElement("div");
  wrapper.style.cssText = "position:fixed;right:18px;bottom:105px;z-index:1000";
  const preview = document.createElement("div");
  preview.hidden = true;
  preview.style.cssText = "position:absolute;right:0;bottom:68px;width:min(300px,calc(100vw - 40px));padding:16px;border-radius:14px;background:#fff;color:#303039;box-shadow:0 8px 28px rgba(0,0,0,.18);border:1px solid #ddd;font:inherit";
  const heading = document.createElement("strong");
  heading.textContent = es ? "¡Bienvenido a La Roca Cleaning Services!" : "Welcome to La Roca Cleaning Services!";
  heading.style.display = "block";
  const body = document.createElement("p");
  body.textContent = es
    ? "¿Necesitas ayuda con la limpieza de tu casa, apartamento u oficina? Cuéntanos qué servicio buscas y en qué área te encuentras. Con gusto resolveremos tus dudas, revisaremos tus necesidades y te ayudaremos a solicitar una cotización."
    : "Need help cleaning your home, apartment, or office? Tell us what service you need and your location. We'll be happy to answer your questions, discuss your cleaning needs, and help you request a free estimate.";
  body.style.cssText = "margin:10px 0 14px;font-size:14px;line-height:1.5";
  const open = document.createElement("a");
  open.href = url;
  open.target = "_blank";
  open.rel = "noopener noreferrer";
  open.textContent = es ? "Abrir chat" : "Open chat";
  open.style.cssText = "display:block;text-align:center;background:#b58a3b;color:#fff;border-radius:9px;padding:10px 12px;text-decoration:none;font-weight:700";
  preview.append(heading,body,open);
  const button = document.createElement("button");
  button.type = "button";
  button.setAttribute("aria-label", es ? "Abrir mensaje de WhatsApp" : "Open WhatsApp message");
  button.setAttribute("aria-expanded","false");
  button.style.cssText = "border:0;padding:0;width:58px;height:58px;border-radius:50%;background:#25D366;box-shadow:0 6px 18px rgba(0,0,0,.22);display:grid;place-items:center;cursor:pointer";
  button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="38" height="38" aria-hidden="true"><path fill="#fff" d="M16 3a13 13 0 0 0-11.2 19.6L3 29l6.6-1.7A13 13 0 1 0 16 3Zm0 23.6a10.5 10.5 0 0 1-5.4-1.5l-.4-.2-3.9 1 1-3.8-.3-.4a10.6 10.6 0 1 1 9 4.9Zm5.8-7.9c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.3-.5-2.5-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.2-.7l.5-.6.3-.5c.1-.2 0-.4 0-.6l-1-2.3c-.2-.5-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1.1-1.1 2.7s1.2 3.1 1.4 3.3c.2.2 2.2 3.4 5.3 4.6 2.5 1 3.1.8 3.6.8.5-.1 1.8-.7 2.1-1.5.3-.7.3-1.3.2-1.5-.1-.2-.3-.3-.6-.5Z"/></svg>';
  button.addEventListener("click", () => {
    preview.hidden = !preview.hidden;
    button.setAttribute("aria-expanded",String(!preview.hidden));
  });
  document.addEventListener("click", e => {
    if (!wrapper.contains(e.target)) {
      preview.hidden = true;
      button.setAttribute("aria-expanded","false");
    }
  });
  wrapper.append(preview,button);
  document.body.append(wrapper);
})();
