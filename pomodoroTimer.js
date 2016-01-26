(function() {
  var worker;
  var myTimer;
  var audioObj;
  var timerOff = true;
  var breakSound = "http://oringz.com/oringz-uploads/sounds-1060-demonstrative.mp3";
  var workSound = "http://oringz.com/oringz-uploads/sounds-942-what-friends-are-for.mp3";
  var doneSound = "http://oringz.com/oringz-uploads/44_loving_you.mp3";

  $(document).ready(function() {
    $("#timer-text #words").text("START");

    //Create a sound object
    audioObj = new Audio();
    audioObj.muted = false;

    //Manipulate sound through the sound icon
    $("#sound").click(function() {
      $(this).toggleClass('mute');
      audioObj.muted ? audioObj.muted = false : audioObj.muted = true;
    });

    //Start button on hover
    $("#timer-text").hover(function() {
      if (timerOff) {
        addColor();
        /*$(".container").addClass('colorful');
        $("h1").css('color', 'red');*/
      }
    }, function() {
      if (timerOff) {
        removeColor();
      }
    });

    //Start timer
    $("#timer-text").click(function() {
      if (timerOff) {
        timerOff = false;
        startTimer();
      }
    });

    //Automatically populate the number of sets based on the user's pomodoro level
    $(".level-button").click(function() {
      updateControls($(this).attr('id'));
      if (!timerOff) {
        resetScreen();
      }
    });

    //Add or substract 1 in the controls container
    $(".control-container button").click(function() {
      var obj = $(this);
      var buttonClass = obj.attr('class');
      var sect = obj.parent().attr('id');
      modifyOption(buttonClass, sect);
      if (!timerOff) {
        resetScreen();
      }
    });
  });

  function updateControls(id) {
    var contrMap = {
      student: 2,
      graduate: 6,
      expert: 10,
      jedi: 14
    };
    var newVal = contrMap[id];
    $("#num-sets").find($(".num")).text(newVal);
  }

  function modifyOption(buttonClass, section) {
    var newV;
    var oldV = parseInt($("#" + section).find('.num').text());
    if (buttonClass.indexOf('plus') !== -1) {
      newV = oldV + 1;
    } else {
      if (oldV <= 0) {
        return;
      }
      newV = oldV - 1;
    }
    $("#" + section).find('.num').text(newV);
  }

  function startTimer() {
    //Scan settings
    var numSets = parseInt($(".control-container #num-sets .num").text());
    var lengthSes = parseInt($(".control-container #ses-length .num").text()) * 60;
    var breakSess = parseInt($(".control-container #ses-break .num").text()) * 60;
    var breakSets = parseInt($(".control-container #set-break .num").text()) * 60;

    var sessionsArr = makeSet(lengthSes, breakSess);
    var sessions = [];
    if (numSets !== 0) {
      for (var k = 0; k < numSets - 1; k++) {
        sessions.push(sessionsArr);
        sessions.push(breakSets);
      }
      sessions.push(sessionsArr);
    } else {
      sessions.push(lengthSes);
      sessions.push(breakSess);
    }

    //Flatten the sessions array
    sessions = [].concat.apply([], sessions);

    //Create timer object
    myTimer = new CountDownTimer(sessions.length, sessions);

    //If the browser suppors the Worker API, create a new Web Worker to count time when the tab is not active.
    if (window.Worker) {
      worker = new Worker("http://s.codepen.io/veronikabenkeser/pen/dYoBow.js");
      //Responding to the message sent back from the worker
      worker.onmessage = function(e) {};

    }

    //Start timer
    myTimer.countSessions(sessions).then(function(data) {
      console.log("complete:", data)
    });
  }

  function CountDownTimer(numOfSessions, sessions) {
    var thisObj = this;
    var count = 0;
    var stop = numOfSessions;
    var sessionsArr = sessions;
    this.countSessions = function(session) {

      function continueCounting() {
        var sessionName;

        //Display the name of the next session at the end of each session.
        if (stop === count + 1) {
          sessionName = "Done!";
        } else if (count % 2 === 0 || count === 0) {
          sessionName = "Break!";

        } else {
          sessionName = "Work!";
        }

        return thisObj.countSeconds(session[count], sessionName).then(function(data) {
          return thisObj.countSessions(session);
        })
      }

      // When have reached the desired number of sessions, stop the timer.
      if (count < stop) {
        return continueCounting();
      } else {
        return Promise.resolve({
          count: count
        })
      };
    }

    this.countSeconds = function(session, sessionName) {
      var minutes;
      var seconds;
      var secsLeft;
      var fillPerSecond = (630 / session);
      var angle = 0;

      return new Promise(function(resolve) {
        secsLeft = session + 1;
        worker.postMessage("start-session");

        //Respond to the message sent back from the worker
        worker.onmessage = function(e) {
          //On each post message from the worker, get the current system time and compare it to the expected elapsed time of a second

          secsLeft -= 1;
          minutes = Math.floor(secsLeft / 60);
          seconds = secsLeft % 60;
          thisObj.displayTimeOrMessage(sessionName, minutes, seconds);
          fillCircle(angle, sessionName);
          angle += fillPerSecond;

          if (secsLeft === -1) {
            worker.postMessage("stop-session");
            count++;
            resolve({
              count: count
            })
          }

        }
      });
    };

    this.displayTimeOrMessage = function(sessionName, minsLeft, secsLeft) {

      if (secsLeft === -1) {

        /* if (!$("#sound").hasClass('mute')) {*/
        if (sessionName === "Work!") {

          //Play sound
          audioObj.src = workSound;
          audioObj.play();
        } else if (sessionName === "Break!") {

          audioObj.src = breakSound;
          audioObj.play();
        } else {
          audioObj.src = doneSound;
          audioObj.play();
        }
        /*}*/
        $("#timer-text tspan").empty();
        $("#timer-text #words").text(sessionName);

      } else {
        $("#timer-text tspan").empty();
        minsLeft = minsLeft < 10 ? "0" + minsLeft : minsLeft + "";
        secsLeft = secsLeft < 10 ? "0" + secsLeft : secsLeft + "";

        $("#timer-text #minute-pic1").text(minsLeft.charAt(0));
        $("#timer-text #minute-pic2").text(minsLeft.charAt(1));
        $("#timer-text #sym").text(":");
        $("#timer-text #second-pic1").text(secsLeft.charAt(0));
        $("#timer-text #second-pic2").text(secsLeft.charAt(1));

      }
    };
  }

  function makeSet(minsPerSession, minsPerSmallBreak) {
    var numOfSessionsInSet = 4;
    var arr = [];
    for (var i = 0; i < numOfSessionsInSet - 1; i++) {
      arr.push(minsPerSession);
      arr.push(minsPerSmallBreak);
    }
    arr.push(minsPerSession);
    return arr;
  }

  function fillCircle(angle, sessionName) {
    var circleOverlay = document.getElementById('green-halo');

    if (sessionName === "Work!") {

      circleOverlay.setAttribute("stroke", "url(#grad2)");
    } else {
      circleOverlay.setAttribute("stroke", "url(#grad3)");
    }

    //Math: 2*pi*circle radius = 628

    circleOverlay.setAttribute("stroke-dasharray", angle + ", 20000");
  }

  function addColor() {
    document.getElementById("circle").setAttribute("stroke", "url(#grad1)");
    document.getElementById("timer-text").setAttribute("fill", "red");
  }

  function removeColor() {
    document.getElementById("circle").setAttribute("stroke", "url(#grad4-grey)");
    document.getElementById("timer-text").setAttribute("fill", "url(#grad7-grey)");
  }

  function resetScreen() {
    myTimer.countSessions = function() {
      return;
    };
    worker.postMessage('stop-session');
    timerOff = true;
    fillCircle(0, "");
    $("#timer-text tspan").empty();
    $("#timer-text #words").text("START");
  }
})();
