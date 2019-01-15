const chart = data => {
  if (data.entries.length <= 0) {
    console.log("nodata");
    return;
  }

  const labels = data.entries.map(e => e.when);

  const tags = Object.keys(data.entries[0].filtered);
  const datasets = tags.map(t => {
    return {
      name: t,
      type: "line",
      values: data.entries.map(d => d.filtered[t])
    };
  });

  const result = new frappe.Chart("#chart", {
    title: "Normalised word frequencies",
    data: {
      labels,
      datasets
    },
    type: "line",
    height: 600,
    lineOptions: {
      hideDots: 1 // default: 0
    }
    // colors: ["#7cd6fd", "#743ee2"]
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
    params.append("tsquery", t);
  });

  params.append("window", options.window);

  // Dummy data
  return fetch(
    "https://gist.githubusercontent.com/gyng/871e8ffd817f53013f216f3386d1dfd2/raw/6546646100c7ebaabd9c02ada1062b5b36062a12/mockdata.json"
  );

  // return fetch(`${endpoint}?${params.toString()}`);
};

const init = (config = {}) => {
  const tags = document.querySelector("input[name=tags]");
  const tagsInput = new Tagify(tags);

  const boards = document.querySelector("input[name=boards]");
  const boardsInput = new Tagify(boards, {
    whitelist: ["a", "g", "can", "int", "spa", "his", "sci"],
    keepInvalidTags: false,
    enforceWhitelist: true,
    dropdown: {
      classname: "color-blue",
      enabled: 1,
      maxItems: 5
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

    query(".", options)
      .then(res => res.json())
      .then(chart)
      .catch(console.error);
  });

  document.querySelector("#debug").addEventListener("click", () => {
    chart();
  });
};

init();
