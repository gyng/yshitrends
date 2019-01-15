const AVAILABLE_BOARDS = ["a", "g", "can", "int", "spa", "his", "sci"];
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
    return {
      label: t,
      data: data.entries.map(d => d.filtered[t]),
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
        text: `Normalized word frequencies for ${options.boards
          .map(b => `/${b}/`)
          .join(", ")}`
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
  endpoint = "/search/time-series",
  options = {
    boards: [],
    tags: [],
    window: 86400
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

  // Dummy data
  return fetch(
    "https://gist.githubusercontent.com/gyng/871e8ffd817f53013f216f3386d1dfd2/raw/6546646100c7ebaabd9c02ada1062b5b36062a12/mockdata.json"
  );

  // return fetch(`${endpoint}?${params.toString()}`);
};

const init = (config = {}) => {
  const chartCanvas = document.querySelector("#chart");

  const tags = document.querySelector("input[name=tags]");
  const tagsInput = new Tagify(tags);

  const boards = document.querySelector("input[name=boards]");
  const boardsInput = new Tagify(boards, {
    whitelist: AVAILABLE_BOARDS,
    keepInvalidTags: false,
    enforceWhitelist: true,
    dropdown: {
      classname: "color-blue",
      enabled: 0,
      maxItems: 7
    }
  });

  const windowDuration = document.querySelector("#window");

  const queryButton = document.querySelector("#query");
  queryButton.addEventListener("click", () => {
    const options = {
      boards: boardsInput.value.map(v => v.value),
      tags: tagsInput.value.map(v => v.value),
      window: windowDuration.value
    };

    const interpolate = document.querySelector("#interpolate");

    setLoading(true);

    query(".", options)
      .then(res => res.json())
      .then(data => {
        chart(chartCanvas, data, {
          interpolate: interpolate.checked,
          boards: options.boards
        });
      })
      .then(() => {
        setLoading(false);
        window.setTimeout(() => {
          chartCanvas.scrollIntoView({ block: "start" });
        }, 1000);
      })
      .catch(err => {
        window.alert(err);
        console.error(err);
      });
  });

  const fromDate = document.querySelector("#fromDate");
  const toDate = document.querySelector("#toDate");
  toDate.value = new Date().toISOString().split("T")[0];

  document.querySelector("#allBoards").addEventListener("click", () => {
    boardsInput.removeAllTags();
    boardsInput.addTags(AVAILABLE_BOARDS);
  });
};

init();
