jt.connected = function() {
  jt.socket.on("playerUpdate", function(player) {
    player = JSON.parse(player);
    let containerName = 'containerDecision'
    if (player.stage.id === 'bargain') {
      containerName = 'containerBargain';
    }
    Vue.nextTick(function() {
      updateChart(player, containerName);
      if (player.stage.id === 'bargain') {
        $('#myAllocX').val(player.myAllocationProposal.x);
        $('#myAllocY').val(player.myAllocationProposal.y);
      }
    });
    if (player.partnerAllocationProposal != null) {
      jt.messages.setPartnerAllocationProposal(player.partnerAllocationProposal);
    }
  });

  // jt.overwriteCrosshairImpl();
};


jt.overwriteCrosshairImpl = function() {

  drawCrosshairLine = function(axis, options) {
      var axis = axis, 
      chart = axis.chart, 
      axisLeft = axis.left, 
      axisTop = axis.top, 
      old = options.old, 
      value = options.value, 
      translatedValue = options.translatedValue, 
      lineWidth = options.lineWidth, 
      force = options.force, 
      x1, 
      y1, 
      x2, 
      y2, 
      cHeight = (old && chart.oldChartHeight) || chart.chartHeight, 
      cWidth = (old && chart.oldChartWidth) || chart.chartWidth, 
      skip, 
      transB = axis.transB, 
      evt, 
      /**
       * Check if x is between a and b. If not, either move to a/b
       * or skip, depending on the force parameter.
       */
      between = function (x, a, b) {
          if (force !== 'pass' && x < a || x > b) {
              if (force) {
                  x = clamp(x, a, b);
              }
              else {
                  skip = true;
              }
          }
          return x;
      };
      evt = {
          value: value,
          lineWidth: lineWidth,
          old: old,
          force: force,
          acrossPanes: options.acrossPanes,
          translatedValue: translatedValue
      };
      fireEvent(this, 'getPlotLinePath', evt, function (e) {
          translatedValue = pick(translatedValue, axis.translate(value, null, null, old));
          // Keep the translated value within sane bounds, and avoid Infinity
          // to fail the isNumber test (#7709).
          translatedValue = clamp(translatedValue, -1e5, 1e5);
          x1 = x2 = Math.round(translatedValue + transB);
          y1 = y2 = Math.round(cHeight - translatedValue - transB);
          if (!isNumber(translatedValue)) { // no min or max
              skip = true;
              force = false; // #7175, don't force it when path is invalid
          }
          else if (axis.horiz) {
              y1 = axisTop;
              y2 = cHeight - axis.bottom;
              x1 = x2 = between(x1, axisLeft, axisLeft + axis.width);
          }
          else {
              x1 = axisLeft;
              x2 = cWidth - axis.right;
              y1 = y2 = between(y1, axisTop, axisTop + axis.height);
          }
          e.path = skip && !force ?
              null :
              chart.renderer.crispLine(['M', x1, y1, 'L', x2, y2], lineWidth || 1);

      });
      return evt.path;
  }

  Highcharts.Axis.prototype.drawCrosshair = function(e, point) {

    this.chart.renderer.crispLine(['M', 0, 0, 'L', 100, 100], 5);
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
  };
}


jt.autoplay_decision = function() {
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

updateChart = function(player, containerName) {
  jt.chart = Highcharts.chart(containerName, {
    xAxis: {
      min: 0,
      max: 100,
      gridLineWidth: 0.5,
      tickInterval: 10,
      title: {
        text: "Good X"
      }
    },
    yAxis: {
      min: 0,
      max: 100,
      gridLineWidth: 0.5,
      tickInterval: 10,
      title: {
        text: "Good Y"
      }
    },
    title: {
      text: "Choose your preferred budget"
    },
    tooltip: {
      borderColor: "black",
      borderRadius: 2,
      borderWidth: 3,
      formatter: function() {
        return "X = <b>" + this.x + "</b>, Y = <b>" + this.y;
      },
      crosshairs: [true, true]
    },
    plotOptions: {
      series: {
        cursor: "pointer",
        point: {
          events: {
            click: function(e) {
              if (
                confirm(
                  "Your chosen budget is X=" +
                    this.x +
                    " and Y=" +
                    this.y +
                    ", is this your preferred budget?"
                )
              ) {
                let proposal = { x: this.x, y: this.y };
                jt.sendMessage("propose", proposal);
              }
            }
          }
        },
        marker: {
          lineWidth: 1
        }
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
  if (player.myProposal.x != '') {
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
  if (player.partnerProposal.x != '') {
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
