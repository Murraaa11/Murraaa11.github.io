Promise.all([
  d3.csv("data/globalCountryFlow_2023.csv"),
  d3.json("data/worldmap_topojson.json"),
  d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-10m.json"),
  d3.csv("data/country_chinese_name.csv"),
]).then(([data, us, country, chinese]) => {
  const { nodes, links } = processData(data, us, country, chinese);
  

  const color_in = d3
    .scaleOrdinal()
    .domain(["outbound", "inbound"])
    .range(["#fecd04", "#00adb3"]);

  const color_out = d3
    .scaleOrdinal()
    .domain(["outbound", "inbound"])
    .range(["#cbccfe", "#048ed6"]);

  const color = {inbounds: color_in, outbounds: color_out};

  const x = d3
    .scaleSqrt()
    .domain([1, d3.max(links, (d) => d.value)])
    .range([1, 24]);

  const dispatch = d3.dispatch(
    "locationchange",
    "directionchange",
    "displaychange"
  );

  const selected = {
    location: "156",
    direction: "both",
    display: "top10",
  };

  new SelectControl({
    container: d3.select("#state-control"),
    label: "国家/地区",
    id: "state-select",
    options: nodes.map((d) => ({
      value: d.id,
      text: d.chinese_name,
    })),
    initialValue: selected.location,
    onChange: (location) => {
      dispatch.call("locationchange", null, location);
    },
  });

  new RadiosControl({
    container: d3.select("#direction-control"),
    label: "流动方向",
    name: "flow-direction-radio",
    options: [
      { value: "inbound", text: "流入", id: "flow-direction-inbound" },
      { value: "outbound", text: "流出", id: "flow-direction-outbound" },
      { value: "both", text: "全部", id: "flow-direction-both" },
    ],
    initialValue: selected.direction,
    onChange: (direction) => {
      dispatch.call("directionchange", null, direction);
    },
  });

  new RadiosControl({
    container: d3.select("#display-control"),
    label: "流动显示",
    name: "flow-display-radio",
    options: [
      { value: "top10", text: "前10", id: "flow-display-top10" },
      { value: "all", text: "全部", id: "flow-display-all" },
    ],
    initialValue: selected.display,
    onChange: (display) => {
      dispatch.call("displaychange", null, display);
    },
  });

  new FlowLegend({
    container: d3.select("#flow-legend-inbound"),
    color: color_in,
    x,
    flowValues: [50, 100, 200, 500], //可能要改
    tickValues: ["流入", ""],
    direction: "inbound",
  });

  new FlowLegend({
    container: d3.select("#flow-legend-outbound"),
    color: color_out,
    x,
    flowValues: [50, 100, 200, 500], //可能要改
    tickValues: ["流出", ""],
    direction: "outbound",
  });

  const flowMap = new FlowMap({
    container: d3.select("#flow-map"),
    data: {nodes, links },
    location: selected.location,
    direction: selected.direction,
    display: selected.display,
    topo: us,
    countries: country,
    topoFeatureObject: "countries",
    color,
    x,
  });

  dispatch.on("locationchange", (location) => {
    selected.location = location;
    flowMap.onLocationChange(location);
  });

  dispatch.on("directionchange", (direction) => {
    selected.direction = direction;
    flowMap.onDirectionChange(direction);
  });

  dispatch.on("displaychange", (display) => {
    selected.display = display;
    flowMap.onDisplayChange(display);
  });
});

