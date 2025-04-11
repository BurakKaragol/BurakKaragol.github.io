const qr = new QRCodeStyling({
  width: 512,
  height: 512,
  data: "Hello world",
  type: "canvas",
  dotsOptions: {
    color: "#ffffff",
    type: "square"
  },
  backgroundOptions: {
    color: "#000000"
  },
  qrOptions: {
    errorCorrectionLevel: "M"
  }
});

const qrContainer = document.getElementById("qr-canvas-container");
qr.append(qrContainer);
qrContainer.classList.add("blur");

// === QR Content Type Inputs ===
const contentFields = document.getElementById("content-fields");
const qrTypeSelect = document.getElementById("qr-type");

function renderFieldsForType(type) {
  contentFields.innerHTML = "";

  const createInput = (id, label, placeholder = "") => {
    const wrapper = document.createElement("div");
    const lbl = document.createElement("label");
    lbl.htmlFor = id;
    lbl.textContent = label;
    const input = document.createElement("input");
    input.type = "text";
    input.id = id;
    input.placeholder = placeholder;
    wrapper.appendChild(lbl);
    wrapper.appendChild(input);
    return wrapper;
  };

  const createTextarea = (id, label, placeholder = "") => {
    const wrapper = document.createElement("div");
    const lbl = document.createElement("label");
    lbl.htmlFor = id;
    lbl.textContent = label;
    const input = document.createElement("textarea");
    input.id = id;
    input.placeholder = placeholder;
    wrapper.appendChild(lbl);
    wrapper.appendChild(input);
    return wrapper;
  };

  switch (type) {
    case "email":
      contentFields.appendChild(createInput("input-email", "Email", "someone@example.com"));
      break;
    case "phone":
      contentFields.appendChild(createInput("input-phone", "Phone Number", "+905551112233"));
      break;
    case "sms":
      contentFields.appendChild(createInput("input-sms-phone", "Phone Number", "+905551112233"));
      contentFields.appendChild(createInput("input-sms-message", "Message", "Hey there!"));
      break;
    case "wifi":
      contentFields.appendChild(createInput("input-ssid", "SSID", "MyWiFi"));
      contentFields.appendChild(createInput("input-password", "Password", "12345678"));
      contentFields.appendChild(createInput("input-encryption", "Encryption", "WPA or WEP"));
      break;
    case "vcard":
      contentFields.appendChild(createInput("input-vcard-name", "Full Name", "John Doe"));
      contentFields.appendChild(createInput("input-vcard-phone", "Phone Number"));
      contentFields.appendChild(createInput("input-vcard-email", "Email"));
      contentFields.appendChild(createInput("input-vcard-org", "Organization"));
      contentFields.appendChild(createInput("input-vcard-title", "Title"));
      break;
    case "event":
      contentFields.appendChild(createInput("input-event-title", "Event Title"));
      contentFields.appendChild(createInput("input-event-start", "Start Date (YYYYMMDD)"));
      contentFields.appendChild(createInput("input-event-end", "End Date (YYYYMMDD)"));
      contentFields.appendChild(createInput("input-event-location", "Location"));
      break;
    default:
      contentFields.appendChild(createTextarea("input-text", "Content", "Enter text or URL..."));
  }
}

renderFieldsForType(qrTypeSelect.value);
qrTypeSelect.addEventListener("change", () => renderFieldsForType(qrTypeSelect.value));

// === Blur on Input Change ===
function triggerBlurOnChange() {
  const inputs = document.querySelectorAll("#control-panel input, #control-panel select, #control-panel textarea");
  inputs.forEach(input => {
    input.addEventListener("input", () => {
      qrContainer.classList.add("blur");
    });
  });
}
triggerBlurOnChange();

// === Generate QR Code ===
document.getElementById("generate-btn").addEventListener("click", () => {
  const fgColor = document.getElementById("fg-color").value;
  const bgColor = document.getElementById("bg-color").value;
  const shape = document.getElementById("shape-style").value;
  const ecLevel = document.getElementById("error-correction").value;
  const size = parseInt(document.getElementById("size").value);
  const type = qrTypeSelect.value;

  let content = "";
  switch (type) {
    case "email":
      content = `mailto:${document.getElementById("input-email").value.trim()}`;
      break;
    case "phone":
      content = `tel:${document.getElementById("input-phone").value.trim()}`;
      break;
    case "sms":
      const p = document.getElementById("input-sms-phone").value.trim();
      const m = document.getElementById("input-sms-message").value.trim();
      content = `sms:${p}?body=${encodeURIComponent(m)}`;
      break;
    case "wifi":
      const ssid = document.getElementById("input-ssid").value.trim();
      const pass = document.getElementById("input-password").value.trim();
      const enc = document.getElementById("input-encryption").value.trim() || "WPA";
      content = `WIFI:T:${enc};S:${ssid};P:${pass};;`;
      break;
    case "vcard":
      content = `BEGIN:VCARD\nVERSION:3.0\nN:${document.getElementById("input-vcard-name").value}\n` +
                `TEL:${document.getElementById("input-vcard-phone").value}\n` +
                `EMAIL:${document.getElementById("input-vcard-email").value}\n` +
                `ORG:${document.getElementById("input-vcard-org").value}\n` +
                `TITLE:${document.getElementById("input-vcard-title").value}\nEND:VCARD`;
      break;
    case "event":
      content = `BEGIN:VEVENT\nSUMMARY:${document.getElementById("input-event-title").value}\n` +
                `DTSTART:${document.getElementById("input-event-start").value}\n` +
                `DTEND:${document.getElementById("input-event-end").value}\n` +
                `LOCATION:${document.getElementById("input-event-location").value}\nEND:VEVENT`;
      break;
    default:
      content = document.getElementById("input-text").value.trim();
  }

  if (!content) {
    qrContainer.classList.add("blur");
    return;
  }

  qrContainer.classList.add("blur");

  const baseDelay = 300;
  const ecMultiplierMap = { L: 1.0, M: 1.2, Q: 1.5, H: 1.8 };
  const multiplier = ecMultiplierMap[ecLevel] || 1.0;
  const totalDelay = Math.min(3000, baseDelay + content.length * 5 * multiplier);

  // Progress bar logic
  const progressBar = document.getElementById("qr-progress-bar");
  progressBar.style.transition = "none";
  progressBar.style.width = "0%";

  requestAnimationFrame(() => {
    progressBar.style.transition = `width ${totalDelay}ms linear`;
    progressBar.style.width = "100%";
  });

  setTimeout(() => {
    qr.update({
      width: size,
      height: size,
      data: content,
      qrOptions: {
        errorCorrectionLevel: ecLevel
      },
      dotsOptions: {
        color: fgColor,
        type: shape.toLowerCase().replace(/\s/g, '-')
      },
      backgroundOptions: {
        color: bgColor
      }
    });

    setTimeout(() => {
      qrContainer.classList.remove("blur");
    }, 100);

    qrContainer.classList.remove("blur");
    progressBar.style.transition = "none";
    progressBar.style.width = "0%";
  }, totalDelay);
});

// === Download Button ===
document.getElementById("download-btn").addEventListener("click", () => {
  qr.download({
    name: "qr-code",
    extension: "png"
  });
});
