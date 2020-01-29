jt.connected = function() {
  jt.socket.on("playerUpdate", function(player) {
    player = JSON.parse(player);
    let containerName = 'containerDecision'
    if (player.stage.id === 'decide') {
      containerName = 'containerBargain';
    }
    Vue.nextTick(function() {
      updateChart(player, containerName);
      if (player.stage.id === 'decide') {
        if (player.myAllocationProposal != null) {
          $('#myAllocX').val(player.myAllocationProposal.x);
          $('#myAllocY').val(player.myAllocationProposal.y);
        }
      }
      enableChartMouseMoving();
      draw_plot_lines(player.randomInitialSelection);
    });
    if (player.partnerAllocationProposal != null && jt.messages.setPartnerAllocationProposal != null) {
      jt.messages.setPartnerAllocationProposal(player.partnerAllocationProposal);
    }
    setTimeout(showMyProposal, 500);
    // setTimeout(randomSelection, 1000);

  });

  // jt.overwriteCrosshairImpl();
};

function enableChartMouseMoving() {
  jt.chart.container.onmousemove = function(e) {
    e = jt.chart.pointer.normalize(e);
    let xValue = jt.chart.xAxis[0].toValue(e.chartX);
    draw_plot_lines(xValue);
  };
  jt.chart.container.onmouseleave = function(e) {
    clearPlotLines();
  };
}

function clearPlotLines() {
  try {
    if(lineX)
      lineX.destroy();
    if(lineY)
      lineY.destroy();
  } catch (err) {
  }
}

function draw_plot_lines(xValue){

  clearPlotLines();

  if (xValue < 0) {
    xValue = 0;
  }
  let xData = jt.chart.series[0].xData;
  let yData = jt.chart.series[0].yData;

  let yValue = null;
  let found = false;
  for (let i = 0; i<xData.length; i++) {
    if (yValue === jt.chart.series[0].yData[i]) {
      break;
    }
    yValue = jt.chart.series[0].yData[i];
    if (xData[i] > xValue) {
      found = true;
      break;
    }
  }
  if (!found) {
    xValue = xData[xData.length-1];
    yValue = yData[yData.length-1];
  }
  let xPixels = jt.chart.xAxis[0].toPixels(xValue);
  let yPixels = jt.chart.yAxis[0].toPixels(yValue);

  xValue = Math.round(xValue*10)/10;
  yValue = Math.round(yValue*10)/10;

  jt.toolTipX = xValue;
  jt.toolTipY = yValue;

  let chart = jt.chart;

  let circle = document.getElementById('circle');
  circle.style.left = (xPixels + 16) + 'px';
  circle.style.top = (yPixels + 57) + 'px';
  let text = document.getElementById('text');
  text.style.left = (xPixels - 44) + 'px';
  text.style.top = (yPixels + 17) + 'px';
  $('#proposalX').text(xValue);
  $('#proposalY').text(yValue);

  let x0 = chart.xAxis[0].toPixels(0);
  let y0 = chart.yAxis[0].toPixels(0);

  try {
    if(lineX)
      lineX.destroy();
    if(lineY)
      lineY.destroy();
  } catch (err) {
  }

  if (xPixels < x0 || yPixels > y0) {
    return;
  }

  lineX = jt.chart.renderer.path(['M', xPixels, y0, 'L', xPixels, yPixels]).attr({
    'stroke-width': 1,
    stroke: 'gray',
    zIndex: 2001
  }).add();

  lineY = jt.chart.renderer.path(['M', x0, yPixels, 'L', xPixels, yPixels]).attr({
    'stroke-width': 1,
    stroke: 'gray',
    zIndex: 2001
  }).add();

}

var lineX = null;
var lineY = null;
var xInt = null;
var yInt = null;

jt.overwriteCrosshairImpl = function() {

  Highcharts.Axis.prototype.drawCrosshair = function(e, point) {

      var path, options = this.crosshair, snap = pick(options.snap, true), pos, categorized, graphic = this.cross, crossOptions;
      fireEvent(this, 'drawCrosshair', { e: e, point: point });
      // Use last available event when updating non-snapped crosshairs without
      // mouse interaction (#5287)
      if (!e) {
          e = this.cross && this.cross.e;
      }
      if (
      // Disabled in options
      !this.crosshair ||
          // Snap
          ((defined(point) || !snap) === false)) {
          this.hideCrosshair();
      }
      else {
          // Get the path
          if (!snap) {
              pos = e &&
                  (this.horiz ?
                      e.chartX - this.pos :
                      this.len - e.chartY + this.pos);
          }
          else if (defined(point)) {
              // #3834
              pos = pick(this.coll !== 'colorAxis' ?
                  point.crosshairPos : // 3D axis extension
                  null, this.isXAxis ?
                  point.plotX :
                  this.len - point.plotY);
          }
          if (defined(pos)) {
              crossOptions = {
                  // value, only used on radial
                  value: point && (this.isXAxis ?
                      point.x :
                      pick(point.stackY, point.y)),
                  translatedValue: pos
              };
              if (this.chart.polar) {
                  // Additional information required for crosshairs in
                  // polar chart
                  extend(crossOptions, {
                      isCrosshair: true,
                      chartX: e && e.chartX,
                      chartY: e && e.chartY,
                      point: point
                  });
              }
              path = this.getPlotLinePath(crossOptions) ||
                  null; // #3189
              // path = drawCrosshairLine(this, crossOptions) ||
              //     null; // #3189
            }
          if (!defined(path)) {
              this.hideCrosshair();
              return;
          }
          categorized = this.categories && !this.isRadial;
          // Draw the cross
          if (!graphic) {
              this.cross = graphic = this.chart.renderer
                  .path()
                  .addClass('highcharts-crosshair highcharts-crosshair-' +
                  (categorized ? 'category ' : 'thin ') +
                  options.className)
                  .attr({
                  zIndex: pick(options.zIndex, 2)
              })
                  .add();
              // Presentational attributes
              if (!this.chart.styledMode) {
                  graphic.attr({
                      stroke: options.color ||
                          (categorized ?
                              color('${palette.highlightColor20}')
                                  .setOpacity(0.25).get() :
                              '${palette.neutralColor20}'),
                      'stroke-width': pick(options.width, 1)
                  }).css({
                      'pointer-events': 'none'
                  });
                  if (options.dashStyle) {
                      graphic.attr({
                          dashstyle: options.dashStyle
                      });
                  }
              }
          }
          graphic.show().attr({
              d: path
          });
          if (categorized && !options.width) {
              graphic.attr({
                  'stroke-width': this.transA
              });
          }
          this.cross.e = e;
      }
      fireEvent(this, 'afterDrawCrosshair', { e: e, point: point });

      // console.log(crossOptions);
      // console.log(path);
  
      if (this.isXAxis) {
        if(lineX)
          lineX.destroy();
        let x1 = path[1];
        let y1 = yInt;
        let x2 = path[4];
        let y2 = path[5];
        xInt = x1;
        lineX = jt.chart.renderer.path(['M', x1, y1, 'L', x2, y2]).attr({
          'stroke-width': 1,
          stroke: 'gray',
          zIndex: 2001
        }).add();
      } else {
        if(lineY)
          lineY.destroy();
        let x1 = path[1];
        let y1 = path[2];
        let x2 = xInt;
        let y2 = path[5];
        yInt = y1;
        lineY = jt.chart.renderer.path(['M', x1, y1, 'L', x2, y2]).attr({
          'stroke-width': 1,
          stroke: 'gray',
          zIndex: 2001
        }).add();
      }
    };
}


jt.autoplay_decide = function() {
  let point = randomEl(jt.budgetData);
  if (jt.vue.app.treatment == 'pair') {
    if (jt.vue.player.idInGroup == 1) {
      point = jt.budgetData[0];
    } else {
      point = jt.budgetData[jt.budgetData.length - 1];
    }
  } 
  let proposal = { x: point[0], y: point[1] };
  jt.sendMessage("propose", proposal);
}

jt.toolTipX = null;
jt.toolTipY = null;

let confirmSelection = function(event) {
  if (
    confirm(
      "Your chosen budget is X=" +
        jt.toolTipX +
        " and Y=" +
        jt.toolTipY +
        ", is this your preferred budget?"
    )
  ) {
    let proposal = { x: jt.toolTipX, y: jt.toolTipY };
    jt.sendMessage("propose", proposal);
  }
};

updateChart = function(player, containerName) {
  jt.chart = Highcharts.chart(containerName, {
    chart: {
      events: {
        click: confirmSelection,
      },
    },
    xAxis: {
      min: 0,
      max: 200,
      gridLineWidth: 0.5,
      tickInterval: 10,
      title: {
        text: "Good X"
      }
    },
    yAxis: {
      min: 0,
      max: 200,
      gridLineWidth: 0.5,
      tickInterval: 10,
      title: {
        text: "Good Y"
      }
    },
    title: {
      text: "Choose your preferred budget"
    },
    // tooltip: {
    //   borderColor: "black",
    //   borderRadius: 2,
    //   borderWidth: 3,
    //   formatter: function() {
    //     jt.toolTipX = this.x;
    //     jt.toolTipY = this.y;
    //     return "X = <b>" + this.x + "</b>, Y = <b>" + this.y;
    //   },
    //   crosshairs: [true, true]
    // },
    plotOptions: {
      series: {
        marker: {
          lineWidth: 1
        },
        events: {
          click: confirmSelection,
        },
        enableMouseTracking: false,
      },
      line: {
        animation: false
      }
    },
    series: getSeries(player)
  });
}

getSeries = function(player) {
  let group = player.group;

  jt.budgetData = [];
  for (let i = 0; i <= group.maxX * 10; i++) {
    let x = i / 10;
    x = round(x, 2);
    let y = group.maxY - (group.maxY * i) / 10 / group.maxX;
    y = round(y, 2);
    jt.budgetData.push([x, y]);
  }

  let series = [
    {
      type: "line",
      name: "",
      color: "black",
      data: jt.budgetData,
      showInLegend: false,
      marker: {
        enabled: false
      },
      states: {
        hover: {
          lineWidth: 0
        }
      },
      enableMouseTracking: true
    }
  ];
  if (player.myProposal != null && player.myProposal.x != '') {
    series.push({
      type: "scatter",
      name: "your choice",
      color: "black",
      data: [[player.myProposal.x, player.myProposal.y]],
      marker: {
        radius: 6
      }
    });
  }
  if (player.partnerProposal != null && player.partnerProposal.x != '') {
    series.push({
      type: "scatter",
      name: "other player choice",
      color: "blue",
      data: [[player.partnerProposal.x, player.partnerProposal.y]],
      marker: {
        radius: 6
      }
    });
  }
  return series;
};
