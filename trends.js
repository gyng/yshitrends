const AVAILABLE_BOARDS = [
  "a",
  "c",
  "can",
  "g",
  "his",
  "k",
  "sci",
  "spa",
  "vg",
  "vint",
  "vip",
  "wsg"
];
const COLORS = [
  "#e41a1c",
  "#377eb8",
  "#4daf4a",
  "#984ea3",
  "#ff7f00",
  "#ffff33",
  "#a65628",
  "#f781bf",
  "#999999"
];

const API_ROOT = "https://xn--9h8h.yshi.org/";

let chartEl;

const setLoading = status => {
  const loader = document.querySelector("#loader");
  loader.classList.toggle("hide", !status);
};

const chart = (container, data, options) => {
  if (data.entries.length <= 0) {
    window.alert("No data found.");
    return;
  }

  const labels = data.entries
    .map(e => e.when)
    .map(timestamp => new Date(timestamp * 1000));

  const tags = Object.keys(data.entries[0].filtered);
  const datasets = tags.map((t, i) => {
    const processData = options.normalize
      ? d => (d.filtered[t] / d.total) * 1000
      : d => d.filtered[t];

    return {
      label: t,
      data: data.entries.map(processData),
      backgroundColor: COLORS[i % COLORS.length],
      borderColor: COLORS[i % COLORS.length],
      borderWidth: 1,
      fill: false,
      pointRadius: 0.6,
      pointHoverRadius: 5,
      lineTension: options.interpolate ? 0.4 : 0
    };
  });

  if (chartEl) {
    chartEl.destroy();
  }

  chartEl = new Chart(container, {
    data: {
      labels,
      datasets
    },
    type: "line",
    options: {
      responsive: true,
      title: {
        display: true,
        text: `${
          options.normalize ? "Normalized" : "Absolute"
        } term frequencies for ${options.boards
          .map(b => `/${b}/`)
          .join(", ")} from ${options.fromDate} to ${options.toDate}`
      },
      tooltips: {
        mode: "index",
        intersect: false
      },
      hover: {
        mode: "index",
        intersect: false,
        animationDuration: 0
      },
      scales: {
        xAxes: [
          {
            type: "time",
            display: true,
            scaleLabel: {
              display: true,
              labelString: "Date"
            }
          }
        ],
        yAxes: [
          {
            display: true,
            scaleLabel: {
              display: true,
              labelString: "Value"
            }
          }
        ]
      }
    }
  });
};

const query = (
  endpoint = `${API_ROOT}/search/time-series`,
  options = {
    boards: [],
    tags: [],
    window: 86400,
    fromDate: new Date(),
    toDate: new Date()
  }
) => {
  const params = new URLSearchParams();

  options.boards.forEach(b => {
    params.append("board", b);
  });

  options.tags.forEach(t => {
    const spacified = t.replace(/ +/g, " <-> ");
    params.append("tsquery", spacified);
  });

  params.append("window", options.window);
  params.append("from", Date.parse(options.fromDate));
  params.append("to", Date.parse(options.toDate));

  // Dummy data
  // return fetch(
  //   "https://gist.githubusercontent.com/gyng/871e8ffd817f53013f216f3386d1dfd2/raw/6546646100c7ebaabd9c02ada1062b5b36062a12/mockdata.json"
  // );

  return fetch(`${endpoint}?${params.toString()}`);
};

const init = (config = {}) => {
  const chartCanvas = document.querySelector("#chart");

  // Dates
  const fromDate = document.querySelector("#fromDate");
  fromDate.value = new Date(
    new Date().setFullYear(new Date().getFullYear() - 1)
  )
    .toISOString()
    .split("T")[0];
  const toDate = document.querySelector("#toDate");
  toDate.value = new Date().toISOString().split("T")[0];

  // Tags
  const tags = document.querySelector("input[name=tags]");
  const tagsInput = new Tagify(tags);

  // Boards
  const boards = document.querySelector("input[name=boards]");
  const boardsInput = new Tagify(boards, {
    whitelist: AVAILABLE_BOARDS,
    keepInvalidTags: false,
    enforceWhitelist: true,
    dropdown: {
      enabled: 0
    }
  });

  document.querySelector("#allBoards").addEventListener("click", () => {
    boardsInput.removeAllTags();
    boardsInput.addTags(AVAILABLE_BOARDS);
  });

  // Window
  const windowDuration = document.querySelector("#window");

  // Search
  const queryButton = document.querySelector("#query");
  queryButton.addEventListener("click", () => {
    const options = {
      boards: boardsInput.value.map(v => v.value),
      tags: tagsInput.value.map(v => v.value),
      window: windowDuration.value,
      fromDate: fromDate.value,
      toDate: toDate.value
    };

    const interpolate = document.querySelector("#interpolate");
    const normalize = document.querySelector("#normalize");

    setLoading(true);

    query(".", options)
      .then(res => res.json())
      .then(data => {
        chart(chartCanvas, data, {
          normalize: normalize.checked,
          interpolate: interpolate.checked,
          boards: options.boards,
          fromDate: fromDate.value,
          toDate: toDate.value
        });
      })
      .then(() => {
        setLoading(false);
        document.querySelector("#chartHint").classList.toggle("hide", false);
        window.setTimeout(() => {
          chartCanvas.scrollIntoView({ block: "start" });
        }, 1000);
      })
      .catch(err => {
        window.alert(err);
        console.error(err);
      });
  });
};

init();
