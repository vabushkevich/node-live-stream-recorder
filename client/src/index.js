import "./index.css";

const API_URL = "http://localhost:8080/api/v1";

class Recorder {
  constructor(obj) {
    const dateProps = ["createdDate"];
    Object.assign(this, obj);
    dateProps.forEach(dateProp => {
      this[dateProp] = new Date(this[dateProp]);
    });
  }

  stop() {
    fetch(`${API_URL}/recordings/${this.id}/stop`, {
      method: "PUT",
    })
      .then(() => window.open(document.location.href, "_self"));
  }

  prolong(duration) {
    fetch(`${API_URL}/recordings/${this.id}/prolong?duration=${duration}`, {
      method: "PUT",
    })
      .then(() => window.open(document.location.href, "_self"));
  }

  close() {
    fetch(`${API_URL}/recordings/${this.id}`, {
      method: "DELETE",
    })
      .then(() => window.open(document.location.href, "_self"));
  }

  getElement() {
    const stateStr = this.state[0].toUpperCase() + this.state.slice(1);
    // const timeLeft = formatDuration(intervalToDuration({ start: new Date(), end: this.finishDate }));
    // const timeLeft = "some time left...";
    const timeLeft = moment.duration(this.timeLeft, "ms").format("hh:mm:ss", { trim: false });
    const html = `
      <li class="card recorder-items__item">
        <div class="card-body d-flex position-relative">
          <div class="mr-3" style="width: 231px; height: 130px;">
            <img src="${this.screenshotPath}" class="rounded" alt="Screenshot" style="width: 100%; height: 100%; object-fit: contain;">
          </div>
          <div class="d-flex flex-column">
            <div class="d-flex align-items-center mb-2">
              <h5 class="mr-2 mb-0">${this.url}</h5>
              ${this.quality ? `
                <span class="mr-2 badge badge-dark">${this.quality.resolution}p</span>
              `: ``}
              <span class="badge badge-${this.state == "recording" ? "primary" : "secondary"}">${stateStr}</span>
            </div>
            ${timeLeft ? `<p class="mb-2"><b>Left:</b> ${timeLeft}</p>` : ``}
            ${this.state != "stopped" ? `
              <div class="d-flex flex-row mb-2">
                <button type="button" class="btn mr-3 btn-primary js-rec-stop-btn">Stop</button>
                <input type="number" style="max-width: 80px;" min="1" value="120" class="form-control mr-1 js-rec-duration-input" id="inputDuration">
                <button type="button" class="btn btn-primary js-rec-prolong-btn">Prolong</button>
              </div>
            ` : ``}
          </div>
          ${this.state == "stopped" ? `
            <button type="button" class="close position-absolute js-rec-close-btn" style="top: 5px; right: 10px;">
              <span>&times;</span>
            </button>
          ` : ``}
        </div>
      </li>
    `;
    const el = htmlToElement(html);

    if (this.state != "stopped") {
      el.querySelector(".js-rec-stop-btn").addEventListener("click", () => {
        this.stop();
      });
      el.querySelector(".js-rec-prolong-btn").addEventListener("click", () => {
        const duration = el.querySelector(".js-rec-duration-input").value * 60 * 1000;
        this.prolong(duration);
      });
    }
    if (this.state == "stopped") {
      el.querySelector(".js-rec-close-btn").addEventListener("click", () => {
        this.close();
      });
    }

    return el;
  }
}

function htmlToElement(html) {
  const template = document.createElement("template");
  template.innerHTML = html.trim();
  return template.content.firstChild;
}

function getSiteName(url) {
  if (url.includes("youtube.com")) return "youtube";
  if (url.includes("twitch.tv")) return "twitch";
}

function main() {
  document.querySelector(".js-record-btn").addEventListener("click", () => {
    const formData = {
      url: document.querySelector(".js-url-input").value,
      duration: document.querySelector(".js-duration-input").value,
    };

    const url = formData.url.trim();
    const siteName = getSiteName(url);
    const duration = formData.duration * 60 * 1000;

    fetch(`${API_URL}/recordings`, {
      method: "POST",
      body: JSON.stringify({
        url,
        duration,
        nameSuffix: siteName,
      }),
      headers: { 'Content-Type': 'application/json' },
    })
      .then(() => window.open(document.location.href, "_self"));
  });

  fetch(`${API_URL}/recordings`, {
    method: "GET",
  })
    .then(req => req.json())
    .then(dataArray => {
      for (const data of dataArray) {
        const recorder = new Recorder(data);
        document.querySelector(".recorder-items").appendChild(recorder.getElement());
      }
    });
}

main();
