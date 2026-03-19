'use client';

import { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { useRaceStore } from '@/store/raceStore';
import { CHECKPOINTS } from '@/lib/constants';
import { formatDuration, formatClock } from '@/lib/timeUtils';
import type { CourseSegment, SlopeZone } from '@/types';

// The legend row is rendered as a plain div above the SVG.
// We subtract its height from the measured container so D3's coordinate
// space matches exactly the SVG's CSS height — preventing label clipping.
const LEGEND_H = 20; // px — must match the legend div height below
const MARGIN = { top: 8, right: 16, bottom: 80, left: 52 };

const ZONE_COLORS: Record<SlopeZone, string> = {
  steep_climb:    '#d64f3d', // alpine-600
  moderate_climb: '#fbbf24', // sunset-gold
  flat:           '#4ade80', // mountain-green
  descent:        '#5ba5d6', // glacier-500
};

function decimate(
  pts: { distM: number; ele: number }[],
  maxPoints: number
): { distM: number; ele: number }[] {
  if (pts.length <= maxPoints) return pts;
  const step = pts.length / maxPoints;
  const result: { distM: number; ele: number }[] = [];
  for (let i = 0; i < maxPoints; i++) result.push(pts[Math.round(i * step)]);
  result[result.length - 1] = pts[pts.length - 1];
  return result;
}

interface ZoneBand { zone: SlopeZone; startDistM: number; endDistM: number; }
function mergeZoneBands(segments: CourseSegment[]): ZoneBand[] {
  if (segments.length === 0) return [];
  const bands: ZoneBand[] = [];
  let cur: ZoneBand = {
    zone: segments[0].zone,
    startDistM: segments[0].cumulativeDistanceM - segments[0].distanceM,
    endDistM: segments[0].cumulativeDistanceM,
  };
  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i];
    if (seg.zone === cur.zone) { cur.endDistM = seg.cumulativeDistanceM; }
    else { bands.push(cur); cur = { zone: seg.zone, startDistM: seg.cumulativeDistanceM - seg.distanceM, endDistM: seg.cumulativeDistanceM }; }
  }
  bands.push(cur);
  return bands;
}

export default function ElevationProfile() {
  const svgRef       = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 160 });

  const courseSegments    = useRaceStore((s) => s.courseSegments);
  const simulationResult  = useRaceStore((s) => s.simulationResult);
  const scrubberDistanceM = useRaceStore((s) => s.scrubberDistanceM);
  const setScrubberDistance = useRaceStore((s) => s.setScrubberDistance);

  // Keep a ref so D3 event handlers always read the latest simulation
  // without needing to be recreated (avoids full chart rebuild on every sim update)
  const simulationResultRef = useRef(simulationResult);
  simulationResultRef.current = simulationResult;

  // Observe the container; subtract LEGEND_H so dimensions match the SVG's CSS height
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({
        width:  Math.max(width, 200),
        height: Math.max(height - LEGEND_H, 80),
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Draw chart
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !courseSegments || courseSegments.length === 0) return;

    const { width, height } = dimensions;
    const innerW = width  - MARGIN.left  - MARGIN.right;
    const innerH = height - MARGIN.top   - MARGIN.bottom;

    const totalDistM = courseSegments[courseSegments.length - 1].cumulativeDistanceM;
    const allEles    = [courseSegments[0].fromPoint.ele, ...courseSegments.map((s) => s.toPoint.ele)];
    const minEle     = d3.min(allEles) ?? 1000;
    const maxEle     = d3.max(allEles) ?? 4000;

    const xScale = d3.scaleLinear().domain([0, totalDistM]).range([0, innerW]);
    const yScale = d3.scaleLinear()
      .domain([Math.max(0, minEle - 150), maxEle + 200])
      .range([innerH, 0]);

    const fullPts: { distM: number; ele: number }[] = [
      { distM: 0, ele: courseSegments[0].fromPoint.ele },
      ...courseSegments.map((s) => ({ distM: s.cumulativeDistanceM, ele: s.toPoint.ele })),
    ];
    const elevPoints = decimate(fullPts, 800);
    const zoneBands  = mergeZoneBands(courseSegments);

    // Clear + rebuild
    const root = d3.select(svg);
    root.selectAll('*').remove();
    root.attr('width', width).attr('height', height);

    const g = root.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    // Gradient
    const defs = root.append('defs');
    const grad = defs.append('linearGradient').attr('id', 'elev-grad').attr('x1','0').attr('y1','0').attr('x2','0').attr('y2','1');
    grad.append('stop').attr('offset','0%').attr('stop-color','#5ba5d6').attr('stop-opacity', 0.28);
    grad.append('stop').attr('offset','100%').attr('stop-color','#0f1f35').attr('stop-opacity', 0.05);

    // Area
    const areaGen = d3.area<{ distM: number; ele: number }>()
      .x((d) => xScale(d.distM)).y0(innerH).y1((d) => yScale(d.ele))
      .curve(d3.curveMonotoneX);
    g.append('path').datum(elevPoints).attr('fill','url(#elev-grad)').attr('d', areaGen);

    // Zone strip
    const stripH = 5;
    g.selectAll('rect.zb').data(zoneBands).join('rect').attr('class','zb')
      .attr('x', (d) => xScale(d.startDistM))
      .attr('y', innerH - stripH)
      .attr('width', (d) => Math.max(0, xScale(d.endDistM) - xScale(d.startDistM)))
      .attr('height', stripH)
      .attr('fill', (d) => ZONE_COLORS[d.zone])
      .attr('opacity', 0.9);

    // Elevation line
    const lineGen = d3.line<{ distM: number; ele: number }>()
      .x((d) => xScale(d.distM)).y((d) => yScale(d.ele))
      .curve(d3.curveMonotoneX);
    g.append('path').datum(elevPoints)
      .attr('fill','none').attr('stroke','#7eb9e0').attr('stroke-width', 1.5)
      .attr('d', lineGen);

    // Axes (drawn before checkpoints so labels render on top)
    const xAxis = d3.axisBottom(xScale).ticks(8).tickFormat((d) => `${(+d / 1000).toFixed(0)}km`);
    const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat((d) => `${d}m`);

    g.append('g').attr('transform', `translate(0,${innerH})`).call(xAxis)
      .call((ax) => ax.select('.domain').attr('stroke','#253752'))
      .call((ax) => ax.selectAll('.tick line').attr('stroke','#253752'))
      .call((ax) => ax.selectAll('.tick text').attr('fill','#6b7280').attr('font-size','10px'));

    g.append('g').call(yAxis)
      .call((ax) => ax.select('.domain').attr('stroke','#253752'))
      .call((ax) => ax.selectAll('.tick line').attr('stroke','#253752'))
      .call((ax) => ax.selectAll('.tick text').attr('fill','#6b7280').attr('font-size','10px'));

    // Checkpoint markers + labels below axis
    // Use ref for initial colors so simulationResult is not a dep of this effect
    const checkpointResults = simulationResultRef.current?.checkpointResults ?? [];

    for (const cp of CHECKPOINTS) {
      const cpDistM = cp.cumulativeDistanceKm * 1000;
      if (cpDistM > totalDistM) continue;

      const result = checkpointResults.find((r) => r.checkpoint.id === cp.id);
      const color =
        !result || result.status === 'none' ? '#374a66'
        : result.isDQ                       ? '#e56b5a'
        : result.status === 'tight'         ? '#fbbf24'
        :                                     '#4ade80';

      const x        = xScale(cpDistM);
      const hasCutoff = cp.cutoffType !== 'none';
      const ele       = interpolateEle(courseSegments, cpDistM);

      // Vertical dashed line
      g.append('line')
        .attr('class', `cp-line-${cp.id}`)
        .attr('x1', x).attr('x2', x).attr('y1', 0).attr('y2', innerH - stripH)
        .attr('stroke', color).attr('stroke-width', hasCutoff ? 1.5 : 1)
        .attr('stroke-dasharray', '4,3').attr('opacity', 0.8);

      // Dot on elevation line
      g.append('circle')
        .attr('class', `cp-dot-${cp.id}`)
        .attr('cx', x).attr('cy', yScale(ele))
        .attr('r', hasCutoff ? 5 : 3)
        .attr('fill', color).attr('stroke','#0a1628').attr('stroke-width', 1);

      // Only render permanent label + connector for cutoff checkpoints
      if (hasCutoff) {
        g.append('line')
          .attr('x1', x).attr('x2', x)
          .attr('y1', innerH).attr('y2', innerH + 14)
          .attr('stroke', color).attr('stroke-width', 1).attr('opacity', 0.5);

        g.append('text')
          .attr('class', `cp-label-${cp.id}`)
          .attr('transform', `translate(${x}, ${innerH + 18}) rotate(-55)`)
          .attr('fill', color)
          .attr('font-size', '9.5px')
          .attr('font-family', 'monospace')
          .attr('text-anchor', 'end')
          .attr('dominant-baseline', 'auto')
          .text(cp.name);
      }

      // Transition plateau marker — always rendered, opacity toggled by sim update effect
      const pw = Math.min(20, innerW * 0.012);
      g.append('rect')
        .attr('class', `cp-pit-${cp.id}`)
        .attr('x', x).attr('y', yScale(ele) - 3)
        .attr('width', pw).attr('height', 6)
        .attr('fill','#fbbf24')
        .attr('opacity', result && result.transitionMin > 0 ? 0.7 : 0)
        .attr('rx', 2);
    }

    // Scrubber
    g.append('line').attr('class','scrubber-line')
      .attr('x1', xScale(scrubberDistanceM)).attr('x2', xScale(scrubberDistanceM))
      .attr('y1', 0).attr('y2', innerH)
      .attr('stroke','#ffffff').attr('stroke-width', 1.5)
      .attr('stroke-dasharray','6,3').attr('opacity', 0.9);

    // Tooltip — pointer-events:none so it never intercepts mouse events and triggers mouseleave
    const tooltip = g.append('g').attr('class','tooltip').style('display','none').style('pointer-events','none');
    const ttRect = tooltip.append('rect').attr('x',6).attr('y',-28).attr('width',150).attr('height',68)
      .attr('fill','#0f1f35').attr('stroke','#253752').attr('rx',4).attr('opacity',0.97);
    const tt1 = tooltip.append('text').attr('x',12).attr('y',-12).attr('fill','#d1d5db').attr('font-size','11px').attr('font-family','monospace');
    const tt2 = tooltip.append('text').attr('x',12).attr('y', 4).attr('fill','#6b7280').attr('font-size','10px').attr('font-family','monospace');
    const tt3 = tooltip.append('text').attr('x',12).attr('y',18).attr('fill','#6b7280').attr('font-size','10px').attr('font-family','monospace');
    const tt4 = tooltip.append('text').attr('x',12).attr('y',32).attr('fill','#5ba5d6').attr('font-size','10px').attr('font-family','monospace');
    const tt5 = tooltip.append('text').attr('x',12).attr('y',47).attr('font-size','10px').attr('font-family','monospace');

    // Invisible interaction overlay (covers chart area only, not label zone)
    g.append('rect')
      .attr('x',0).attr('y',0).attr('width', innerW).attr('height', innerH)
      .attr('fill','transparent').attr('cursor','crosshair')
      .on('mousemove touchmove', (event: MouseEvent) => {
        const [mx] = d3.pointer(event, g.node() as SVGGElement);
        const clampedX = Math.max(0, Math.min(innerW, mx));
        const distM    = xScale.invert(clampedX);

        setScrubberDistance(distM);
        g.select('.scrubber-line').attr('x1', clampedX).attr('x2', clampedX);

        const ele     = interpolateEle(courseSegments, distM);
        const simRes  = simulationResultRef.current;
        const ghPoint = simRes?.ghostTimeline.find((p) => p.cumulativeDistanceM >= distM);
        const elapsed = ghPoint ? formatDuration(ghPoint.elapsedMs) : '';
        const startMs = simRes?.startMs ?? 0;
        const clockTime = ghPoint ? formatClock(startMs + ghPoint.elapsedMs) : '';
        const zone    = getZoneAtDistance(courseSegments, distM);

        // Show checkpoint name when hovering within 10px of a checkpoint line
        const nearCp = CHECKPOINTS.find((cp) => {
          const cpDistM = cp.cumulativeDistanceKm * 1000;
          if (cpDistM > totalDistM) return false;
          return Math.abs(clampedX - xScale(cpDistM)) < 10;
        });

        const tooltipX = clampedX > innerW * 0.75 ? clampedX - 162 : clampedX + 6;
        const hasName = !!nearCp;
        ttRect.attr('height', hasName ? 83 : 68);
        tooltip.style('display', null).attr('transform', `translate(${tooltipX},${Math.max(32, yScale(ele))})`);
        tt1.text(`${(distM / 1000).toFixed(1)}km  ${Math.round(ele)}m`);
        tt2.text(zone ? zone.replace(/_/g,' ') : '');
        tt3.text(elapsed ? `~${elapsed} elapsed` : '');
        tt4.text(clockTime ? clockTime : '');
        if (nearCp) {
          const cpResult = simRes?.checkpointResults.find((r) => r.checkpoint.id === nearCp.id);
          const cpColor = !cpResult || cpResult.status === 'none' ? '#6b7280'
            : cpResult.isDQ ? '#e56b5a'
            : cpResult.status === 'tight' ? '#fbbf24'
            : '#4ade80';
          tt5.text(nearCp.name).attr('fill', cpColor);
        } else {
          tt5.text('');
        }
      })
      .on('mouseleave', () => tooltip.style('display','none'));

  // scrubberDistanceM intentionally excluded — updated imperatively in mousemove
  // and via a separate lightweight effect below to avoid full chart rebuilds on every move
  // simulationResult intentionally excluded — checkpoint colors updated by targeted effect below
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseSegments, dimensions, setScrubberDistance]);

  // Lightweight scrubber-only update — avoids full chart rebuild on every mousemove
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !courseSegments || courseSegments.length === 0) return;
    const totalDistM = courseSegments[courseSegments.length - 1].cumulativeDistanceM;
    const innerW = dimensions.width - MARGIN.left - MARGIN.right;
    const xScale = d3.scaleLinear().domain([0, totalDistM]).range([0, innerW]);
    const x = xScale(scrubberDistanceM);
    d3.select(svg).select('.scrubber-line').attr('x1', x).attr('x2', x);
  }, [scrubberDistanceM, courseSegments, dimensions]);

  // Targeted simulation update — only updates checkpoint colors/pit markers, no full rebuild
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !courseSegments) return;
    const results = simulationResult?.checkpointResults ?? [];
    const g = d3.select(svg).select('g');
    for (const cp of CHECKPOINTS) {
      const result = results.find((r) => r.checkpoint.id === cp.id);
      const color = !result || result.status === 'none' ? '#374a66'
        : result.isDQ    ? '#e56b5a'
        : result.status === 'tight' ? '#fbbf24'
        :                  '#4ade80';
      g.select(`.cp-dot-${cp.id}`).attr('fill', color);
      g.select(`.cp-line-${cp.id}`).attr('stroke', color);
      if (cp.cutoffType !== 'none') g.select(`.cp-label-${cp.id}`).attr('fill', color);
      g.select(`.cp-pit-${cp.id}`).attr('opacity', result && result.transitionMin > 0 ? 0.7 : 0);
    }
  }, [simulationResult, courseSegments]);

  if (!courseSegments || courseSegments.length === 0) {
    return (
      <div ref={containerRef} className="w-full h-full flex items-center justify-center text-sm" style={{ color: 'var(--stone-500)' }}>
        Loading course data…
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col">
      {/* Legend row — fixed height, matches LEGEND_H constant */}
      <div className="flex gap-3 px-2 items-center flex-shrink-0 text-xs" style={{ height: LEGEND_H, color: 'var(--stone-500)' }}>
        {(Object.entries(ZONE_COLORS) as [SlopeZone, string][]).map(([zone, color]) => (
          <span key={zone} className="flex items-center gap-1">
            <span className="inline-block w-3 h-2 rounded-sm" style={{ background: color }} />
            {zone.replace(/_/g,' ')}
          </span>
        ))}
        <span className="flex items-center gap-1 ml-1">
          <span className="inline-block w-4 h-1.5 rounded" style={{ background: '#fbbf24' }} />
          pit stop
        </span>
      </div>

      {/* SVG fills everything below the legend row.
          overflow="visible" ensures rotated labels are never hard-clipped by SVG viewport.
          The parent div uses flex-col so there is no overflow:hidden cutting them. */}
      <svg
        ref={svgRef}
        className="w-full flex-1 min-h-0"
        style={{ overflow: 'visible' }}
      />
    </div>
  );
}

function interpolateEle(segments: CourseSegment[], distM: number): number {
  for (const seg of segments) {
    const s0 = seg.cumulativeDistanceM - seg.distanceM;
    if (distM >= s0 && distM <= seg.cumulativeDistanceM) {
      const t = seg.distanceM > 0 ? (distM - s0) / seg.distanceM : 0;
      return seg.fromPoint.ele + t * (seg.toPoint.ele - seg.fromPoint.ele);
    }
  }
  return segments[segments.length - 1]?.toPoint.ele ?? 1500;
}

function getZoneAtDistance(segments: CourseSegment[], distM: number): string | null {
  for (const seg of segments) {
    const s0 = seg.cumulativeDistanceM - seg.distanceM;
    if (distM >= s0 && distM <= seg.cumulativeDistanceM) return seg.zone;
  }
  return null;
}
