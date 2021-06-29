jt.connected = function () {
  jt.socket.on("playerUpdate", function (player) {

    player = JSON.parse(player);

    if (player.roomId !== jt.vue.player.roomId) {
      resetRangeInputs();
    }

    Vue.nextTick(function () {

      if (player.stage.id === 'transition') {
        $('.modal').modal('hide');
        return
      }

      if (player.status !== 'playing') {
        return;
      }
      updateChart(player);
      if (player.myDivisionProposal != null && player.myDivisionProposal.x != '') {
        $('#myDivisionX').val(player.myDivisionProposal.x);
        $('#myDivisionY').val(player.myDivisionProposal.y);
      } else {
        $('#myDivisionX').val(0);
        $('#myDivisionY').val(0);
      }

      if (player.myDivisionProposal != null && player.myDivisionProposal.x !== '') {
        showMyDivisionProposal('X');
      }

      if (player.myDivisionProposal != null && player.myDivisionProposal.y !== '') {
        showMyDivisionProposal('Y');
      }

      enableChartMouseMoving();
      if (player.myAllocationProposal.x !== '') {
        draw_plot_lines(player.myAllocationProposal.x);
      }

      $('#confirmAllocationModal').on('hidden.bs.modal', function (e) {
        jt.showingAllocationModal = false;
      });

    });
    if (player.partnerDivisionProposal != null && jt.messages.setPartnerDivisionProposal != null) {
      jt.messages.setPartnerDivisionProposal(player.partnerDivisionProposal);
    }

    if (player.group.validProposals && player.status === 'playing') {
      $('#informMatchModal').modal({ backdrop: 'static', keyboard: false });
    } else {
      $('#informMatchModal').modal('hide');
    }

    // setTimeout(showMyAllocationProposal, 500);
    // setTimeout(randomSelection, 1000);

  });

  // jt.overwriteCrosshairImpl();
};

function enableChartMouseMoving() {
  jt.chart.container.onmousemove = function (e) {

    let chartMax = 100;
    if (jt.vue.app.session != null) {
      chartMax = jt.vue.app.session.chartMax;
    }

    e = jt.chart.pointer.normalize(e);
    let xVal = jt.chart.xAxis[0].toValue(e.chartX);
    let yVal = jt.chart.yAxis[0].toValue(e.chartY);
    if (xVal < 0 && yVal < 0) {
      return;
    }
    let yMax = jt.vue.player.maxY;
    let xMax = jt.vue.player.maxX;
    if (xVal < 0) {
      yVal = yMax;
      xVal = 0;
    } else if (yVal < 0) {
      xVal = xMax;
      yVal = 0;
    }

    let selX = null;
    if (xVal === 0) {
      selX = 0;
    } else {
      selX = yMax / (yMax / xMax + yVal / xVal);
    }
    draw_plot_lines(selX, xVal, yVal);
  };
  jt.chart.container.onmouseleave = function (e) {
    if (!jt.showingAllocationModal) {
      if (jt.vue.player.myAllocationProposal.x === '') {
        clearPlotLines();
        jt.vue.player.toolTipX = -1;
        jt.vue.player.toolTipY = -1;
      } else {
        draw_plot_lines(jt.vue.player.myAllocationProposal.x, -1, -1);
      }
    }
  };
}

function clearPlotLines() {
  try {
    if (lineX)
      lineX.destroy();
    if (lineY)
      lineY.destroy();
    if (lineMouse)
      lineMouse.destroy();
  } catch (err) {
  }
}

function draw_plot_lines(xValue, xPos, yPos) {
  clearPlotLines();

  let player = jt.vue.player;

  if (player.group.validProposals) {
    return;
  }

  let xData = jt.chart.series[0].xData;
  let yData = jt.chart.series[0].yData;

  let yValue = null;

  if (xValue < 0) {
    xValue = 0;
    yValue = yData[0];
  } else {
    let upperY = null;
    let lowerY = null;
    for (let i = 0; i < xData.length; i++) {
      if (xValue < xData[i]) {
        upperY = yData[i];
        break;
      } else {
        lowerY = yData[i];
      }
    }
    if (upperY != null) {
      yValue = lowerY;
    } else {
      yValue = 0;
    }
  }

  xValue = Math.round(xValue * 10) / 10;
  yValue = Math.round(yValue * 10) / 10;

  let otherProposal = jt.vue.player.partnerAllocationProposal;
  if (otherProposal != null && otherProposal.x !== "" && jt.vue.player.myAllocationProposal.x !== '') {
    if (Math.abs(otherProposal.x - xValue) < 1.5) {
      xValue = otherProposal.x;
      yValue = otherProposal.y;
    }
  }

  let xPixels = jt.chart.xAxis[0].toPixels(xValue);
  let yPixels = jt.chart.yAxis[0].toPixels(yValue);

  let xMousePixels = jt.chart.xAxis[0].toPixels(xPos);
  let yMousePixels = jt.chart.yAxis[0].toPixels(yPos);

  jt.toolTipX = xValue;
  jt.toolTipY = yValue;

  jt.vue.player.toolTipX = xValue;
  jt.vue.player.toolTipY = yValue;

  let chart = jt.chart;

  let circle = document.getElementById('circle');
  circle.style.left = (xPixels + 15) + 'px';
  circle.style.top = (yPixels + 87) + 'px';
  let text = document.getElementById('text');
  text.style.left = (xPixels - 44) + 'px';
  text.style.top = (yPixels + 40) + 'px';
  $('#allocationProposalX').text(xValue);
  $('#allocationProposalY').text(yValue);

  let x0 = chart.xAxis[0].toPixels(0);
  let y0 = chart.yAxis[0].toPixels(0);

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

  // if (xPos >= 0 && yPos >= 0) {
  //   lineMouse = jt.chart.renderer.path(['M', x0, y0, 'L', xMousePixels, yMousePixels]).attr({
  //     'stroke-width': 1,
  //     stroke: '#ff000029',
  //     zIndex: 2002
  //   }).add();
  // } 

}

var lineX = null;
var lineY = null;
var xInt = null;
var yInt = null;

jt.overwriteCrosshairImpl = function () {

  Highcharts.Axis.prototype.drawCrosshair = function (e, point) {

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
      if (lineX)
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
      if (lineY)
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

isFirstBudgetPoint = function (point) {
  if (point.x != jt.budgetData[0][0]) return false
  if (point.y != jt.budgetData[0][1]) return false
  return true
}

jt.setPlayerPage = function (page) {
  jt.vue.player.page = page
  jt.sendMessage('setPlayerPage', page)
}

jt.autoplay_decide = function () {

  if (jt.vue.player.page !== 'game') {
    jt.setPlayerPage('game')
    return
  }
  if (jt.vue.group.validProposals) {
    confirmNewRound();
    return;
  }

  if (!jt.vue.player.madeAllocationSelection || !isFirstBudgetPoint(jt.vue.player.myAllocationProposal)) {
    let point = randomEl(jt.budgetData);
    if (jt.vue.app.treatment == 'pair') {
      point = jt.budgetData[0];
    }
    let proposal = { x: point[0], y: point[1] };
    jt.sendMessage("setMyAllocationProposal", proposal);
    return;
  }

  if (jt.vue.player.myDivisionProposal.x === '') {
    let proposal = { X: 50, Y: 50 };
    jt.sendMessage("setMyDivisionProposal", proposal);
    return;
  }
}

jt.toolTipX = null;
jt.toolTipY = null;

jt.showingAllocationModal = false;

let confirmAllocationSelection = function (event) {
  let player = jt.vue.player
  let app = jt.vue.app

  if (player.toolTipX < 0 || player.toolTipY < 0) {
    return;
  }

  if (player.partnerAllocationProposal != null &&
    player.myAllocationProposal.x === player.partnerAllocationProposal.x &&
    player.myAllocationProposal.y === player.partnerAllocationProposal.y &&
    (app.session.divisionType === "EXOG" || (player.myDivisionProposal.x !== "" && player.myDivisionProposal.x === 100 - player.partnerDivisionProposal.x && player.myDivisionProposal.y !== "" && player.myDivisionProposal.y === 100 - player.partnerDivisionProposal.y)))
    {
    return;
  }
  jt.showingAllocationModal = true;
  $('#confirmAllocationModal').modal('show');
};

let cancelDivisionProposal = function () {
  if (isNumeric(jt.vue.player.myDivisionProposal.x)) {
    $('#myDivisionX').val(jt.vue.player.myDivisionProposal.x);
  } else {
    $('#myDivisionX').val(-1);
  }
  $('#myDivisionY').val(jt.vue.player.myDivisionProposal.y);
}

jt.sendProposal = function () {
  let proposal = { x: jt.toolTipX, y: jt.toolTipY };
  jt.sendMessage("propose", proposal);
}

updateChart = function (player) {

  let chartMax = 100;
  if (player.group.period.app.session != null) {
    chartMax = player.group.period.app.session.chartMax;
  }

  jt.chart = Highcharts.chart('containerBargain', {
    chart: {
      events: {
        click: confirmAllocationSelection,
      },
    },
    xAxis: {
      min: 0,
      max: chartMax,
      gridLineWidth: 0.5,
      tickInterval: 10,
      margin: 25,
      title: {
        text: "X",
        style: {
          "font-weight": "bolder",
          "font-size": "14pt",
          "margin": "5px",
        },
      },
    },
    yAxis: {
      min: 0,
      max: chartMax,
      gridLineWidth: 0.5,
      tickInterval: 10,
      title: {
        text: "Y",
        rotation: 0,
        margin: 25,
        style: {
          "font-weight": "bolder",
          "font-size": "14pt",
        },
      }
    },
    title: {
      text: ""
    },
    subtitle: {
      text: ''
    },
    plotOptions: {
      series: {
        marker: {
          lineWidth: 1
        },
        events: {
          click: confirmAllocationSelection,
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

getSeries = function (player) {
  let group = player.group;
  let app = group.period.app;
  
  jt.budgetData = [];
  const resolution = 100;
  for (let i = 0; i <= player.maxX * resolution; i++) {
    let x = i / resolution;
    x = round(x, 2);
    let y = player.maxY - (player.maxY * i) / resolution / player.maxX;
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
  if (!player.initialCircle && player.myAllocationProposal != null && player.myAllocationProposal.x !== '') {
    series.push({
      type: "scatter",
      name: "My allocation proposal",
      color: "black",
      data: [[player.myAllocationProposal.x, player.myAllocationProposal.y]],
      marker: {
        radius: 6
      }
    });
  } else if (player.stage.app.treatment === 'pair') {
    series.push({
      type: "scatter",
      name: "-",
      color: "white",
      data: [[1, 1]],
      marker: {
        radius: 1
      }
    });
  }
  if (player.madeAllocationSelection && player.partnerAllocationProposal && player.partnerAllocationProposal.x !== "" && (app.session.divisionType != "ENDO" || (player.myDivisionProposal.x !== "" && player.myDivisionProposal.y !== "" && player.partnerDivisionProposal.x !== "" && player.partnerDivisionProposal.y !== ""))) {
    series.push({
      type: "scatter",
      name: "Other's allocation proposal",
      color: "blue",
      data: [[player.partnerAllocationProposal.x, player.partnerAllocationProposal.y]],
      marker: {
        radius: 6
      }
    });
  }
  return series;
};

window.sX = document.createElement("style");
document.head.appendChild(sX);
window.sY = document.createElement("style");
document.head.appendChild(sY);

resetRangeInputs = function () {
  window.sX.textContent = '';
  window.sY.textContent = '';
}

resetRangeInputs();

showSliderThumb = function (letter) {
  window['s' + letter].textContent = `

#myDivision${letter}::-webkit-slider-thumb {
    width: 2px !important;
}

#myDivision${letter}::-webkit-slider-runnable-track {
    background-color: unset;
}

`;
}

confirmNewRound = function () {
  resetRangeInputs();
  jt.sendMessage('endBargaining');
  $('#informMatchModal').modal('hide');
}

keyUp = function (event) {
  // Number 13 is the "Enter" key on the keyboard
  if (event.keyCode === 13) {
    // Cancel the default action, if needed
    event.preventDefault();
    sendChatMessageToServer();
  }
}

let lastHoverVal = -1;

showMyDivisionProposal = function (letter) {
  if (jt.vue.app.treatment === 'individual') {
    return;
  }
  let value = jt.vue.player.myDivisionProposal[letter.toLowerCase()];
  let bottomEl = $('#myDivision' + letter)[0];
  if (bottomEl == null) return
  if (value == 0) {
    bottomEl.style.background = 'linear-gradient(to right, #AAAAAA 0%, #AAAAAA 100%)';
  } else {
    bottomEl.style.background = 'linear-gradient(to right, #666666 0%, #666666 ' + value + '%, #AAAAAA ' + value + '%, #AAAAAA 100%)';
  }
  $(bottomEl).val(value);
  showSliderThumb(letter);
}
setMyDivisionProposal = function () {
  let letter = jt.vue.player.newDivisionLetter;

  // Show the thumb slider.
  showSliderThumb(letter);

  // Fill in the background.
  let value = lastHoverVal;
  let player = jt.vue.player;
  if (player.myDivisionProposal == null) {
    player.myDivisionProposal = {};
  }
  player.myDivisionProposal[letter.toLowerCase()] = value;
  showMyDivisionProposal(letter);

  // Notify server
  let out = {};
  out[letter] = value;
  jt.sendMessage('setMyDivisionProposal', out);
}
jt.sendAllocationProposal = function () {
  let proposal = {
    x: jt.toolTipX,
    y: jt.toolTipY,
  };
  jt.sendMessage('setMyAllocationProposal', proposal);
  jt.vue.player.initialCircle = false;
}
sendChatMessageToServer = function () {
  let content = $('#chatMessageInput').val();
  jt.sendMessage("sendMessage", content);
  $('#chatMessageInput').val('');
}
jt.messages.setMyDivisionProposal = function (proposal) {
  jt.vue.player.myDivisionProposal.x = proposal.x;
  jt.vue.player.myDivisionProposal.y = proposal.y;
}
jt.messages.setPartnerDivisionProposal = function (proposal) {
  jt.vue.player.partnerDivisionProposal = proposal;
  if (isNumeric(proposal.x)) {
    jt.setProposal('X', 100 - proposal.x, 'partner');
  }
  if (isNumeric(proposal.y)) {
    jt.setProposal('Y', 100 - proposal.y, 'partner');
  }
}
jt.setProposal = function (letter, value, person) {
  if (isNaN(value) || value === '') {
    return;
  }
  $('#' + person + 'Division' + letter + 'Bar').css('left', 'calc(' + value + '/100 * (100% - ' + 2 * PADDING + 'px) + ' + PADDING + 'px)');
  $('#' + person + 'Division' + letter + 'Text').text(value);
  let adjLeft = 3;
  if (value >= 10 && value < 100) {
    adjLeft = 6;
  } else if (value >= 100) {
    adjLeft = 11;
  }
  $('#' + person + 'Division' + letter + 'Text').css('left', 'calc(' + value + '/100 * (100% - ' + 2 * PADDING + 'px) + ' + PADDING + 'px - ' + adjLeft + 'px)');
}

let showRhombus = function () {
  jt.vue.player.showRhombus = true
}

let hideRhombus = function () {
  jt.vue.player.showRhombus = false
}

const PADDING = 10;

function calcSliderPos(e) {
  let x = 100 * (e.offsetX - PADDING - 2) / (e.target.clientWidth - 2 * PADDING);
  if (x > 100) {
    x = 100;
  }
  if (x < 0) {
    x = 0;
  }
  return x;
}

let mouseMove = function (event, letter) {
  let value = calcSliderPos(event);
  if (isNaN(value)) {
    return;
  }
  lastHoverVal = value.toFixed(0);
  $('#hoverDivision' + letter + 'Bar').css('left', 'calc(' + value + '/100 * (100% - ' + 2 * PADDING + 'px) + ' + PADDING + 'px)');
  jt.vue.player['hoverDivision' + letter] = value.toFixed(0);
  $('#hoverDivision' + letter + 'Text').text(value.toFixed(0));
  let adjLeft = 3;
  if (value >= 10 && value < 100) {
    adjLeft = 11;
  } else if (value >= 100) {
    adjLeft = 15;
  }
  $('#hoverDivision' + letter + 'Text').css('left', 'calc(' + value + '/100 * (100% - ' + 2 * PADDING + 'px) + ' + PADDING + 'px - ' + adjLeft + 'px)');
}

let mouseLeave = function (letter) {
  jt.vue.player['hoverDivision' + letter] = -1;
}

let confirmDivisionSelection = function (event) {

  let player = jt.vue.player;

  let noCurChoice = null;
  if (event.target.id === 'myDivisionX2') {
    player.newDivisionLetter = 'X';
    noCurChoice = player.myDivisionProposal.x === '';
  } else {
    player.newDivisionLetter = 'Y';
    noCurChoice = player.myDivisionProposal.y === '';
  }
  if (!noCurChoice &&
    player.myDivisionProposal.x === 100 - player.partnerDivisionProposal.x &&
    player.myDivisionProposal.y === 100 - player.partnerDivisionProposal.y &&
    (
      player.partnerAllocationProposal != null &&
      player.myAllocationProposal.x === player.partnerAllocationProposal.x &&
      player.myAllocationProposal.y === player.partnerAllocationProposal.y
    )
  ) {
    return;
  }

  jt.vue.player.newDivisionValue = jt.vue.player['hoverDivision' + jt.vue.player.newDivisionLetter];
  if (jt.vue.player.newDivisionValue >= 0)
    $('#confirmDivisionModal').modal('show');
};