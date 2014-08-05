/* ======================================================
 * PokerTimer 
 *
 * by ReBuildAll
 */
"use strict"

function PokerLevel(smallBlind,bigBlind,ante,duration,isBreak)
{
    if(typeof(smallBlind) === "object") {
        var otherLevel = smallBlind;

        this.smallBlind = otherLevel.smallBlind;
        this.bigBlind = otherLevel.bigBlind;
        this.ante = otherLevel.ante;
        this.duration = otherLevel.duration;
        this.isBreak = otherLevel.isBreak;
    }
    else {
        this.smallBlind = smallBlind || 1;
        this.bigBlind = bigBlind || 2;
        this.ante = ante || 0;
        this.duration = duration || 600;
        this.isBreak = !!isBreak;
    }
}

var pokertimer = angular.module('pokertimer',[]);

pokertimer.filter("place", function() {
    return function(place) {
        var placeString;
        if ( place == 1 ) placeString = "1st";
        else if ( place ==  2 ) placeString = "2nd";
        else if ( place == 3 ) placeString = "3rd";
        else placeString = place + "th";
        return placeString;
    }
});

pokertimer.filter("minutes", function () {
   return function (minutes) {
       var min = (Math.floor(minutes / 60)).toString();
       var sec = (minutes % 60).toString();
       if(min.length<2) { min = "0"+min; }
       if(sec.length<2) { sec = "0"+sec; }
       return min + ":" + sec;
   }
});

pokertimer.directive('scrollIf', function () {
    return function (scope, element, attributes) {
        scope.$watch(attributes.scrollIf, function(newValue,oldValue) {
            if(newValue) {
                element[0].scrollIntoView();
            }
        });
    }
});

pokertimer.directive("rbaDialog", ["$rootScope", function($rootScope) {

   return {
      link: function(scope,element,attr,controller) {
          $(element).click(function() {
              $rootScope.$broadcast("showDialog", {id: attr["rbaDialog"]});
              dialogManager.showDialog(attr["rbaDialog"]);
          })
      }
   };
}]);

pokertimer.factory("settings", ["$rootScope", function($rootScope) {
    var settingsInstance = {
        settings: [],
        currentSettings: 0,

        init: function() {
            this.settings = window.localStorage.getItem("RBAPokerTimer_Settings");
            if(!this.settings) {
                this.reset();
            }
            else {
                this.settings = JSON.parse(this.settings);
            }

            var that = this;

            $rootScope.$on("settingsUpdated", function() {
                that.save();
                $rootScope.$broadcast("reload");
            });
        },

        get: function() {
            return this.settings[this.currentSettings];
        },

        reset: function() {
            window.localStorage.removeItem("RBAPokerTimer_Settings");

            var defaultSettings = {
                name: "RBA Home Tournament",
                levels: this.defaultLevels(),
                prizeSharing: [50,30,20],
                buyinCost: 10,
                buyinChips: 400,
                addonChips: 400,
                addonCost: 10,
                rebuyChips: 400,
                rebuyCost: 10,
                currency: "€"
            };

            this.settings = [defaultSettings];

            var legacy = this.tryReadLegacySettings();
            if(legacy) {
                this.settings.push(legacy);
            }

            this.save();
        },

        defaultLevels: function() {
            return [
                new PokerLevel(2,4),
                new PokerLevel(4,8),
                new PokerLevel(5,10),
                new PokerLevel(10,20),
                new PokerLevel(20,40),
                new PokerLevel(30,60),
                new PokerLevel(0,0,0,600,true),
                new PokerLevel(50,100),
                new PokerLevel(75,150),
                new PokerLevel(100,200),
                new PokerLevel(125,250),
                new PokerLevel(150,300),
                new PokerLevel(200,400),
                new PokerLevel(250,500),
                new PokerLevel(300,600),
                new PokerLevel(300,600,50),
                new PokerLevel(300,600,100),
                new PokerLevel(300,600,200),
                new PokerLevel(300,600,300)
            ];
        },

        tryReadLegacySettings: function() {
            var legacy = {
                name: "Settings from v0.3",
                levels: this.defaultLevels(),
                prizeSharing: [50,30,20],
                buyinCost: 10,
                buyinChips: 400,
                addonChips: 400,
                addonCost: 10,
                rebuyChips: 400,
                rebuyCost: 10,
                currency: "€"
            };

            var hasLegacy = false;
            var levels = window.localStorage.getItem("LennuPokerTimer_Levels");
            if(levels) {
                legacy.levels = levels;
                hasLegacy = true;
            }

            var settings = window.localStorage.getItem("LennuPokerTimer_Settings");
            if (settings) {
                var settingsValues = JSON.parse(settings);
                hasLegacy = true;

                legacy.buyinCost = settingsValues.buyinCost;
                legacy.buyinChips = settingsValues.buyinChips;
                legacy.addonChips = settingsValues.addonChips;
                legacy.addonCost = settingsValues.addonCost;
                legacy.rebuyChips = settingsValues.rebuyChips;
                legacy.rebuyCost = settingsValues.rebuyCost;
            }

            var prize = window.localStorage.getItem("LennuPokerTimer_Prize");
            if (prize) {
                var prizeValues = JSON.parse(prize);
                hasLegacy = true;

                legacy.prizeSharing = prizeValues.sharing;
            }

            return hasLegacy ? legacy : undefined;
        },

        save: function() {
            window.localStorage.setItem("RBAPokerTimer_Settings", JSON.stringify(this.settings));
        },

        export: function(index) {
            return JSON.stringify(this.settings[index]);
        },

        import: function(settingsString) {

        }
    };

    settingsInstance.init();

    return settingsInstance;
}]);

pokertimer.factory("poker", ["$rootScope", "$interval", "settings", "sfx", function($rootScope, $interval, settings, sfx) {
    var pokerInstance = {
        isRunning: false,
        intervalId: undefined,
        lastStart: undefined,
        alreadyElapsed: 0,

        isLevelActive: false,

        currentLevel: 0,

        isInProgress : function() {
            return this.isRunning || this.alreadyElapsed>0 || this.currentLevel>0;
        },

        gotoNextLevel: function() {
            if ( this.currentLevel < settings.get().levels.length - 1 ) {
                this.currentLevel++;
            }

            this.isLevelActive = true;
            this.alreadyElapsed = 0;
            this.lastStart = new Date();

            $rootScope.$broadcast("nextlevel");
            this.updateTime();
        },

        updateTime: function() {
            var levelTime = settings.get().levels[this.currentLevel].duration;

            var time = this.getElapsedTime();
            var remaining = levelTime - time;

            var remainingPercent = remaining / levelTime * 100;
            var elapsedPercent = 100 - remainingPercent;

            var remainingMinutes = Math.floor(Math.round(remaining) / 60);
            var remainingSeconds = Math.floor(Math.round(remaining) % 60);

            $rootScope.$broadcast("updatetime", {
                elapsedPercent: elapsedPercent,
                remainingMinutes: remainingMinutes,
                remainingSeconds: remainingSeconds
            });

            return remaining;
        },

        getElapsedTime: function(returnOnlyThisPeriod) {
            if ( !this.isRunning ) { return this.alreadyElapsed; }

            var timeNow = new Date();
            var elapsed = (timeNow - this.lastStart) / 1000;

            if ( returnOnlyThisPeriod ) {
                return elapsed;
            }
            else {
                return elapsed + this.alreadyElapsed;
            }
        },

        tick: function() {
            var remainingSeconds = this.updateTime();

            if ( remainingSeconds < 60 ) {
                sfx.startWarning();
            }

            if ( remainingSeconds < 0.1 && this.isLevelActive ) {
                this.isLevelActive = false;
                this.gotoNextLevel();
            }
        },

        start: function() {
            if ( this.isRunning ) {
                return;
            }

            this.isRunning = true;

            this.lastStart = new Date();

            this.updateTime();

            this.isLevelActive = true;

            var pokerService = this;
            this.intervalId = $interval(function() {
                pokerService.tick();
            }, 1000 );
        },

        stop: function() {
            if ( !this.isRunning )
            {
                return;
            }

            this.alreadyElapsed += this.getElapsedTime(true);

            $interval.cancel(this.intervalId);
            this.intervalId = undefined;

            this.isRunning = false;
        },

        reset: function() {
            this.currentLevel = 0;
            this.alreadyElapsed = 0;
            $rootScope.$broadcast("reset");
            this.updateTime();
            $rootScope.$broadcast("nextlevel");
        }
    };

    return pokerInstance;
}]);

pokertimer.factory("sfx", [function() {
    var sfxInstance = {
        isWarningActive: false,

        stopWarning: function() {
            if ( this.isWarningActive ) {
                this.pauseAudio("#audio-minute");
                this.isWarningActive = false;
            }
        },

        startWarning: function() {
            if ( !this.isWarningActive ) {
                this.isWarningActive = true;
                this.playAudio("#audio-minute", false);
            }
        },

        startLevel: function () {
            this.playAudio("#audio-level");
        },

        playAudio: function(id,loop) {
            var a = $(id)[0];
            if ( a.pause ) {
                a.pause();
            }
            if ( loop ) {
                a.loop = true;
            }
            a.currentTime = 0;
            a.play();
        },

        pauseAudio: function(id) {
            var a = $(id)[0];
            if ( a.pause ) {
                a.pause();
            }
        }
    };

    return sfxInstance;
}]);

pokertimer.controller("tournament", ["$scope", "$window", "settings", "poker", function($scope, $window, settings, poker){
    $scope.players = 2;
    $scope.activePlayers = 2;
    $scope.addons = 0;
    $scope.rebuys = 0;

    $scope.settings = settings.get();

    $scope.totalChips = function() {
        return $scope.players * $scope.settings.buyinChips +
            $scope.addons * $scope.settings.addonChips +
            $scope.rebuys * $scope.settings.rebuyChips;
    }

    $scope.averageChips = function() {
        return Math.round($scope.totalChips() / $scope.activePlayers);
    }

    $scope.totalPrizes = function() {
        return $scope.players * $scope.settings.buyinCost +
        $scope.addons * $scope.settings.addonCost +
        $scope.rebuys * $scope.settings.rebuyCost;
    }

    $scope.onBuyIn = function() {
        $scope.players++;
        $scope.activePlayers++;
    }

    $scope.onPlayerOut = function() {
        $scope.activePlayers--;
    }

    $scope.removePlayer = function() {
        $scope.players--;
        $scope.activePlayers--;
    }

    $scope.addRebuy = function () {
        $scope.rebuys++;
    }

    $scope.removeRebuy = function() {
        $scope.rebuys--;
    }

    $scope.addAddOn = function() {
        $scope.addons++;
    }

    $scope.removeAddOn = function() {
        $scope.addons--;
    }

    $scope.$on("reset",function() {
        $scope.activePlayers = $scope.players;
        $scope.addins = 0;
        $scope.rebuys = 0;
    });

    $window.onbeforeunload = function() {
        if(poker.isInProgress()) {
            return "Tournament is in progress, are you sure you wish to abandon it?";
        }
    }
}]);

pokertimer.controller("gamestatus",
    ["$scope", "poker", "settings", "sfx",
        function($scope,poker,settings,sfx) {

    $scope.getCurrentLevel = function() {
        return settings.get().levels[poker.currentLevel];
    }
    $scope.getNextLevel = function() {
        if(poker.currentLevel == settings.get().levels.length - 1) {
            return settings.get().levels[poker.currentLevel + 1];
        }
        return settings.get().levels[poker.currentLevel + 1];
    }

    $scope.levels = settings.get().levels;
    $scope.currentLevelIndex = poker.currentLevel;

    $scope.$on("nextlevel", function() {
        $scope.currentLevelIndex = poker.currentLevel;
    });

    $scope.$on("updatetime", function(e,a) {
        function zeroPad(num, places) {
            var zero = places - num.toString().length + 1;
            return Array(+(zero > 0 && zero)).join("0") + num;
        };
        $("#poker-progress-full").css("width", a.elapsedPercent+"%");
        $("#poker-time").text(zeroPad(a.remainingMinutes,2) + ":" + zeroPad(a.remainingSeconds,2));
    });

    $scope.$on("reload", function() {
        $scope.levels = settings.get().levels;
        $scope.currentLevelIndex = poker.currentLevel;
    });

    $scope.gotoNextLevel = function () {
        sfx.stopWarning();
        sfx.startLevel();

        poker.gotoNextLevel();
    }

    $scope.start = function() {
        poker.start();
    }

    $scope.stop = function() {
        poker.stop();
    }

    $scope.reset = function() {
        if (confirm("This will reset the current tournament and restart it. Are you sure you wish to abandon your current game?")) {
            poker.stop();
            poker.reset();
        }
    }

    $scope.isRunning = function() {
        return poker.isRunning;
    }

    poker.updateTime();
}]);

pokertimer.controller("setup", ["$scope", "poker", "settings", function($scope,poker,settings) {
    $scope.levels = [];

    $scope.editableSettings = {};

    function levels_copy ( source, dest ) {
        dest.splice(0,dest.length);
        for(var i = 0; i < source.length; ++i) {
            dest.push(new PokerLevel(source[i]));
        }
    }

    function reloadLevels() {
        levels_copy ( settings.get().levels, $scope.levels );
        $scope.$apply();
    }

    function reloadSettings() {
        $scope.editableSettings = {
            buyinChips: settings.get().buyinChips,
            buyinCost: settings.get().buyinCost,
            rebuyChips: settings.get().rebuyChips,
            rebuyCost: settings.get().rebuyCost,
            addonChips: settings.get().addonChips,
            addonCost: settings.get().addonCost
        };
        $scope.$apply();
    }

    $scope.$on("showDialog", function(e,a){
        if(a.id == "#dialog-level-structure") {
            reloadLevels();
        }
        if(a.id == "#dialog-parameters") {
            reloadSettings();
        }
    });

    $scope.removeLevel = function (index) {
        $scope.levels.splice(index,1);
        $scope.$apply();
    };

    $scope.addLevel = function () {
        var lastLevel = $scope.levels[$scope.levels.length -1];
        $scope.levels.push(new PokerLevel(lastLevel.smallBlind, lastLevel.bigBlind, lastLevel.ante, lastLevel.duration));
    }

    $scope.saveLevelStructure = function () {
        levels_copy ( $scope.levels, settings.get().levels );
        $scope.$emit("settingsUpdated");
    };

    $scope.saveSettings = function () {
        settings.get().buyinChips = $scope.editableSettings.buyinChips;
        settings.get().buyinCost = $scope.editableSettings.buyinCost;
        settings.get().rebuyChips = $scope.editableSettings.rebuyChips;
        settings.get().rebuyCost = $scope.editableSettings.rebuyCost;
        settings.get().addonChips = $scope.editableSettings.addonChips;
        settings.get().addonCost = $scope.editableSettings.addonCost;
        $scope.$emit("settingsUpdated");
    };

    $scope.resetAllSettings = function() {
        if(confirm("This will OVERWRITE all current settings with the default ones, erasing EVERYTHING. The operation CANNOT BE undone.\n\nAre you absolutely sure?")) {
            settings.reset();
            $scope.$emit("settingsUpdated");
            poker.stop();
            poker.reset();
        }
    }

    $scope.resetLevels = function() {
        if(confirm("This will RESET the level settings for the current preset to the default ones. Your current level settings will be lost.\n\nContinue?")) {
            settings.get().levels = settings.defaultLevels();
            $scope.$emit("settingsUpdated");
            poker.stop();
            poker.reset();
        }
    }
}]);

var dialogManager = {
    showDialog: function(selector) {
        var dialog = $(selector);

        this.initDialog(dialog);

        $(".dialog").show();
        dialog.slideDown();
        dialog.find("input")[0].focus();
    },

    initDialog: function(dialog) {
        var that = this;
        dialog.find(".controls-save").off("click.rbadialog").on("click.rbadialog", function() {
            that.closeDialog(dialog);
        });
        dialog.find(".controls-cancel").off("click.rbadialog").on("click.rbadialog", function() {
            that.closeDialog(dialog);
        });
    },

    closeDialog: function(dialog) {
        dialog.fadeOut();
        $(".dialog").fadeOut();
    }
};

/*
 * Update notification
 */
$(function() {
    $("#update-notification-dismiss").click(function(){ 
        $("#update-notification").hide();
        return false;
    });
    
    if ( window.applicationCache ) {
        window.applicationCache.addEventListener("updateready",function() {
            $("#update-notification").show();
        },false);
    }
});
