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
  // Highcharts.Axis.prototype.drawCrosshair = function(e, point) {
  //   // Additional variables
  //   var defined = Highcharts.defined,
  //   	pick = Highcharts.pick;
    
  //   var path,
  //     options = this.crosshair,
  //     snap = Highcharts.pick(options.snap, true),
  //     pos,
  //     categorized,
  //     graphic = this.cross;

  //   // Use last available event when updating non-snapped crosshairs without
  //   // mouse interaction (#5287)
  //   if (!e) {
  //     e = this.cross && this.cross.e;
  //   }

  //   if (
  //     // Disabled in options
  //     !this.crosshair ||
  //     // Snap
  //     ((defined(point) || !snap) === false)
  //   ) {
  //     this.hideCrosshair();
  //   } else {

  //     // Get the path
  //     if (!snap) {
  //       pos = e && (this.horiz ? e.chartX - this.pos : this.len - e.chartY + this.pos);
  //     } else if (defined(point)) {
  //       pos = this.isXAxis ? point.plotX : this.len - point.plotY; // #3834
  //     }

  //     if (defined(pos)) {
  //       path = this.getPlotLinePath(
  //         // First argument, value, only used on radial
  //         point && (this.isXAxis ? point.x : pick(point.stackY, point.y)),
  //         null,
  //         null,
  //         null,
  //         pos // Translated position
  //       ) || null; // #3189
  //     }
  //     console.log('Old path', path);
  //     path.splice(path.length - 1 - 7, 6);
  //     console.log('New path', path);


  //     if (!defined(path)) {
  //       this.hideCrosshair();
  //       return;
  //     }

  //     categorized = this.categories && !this.isRadial;

  //     // Draw the cross
  //     if (!graphic) {
  //       this.cross = graphic = this.chart.renderer
  //         .path()
  //         .addClass('highcharts-crosshair highcharts-crosshair-' +
  //           (categorized ? 'category ' : 'thin ') + options.className)
  //         .attr({
  //           zIndex: pick(options.zIndex, 2)
  //         })
  //         .add();


  //       // Presentational attributes
  //       graphic.attr({
  //         'stroke': options.color || (categorized ? color('#ccd6eb').setOpacity(0.25).get() : '#cccccc'),
  //         'stroke-width': pick(options.width, 1)
  //       });
  //       if (options.dashStyle) {
  //         graphic.attr({
  //           dashstyle: options.dashStyle
  //         });
  //       }


  //     }

  //     graphic.show().attr({
  //       d: path
  //     });

  //     if (categorized && !options.width) {
  //       graphic.attr({
  //         'stroke-width': this.transA
  //       });
  //     }
  //     this.cross.e = e;
  //   }
  // }
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
