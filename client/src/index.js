import "./index.css";

const HOSTNAME = process.env.SERVER_HOSTNAME;
const PORT = process.env.SERVER_PORT;
const API_URL = `http://${HOSTNAME}:${PORT}/api/v1`;

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
        <div class="card-body position-relative">
          <div class="row no-gutters">
            <div class="col-md col-md-4 col-lg-3 pr-md-3 pb-2 pb-md-0 col-6 mx-auto min-w-0">
              <img src="${this.screenshotPath}" class="rounded w-100" alt="Screenshot">
            </div>
            <div class="col-md min-w-0">
              <div class="d-flex flex-md-nowrap flex-wrap align-items-center mb-2">
                <h5 class="mr-2 mb-md-0 mb-1 text-truncate">${this.url}</h5>
                <div class="d-flex">
                  ${this.quality ? `
                    <span class="mr-2 badge badge-dark">${this.quality.resolution}p</span>
                  `: ``}
                  <span class="badge badge-${this.state == "recording" ? "primary" : "secondary"}">${stateStr}</span>
                </div>
              </div>
              ${timeLeft ? `<p class="${this.state != "stopped" ? "mb-2" : "mb-0"}"><b>Left:</b> ${timeLeft}</p>` : ``}
              ${this.state != "stopped" ? `
                <div class="d-flex flex-row">
                  <button type="button" class="btn mr-1 btn-primary btn-sm js-rec-stop-btn">Stop</button>
                  <div class="input-group w-auto">
                    <input type="number" min="1" max="999" value="120" class="form-control form-control-sm js-rec-duration-input" id="inputDuration">
                    <div class="input-group-append">
                      <button type="button" class="btn btn-primary btn-sm js-rec-prolong-btn">Prolong</button>
                    </div>
                  </div>
                </div>
              ` : ``}
            </div>
          </div>
          ${this.state == "stopped" ? `
            <button type="button" class="close recording__close-btn js-rec-close-btn">
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
