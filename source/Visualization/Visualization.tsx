import * as React from 'react';
import {browser, Storage} from 'webextension-polyfill-ts';
import _ from 'lodash';
import * as d3 from 'd3';
import {JsObject} from '../Core/types';
import {EXTENSION_NAME} from '../Core';

// set the dimensions and margins of the graph
const margin = {top: 30, right: 30, bottom: 70, left: 60};
const width = 0.8 * window.innerWidth - margin.left - margin.right;
const height = 0.8 * window.innerHeight - margin.bottom;

function showHistory(rawAds: JsObject[]): void {
  const div = d3.select('#viz-container');
  div.selectChildren().remove();

  if (rawAds?.length === 0) {
    const p = div.append('p');
    p.text(
      `No information to display. Navigate the web with the ${EXTENSION_NAME} extension and you will see your ad history here.`
    );
    return;
  }

  const data: {hostname: string; revenue: number}[] = Object.entries(
    _.groupBy(rawAds, 'hostname')
  ).map(([hostname, v]) => ({
    hostname,
    revenue: d3.sum(v.map((b) => (b.extracted as {cpm: number}).cpm)) / 1000,
  }));

  const svg = div
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3
    .scaleBand()
    .range([0, width])
    .domain(data.map((d) => d.hostname))
    .padding(0.2);
  svg
    .append('g')
    .attr('transform', `translate(0, ${height})`)
    .call(d3.axisBottom(x))
    .selectAll('text')
    .attr('transform', `translate(0,${margin.bottom / 5})rotate(-20)`)
    .style('text-anchor', 'middle');
  svg
    .append('text')
    .attr('x', width / 2)
    .attr('y', height + margin.bottom)
    .style('text-anchor', 'middle')
    .text('Website domain');

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (o) => o.revenue) ?? 1])
    .range([height, 0]);
  svg.append('g').call(d3.axisLeft(y).ticks(5, '.3f'));
  svg
    .append('text')
    .attr(
      'transform',
      `translate(${(-4 / 5) * margin.left}, ${height / 2})rotate(-90)`
    )
    .style('text-anchor', 'middle')
    .text('Cumulative revenue (USD)');

  svg
    .selectAll('mybar')
    .data(data)
    .join('rect')
    .attr('x', (o) => x(o.hostname) ?? 0)
    .attr('y', (o) => y(o.revenue))
    .attr('width', x.bandwidth())
    .attr('height', (o) => height - y(o.revenue))
    .attr('fill', '#69b3a2');
}

function getDataAndCallViz(): void {
  browser.storage.local.get('ads').then((data) => showHistory(data.ads));
}

function handleStorageChange(
  changes: {[s: string]: Storage.StorageChange},
  areaName: string
): void {
  if (areaName === 'local') {
    showHistory(changes.ads.newValue);
  }
}

getDataAndCallViz();
browser.storage.onChanged.addListener(handleStorageChange);
window.addEventListener('unload', () =>
  browser.storage.onChanged.removeListener(handleStorageChange)
);

const Visualization: React.FC = () => {
  return (
    <section id="visualization">
      <h1>Your ad price history.</h1>
      <div id="viz-container" />
    </section>
  );
};

export default Visualization;
